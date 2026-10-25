// Camada fina sobre o Supabase Auth + tabela public.profiles.
// O nome do treinador e o save do jogo ficam em public.profiles, protegidos por RLS.
const CloudAuth = (() => {
    const PROFILE_TABLE = 'profiles';
    let client = null;
    let user = null;
    let profile = null;
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
            const nextUser = session && session.user ? session.user : null;
            if(event === 'SIGNED_OUT' || (user && nextUser && user.id !== nextUser.id)) {
                profile = null;
            }
            user = nextUser;
        });
        return client;
    }

    function fallbackTrainerName(currentUser) {
        const meta = (currentUser && currentUser.user_metadata) || {};
        const fromMeta = typeof meta.trainer_name === 'string' ? meta.trainer_name.trim() : '';
        if(fromMeta) return fromMeta.slice(0, 20);
        const email = (currentUser && currentUser.email) || '';
        const fromEmail = email.split('@')[0].trim();
        return (fromEmail || 'Treinador').slice(0, 20);
    }

    function fallbackSave(currentUser) {
        const meta = (currentUser && currentUser.user_metadata) || {};
        return meta.save && typeof meta.save === 'object' && !Array.isArray(meta.save)
            ? meta.save
            : {};
    }

    function normalizeProfile(row, currentUser) {
        if(!row) return null;
        const save = row.save && typeof row.save === 'object' && !Array.isArray(row.save)
            ? row.save
            : {};
        return {
            trainer_name: row.trainer_name || fallbackTrainerName(currentUser),
            save: save,
            save_version: Number(row.save_version) || 1,
            updated_at: row.updated_at || null
        };
    }

    async function getSessionUser() {
        if(!enabled()) return null;
        init();
        const { data, error } = await client.auth.getSession();
        if(error) throw error;
        user = data.session && data.session.user ? data.session.user : null;
        return user;
    }

    async function loadProfile(force) {
        if(!enabled()) throw new Error('Nuvem não configurada.');
        init();
        if(profile && !force) return profile;

        const currentUser = user || await getSessionUser();
        if(!currentUser) throw new Error('Sessão da nuvem não encontrada.');

        const { data, error } = await client
            .from(PROFILE_TABLE)
            .select('trainer_name,save,save_version,updated_at')
            .eq('id', currentUser.id)
            .maybeSingle();
        if(error) throw error;

        let row = data;
        if(!row) {
            // Conta antiga (ou trigger ainda não executado): cria o perfil
            // usando o que estiver no user_metadata.
            const initialRow = {
                id: currentUser.id,
                trainer_name: fallbackTrainerName(currentUser),
                save: fallbackSave(currentUser)
            };
            const created = await client
                .from(PROFILE_TABLE)
                .upsert(initialRow, { onConflict: 'id' })
                .select('trainer_name,save,save_version,updated_at')
                .single();
            if(created.error) throw created.error;
            row = created.data;
        }

        user = currentUser;
        profile = normalizeProfile(row, currentUser);
        return profile;
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

        user = data.session && data.session.user ? data.session.user : null;
        profile = null;

        if(user) {
            // O trigger do banco já cria o perfil. A leitura confirma e,
            // se necessário, recria a linha a partir do metadata.
            data.profile = await loadProfile(true);
        }
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
        profile = null;
        if(user) data.profile = await loadProfile(true);
        return data;
    }

    async function logout() {
        if(!enabled()) return;
        init();
        const { error } = await client.auth.signOut();
        if(error) throw error;
        user = null;
        profile = null;
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

    async function saveProfile(save) {
        if(!enabled() || !user) throw new Error('Sessão da nuvem não encontrada.');
        const payload = {
            id: user.id,
            save: save
        };
        if(profile && profile.trainer_name) payload.trainer_name = profile.trainer_name;

        const { data, error } = await client
            .from(PROFILE_TABLE)
            .upsert(payload, { onConflict: 'id' })
            .select('updated_at')
            .maybeSingle();
        if(error) throw error;

        if(profile) {
            profile.save = save;
            if(data && data.updated_at) profile.updated_at = data.updated_at;
        }
        return data || null;
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
        try {
            await saveProfile(save);
        } catch(error) {
            pendingSave = save;
            console.warn('Falha ao salvar na nuvem:', error.message);
        }
    }

    return {
        enabled: enabled,
        init: init,
        getSessionUser: getSessionUser,
        loadProfile: loadProfile,
        getProfile: () => profile,
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
