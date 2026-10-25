# Banco online do Folkmons (Supabase)

O jogo usa o **Supabase Auth** para as contas e uma tabela
**`public.profiles`** para o nome do treinador e o save completo. Cada jogador
só consegue ler e alterar o próprio perfil por causa das políticas de **RLS**.

O SQL pronto está em [`supabase/schema.sql`](../supabase/schema.sql).

## 1. Criar o projeto

1. Entre em <https://supabase.com> e crie um projeto gratuito chamado
   `folkmons`.
2. Região sugerida: **South America (São Paulo)**.
3. Guarde a senha do banco. Ela **não** é a senha dos jogadores e não precisa
   ficar no jogo.
4. Espere o projeto terminar de provisionar.

## 2. Criar a tabela e as proteções

1. No painel do Supabase, abra **SQL Editor → New query**.
2. Copie todo o conteúdo de `supabase/schema.sql`.
3. Cole e clique em **Run**.
4. O resultado final deve mostrar:
   - `profiles_table_ok = 1`
   - `policies_ok = 3`

O script pode ser executado novamente. Ele **não apaga** os saves existentes.

## 3. Configurar o login

Em **Authentication → Providers → Email**:

- **Enable Email provider**: ligado.
- Para testes rápidos, desligue **Confirm email**. Assim o cadastro já entra no
  jogo sem clicar em link.
- Para produção, você pode ligar a confirmação de e-mail depois.

Em **Authentication → URL Configuration**:

- **Site URL**:
  `https://kuradame13.github.io/folkmons/`
- **Redirect URLs**:
  - `https://kuradame13.github.io/folkmons/**`
  - `http://localhost:8765/**`
  - `http://127.0.0.1:8765/**`

## 4. Ligar o jogo na nuvem

Em **Project Settings → API**, copie:

- **Project URL** — algo como `https://abcdefgh.supabase.co`
- **anon public** — a chave pública que começa com `eyJ...`

Preencha `cloud_config.js`:

```js
const CLOUD_CONFIG = {
    ENABLED: true,
    SUPABASE_URL: 'https://abcdefgh.supabase.co',
    SUPABASE_ANON_KEY: 'eyJ...'
};
```

> A chave **anon public** é pública e pode ir para o GitHub Pages. Nunca coloque
> a chave **service_role** no navegador: ela ignora o RLS.

Depois de publicar, o selo da tela de login deve mostrar
**☁️ Conta na nuvem (Supabase)**.

## 5. Teste online de verdade

1. Abra o jogo publicado em uma janela normal.
2. Crie uma conta com um e-mail novo.
3. Escolha o inicial, ande e altere o save.
4. Recarregue a página: o auto-login deve recuperar o mesmo save.
5. Saia e entre novamente: time, posição, itens e Enciclore devem continuar.
6. Abra o jogo em outro navegador ou no celular e entre com a mesma conta.
7. No Supabase, confira o registro:

```sql
select
  p.trainer_name,
  p.save ->> 'starterChosen' as escolheu_inicial,
  jsonb_array_length(coalesce(p.save -> 'team', '[]'::jsonb)) as time,
  p.updated_at
from public.profiles p
order by p.updated_at desc;
```

## Como o save funciona

- O cliente carrega o perfil ao entrar e ao usar o auto-login.
- `saveGame()` envia o save para `public.profiles` com debounce de 1,2 segundo.
- O servidor atualiza `updated_at` automaticamente.
- Ao sair, o jogo tenta enviar o save pendente antes de encerrar a sessão.
- A tabela aceita JSON de até **2 MB** e só salva se o JSON for um objeto.

## Segurança

- RLS está ligado em `public.profiles`.
- `anon` não tem acesso à tabela.
- `authenticated` só enxerga e altera a linha cujo `id` é igual a
  `auth.uid()`.
- Não existe política de `DELETE`; o save não é apagado pelo cliente.
- Quando a conta é removida no Auth, o perfil é removido em cascata.
- O trigger de cadastro cria o perfil automaticamente.
- O SQL também migra saves antigos que estavam em `user_metadata`.

## Problemas comuns

**“Banco online ainda não configurado”**

O `supabase/schema.sql` ainda não foi executado no projeto, ou o schema cache
da API está desatualizado. Rode o SQL novamente e recarregue o jogo.

**“Sem permissão no banco online”**

Confira se o usuário está autenticado e se as três políticas de RLS existem:

```sql
select policyname, cmd
from pg_policies
where schemaname = 'public' and tablename = 'profiles'
order by policyname;
```

**O cadastro pede confirmação de e-mail**

Desligue **Confirm email** enquanto estiver testando, ou confirme o e-mail antes
de entrar.

**O save não aparece em outro dispositivo**

Confirme se o login foi feito com o mesmo e-mail e se o selo da nuvem está
ligado. O save local de outro navegador não é enviado automaticamente para uma
conta diferente.

## Próximos passos possíveis

Com a tabela funcionando, dá para acrescentar recursos online reais:

- ranking e PvP usando dados de `profiles`;
- mercado/GTL com tabelas próprias;
- presença online e canais de chat;
- backups e histórico de saves;
- moderação e painel administrativo.
