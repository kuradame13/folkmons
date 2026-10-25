#!/usr/bin/env python3
"""
Folkmons - gerador de sprites pixel art.

Usa Cloudflare Workers AI (FLUX.1 [schnell]) para gerar a arte e prepara
o asset para o jogo: remove o fundo magenta, recorta, centraliza,
redimensiona e quantiza as cores.

Uso:
  python3 tools/gen_image.py "pixel art sprite of ..." --out assets/iarinha.png
  python3 tools/gen_image.py --from-file assets/raw/iarinha.jpg --out assets/iarinha.png
  python3 tools/gen_image.py --batch tools/prompts.json

Credenciais (env ou ~/.config/opencode/.env):
  CLOUDFLARE_ACCOUNT_ID
  CLOUDFLARE_API_TOKEN
"""

import argparse
import base64
import json
import math
import os
import pathlib
import subprocess
import sys
import time

from PIL import Image, ImageDraw

API_URL = (
    "https://api.cloudflare.com/client/v4/accounts/{account}/ai/run/"
    "@cf/black-forest-labs/flux-1-schnell"
)
ENV_FILE = pathlib.Path.home() / ".config" / "opencode" / ".env"
ROOT = pathlib.Path(__file__).resolve().parent.parent


def load_env() -> None:
    """Carrega variaveis do .env local sem sobrescrever o ambiente."""
    if not ENV_FILE.exists():
        return
    for line in ENV_FILE.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


def credentials() -> tuple[str, str]:
    account = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "").strip()
    token = os.environ.get("CLOUDFLARE_API_TOKEN", "").strip()
    if not account or not token:
        sys.exit(
            "Faltam credenciais. Defina CLOUDFLARE_ACCOUNT_ID e "
            "CLOUDFLARE_API_TOKEN no ambiente ou em ~/.config/opencode/.env"
        )
    return account, token


def generate(prompt: str, steps: int = 4) -> bytes:
    """Chama a API e devolve os bytes da imagem (JPEG)."""
    account, token = credentials()
    body = json.dumps({"prompt": prompt, "steps": steps})
    result = subprocess.run(
        [
            "curl", "-sS", "-X", "POST", API_URL.format(account=account),
            "-H", f"Authorization: Bearer {token}",
            "-H", "Content-Type: application/json",
            "--data", body,
            "-w", "\n%{http_code}",
        ],
        capture_output=True,
        text=True,
        timeout=180,
    )
    payload, _, code = result.stdout.rpartition("\n")
    if not code.strip().isdigit():
        raise RuntimeError(f"Resposta inesperada da API: {result.stdout[:400]}")
    if code.strip() != "200":
        raise RuntimeError(f"HTTP {code.strip()}: {payload[:400]}")

    data = json.loads(payload)
    if not data.get("success"):
        raise RuntimeError(f"API recusou: {json.dumps(data)[:400]}")
    return base64.b64decode(data["result"]["image"])


def corner_color(img: Image.Image) -> tuple[int, int, int]:
    """Cor dominante nas bordas (o fundo chapado do prompt)."""
    w, h = img.size
    points = [
        (2, 2), (w - 3, 2), (2, h - 3), (w - 3, h - 3),
        (w // 2, 2), (w // 2, h - 3), (2, h // 2), (w - 3, h // 2),
    ]
    samples = [img.getpixel(p) for p in points]
    return max(set(samples), key=samples.count)


def flatten_chroma(img: Image.Image, tolerance: int = 110) -> Image.Image:
    """Troca o fundo conectado as bordas por verde puro (#00FF00).

    O modelo costuma devolver um verde suave, com vinheta. Isso deixa o
    chroma key chato. O flood fill a partir das bordas deixa o fundo liso
    sem afetar partes verdes do proprio personagem.
    """
    from collections import deque

    img = img.convert("RGB")
    px = img.load()
    w, h = img.size
    bg = corner_color(img)

    def close_to_bg(x, y):
        r, g, b = px[x, y]
        return math.sqrt(
            (r - bg[0]) ** 2 + (g - bg[1]) ** 2 + (b - bg[2]) ** 2
        ) <= tolerance

    visited = bytearray(w * h)
    queue = deque()

    def push(x, y):
        if 0 <= x < w and 0 <= y < h and not visited[y * w + x]:
            if close_to_bg(x, y):
                visited[y * w + x] = 1
                queue.append((x, y))

    for x in range(w):
        push(x, 0)
        push(x, h - 1)
    for y in range(h):
        push(0, y)
        push(w - 1, y)

    while queue:
        x, y = queue.popleft()
        px[x, y] = (0, 255, 0)
        push(x + 1, y)
        push(x - 1, y)
        push(x, y + 1)
        push(x, y - 1)

    return img


def cut_background(img: Image.Image, tolerance: int = 100) -> Image.Image:
    """Remove o fundo chapado e devolve RGBA recortado no personagem.

    Faz duas passadas: chroma key global e limpeza do halo nas bordas
    (os pixels anti-aliased entre a arte e o fundo magenta).
    """
    img = img.convert("RGB")
    bg = corner_color(img)
    px = img.load()
    out = Image.new("RGBA", img.size, (0, 0, 0, 0))
    dst = out.load()

    def dist_to_bg(r, g, b):
        return math.sqrt((r - bg[0]) ** 2 + (g - bg[1]) ** 2 + (b - bg[2]) ** 2)

    # Sombra projetada: mesma matiz do fundo, so que escurecida.
    def is_shadow(r, g, b):
        total = r + g + b + 1e-6
        bg_total = bg[0] + bg[1] + bg[2] + 1e-6
        chroma = (
            abs(r / total - bg[0] / bg_total)
            + abs(g / total - bg[1] / bg_total)
            + abs(b / total - bg[2] / bg_total)
        )
        lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
        bg_lum = 0.2126 * bg[0] + 0.7152 * bg[1] + 0.0722 * bg[2]
        return chroma < 0.08 and lum < bg_lum * 0.8

    for y in range(img.height):
        for x in range(img.width):
            r, g, b = px[x, y]
            if dist_to_bg(r, g, b) > tolerance and not is_shadow(r, g, b):
                dst[x, y] = (r, g, b, 255)

    # Halo: pixel opaco perto do transparente e ainda puxando a cor do fundo.
    # Olha ate 2 px de distancia, porque o modelo costuma desenhar um contorno
    # rosa de 1-2 px em volta da arte.
    #
    # IMPORTANTE: usa uma copia do alpha como referencia. Se olhasse o alpha
    # sendo alterado, a limpeza viraria uma erosao em cascata e comeria o
    # personagem inteiro.
    alpha_ref = out.getchannel("A").copy()
    halo_limit = tolerance * 2.2
    for y in range(2, img.height - 2):
        for x in range(2, img.width - 2):
            r, g, b, a = dst[x, y]
            if a == 0:
                continue
            near_hole = False
            for dy in (-2, -1, 0, 1, 2):
                for dx in (-2, -1, 0, 1, 2):
                    if dx == 0 and dy == 0:
                        continue
                    if alpha_ref.getpixel((x + dx, y + dy)) == 0:
                        near_hole = True
                        break
                if near_hole:
                    break
            near_white = min(r, g, b) > 236
            if near_hole and (dist_to_bg(r, g, b) < halo_limit or near_white):
                dst[x, y] = (0, 0, 0, 0)

    bbox = out.getbbox()
    if bbox:
        out = out.crop(bbox)
    return out


def square_pad(img: Image.Image, margin: float = 0.06) -> Image.Image:
    """Centraliza em um quadrado transparente com uma pequena margem."""
    side = int(max(img.width, img.height) * (1 + margin * 2))
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(
        img,
        ((side - img.width) // 2, (side - img.height) // 2),
        img,
    )
    return canvas


def find_pixel_scale(img: Image.Image) -> int:
    """Detecta o tamanho do "pixel" da arte gerada (blocos de cor)."""
    img = img.convert("RGB")
    px = img.load()
    w, h = img.size
    scale = 1
    for y in range(0, h, 3):
        run = 1
        last = px[0, y]
        for x in range(1, w):
            cur = px[x, y]
            if max(abs(cur[i] - last[i]) for i in range(3)) <= 12:
                run += 1
            else:
                if run >= 6:
                    scale = max(scale, run)
                run = 1
                last = cur
    return max(1, scale // 2)


def process(
    source: pathlib.Path | bytes,
    out: pathlib.Path,
    size: int = 128,
    colors: int = 48,
    tolerance: int = 80,
    raw_out: pathlib.Path | None = None,
    keep_bg: bool = False,
    flat_chroma: bool = False,
) -> pathlib.Path:
    if isinstance(source, bytes):
        import io

        img = Image.open(io.BytesIO(source))
    else:
        img = Image.open(source)

    img = img.convert("RGB")

    if flat_chroma:
        img = flatten_chroma(img, tolerance=max(tolerance, 110))

    if raw_out:
        raw_out.parent.mkdir(parents=True, exist_ok=True)
        if raw_out.suffix.lower() in (".jpg", ".jpeg"):
            img.save(raw_out, "JPEG", quality=95)
        else:
            img.save(raw_out, "PNG")

    if keep_bg:
        out.parent.mkdir(parents=True, exist_ok=True)
        img.save(out)
        return out

    cut = cut_background(img, tolerance=tolerance)
    cut = square_pad(cut)

    # LANCZOS suaviza o ruido de 1 px; a quantizacao devolve o look chapado.
    cut = cut.resize((size, size), Image.Resampling.LANCZOS)

    if colors and colors > 0:
        alpha = cut.getchannel("A")
        rgb = cut.convert("RGB").quantize(colors=colors, method=Image.MEDIANCUT)
        cut = rgb.convert("RGBA")
        cut.putalpha(alpha)

    out.parent.mkdir(parents=True, exist_ok=True)
    cut.save(out, "PNG")
    return out


def main() -> None:
    load_env()

    ap = argparse.ArgumentParser(description="Gera sprites pixel art para o Folkmons")
    ap.add_argument("prompt", nargs="?", help="descricao da imagem")
    ap.add_argument("--from-file", type=pathlib.Path, help="processa uma imagem local")
    ap.add_argument("--out", type=pathlib.Path, help="arquivo PNG de saida")
    ap.add_argument("--size", type=int, default=128, help="lado final em px (padrao 128)")
    ap.add_argument("--colors", type=int, default=48, help="cores da paleta (0 desliga)")
    ap.add_argument("--steps", type=int, default=4, help="passos de difusao (1-8)")
    ap.add_argument("--tolerance", type=int, default=100, help="tolerancia do chroma key")
    ap.add_argument("--raw-out", type=pathlib.Path, help="salva tambem o JPG original")
    ap.add_argument("--keep-bg", action="store_true", help="nao remove o fundo (mantem o chroma)")
    ap.add_argument(
        "--flat-chroma",
        action="store_true",
        help="troca o fundo por verde puro #00FF00 (chroma key limpo)",
    )
    ap.add_argument(
        "--chroma",
        choices=["green", "magenta", "none"],
        help="acrescenta o fundo chroma padrao ao prompt",
    )
    ap.add_argument("--batch", type=pathlib.Path, help="JSON com lista de jobs")
    args = ap.parse_args()

    chroma_text = {
        "green": "solid flat pure chroma key green background (#00FF00), no shadow",
        "magenta": "solid flat magenta background (#FF00FF), no shadow",
        "none": "",
    }

    if args.batch:
        jobs = json.loads(args.batch.read_text())
        total = len(jobs)
        start = time.time()
        failures: list[tuple[str, str]] = []
        for index, job in enumerate(jobs, 1):
            out = pathlib.Path(job["out"])
            if out.exists() and not job.get("force"):
                print(f"[{index}/{total}] pulando (existe): {out}", flush=True)
                continue
            print(f"[{index}/{total}] gerando: {job['name']}", flush=True)

            raw = None
            last_error = ""
            for attempt in range(1, 3):
                try:
                    raw = generate(job["prompt"], steps=job.get("steps", args.steps))
                    break
                except Exception as exc:  # noqa: BLE001 - queremos seguir o lote
                    last_error = str(exc)
                    print(f"  erro (tentativa {attempt}): {last_error[:300]}", flush=True)
                    if attempt == 1:
                        time.sleep(3)

            if raw is None:
                failures.append((job["id"], last_error[:300]))
                continue

            try:
                process(
                    raw,
                    out,
                    size=job.get("size", args.size),
                    colors=job.get("colors", args.colors),
                    tolerance=job.get("tolerance", args.tolerance),
                    raw_out=pathlib.Path(job["raw"]) if job.get("raw") else None,
                    keep_bg=job.get("keep_bg", args.keep_bg),
                    flat_chroma=job.get("flat_chroma", args.flat_chroma),
                )
                if job.get("out64"):
                    process(
                        raw,
                        pathlib.Path(job["out64"]),
                        size=64,
                        colors=job.get("colors64", 32),
                        tolerance=job.get("tolerance", args.tolerance),
                    )
            except Exception as exc:  # noqa: BLE001
                failures.append((job["id"], f"process: {exc}"[:300]))
                print(f"  erro no processamento: {exc}", flush=True)
                continue

            elapsed = time.time() - start
            print(f"  ok em {elapsed:.0f}s ({out.stat().st_size // 1024} KB)", flush=True)

        print(f"lote concluido: {total} jobs em {(time.time()-start)/60:.1f} min", flush=True)
        if failures:
            print(f"FALHAS ({len(failures)}):", flush=True)
            for folkmom_id, error in failures:
                print(f"  {folkmom_id}: {error}", flush=True)
        return

    if not args.out:
        sys.exit("informe --out (ou use --batch)")

    if args.from_file:
        process(
            args.from_file,
            args.out,
            size=args.size,
            colors=args.colors,
            tolerance=args.tolerance,
            raw_out=args.raw_out,
            keep_bg=args.keep_bg,
            flat_chroma=args.flat_chroma,
        )
        print(f"ok: {args.out}")
        return

    prompt = args.prompt or ""
    if prompt and args.chroma:
        prompt = f"{prompt}, {chroma_text[args.chroma]}"
    if not prompt:
        sys.exit("informe o prompt, --from-file ou --batch")

    raw = generate(prompt, steps=args.steps)
    process(
        raw,
        args.out,
        size=args.size,
        colors=args.colors,
        tolerance=args.tolerance,
        raw_out=args.raw_out,
        keep_bg=args.keep_bg,
        flat_chroma=args.flat_chroma,
    )
    print(f"ok: {args.out}")


if __name__ == "__main__":
    main()
