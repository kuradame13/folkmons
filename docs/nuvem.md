# Conta na nuvem (Supabase)

O jogo já está pronto para usar **login, cadastro, troca de senha e save na
nuvem** com o Supabase. Falta apenas criar o projeto gratuito e colocar duas
chaves no arquivo `cloud_config.js`.

> A chave **anon public** é pública e pode ficar no site. Nunca coloque a chave
> **service_role** no navegador: ela ignora as proteções do banco.

## 1. Criar o projeto

1. Acesse <https://supabase.com> e entre com GitHub (ou e-mail).
2. Clique em **New project**.
3. Nome: `folkmons`.
4. Senha do banco: use uma senha forte e guarde (não é a senha dos jogadores).
5. Região: **South America (São Paulo)**.
6. Plano: **Free**.
7. Espere o projeto terminar de provisionar (1–2 minutos).

## 2. Configurar autenticação

Em **Authentication → Providers → Email**:

- Deixe **Enable Email provider** ligado.
- Para testar hoje, desligue **Confirm email**. Assim o cadastro já entra no
  jogo sem precisar clicar no link do e-mail.
- Se deixar a confirmação ligada, o jogador verá a mensagem “Confirme seu
  e-mail antes de entrar”.

Em **Authentication → URL Configuration**:

- **Site URL**: `https://kuradame13.github.io/folkmons/`
- **Redirect URLs** (adicione as duas):
  - `https://kuradame13.github.io/folkmons/**`
  - `http://localhost:8765/**`
  - `http://127.0.0.1:8765/**`

O segundo endereço serve para testar no computador. Se você publicar em outro
endereço, adicione também.

## 3. Copiar as chaves

Em **Project Settings → API**, copie:

- **Project URL** — parece `https://abcdefgh.supabase.co`
- **anon public** — uma chave longa que começa com `eyJ...`

## 4. Ativar no jogo

Abra `cloud_config.js` e preencha:

```js
const CLOUD_CONFIG = {
    ENABLED: true,
    SUPABASE_URL: 'https://abcdefgh.supabase.co',
    SUPABASE_ANON_KEY: 'eyJ...'
};
```

Depois recarregue o jogo. O selo embaixo do título deve mudar para
**☁️ Conta na nuvem (Supabase)**.

Se preferir, envie a URL e a chave anon para eu configurar e publicar.

## O que fica salvo

- **E-mail** e senha: o Supabase Auth cuida do hash da senha (bcrypt). O jogo
  nunca vê a senha depois do cadastro.
- **Nome de treinador** e **save do jogo**: ficam em `user_metadata`, na conta
  do usuário. Não é preciso criar tabelas nem configurar RLS.
- O save inclui time, itens, evoluções, posição no mapa e estatísticas.
- Os sprites e o código continuam no GitHub Pages; só a conta/save vão para o
  Supabase.

## Troca e redefinição de senha

- **Logado**: botão **Senha** no topo do jogo. Pede a nova senha e confirma.
- **Deslogado**: aba **Redefinir Senha** na tela de login. O Supabase envia um
  link para o e-mail cadastrado; o link volta para o jogo e abre a troca de
  senha.

O envio de e-mails do plano free tem limite e pode cair em spam. Para testar
hoje, o mais rápido é deixar **Confirm email** desligado.

## Limitações do plano free

- Projetos gratuitos podem ser **pausados após 7 dias sem uso**. Se isso
  acontecer, entre no painel do Supabase e restaure o projeto.
- O limite de e-mails é baixo; redefinição de senha em massa não é indicada.
- Para produção, configure um provedor de e-mail próprio (Resend, SendGrid
  etc.) nas configurações de Auth.

## Alternativa: Cloudflare Workers + KV

Também é possível rodar o backend inteiro na Cloudflare, mas seria preciso
criar um token com permissões de **Workers Scripts** e **Workers KV Storage**,
publicar um Worker e manter o banco de usuários. O Supabase entrega o mesmo
resultado com menos manutenção e já resolve hash de senha, sessão e e-mail.
Por isso ele é o caminho recomendado.
