#!/usr/bin/env python3
"""Empacota o jogo e os sprites para entrega.

Gera:
  folkmons_jogo.zip             -> jogo + sprites transparentes + docs
  folkmons_sprites_chroma.zip   -> sprites com fundo verde + ferramentas

Os dois tambem sao copiados para ~/Downloads.
"""

import pathlib
import shutil
import zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
DOWNLOADS = pathlib.Path.home() / "Downloads"

GAME_ITEMS = [
    "index.html",
    "index_new.html",
    "style.css",
    "folkmons_data.js",
    "game_new.js",
    "cloud_config.js",
    "cloud_auth.js",
    "vendor/supabase.js",
    "galeria.html",
    "README.md",
    "docs/prompt_folkmons.md",
    "docs/legendarios.md",
    "docs/nuvem.md",
    "docs/encontros_scan.md",
    "docs/banco.md",
    "docs/relatorio_controles_toque.md",
    "supabase/schema.sql",
    "assets/sprites/*.png",
    "assets/sprites64/*.png",
    "assets/trainer/*.png",
    "tools/make_trainer.py",
]

CHROMA_ITEMS = [
    "README.md",
    "folkmons_data.js",
    "docs/prompt_folkmons.md",
    "docs/legendarios.md",
    "docs/nuvem.md",
    "docs/encontros_scan.md",
    "cloud_config.js",
    "cloud_auth.js",
    "vendor/supabase.js",
    "assets/trainer/*.png",
    "assets/chroma/*.png",
    "assets/sprites/*.png",
    "assets/sprites64/*.png",
    "tools/gen_image.py",
    "tools/build_prompts.py",
    "tools/build_gallery.py",
    "tools/check_sprites.py",
    "tools/make_trainer.py",
    "tools/package.py",
    "tools/prompts.json",
    "tools/missing.json",
]


def matching_files(pattern: str) -> list[pathlib.Path]:
    return sorted(path for path in ROOT.glob(pattern) if path.is_file())


def build(zip_path: pathlib.Path, items: list[str], label: str) -> None:
    count = 0
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
        for item in items:
            if "*" in item:
                files = matching_files(item)
            else:
                path = ROOT / item
                files = [path] if path.is_file() else []

            for path in files:
                zf.write(path, path.relative_to(ROOT))
                count += 1

    size_mb = zip_path.stat().st_size / (1024 * 1024)
    print(f"{label}: {count} arquivos, {size_mb:.1f} MB -> {zip_path}")


def main() -> None:
    game_zip = ROOT / "folkmons_jogo.zip"
    chroma_zip = ROOT / "folkmons_sprites_chroma.zip"

    build(game_zip, GAME_ITEMS, "jogo")
    build(chroma_zip, CHROMA_ITEMS, "sprites + chroma")

    if DOWNLOADS.is_dir():
        for path in (game_zip, chroma_zip):
            shutil.copy2(path, DOWNLOADS / path.name)
            print(f"copiado para {DOWNLOADS / path.name}")
    else:
        print(f"pasta {DOWNLOADS} nao existe; ZIPs ficaram na raiz do projeto")


if __name__ == "__main__":
    main()
