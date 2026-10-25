#!/usr/bin/env python3
"""Gera a folha de sprites do treinador (4 direções x 3 quadros).

Desenho em grade 16x16, ampliado 2x com NEAREST para 32x32 por quadro.
Folha final: 96x128 (3 colunas, 4 linhas).
"""
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "trainer"
OUT.mkdir(parents=True, exist_ok=True)

PALETTE = {
    ".": (0, 0, 0, 0),
    "O": (31, 41, 55, 255),      # contorno
    "H": (46, 125, 50, 255),     # chapéu
    "h": (27, 94, 32, 255),      # chapéu escuro
    "S": (241, 194, 125, 255),   # pele
    "s": (217, 160, 102, 255),   # pele sombreada
    "E": (31, 41, 55, 255),      # olhos
    "T": (244, 180, 0, 255),     # camisa
    "t": (217, 154, 0, 255),     # camisa escura
    "P": (29, 78, 216, 255),     # calça
    "p": (30, 58, 138, 255),     # calça escura
    "B": (93, 64, 55, 255),      # botas
    "A": (141, 110, 99, 255),    # mochila
    "a": (93, 64, 55, 255),      # mochila escura
    "W": (62, 39, 35, 255),      # cabelo
}

FRONT = [
    "................",
    ".....OOOOOO.....",
    "....OHHHHHHO....",
    "....OHHHHHHO....",
    "...OOhHHHHhOO...",
    "...OSSSSSSSSO...",
    "...OSESSSSESO...",
    "...OSSSSSSSSO...",
    "....OSSSSSSO....",
    "...OTTTTTTTTO...",
    "..OTTTTTTTTTTO..",
    "..OSTTTTTTTTSO..",
    "..OSSTTTTTTSSO..",
]

BACK = [
    "................",
    ".....OOOOOO.....",
    "....OHHHHHHO....",
    "....OHHHHHHO....",
    "...OOhHHHHhOO...",
    "...OWWWWWWWWO...",
    "...OWWWWWWWWO...",
    "...OWWWWWWWWO...",
    "....OWWWWWWO....",
    "...OAAAAAAAAO...",
    "..OAAaaaaaaAAO..",
    "..OSAAAAAAAASO..",
    "..OSSTTTTTTSSO..",
]

SIDE = [
    "................",
    ".....OOOOOO.....",
    "....OHHHHHHO....",
    "....OHHHHHHO....",
    "...OOhHHHHHHHO..",
    "...OSSSSSSSSO...",
    "...OSSSSSSESO...",
    "...OSSSSSSSSO...",
    "....OSSSSSSO....",
    "...OATTTTTTTO...",
    "..OAATTTTTTTTO..",
    "..OAATTTTTTSSO..",
    "..OSATTTTTTSSO..",
]

LEGS = {
    0: [
        "....OPPPPPPO....",
        "....OPPOOPPO....",
        "....OBBOOBBO....",
    ],
    1: [
        "...OPPPPPPPO....",
        "...OPPO..OPPO...",
        "...OBBO..OBBO...",
    ],
    2: [
        "....OPPPPPPO....",
        "...OPPO..OPPO...",
        "..OBBO....OBBO..",
    ],
}

LEGS_SIDE = {
    0: [
        "....OPPPPPPO....",
        "...OPPPOOPPPO...",
        "...OBBBOOBBBO...",
    ],
    1: [
        "....OPPPPPPO....",
        "...OPPO..OPPO...",
        "...OBBO..OBBO...",
    ],
    2: [
        "....OPPPPPPO....",
        "....OPPO.OPPO...",
        "....OBBO.OBBO...",
    ],
}


def make_frame(body, legs):
    rows = body + legs
    if len(rows) != 16 or any(len(r) != 16 for r in rows):
        raise ValueError("Quadro precisa ser 16x16: " + repr([(len(r), r) for r in rows if len(r) != 16]))
    img = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
    px = img.load()
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            px[x, y] = PALETTE[ch]
    return img.resize((32, 32), Image.Resampling.NEAREST)


def main():
    frames = {
        "down": [make_frame(FRONT, LEGS[i]) for i in range(3)],
        "right": [make_frame(SIDE, LEGS_SIDE[i]) for i in range(3)],
    }
    frames["left"] = [ImageOps.mirror(f) for f in frames["right"]]
    frames["up"] = [make_frame(BACK, LEGS[i]) for i in range(3)]

    order = ["down", "left", "right", "up"]
    sheet = Image.new("RGBA", (32 * 3, 32 * 4), (0, 0, 0, 0))
    for row, direction in enumerate(order):
        for col, frame in enumerate(frames[direction]):
            sheet.alpha_composite(frame, (col * 32, row * 32))

    sheet_path = OUT / "trainer_sheet.png"
    sheet.save(sheet_path)

    preview = sheet.resize((sheet.width * 4, sheet.height * 4), Image.Resampling.NEAREST)
    preview.save(OUT / "trainer_preview.png")
    print("Gerado:", sheet_path, sheet.size)
    print("Preview:", OUT / "trainer_preview.png")


if __name__ == "__main__":
    main()
