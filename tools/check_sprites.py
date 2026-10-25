#!/usr/bin/env python3
"""Confere os sprites gerados e cria tools/missing.json com o que faltar."""

import json
import pathlib
import sys

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
PROMPTS = ROOT / "tools" / "prompts.json"
MISSING = ROOT / "tools" / "missing.json"


def main() -> int:
    jobs = json.loads(PROMPTS.read_text())
    problems = []
    missing_jobs = []

    for job in jobs:
        folkmom_id = job["id"]
        checks = [
            (ROOT / "assets" / "chroma" / f"{folkmom_id}.png", (1024, 1024), False),
            (ROOT / "assets" / "sprites" / f"{folkmom_id}.png", (128, 128), True),
            (ROOT / "assets" / "sprites64" / f"{folkmom_id}.png", (64, 64), True),
        ]

        job_missing = False
        for path, expected_size, need_alpha in checks:
            if not path.exists():
                problems.append(f"FALTA  {path.relative_to(ROOT)}")
                job_missing = True
                continue
            if path.stat().st_size == 0:
                problems.append(f"VAZIO  {path.relative_to(ROOT)}")
                job_missing = True
                continue
            try:
                with Image.open(path) as img:
                    if img.size != expected_size:
                        problems.append(
                            f"TAMANHO {path.relative_to(ROOT)}: "
                            f"{img.size} (esperado {expected_size})"
                        )
                    if need_alpha and "A" not in img.getbands():
                        problems.append(f"SEM ALFA {path.relative_to(ROOT)}")
            except Exception as exc:  # noqa: BLE001
                problems.append(f"ERRO   {path.relative_to(ROOT)}: {exc}")
                job_missing = True

        if job_missing:
            missing_jobs.append(job)

    total = len(jobs)
    present = total - len(missing_jobs)
    print(f"Folkmons no manifesto: {total}")
    print(f"Prontos: {present} | Faltando: {len(missing_jobs)}")
    print(f"Problemas encontrados: {len(problems)}")

    if missing_jobs:
        MISSING.write_text(json.dumps(missing_jobs, indent=2, ensure_ascii=False) + "\n")
        print(f"Lista para retomar: {MISSING.relative_to(ROOT)}")
        print("IDs:", " ".join(job["id"] for job in missing_jobs))

    if problems:
        for problem in problems[:30]:
            print("  " + problem)
        if len(problems) > 30:
            print(f"  ... e mais {len(problems) - 30}")
        return 1 if not missing_jobs else 0

    print("Tudo certo: chroma 1024, sprite 128 e sprite 64 para todos.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
