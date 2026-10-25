#!/usr/bin/env python3
"""
Monta tools/prompts.json com os 153 Folkmons (3 starters + 150 formas).

Cada job gera:
  assets/chroma/<id>.jpg   -> arte original com fundo verde chroma
  assets/sprites/<id>.png  -> PNG 128x128 com transparencia
  assets/sprites64/<id>.png-> PNG 64x64 com transparencia

Uso:
  python3 tools/build_prompts.py
  python3 tools/gen_image.py --batch tools/prompts.json
"""

import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "folkmons_data.js"
OUT = ROOT / "tools" / "prompts.json"

# Conceito visual de cada uma das 50 familias.
FAMILIES = {
    1: "a cunning dark sorcerer from the Brazilian sertao, worn leather hat, bone amulets and a tattered cloak",
    2: "a luminous river serpent with glowing scales and floating water droplets",
    3: "a moonlit wolf-dog spirit with silver fur and glowing yellow eyes",
    4: "a small forest guardian spirit with light green skin, leaf hair and twig antlers",
    5: "a skeletal foal spirit wreathed in ghostly blue flames",
    6: "a legendary river fish with iridescent pearl scales and long flowing fins",
    7: "a mischievous ember spirit with a red cap, swirling smoke and a wooden pipe",
    8: "a large emerald snake covered in moss and small blossoms, glowing eyes",
    9: "a ghostly firefly spirit with a glowing lantern abdomen and translucent wings",
    10: "a majestic spirit bird guide with white feathers and a glowing crest",
    11: "a ghostly rooster with a fiery red comb and translucent blue feathers",
    12: "a grey ghost hound with burning eyes and smoke trailing from its paws",
    13: "an armored ghost armadillo with bone plates and glowing runes",
    14: "an enchanted ovenbird with clay-colored feathers and a small clay nest on its back",
    15: "a silver toad with metallic warts and glowing golden eyes",
    16: "a bright red frog with flame patterns and ember eyes",
    17: "a mystic river dolphin with grey-pink skin and a glowing water aura",
    18: "a gentle mystic manatee with a mossy back and glowing river symbols",
    19: "a clever enchanted monkey with brown fur, bright eyes and a mischievous grin",
    20: "a ghostly marmoset with translucent fur and glowing white eyes",
    21: "a singing cricket with an emerald shell and musical note sparkles",
    22: "a giant ant with polished chitin armor and strong mandibles",
    23: "a golden beetle with a jewel-like shell and crystal horns",
    24: "a grey moth spirit with dusty wings and glowing eyespots",
    25: "a small mystic owl with feathered ear tufts and moonlit eyes",
    26: "a ball armadillo with a segmented shell and curious eyes",
    27: "a green lizard with leaf-like scales and a long tail",
    28: "a mystic piranha with razor teeth and red glowing fins",
    29: "a weaver spider with intricate web patterns on its abdomen",
    30: "a yellow wasp with electric sparks around its wings",
    31: "a mystic crab with coral growths on its shell",
    32: "a purple chameleon with swirling illusion patterns",
    33: "a mystic anteater with a long snout and a shaggy mane",
    34: "a calm mystic capybara with river plants growing on its back",
    35: "an enchanted jaguar with glowing rosettes and emerald eyes",
    36: "a mystic caiman with armored scales and glowing yellow eyes",
    37: "a mystic skunk with smoky purple stripes",
    38: "a mystic coati with a ringed tail and bright eyes",
    39: "a mystic bat with tattered wings and glowing red eyes",
    40: "a wise mystic tortoise with a mossy shell and ancient runes",
    41: "a coral snake with vivid red, black and yellow bands",
    42: "a mystic toucan with a huge colorful beak",
    43: "a dreamy mystic sloth with mossy fur and sleepy eyes",
    44: "a wild boar with bristly fur and curved tusks",
    45: "a tiny tree frog with rainbow dew drops on its skin",
    46: "a mystic songbird with warm brown feathers and a musical aura",
    47: "a mystic macaw with vivid blue and red feathers",
    48: "a tiny hummingbird with iridescent crystal feathers",
    49: "a barn owl spirit with a heart-shaped face and pale wings",
    50: "a mystic vulture with dark feathers and a bone necklace",
}

ELEMENTS = {
    "Agua": "water",
    "Grama": "nature",
    "Fogo": "fire",
    "Trevas": "shadow",
    "Vento": "wind",
    "Terra": "earth",
    "Eletrico": "lightning",
}

STARTERS = {
    "START_AGUA": (
        "Iarinha",
        "a small water nymph spirit from Brazilian folklore, teal skin, "
        "long wavy blue-green hair, a fish tail and big expressive eyes",
    ),
    "START_GRAMA": (
        "Caiporinha",
        "a small forest guardian spirit, light green skin, leaf and twig hair, "
        "twig antlers and big expressive eyes",
    ),
    "START_FOGO": (
        "Saci-Embrião",
        "a small young trickster spirit with smooth brown skin, a glowing red "
        "pointed cap, a single leg, hopping, swirling embers and a wooden pipe, "
        "cute chibi proportions",
    ),
}

SUFFIX = (
    "pixel art game sprite, 32x32 pixel art style, crisp pixels, "
    "centered full figure, solid flat pure chroma key green background (#00FF00), "
    "no shadow, no text, no watermark, game asset"
)

ENTRY_RE = re.compile(
    r'\{ id: "([^"]+)", name: "([^"]+)", element: "([^"]+)", folklore: "([^"]+)"'
)


def element_words(element: str) -> str:
    parts = [p.strip() for p in element.split("/")]
    words = [ELEMENTS.get(p, p.lower()) for p in parts]
    return " and ".join(words)


def stage_of(folkmom_id: str) -> str:
    if folkmom_id.startswith("START_"):
        return "starter"
    if folkmom_id.endswith("B"):
        return "final"
    if folkmom_id.endswith("A"):
        return "middle"
    return "base"


def family_of(folkmom_id: str) -> int | None:
    match = re.match(r"FM(\d{3})", folkmom_id)
    return int(match.group(1)) if match else None


def build_prompt(folkmom_id: str, name: str, element: str, folklore: str) -> str:
    if folkmom_id in STARTERS:
        concept = STARTERS[folkmom_id][1]
        return f"pixel art game sprite of {name}, {concept}, {SUFFIX}"

    family = family_of(folkmom_id)
    concept = FAMILIES.get(family, f"a mystical creature inspired by {folklore}")
    stage = stage_of(folkmom_id)
    elem = element_words(element)

    if stage == "base":
        desc = f"small {concept}, cute chibi proportions, {elem} element"
    elif stage == "middle":
        desc = (
            f"{concept}, evolved form, larger and more powerful, "
            f"extra {elem} details, confident pose"
        )
    else:
        desc = (
            f"{concept}, final evolution, majestic and imposing, "
            f"glowing {elem} aura, legendary presence"
        )

    return f"pixel art game sprite of {name}, {desc}, {SUFFIX}"


def main() -> None:
    text = DATA.read_text()
    found = {}
    for folkmom_id, name, element, folklore in ENTRY_RE.findall(text):
        found[folkmom_id] = {
            "id": folkmom_id,
            "name": name,
            "element": element,
            "folklore": folklore,
        }

    for folkmom_id, (name, concept) in STARTERS.items():
        found.setdefault(
            folkmom_id,
            {"id": folkmom_id, "name": name, "element": "starter", "folklore": name},
        )

    jobs = []
    for folkmom_id, info in found.items():
        jobs.append(
            {
                "id": folkmom_id,
                "name": info["name"],
                "prompt": build_prompt(
                    folkmom_id,
                    info["name"],
                    info["element"],
                    info["folklore"],
                ),
                "raw": f"assets/chroma/{folkmom_id}.png",
                "out": f"assets/sprites/{folkmom_id}.png",
                "out64": f"assets/sprites64/{folkmom_id}.png",
                "flat_chroma": True,
            }
        )

    # Starters primeiro, depois FM001..FM050 na ordem.
    def sort_key(job):
        if job["id"].startswith("START_"):
            return (0, job["id"])
        return (1, job["id"])

    jobs.sort(key=sort_key)
    OUT.write_text(json.dumps(jobs, indent=2, ensure_ascii=False) + "\n")
    print(f"{len(jobs)} jobs escritos em {OUT}")


if __name__ == "__main__":
    main()
