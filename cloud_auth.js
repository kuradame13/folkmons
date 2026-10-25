// Camada fina sobre o Supabase Auth.
// O save do jogo fica em user_metadata.save (sem tabela/RLS).
const CloudAuth = (() => {
    let client = null;
    let user = null;
    let saveTimer = null;
    let pendingSave = null;

    function enabled() {
        return !!(
            typeof CLOUD_CONFIG !== 'undefined' &&
            CLOUD_CONFIG.ENABLED &&
            CLOUD_CONFIG.SUPABASE_URL &&
            CLOUD_CONFIG.SUPABASE_ANON_KEY &&
            window.supabase &&
            typeof window.supabase.createClient === 'function'
        );
    }

    function init() {
        if(!enabled()) return null;
        if(client) return client;
        client = window.supabase.createClient(CLOUD_CONFIG.SUPABASE_URL, CLOUD_CONFIG.SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        });
        client.auth.onAuthStateChange((event, session) => {
            user = session && session.user ? session.user : null;
        });
        return client;
    }

    async function getSessionUser() {
        if(!enabled()) return null;
        init();
        const { data, error } = await client.auth.getSession();
        if(error) throw error;
        user = data.session && data.session.user ? data.session.user : null;
        return user;
    }

    async function register(email, password, trainerName, initialSave) {
        if(!enabled()) throw new Error('Nuvem não configurada.');
        init();
        const { data, error } = await client.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    trainer_name: trainerName,
                    save: initialSave
                }
            }
        });
        if(error) throw error;
        user = data.session && data.user ? data.user : null;
        return data;
    }

    async function login(email, password) {
        if(!enabled()) throw new Error('Nuvem não configurada.');
        init();
        const { data, error } = await client.auth.signInWithPassword({
            email: email,
            password: password
        });
        if(error) throw error;
        user = data.user || null;
        return data;
    }

    async function logout() {
        if(!enabled()) return;
        init();
        const { error } = await client.auth.signOut();
        if(error) throw error;
        user = null;
        pendingSave = null;
        clearTimeout(saveTimer);
    }

    async function changePassword(newPassword) {
        if(!enabled()) throw new Error('Nuvem não configurada.');
        init();
        const { data, error } = await client.auth.updateUser({ password: newPassword });
        if(error) throw error;
        return data;
    }

    async function resetPassword(email) {
        if(!enabled()) throw new Error('Nuvem não configurada.');
        init();
        const redirectTo = window.location.origin + window.location.pathname;
        const { data, error } = await client.auth.resetPasswordForEmail(email, { redirectTo: redirectTo });
        if(error) throw error;
        return data;
    }

    function scheduleSave(save) {
        if(!enabled() || !user) return;
        pendingSave = save;
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => { flush(); }, 1200);
    }

    async function flush() {
        if(!enabled() || !user || !pendingSave) return;
        clearTimeout(saveTimer);
        const save = pendingSave;
        pendingSave = null;
        const { error } = await client.auth.updateUser({ data: { save: save } });
        if(error) {
            pendingSave = save;
            console.warn('Falha ao salvar na nuvem:', error.message);
        }
    }

    return {
        enabled: enabled,
        init: init,
        getSessionUser: getSessionUser,
        register: register,
        login: login,
        logout: logout,
        changePassword: changePassword,
        resetPassword: resetPassword,
        scheduleSave: scheduleSave,
        flush: flush,
        getUser: () => user
    };
})();
