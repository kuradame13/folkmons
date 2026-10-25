# Conta na nuvem (Supabase)

O jogo usa o **Supabase Auth** para as contas e a tabela
**`public.profiles`** para o nome do treinador e o save. O banco tem **RLS**:
cada jogador só lê e altera o próprio perfil.

O guia completo do banco está em [`docs/banco.md`](banco.md). O SQL pronto está
em [`supabase/schema.sql`](../supabase/schema.sql).

> A chave **anon public** é pública e pode ficar no site. Nunca coloque a chave
> **service_role** no navegador: ela ignora as proteções do banco.

## Passo a passo

### 1. Criar o projeto

1. Acesse <https://supabase.com> e entre com GitHub (ou e-mail).
2. Clique em **New project**.
3. Nome: `folkmons`.
4. Senha do banco: use uma senha forte e guarde (não é a senha dos jogadores).
5. Região: **South America (São Paulo)**.
6. Plano: **Free**.
7. Espere o projeto terminar de provisionar (1–2 minutos).

### 2. Criar a tabela e as proteções

1. Abra **SQL Editor → New query**.
2. Cole todo o conteúdo de `supabase/schema.sql`.
3. Clique em **Run**.
4. Confirme o resultado: `profiles_table_ok = 1` e `policies_ok = 3`.

Isso cria `public.profiles`, o trigger de cadastro, o `updated_at` automático,
as políticas de RLS e a migração de saves antigos que estavam em
`user_metadata`.

### 3. Configurar autenticação

Em **Authentication → Providers → Email**:

- Deixe **Enable Email provider** ligado.
- Para testar hoje, desligue **Confirm email**. Assim o cadastro já entra no
  jogo sem precisar clicar no link do e-mail.
- Se deixar a confirmação ligada, o jogador verá a mensagem “Confirme seu
  e-mail antes de entrar”.

Em **Authentication → URL Configuration**:

- **Site URL**: `https://kuradame13.github.io/folkmons/`
- **Redirect URLs**:
  - `https://kuradame13.github.io/folkmons/**`
  - `http://localhost:8765/**`
  - `http://127.0.0.1:8765/**`

### 4. Copiar as chaves

Em **Project Settings → API**, copie:

- **Project URL** — parece `https://abcdefgh.supabase.co`
- **anon public** — uma chave longa que começa com `eyJ...`

### 5. Ativar no jogo

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

- **E-mail** e senha: o Supabase Auth cuida do hash da senha. O jogo nunca vê a
  senha depois do cadastro.
- **Nome de treinador** e **save do jogo**: ficam em `public.profiles`, uma
  linha por conta.
- O save inclui time, itens, evoluções, posição no mapa, estatísticas,
  Enciclore, atalhos, seguidor, amigos e guilda local.
- O cliente atualiza o save com debounce de 1,2 segundo e tenta enviar o que
  estiver pendente ao sair.
- Os sprites e o código continuam no GitHub Pages; só a conta/save vão para o
  Supabase.

## Teste online

1. Crie uma conta nova com a confirmação de e-mail desligada.
2. Escolha o inicial, ande e altere o save.
3. Recarregue a página e confirme o auto-login.
4. Saia, entre de novo e confira o time e a posição.
5. Abra em outro navegador/celular e entre com a mesma conta.
6. No Supabase, rode:

```sql
select trainer_name, save ->> 'starterChosen' as inicial, updated_at
from public.profiles
order by updated_at desc;
```

## Troca e redefinição de senha

- **Logado**: **Menu do Jogo → Trocar senha** (canto inferior direito).
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

## Segurança

- RLS está ligado em `public.profiles`.
- `anon` não acessa a tabela.
- `authenticated` só vê e altera a própria linha (`auth.uid() = id`).
- Não existe política de `DELETE`.
- A chave `service_role` nunca deve ser usada no navegador.
