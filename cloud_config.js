// ============================================================
// Conta na nuvem (Supabase)
// ============================================================
// 1. Crie um projeto gratuito em https://supabase.com
// 2. Abra Project Settings -> API e copie:
//    - Project URL
//    - anon public (esta chave é pública e pode ficar no site)
// 3. Em Authentication -> Providers -> Email, desative "Confirm email"
//    enquanto estiver testando (ou confirme o e-mail antes de entrar).
// 4. Em Authentication -> URL Configuration, adicione a URL do jogo:
//    https://kuradame13.github.io/folkmons/
// 5. Preencha os campos abaixo e mude ENABLED para true.
//
// IMPORTANTE: nunca use a chave "service_role" no navegador.
// A chave "anon" é feita para rodar no cliente.
const CLOUD_CONFIG = {
    ENABLED: false,
    SUPABASE_URL: '',
    SUPABASE_ANON_KEY: ''
};
