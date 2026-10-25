# Prompt para gerar Folkmons (estilo do jogo)

Este é o mesmo tipo de prompt que usei para gerar os 153 Folkmons do jogo.
Funciona bem no Cloudflare Workers AI (FLUX), mas também dá para adaptar para
Midjourney, Leonardo, DALL·E, Stable Diffusion etc.

## Template principal

Copie, troque o que está entre `**` e cole no gerador:

```
pixel art game sprite of **NOME**, **DESCRIÇÃO VISUAL EM 2 A 4 DETALHES**, Brazilian folklore creature, **ELEMENTO** element, cute chibi proportions, 32x32 pixel art style, crisp pixels, centered full figure, solid flat pure chroma key green background (#00FF00), no shadow, no text, no watermark, game asset
```

### Exemplo pronto — Iarinha (inicial de Água)

```
pixel art game sprite of Iarinha, a small water nymph spirit from Brazilian folklore, teal skin, long wavy blue-green hair, a fish tail and big expressive eyes, water element, cute chibi proportions, 32x32 pixel art style, crisp pixels, centered full figure, solid flat pure chroma key green background (#00FF00), no shadow, no text, no watermark, game asset
```

### Exemplo pronto — Caiporinha (inicial de Grama)

```
pixel art game sprite of Caiporinha, a small forest guardian spirit with light green skin, leaf and twig hair, twig antlers and big expressive eyes, nature element, cute chibi proportions, 32x32 pixel art style, crisp pixels, centered full figure, solid flat pure chroma key green background (#00FF00), no shadow, no text, no watermark, game asset
```

### Exemplo pronto — Saci (inicial de Fogo)

```
pixel art game sprite of Saci-Embrião, a small young trickster spirit with smooth brown skin, a glowing red pointed cap, a single leg, hopping, swirling embers and a wooden pipe, fire element, cute chibi proportions, 32x32 pixel art style, crisp pixels, centered full figure, solid flat pure chroma key green background (#00FF00), no shadow, no text, no watermark, game asset
```

## Para evoluções

Troque a parte de proporções por uma destas frases:

- **Forma 2 (A):**
  `evolved form, larger and more powerful, extra **ELEMENTO** details, confident pose`
- **Forma final (B):**
  `final evolution, majestic and imposing, glowing **ELEMENTO** aura, legendary presence`

Exemplo para a forma final da Cobra-Encantada (FM002B, Boitatá):

```
pixel art game sprite of Boitatá, a luminous river serpent with glowing scales and floating water droplets, final evolution, majestic and imposing, glowing fire and water aura, legendary presence, 32x32 pixel art style, crisp pixels, centered full figure, solid flat pure chroma key green background (#00FF00), no shadow, no text, no watermark, game asset
```

## Para lendários

Use uma escala maior e uma presença mais dramática:

```
pixel art game sprite of **NOME**, **DESCRIÇÃO**, Brazilian folklore legendary spirit, **ELEMENTOS** elements, colossal, majestic and imposing, ancient glowing aura, dramatic pose, 32x32 pixel art style, crisp pixels, centered full figure, solid flat pure chroma key green background (#00FF00), no shadow, no text, no watermark, game asset
```

## Regras de ouro (aprendidas na prática)

1. **Escreva o prompt em inglês.** Os modelos entendem melhor, mesmo que o jogo
   esteja em português.
2. **Descreva 2 a 4 traços visuais marcantes**, não a lore inteira. Exemplo:
   "red cap, one leg, pipe" funciona melhor do que "espírito que apronta
   travessuras nas matas".
3. **Fundo chroma verde:** peça sempre
   `solid flat pure chroma key green background (#00FF00)`.
   Se o personagem for muito verde (Caiporinha, Cobra, Jibóia), o verde pode
   encostar no personagem. Nesses casos, use fundo azul ou magenta e remova
   depois.
4. **Sem sombra:** `no shadow` evita aquela mancha escura que estraga o recorte.
5. **Cuidado com o filtro NSFW.** Evite palavras como `child`, `boy`, `girl`,
   `body`, `nude`, `bare`, `blood`. Descreva como `small spirit`, `creature`,
   `trickster` etc.
6. **Saci tem uma perna só.** Os modelos erram muito. Reforce com
   `single leg, hopping, one leg visible`.
7. **O modelo entrega 1024×1024.** Depois reduza para 128×128 ou 64×64 com
   LANCZOS e quantize as cores para ficar com cara de pixel art.
8. **Consistência:** o FLUX do Cloudflare não aceita `seed`. Para manter o
   mesmo personagem em várias poses, use a imagem aprovada como referência
   (img2img) em outro modelo, ou descreva sempre os mesmos detalhes.
9. **Gere 1 por vez e aprove.** Cada imagem custa créditos. Se o personagem
   saiu errado, ajuste o prompt antes de gerar a evolução.
10. **Fundo verde é para você recortar depois.** Guarde o PNG original com o
    verde; o PNG transparente é só uma conveniência.

## Usando o script local (Cloudflare)

O script `tools/gen_image.py` já faz geração + chroma key + sombra + redução +
quantização.

Uma imagem só, mantendo o fundo verde puro:

```bash
python3 tools/gen_image.py "SEU PROMPT" \
  --chroma green --flat-chroma --keep-bg \
  --out assets/chroma/meu_folkmom.png
```

Uma imagem com fundo verde + PNG transparente:

```bash
python3 tools/gen_image.py "SEU PROMPT" \
  --chroma green --flat-chroma \
  --out assets/sprites/meu_folkmom.png \
  --raw-out assets/chroma/meu_folkmom.png
```

Lote completo (153 formas):

```bash
python3 tools/build_prompts.py
python3 tools/gen_image.py --batch tools/prompts.json
```

Os prompts de todas as formas ficam em `tools/prompts.json`. Para mudar a
descrição de uma família, edite `FAMILIES` em `tools/build_prompts.py` e rode
de novo.
