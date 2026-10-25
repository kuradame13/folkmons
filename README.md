# Folkmons — protótipo jogável

Jogo de criaturas inspirado no folclore brasileiro. O objetivo é explorar o
mapa, escanear criaturas com o celular do jogo, batalhar, evoluir e trocar
Folkmons. Não usa nomes, sprites nem mecânicas de Pokémon: a captura é feita
pelo **Scan** do celular.

## O que já está pronto

- Login, cadastro e troca de senha **locais** (salvos no `localStorage`).
- **Conta na nuvem pronta para Supabase**: cadastro por e-mail, login, troca de
  senha, redefinição por e-mail e save sincronizado. Veja
  [`docs/nuvem.md`](docs/nuvem.md) para ativar com duas chaves.
- **Treinador visível no mapa**, com sprite próprio em 4 direções, animação de
  caminhada, sombra, seta e etiqueta “VOCÊ”. Ande com **WASD** ou setas.
- **Menu de batalha completo**: 4 golpes por Folkmom, vantagens de tipo,
  troca de Folkmom, itens, fuga, EXP, level up, recompensa em moedas e captura
  ao vencer.
- 3 iniciais: **Iarinha** (Água), **Caiporinha** (Grama) e **Saci-Embrião**
  (Fogo).
- 50 famílias de Folkmons do folclore, com 2 evoluções cada (153 formas no
  total).
- Evoluções por nível, por item e por troca.
- Mapa top-down, coleta de itens, Scan, batalha por turnos, time e trocas.
- Sprites em PNG (128×128 e 64×64) com fallback para emoji se a imagem ainda
  não existir.
- Galeria para revisar os 153 sprites: `galeria.html`.
- Sprites com fundo verde chroma puro para recortar depois:
  `assets/chroma/`.

## Como jogar

1. Abra o arquivo `index.html` no navegador.
2. Crie uma conta. Sem as chaves do Supabase, ela fica salva só neste
   navegador; com a nuvem ativada, o save acompanha a conta.
3. Escolha seu Folkmom inicial.
4. Ande pelo mapa com **WASD** ou setas; o treinador aparece com a etiqueta
   “VOCÊ”.
5. Pise nos itens, abra o celular e use o **Scan**.
6. Quando o Scan chegar a 100%, conserte o Scan para gerar o Folkmom.
7. No menu de batalha, escolha **Atacar** (4 golpes), **Trocar**, **Item** ou
   **Fugir**. Ao vencer, você ganha EXP, moedas e pode adicionar o Folkmom ao
   time.
8. Troque com o NPC de trocas e use a senha no botão **Senha** do topo.

Se o navegador bloquear alguma coisa ao abrir direto pelo `file://`, rode um
servidor local:

```bash
python3 -m http.server 8000
```

Depois abra `http://localhost:8000/index.html`.

> `index.html` é a versão de publicação. `index_new.html` é a cópia de
> trabalho; as duas carregam o jogo novo (`folkmons_data.js` + `game_new.js`).
> `index_antigo.html` é o protótipo antigo, mantido só como backup.

## Publicar no GitHub Pages

1. Crie um repositório no GitHub (pode ser público).
2. Envie **o conteúdo** da pasta do jogo para a raiz do repositório, não o ZIP.
   O caminho tem que ficar assim:

```
index.html
style.css
folkmons_data.js
game_new.js
cloud_config.js
cloud_auth.js
vendor/supabase.js
galeria.html
assets/sprites/...
assets/sprites64/...
assets/trainer/...
```

3. No GitHub, vá em **Settings → Pages**.
4. Em **Build and deployment**, escolha **Deploy from a branch**.
5. Selecione a branch `main` e a pasta `/ (root)`.
6. Salve e espere 1–2 minutos.
7. Acesse `https://SEU-USUARIO.github.io/NOME-DO-REPO/`.

Como são muitos arquivos de sprite, o mais fácil é usar Git ou o GitHub
Desktop. Se for subir pela interface web, envie em lotes de até 100 arquivos.

Comandos com Git:

```bash
git init
git add .
git commit -m "Folkmons"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/folkmons.git
git push -u origin main
```

## Estrutura de arquivos

```
index.html            versão de publicação
index_new.html        cópia de trabalho
index_antigo.html     protótipo antigo (backup)
style.css             estilos do jogo
folkmons_data.js      dados dos 153 Folkmons, itens e evoluções
game_new.js           lógica do jogo (login, mapa, scan, batalha, trocas)
cloud_config.js       URL e chave anon do Supabase
cloud_auth.js         login/cadastro/senha/save na nuvem
vendor/supabase.js    SDK do Supabase (para funcionar sem CDN)
galeria.html          galeria para revisar os sprites
assets/sprites/       PNGs transparentes 128×128
assets/sprites64/     PNGs transparentes 64×64
assets/trainer/       folha de sprites do treinador
assets/chroma/        PNGs com fundo verde chroma puro (1024×1024)
docs/                 prompts, ideias de lendários e guia da nuvem
tools/                scripts de geração, treinador e empacotamento
```

## Conta na nuvem (opcional, recomendado)

O código da nuvem já está no jogo, mas fica desligado até você criar um projeto
gratuito no Supabase e colocar a **Project URL** e a **anon public key** em
`cloud_config.js`.

Passo a passo completo: [`docs/nuvem.md`](docs/nuvem.md).

Com a nuvem ligada:

- cadastro por e-mail, login e senha com hash no Supabase;
- botão **Senha** no jogo para trocar a senha logado;
- aba **Redefinir Senha** para receber link por e-mail;
- save (time, itens, posição, evoluções) sincronizado na conta.

A chave **anon** é pública e pode ficar no site. Nunca use a
**service_role** no navegador.

## Sprites e fundo verde

- `assets/chroma/<ID>.png` — arte original com o fundo trocado para
  **verde puro `#00FF00`**. Use essas imagens se quiser recortar do zero.
- `assets/sprites/<ID>.png` — PNG 128×128 já com transparência.
- `assets/sprites64/<ID>.png` — versão 64×64 para ícones.

O script tenta remover o fundo, a sombra e o halo. Em personagens muito verdes
(Caiporinha, Cobra, Jibóia), o verde do fundo pode encostar no personagem; nesse
caso, o PNG com transparência já resolve, ou use fundo azul/magenta no prompt.

### Status atual (25/10/2026)

- **74 de 153 sprites prontos.**
- Faltam **79**: `FM024B` e as famílias `FM025` a `FM050` (as três formas de
  cada uma).
- O motivo foi o limite diário gratuito do Cloudflare Workers AI
  (**10.000 neurons/dia**). Em 25/10 a cota ainda respondia **HTTP 429**; a
  próxima tentativa pode ser feita mais tarde.
- Enquanto isso, o jogo continua jogável: as formas sem PNG usam o emoji
  original como fallback.
- A lista exata do que falta fica em `tools/missing.json`, gerada pelo
  `tools/check_sprites.py`.

Para retomar no dia seguinte:

```bash
python3 tools/gen_image.py --batch tools/missing.json
python3 tools/check_sprites.py
python3 tools/build_gallery.py
python3 tools/package.py
```

Se preferir regenerar tudo do zero, use `tools/prompts.json`; o script pula
automaticamente os arquivos que já existem.

## Gerar ou regenerar sprites

As credenciais ficam em `~/.config/opencode/.env`:

```
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_API_TOKEN=...
```

Depois:

```bash
python3 tools/build_prompts.py          # monta tools/prompts.json
python3 tools/gen_image.py --batch tools/prompts.json
python3 tools/build_gallery.py          # atualiza a galeria
```

Uma imagem só, mantendo o fundo verde:

```bash
python3 tools/gen_image.py "SEU PROMPT" \
  --chroma green --flat-chroma --keep-bg \
  --out assets/chroma/meu_folkmom.png
```

Prompt base, dicas e exemplos: `docs/prompt_folkmons.md`.
Ideias de lendários: `docs/legendarios.md`.

## Limitações e avisos

- Sem as chaves do Supabase, as contas continuam locais do navegador: somem se
  o usuário limpar os dados do site. Com a nuvem ativada, o Supabase cuida do
  hash da senha e do save; a chave anon é pública, mas o projeto free pode ser
  pausado após 7 dias sem uso.
- O projeto é um protótipo: balanceamento, mapas e quests ainda podem mudar.
- Confira os sprites na galeria. Alguns podem precisar de ajuste manual (por
  exemplo, o Saci às vezes sai com duas pernas).
- Não use nomes, sprites ou assets oficiais de Pokémon. O folclore brasileiro é
  patrimônio cultural; use com respeito, principalmente figuras sagradas como
  Jurupari.
