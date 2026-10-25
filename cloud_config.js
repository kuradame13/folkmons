// ============================================================
// Conta na nuvem (Supabase)
// ============================================================
// 1. Crie um projeto gratuito em https://supabase.com
// 2. Abra o SQL Editor e execute o arquivo supabase/schema.sql.
//    Ele cria a tabela public.profiles, os triggers e as políticas RLS.
// 3. Abra Project Settings -> API e copie:
//    - Project URL
//    - anon public (esta chave é pública e pode ficar no site)
// 4. Em Authentication -> Providers -> Email, desative "Confirm email"
//    enquanto estiver testando (ou confirme o e-mail antes de entrar).
// 5. Em Authentication -> URL Configuration, adicione a URL do jogo:
//    https://kuradame13.github.io/folkmons/
// 6. Preencha os campos abaixo e mude ENABLED para true.
//
// IMPORTANTE: nunca use a chave "service_role" no navegador.
// A chave "anon" é feita para rodar no cliente.
const CLOUD_CONFIG = {
    ENABLED: false,
    SUPABASE_URL: '',
    SUPABASE_ANON_KEY: ''
};
