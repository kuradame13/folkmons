// Folkmons - Jogo base folclore brasileiro
let currentUser = null;

// Estado da HUD no estilo cliente de MMO.
const CHAT_TABS = ['Local', 'Global', 'Comércio', 'Sussurro', 'Equipe', 'Batalha'];
const chatState = {
    active: 'Local',
    messages: {},
    unread: {},
    initialized: false
};
let gameSessionStart = Date.now();
let fpsFrames = 0;
let fpsLast = performance.now();
let currentFps = 0;
let partySelectedIndex = -1;
let lastPartySignature = '';
let lastHotbarSignature = '';
let lastTopHudUpdate = 0;
let bagTab = 'heal';
let currentMenuType = '';
let dexFilter = { search: '', element: 'all', status: 'all' };
let marketOffers = [];
let followerMon = null;
let followerImg = null;
let followerImageId = '';
let followerReady = false;
let toastTimer = null;
let toastQueue = [];
let toastCurrent = null;
let playTimer = null;
let hudTimer = null;
let touchControlsEnabled = false;
let touchControlsReady = false;
let touchVector = { x: 0, y: 0 };
let stickPointerId = null;

// All folkmons flattened
let ALL_FOLKMONS = [];
FOLKMONS.starters.forEach(s => ALL_FOLKMONS.push({...s, evoType: "starter"}));
FOLKMONS.main.forEach(m => ALL_FOLKMONS.push(m));

function getFolkmomById(id) {
    return ALL_FOLKMONS.find(f => f.id === id);
}

// Sprite em PNG (assets/sprites/<id>.png). Se a imagem ainda nao existir,
// cai de volta para o emoji original da base.
function monsterSpriteHTML(mon, extraClass) {
    const emoji = (mon && mon.sprite) || '❓';
    const id = mon && mon.id;
    if(!id) return '<span class="sprite-fallback">' + emoji + '</span>';
    const cls = 'monster-img' + (extraClass ? ' ' + extraClass : '');
    return '<img class="' + cls + '" src="assets/sprites/' + id + '.png" alt="' +
        (mon.name || 'Folkmom') + '" data-fallback="' + emoji +
        '" onerror="spriteFallback(this)">';
}

function spriteFallback(img) {
    const span = document.createElement('span');
    span.className = 'sprite-fallback';
    span.textContent = img.dataset.fallback || '❓';
    img.replaceWith(span);
}

function createFolkmom(id, level) {
    const base = getFolkmomById(id);
    if(!base) return null;
    return {
        id: base.id,
        name: base.name,
        element: base.element,
        folklore: base.folklore,
        sprite: base.sprite,
        level: level,
        exp: 0,
        expToNext: level * 120,
        hp: Math.floor(base.baseHp + level * 2.5),
        maxHp: Math.floor(base.baseHp + level * 2.5),
        atk: Math.floor(base.baseAtk + level * 1.8),
        def: Math.floor(base.baseDef + level * 1.3),
        baseData: base
    };
}

// Sistema de autenticação (local ou nuvem/Supabase)
const CLOUD_ENABLED = (typeof CLOUD_CONFIG !== 'undefined') &&
    !!CLOUD_CONFIG.ENABLED &&
    (typeof CloudAuth !== 'undefined') &&
    CloudAuth.enabled();

function newPlayer() {
    return {
        level: 1,
        money: 500,
        team: [],
        items: { cura_simples: 5 },
        evoItems: {},
        missions: [],
        stats: {
            scans: 0,
            captures: 0,
            battlesWon: 0,
            evolves: 0,
            bp: 0,
            playSeconds: 0,
            pvpWins: 0,
            pvpLosses: 0,
            pvpRating: 1000
        },
        dex: { seen: {}, caught: {} },
        hotbar: ['cura_simples', null, null, null, null, null, null, null, null],
        followerIndex: 0,
        trainerName: '',
        friends: [],
        guild: '',
        settings: { chat: true, hotbar: true },
        pos: { x: 400, y: 300 },
        starterChosen: false
    };
}

function normalizePlayer() {
    if(!player || typeof player !== 'object') player = {};
    const base = newPlayer();
    Object.keys(base).forEach(k => {
        if(player[k] === undefined) player[k] = base[k];
    });
    player.stats = Object.assign({}, base.stats, player.stats || {});
    player.items = Object.assign({ cura_simples: 5 }, player.items || {});
    player.evoItems = player.evoItems || {};
    player.team = Array.isArray(player.team) ? player.team.filter(Boolean) : [];
    player.missions = Array.isArray(player.missions) ? player.missions : [];
    player.dex = Object.assign({ seen: {}, caught: {} }, player.dex || {});
    player.dex.seen = player.dex.seen || {};
    player.dex.caught = player.dex.caught || {};
    player.hotbar = Array.isArray(player.hotbar) ? player.hotbar.slice(0, 9) : [];
    while(player.hotbar.length < 9) player.hotbar.push(null);
    if(!player.hotbar[0] && player.items.cura_simples > 0) player.hotbar[0] = 'cura_simples';
    player.followerIndex = Number.isFinite(player.followerIndex) ? player.followerIndex : 0;
    if(player.followerIndex < 0 || player.followerIndex >= Math.max(1, player.team.length)) player.followerIndex = 0;
    player.friends = Array.isArray(player.friends) ? player.friends : [];
    player.guild = typeof player.guild === 'string' ? player.guild : '';
    player.trainerName = typeof player.trainerName === 'string' ? player.trainerName : '';
    player.settings = Object.assign({ chat: true, hotbar: true }, player.settings || {});
    if(typeof player.settings.touchControls !== 'boolean') player.settings.touchControls = isTouchCapable();
    if(!player.pos) player.pos = { x: 400, y: 300 };

    // Saves antigos não tinham Enciclore. O time atual conta como visto/capturado.
    player.team.forEach(mon => {
        if(!mon || !mon.id) return;
        player.dex.seen[mon.id] = true;
        player.dex.caught[mon.id] = true;
    });
}

function markDexSeen(id) {
    if(!id) return;
    if(!player.dex) player.dex = { seen: {}, caught: {} };
    player.dex.seen[id] = true;
}

function markDexCaught(id) {
    if(!id) return;
    if(!player.dex) player.dex = { seen: {}, caught: {} };
    player.dex.seen[id] = true;
    player.dex.caught[id] = true;
}

function cloudErrorMessage(err) {
    const message = (err && (err.message || err.error_description)) || 'Erro ao acessar a nuvem.';
    if(/Invalid login credentials/i.test(message)) return 'E-mail ou senha inválidos.';
    if(/Email not confirmed/i.test(message)) return 'Confirme seu e-mail antes de entrar.';
    if(/User already registered|already been registered/i.test(message)) return 'Este e-mail já está cadastrado. Faça login.';
    if(/Password should be at least/i.test(message)) return 'A senha deve ter pelo menos 6 caracteres.';
    if(/Unable to validate email/i.test(message)) return 'E-mail inválido.';
    if(/Failed to fetch|NetworkError/i.test(message)) return 'Sem conexão com a nuvem. Tente novamente.';
    return message;
}

function updateChangePassUI() {
    const passwordFields = document.getElementById('cpPasswordFields');
    const resetFields = document.getElementById('cpResetFields');
    if(!passwordFields || !resetFields) return;

    if(!CLOUD_ENABLED) {
        passwordFields.style.display = 'block';
        resetFields.style.display = 'none';
        return;
    }

    // Na tela de autenticação o usuário está deslogado:
    // oferecemos redefinição por e-mail. A troca de senha logado fica no botão "Senha".
    passwordFields.style.display = 'none';
    resetFields.style.display = 'block';
}

function applyCloudUI() {
    const badge = document.getElementById('cloudBadge');
    if(!CLOUD_ENABLED) {
        if(badge) {
            badge.textContent = '💾 Conta local (neste navegador)';
            badge.style.display = 'block';
            badge.style.color = '#92400e';
            badge.style.background = '#fef3c7';
            badge.style.borderColor = '#fcd34d';
        }
        updateChangePassUI();
        return;
    }

    const loginInput = document.getElementById('loginUsername');
    loginInput.type = 'email';
    loginInput.placeholder = 'E-mail';
    loginInput.maxLength = 254;

    const regEmail = document.getElementById('regEmail');
    if(regEmail) regEmail.style.display = 'block';

    const regUsername = document.getElementById('regUsername');
    regUsername.placeholder = 'Nome de treinador (3-20)';
    document.getElementById('regPassword').placeholder = 'Senha (mín. 6 caracteres)';
    document.getElementById('cpNewPass').placeholder = 'Nova Senha (mín. 6 caracteres)';

    const cpTab = document.querySelectorAll('.tab-btn')[2];
    if(cpTab) cpTab.textContent = 'Redefinir Senha';

    if(badge) {
        badge.textContent = '☁️ Conta na nuvem (Supabase)';
        badge.style.display = 'block';
    }

    const gameOldPass = document.getElementById('gameOldPass');
    if(gameOldPass) gameOldPass.style.display = 'none';
    const gameNewPass = document.getElementById('gameNewPass');
    if(gameNewPass) gameNewPass.placeholder = 'Nova senha (mín. 6 caracteres)';

    updateChangePassUI();
}

function enterGame(displayName) {
    currentBattle = null;
    const battleScreen = document.getElementById('battleScreen');
    if(battleScreen) battleScreen.style.display = 'none';
    const menuOverlay = document.getElementById('menuOverlay');
    if(menuOverlay) menuOverlay.style.display = 'none';
    const passwordOverlay = document.getElementById('passwordOverlay');
    if(passwordOverlay) passwordOverlay.style.display = 'none';

    normalizePlayer();
    player.trainerName = displayName || player.trainerName || currentUser || 'Treinador';
    gameSessionStart = Date.now();
    partySelectedIndex = -1;
    marketOffers = [];
    bagTab = 'heal';
    dexFilter = { search: '', element: 'all', status: 'all' };

    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'flex';
    document.getElementById('playerName').textContent = player.trainerName;
    fitGameClient();
    applyHUDVisibility();
    initChatUI();
    initGame();
    updateTopHUD();
    updatePartyBar(true);
    renderHotbar();
    refreshFollower();
    startPlayTimer();
    updateHUD();
}

// Ajusta o cliente de 800x600 ao espaço disponível, mantendo a HUD inteira visível.
function fitGameClient() {
    const screen = document.getElementById('gameScreen');
    const client = document.querySelector('.game-client');
    const container = document.querySelector('.game-container');
    if(!screen || !client || !container || screen.style.display === 'none') return;
    if(!screen.clientWidth || !screen.clientHeight) return;

    const scale = Math.max(0.32, Math.min(1.55,
        (screen.clientWidth - 24) / 800,
        (screen.clientHeight - 24) / 600
    ));
    client.style.width = (800 * scale) + 'px';
    client.style.height = (600 * scale) + 'px';
    container.style.transform = 'scale(' + scale + ')';
}

function fitBattleScreen() {
    const overlay = document.getElementById('battleScreen');
    const box = overlay && overlay.querySelector('.battle-container');
    if(!overlay || !box || overlay.style.display === 'none') return;
    const scale = Math.max(0.45, Math.min(1.8,
        (window.innerWidth - 28) / 640,
        (window.innerHeight - 28) / 430
    ));
    box.style.transform = 'scale(' + scale + ')';
}

function showTab(tab) {
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');
    tabs.forEach(btn => btn.classList.remove('active'));
    contents.forEach(content => content.classList.remove('active'));

    const index = tab === 'login' ? 0 : tab === 'register' ? 1 : 2;
    if(tabs[index]) tabs[index].classList.add('active');

    if(tab === 'login') document.getElementById('loginTab').classList.add('active');
    else if(tab === 'register') document.getElementById('registerTab').classList.add('active');
    else if(tab === 'changePass') {
        document.getElementById('changePassTab').classList.add('active');
        updateChangePassUI();
    }
}

function getUsers() {
    return JSON.parse(localStorage.getItem('folkmonsUsers') || '{}');
}

function saveUsers(users) {
    localStorage.setItem('folkmonsUsers', JSON.stringify(users));
}

async function register() {
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail') ? document.getElementById('regEmail').value.trim() : '';
    const pass = document.getElementById('regPassword').value;
    const pass2 = document.getElementById('regPassword2').value;
    const msg = document.getElementById('regMsg');
    const minPass = CLOUD_ENABLED ? 6 : 4;

    if(username.length < 3) { msg.style.color = 'red'; msg.textContent = 'Nome de treinador deve ter pelo menos 3 caracteres'; return; }
    if(CLOUD_ENABLED && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { msg.style.color = 'red'; msg.textContent = 'Informe um e-mail válido'; return; }
    if(pass.length < minPass) { msg.style.color = 'red'; msg.textContent = 'Senha deve ter pelo menos ' + minPass + ' caracteres'; return; }
    if(pass !== pass2) { msg.style.color = 'red'; msg.textContent = 'Senhas não coincidem'; return; }

    if(CLOUD_ENABLED) {
        msg.style.color = 'blue';
        msg.textContent = 'Criando conta na nuvem...';
        try {
            const data = await CloudAuth.register(email, pass, username, newPlayer());
            if(data.user && data.user.identities && data.user.identities.length === 0) {
                msg.style.color = 'red';
                msg.textContent = 'Este e-mail já está cadastrado. Faça login.';
                return;
            }
            if(!data.session) {
                msg.style.color = 'green';
                msg.textContent = 'Conta criada! Confirme seu e-mail e depois faça login.';
                return;
            }
            currentUser = data.user.email;
            const meta = data.user.user_metadata || {};
            player = meta.save || newPlayer();
            normalizePlayer();
            msg.style.color = 'green';
            msg.textContent = 'Conta criada com sucesso!';
            document.getElementById('regUsername').value = '';
            document.getElementById('regEmail').value = '';
            document.getElementById('regPassword').value = '';
            document.getElementById('regPassword2').value = '';
            enterGame(meta.trainer_name || username);
        } catch(err) {
            msg.style.color = 'red';
            msg.textContent = cloudErrorMessage(err);
        }
        return;
    }

    if(getUsers()[username]) { msg.style.color = 'red'; msg.textContent = 'Usuário já existe'; return; }

    const users = getUsers();
    users[username] = { password: pass, data: newPlayer() };
    saveUsers(users);

    msg.style.color = 'green';
    msg.textContent = 'Conta criada com sucesso!';
    document.getElementById('regUsername').value = '';
    document.getElementById('regPassword').value = '';
    document.getElementById('regPassword2').value = '';
}

async function login() {
    const identifier = document.getElementById('loginUsername').value.trim();
    const pass = document.getElementById('loginPassword').value;
    const msg = document.getElementById('loginMsg');

    if(!identifier) { msg.style.color = 'red'; msg.textContent = 'Informe seu e-mail ou usuário'; return; }
    if(!pass) { msg.style.color = 'red'; msg.textContent = 'Informe sua senha'; return; }

    if(CLOUD_ENABLED) {
        msg.style.color = 'blue';
        msg.textContent = 'Entrando...';
        try {
            const data = await CloudAuth.login(identifier, pass);
            const meta = data.user.user_metadata || {};
            currentUser = data.user.email;
            player = meta.save || newPlayer();
            normalizePlayer();
            document.getElementById('loginPassword').value = '';
            msg.textContent = '';
            enterGame(meta.trainer_name || data.user.email.split('@')[0]);
        } catch(err) {
            msg.style.color = 'red';
            msg.textContent = cloudErrorMessage(err);
        }
        return;
    }

    const users = getUsers();
    if(!users[identifier]) { msg.style.color = 'red'; msg.textContent = 'Usuário não encontrado'; return; }
    if(users[identifier].password !== pass) { msg.style.color = 'red'; msg.textContent = 'Senha incorreta'; return; }

    currentUser = identifier;
    player = JSON.parse(JSON.stringify(users[identifier].data));
    normalizePlayer();
    document.getElementById('loginPassword').value = '';
    enterGame(identifier);
}

async function changePassword() {
    const msg = document.getElementById('cpMsg');

    if(CLOUD_ENABLED) {
        msg.style.color = 'blue';
        msg.textContent = 'Use o campo de e-mail acima para receber o link de redefinição.';
        return;
    }

    const username = document.getElementById('cpUsername').value.trim();
    const oldPass = document.getElementById('cpOldPass').value;
    const newPass = document.getElementById('cpNewPass').value;
    const newPass2 = document.getElementById('cpNewPass2').value;

    const users = getUsers();
    if(!users[username]) { msg.style.color = 'red'; msg.textContent = 'Usuário não encontrado'; return; }
    if(users[username].password !== oldPass) { msg.style.color = 'red'; msg.textContent = 'Senha atual incorreta'; return; }
    if(newPass.length < 4) { msg.style.color = 'red'; msg.textContent = 'Nova senha deve ter pelo menos 4 caracteres'; return; }
    if(newPass !== newPass2) { msg.style.color = 'red'; msg.textContent = 'Senhas não coincidem'; return; }

    users[username].password = newPass;
    saveUsers(users);
    msg.style.color = 'green';
    msg.textContent = 'Senha alterada com sucesso!';
    document.getElementById('cpUsername').value = '';
    document.getElementById('cpOldPass').value = '';
    document.getElementById('cpNewPass').value = '';
    document.getElementById('cpNewPass2').value = '';
}

async function sendPasswordReset() {
    const msg = document.getElementById('cpMsg');
    if(!CLOUD_ENABLED) {
        msg.style.color = 'red';
        msg.textContent = 'A redefinição por e-mail só está disponível com a conta na nuvem.';
        return;
    }
    const email = document.getElementById('cpEmail').value.trim();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        msg.style.color = 'red';
        msg.textContent = 'Informe um e-mail válido';
        return;
    }
    msg.style.color = 'blue';
    msg.textContent = 'Enviando link...';
    try {
        await CloudAuth.resetPassword(email);
        msg.style.color = 'green';
        msg.textContent = 'Se este e-mail estiver cadastrado, você receberá um link para redefinir a senha.';
    } catch(err) {
        msg.style.color = 'red';
        msg.textContent = cloudErrorMessage(err);
    }
}

function openChangePassword() {
    const oldPass = document.getElementById('gameOldPass');
    if(oldPass) oldPass.style.display = CLOUD_ENABLED ? 'none' : 'block';
    const msg = document.getElementById('gamePassMsg');
    if(msg) { msg.style.color = ''; msg.textContent = ''; }
    document.getElementById('passwordOverlay').style.display = 'flex';
}

function closeChangePassword() {
    document.getElementById('passwordOverlay').style.display = 'none';
    ['gameOldPass', 'gameNewPass', 'gameNewPass2'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.value = '';
    });
}

async function changePasswordLoggedIn() {
    const msg = document.getElementById('gamePassMsg');
    const newPass = document.getElementById('gameNewPass').value;
    const newPass2 = document.getElementById('gameNewPass2').value;
    const minPass = CLOUD_ENABLED ? 6 : 4;

    if(newPass.length < minPass) {
        msg.style.color = 'red';
        msg.textContent = 'A nova senha deve ter pelo menos ' + minPass + ' caracteres';
        return;
    }
    if(newPass !== newPass2) {
        msg.style.color = 'red';
        msg.textContent = 'As senhas não coincidem';
        return;
    }

    if(CLOUD_ENABLED) {
        if(!CloudAuth.getUser()) {
            msg.style.color = 'red';
            msg.textContent = 'Sessão expirada. Entre novamente.';
            return;
        }
        msg.style.color = 'blue';
        msg.textContent = 'Salvando...';
        try {
            await CloudAuth.changePassword(newPass);
            msg.style.color = 'green';
            msg.textContent = 'Senha alterada com sucesso!';
            setTimeout(closeChangePassword, 1200);
        } catch(err) {
            msg.style.color = 'red';
            msg.textContent = cloudErrorMessage(err);
        }
        return;
    }

    const oldPass = document.getElementById('gameOldPass').value;
    const users = getUsers();
    if(!users[currentUser] || users[currentUser].password !== oldPass) {
        msg.style.color = 'red';
        msg.textContent = 'Senha atual incorreta';
        return;
    }
    users[currentUser].password = newPass;
    saveUsers(users);
    msg.style.color = 'green';
    msg.textContent = 'Senha alterada com sucesso!';
    setTimeout(closeChangePassword, 1200);
}

async function logout() {
    saveGame();
    if(CLOUD_ENABLED) {
        try {
            await CloudAuth.flush();
            await CloudAuth.logout();
        } catch(err) {
            console.warn('Falha ao sair da nuvem:', err);
        }
    }
    currentUser = null;
    keys = {};
    currentBattle = null;
    player = {};
    closePartyMenu();
    if(scanInterval) {
        clearInterval(scanInterval);
        scanInterval = null;
    }
    currentScanPercent = 0;
    const scanPercent = document.getElementById('scanPercent');
    if(scanPercent) scanPercent.textContent = '0%';
    const scanStatus = document.getElementById('scanStatus');
    if(scanStatus) scanStatus.textContent = 'Pronto';

    const battleScreen = document.getElementById('battleScreen');
    if(battleScreen) battleScreen.style.display = 'none';
    const battleLog = document.getElementById('battleLog');
    if(battleLog) battleLog.innerHTML = '';
    const battleActions = document.getElementById('battleMainActions');
    if(battleActions) battleActions.innerHTML = '';
    const menuOverlay = document.getElementById('menuOverlay');
    if(menuOverlay) menuOverlay.style.display = 'none';
    cancelToast();
    resetTouchStick();

    chatState.active = 'Local';
    chatState.messages = {};
    chatState.unread = {};
    chatState.initialized = false;
    lastPartySignature = '';
    lastHotbarSignature = '';
    followerMon = null;
    followerImg = null;
    followerReady = false;
    followerImageId = '';

    document.getElementById('gameScreen').style.display = 'none';
    document.getElementById('authScreen').style.display = 'flex';
    document.getElementById('passwordOverlay').style.display = 'none';
    updateChangePassUI();
}

function saveGame() {
    if(!currentUser) return;
    if(player && typeof player.x === 'number' && typeof player.y === 'number') {
        player.pos = { x: player.x, y: player.y };
    }

    if(CLOUD_ENABLED) {
        if(!CloudAuth.getUser()) return;
        const clean = JSON.parse(JSON.stringify(player, (key, value) => key === 'baseData' ? undefined : value));
        CloudAuth.scheduleSave(clean);
        return;
    }

    const users = getUsers();
    if(users[currentUser]) {
        users[currentUser].data = JSON.parse(JSON.stringify(player));
        saveUsers(users);
    }
}

async function tryCloudAutoLogin() {
    if(!CLOUD_ENABLED) return false;
    try {
        const user = await CloudAuth.getSessionUser();
        if(!user) return false;
        const meta = user.user_metadata || {};
        currentUser = user.email;
        player = meta.save || newPlayer();
        normalizePlayer();
        enterGame(meta.trainer_name || user.email.split('@')[0]);
        if(window.location.hash.includes('type=recovery')) {
            setTimeout(openChangePassword, 800);
        }
        return true;
    } catch(err) {
        console.warn('Auto-login na nuvem falhou:', err);
        return false;
    }
}

let player = {};
let canvas, ctx;
let keys = {};
let gameMap = [];
let currentBattle = null;
let trainerSheet = null;
let trainerReady = false;
let controlsReady = false;

function ensurePlayerPosition() {
    if(!player.pos) player.pos = { x: 400, y: 300 };
    if(typeof player.x !== 'number' || Number.isNaN(player.x)) player.x = Number(player.pos.x) || 400;
    if(typeof player.y !== 'number' || Number.isNaN(player.y)) player.y = Number(player.pos.y) || 300;
    if(typeof player.dir !== 'number') player.dir = 0;
    player.x = Math.max(16, Math.min(784, player.x));
    player.y = Math.max(16, Math.min(584, player.y));
}

function loadTrainerSheet() {
    if(trainerSheet) return;
    trainerSheet = new Image();
    trainerSheet.onload = () => { trainerReady = true; };
    trainerSheet.onerror = () => { trainerReady = false; };
    trainerSheet.src = 'assets/trainer/trainer_sheet.png';
}

function isTypingTarget(target) {
    if(!target) return false;
    const tag = (target.tagName || '').toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable;
}

function isGamePaused() {
    if(currentBattle) return true;
    const menu = document.getElementById('menuOverlay');
    const pass = document.getElementById('passwordOverlay');
    if(menu && menu.style.display !== 'none') return true;
    if(pass && pass.style.display !== 'none') return true;
    return false;
}

// ===================== CONTROLES DE TOQUE =====================
function isTouchCapable() {
    try {
        return (navigator.maxTouchPoints || 0) > 0 ||
            !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    } catch(e) {
        return false;
    }
}

function applyTouchControls(enabled) {
    touchControlsEnabled = !!enabled;
    const box = document.getElementById('touchControls');
    if(box) {
        box.classList.toggle('active', touchControlsEnabled);
        box.setAttribute('aria-hidden', touchControlsEnabled ? 'false' : 'true');
    }
    if(!touchControlsEnabled) resetTouchStick();
}

function toggleTouchControls() {
    if(!player) return;
    if(!player.settings) player.settings = { chat: true, hotbar: true };
    player.settings.touchControls = !touchControlsEnabled;
    applyTouchControls(player.settings.touchControls);
    saveGame();
    if(currentMenuType === 'game' && isMenuOpen()) renderGameMenu();
}

function resetTouchStick() {
    touchVector.x = 0;
    touchVector.y = 0;
    const knob = document.getElementById('stickKnob');
    if(knob) knob.style.transform = 'translate(0px, 0px)';
    const stick = document.getElementById('moveStick');
    if(stick && stickPointerId !== null && stick.hasPointerCapture && stick.hasPointerCapture(stickPointerId)) {
        try { stick.releasePointerCapture(stickPointerId); } catch(e) {}
    }
    stickPointerId = null;
}

function updateTouchStick(clientX, clientY) {
    const stick = document.getElementById('moveStick');
    const knob = document.getElementById('stickKnob');
    if(!stick || !knob) return;
    const rect = stick.getBoundingClientRect();
    if(!rect || !rect.width || !rect.height) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const knobSize = knob.offsetWidth || 38;
    const travel = Math.max(10, rect.width / 2 - knobSize / 2 - 7);
    const distance = Math.hypot(dx, dy);
    if(distance > travel) {
        dx = (dx / distance) * travel;
        dy = (dy / distance) * travel;
    }
    knob.style.transform = 'translate(' + dx.toFixed(1) + 'px, ' + dy.toFixed(1) + 'px)';
    touchVector.x = Math.max(-1, Math.min(1, dx / travel));
    touchVector.y = Math.max(-1, Math.min(1, dy / travel));
}

function handleTouchStickStart(e) {
    if(!touchControlsEnabled) return;
    if(e.pointerType === 'mouse' && e.button !== 0) return;
    const stick = document.getElementById('moveStick');
    if(!stick) return;
    stickPointerId = e.pointerId;
    if(stick.setPointerCapture) {
        try { stick.setPointerCapture(e.pointerId); } catch(err) {}
    }
    updateTouchStick(e.clientX, e.clientY);
    e.preventDefault();
}

function handleTouchStickMove(e) {
    if(stickPointerId === null || e.pointerId !== stickPointerId) return;
    updateTouchStick(e.clientX, e.clientY);
    e.preventDefault();
}

function handleTouchStickEnd(e) {
    if(stickPointerId === null || (e.pointerId !== undefined && e.pointerId !== stickPointerId)) return;
    resetTouchStick();
    if(e.preventDefault) e.preventDefault();
}

function initTouchControls() {
    if(touchControlsReady) return;
    touchControlsReady = true;
    const stick = document.getElementById('moveStick');
    if(!stick) return;
    stick.addEventListener('pointerdown', handleTouchStickStart, { passive: false });
    stick.addEventListener('pointermove', handleTouchStickMove, { passive: false });
    stick.addEventListener('pointerup', handleTouchStickEnd, { passive: false });
    stick.addEventListener('pointercancel', handleTouchStickEnd, { passive: false });
    stick.addEventListener('lostpointercapture', resetTouchStick);
    window.addEventListener('blur', resetTouchStick);
    window.addEventListener('orientationchange', resetTouchStick);
    window.addEventListener('resize', resetTouchStick);
}

function setupControls() {
    if(controlsReady) return;
    controlsReady = true;
    document.addEventListener('keydown', (e) => {
        if(isTypingTarget(e.target)) {
            if(e.key === 'Escape') e.target.blur();
            return;
        }

        if(e.key === 'Escape') {
            closeTopOverlay();
            return;
        }

        if(currentBattle) {
            handleBattleShortcut(e);
            return;
        }

        if(isGamePaused()) return;

        if(e.key === 'e' || e.key === 'E') {
            e.preventDefault();
            openMenu('phone');
            return;
        }

        if(/^[1-9]$/.test(e.key)) {
            e.preventDefault();
            useHotbarSlot(Number(e.key) - 1);
            return;
        }

        keys[e.key] = true;
        if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
    });
    document.addEventListener('keyup', (e) => { keys[e.key] = false; });
    window.addEventListener('blur', () => { keys = {}; });
    document.addEventListener('click', (e) => {
        const context = document.getElementById('partyContext');
        if(!context || context.style.display === 'none') return;
        if(context.contains(e.target)) return;
        if(e.target.closest && e.target.closest('#partySlots')) return;
        closePartyMenu();
    });
}

function handleBattleShortcut(e) {
    if(!currentBattle || currentBattle.busy || currentBattle.over) return;
    if(/^[1-4]$/.test(e.key)) {
        e.preventDefault();
        useMove(Number(e.key) - 1);
        return;
    }
    if(e.key === '5') {
        e.preventDefault();
        battleMenu('items');
        return;
    }
    if(e.key === '6') {
        e.preventDefault();
        battleMenu('switch');
        return;
    }
    if(e.key === '0') {
        e.preventDefault();
        battleAction('run');
    }
}

function closeTopOverlay() {
    const party = document.getElementById('partyContext');
    if(party && party.style.display !== 'none') { closePartyMenu(); return; }
    const menu = document.getElementById('menuOverlay');
    if(menu && menu.style.display !== 'none') { closeMenu(); return; }
    const pass = document.getElementById('passwordOverlay');
    if(pass && pass.style.display !== 'none') { closeChangePassword(); return; }
}

function chatInputKeydown(e) {
    e.stopPropagation();
    if(e.key === 'Enter') {
        e.preventDefault();
        sendChat();
    } else if(e.key === 'Escape') {
        e.preventDefault();
        e.target.blur();
    }
}

// Inicializar jogo
function initGame() {
    canvas = document.getElementById('gameMap');
    ctx = canvas.getContext('2d');

    normalizePlayer();
    ensurePlayerPosition();
    loadTrainerSheet();
    setupControls();
    initTouchControls();
    applyTouchControls(player.settings ? player.settings.touchControls : false);
    startHUDTimer();

    if(!player.starterChosen) {
        chooseStarter();
        return;
    }

    generateMap();
    updateHUD();
    updatePartyBar(true);
    renderHotbar();
    refreshFollower();
    updateTopHUD();
    gameLoop();
}

function chooseStarter() {
    document.getElementById('menuOverlay').style.display = 'flex';
    const menuBox = document.getElementById('menuBox');
    if(menuBox) menuBox.classList.remove('menu-wide');
    document.getElementById('menuTitle').textContent = 'Escolha seu Folkmom Inicial';
    const content = document.getElementById('menuContent');
    content.innerHTML = '<p style="text-align:center; margin-bottom:20px;">Escolha entre os 3 elementos: Água, Grama e Fogo</p>';
    
    FOLKMONS.starters.forEach(starter => {
        content.innerHTML += '<div class="team-slot" onclick="selectStarter(\'' + starter.id + '\')">' +
            '<div class="monster-sprite">' + monsterSpriteHTML(starter, 'starter-img') + '</div>' +
            '<div class="monster-info">' +
            '<strong>' + starter.name + '</strong> | ' + starter.element + ' | Folclore: ' + starter.folklore + '<br>' +
            '<small>' + starter.desc + '</small><br>' +
            'HP:' + starter.baseHp + ' ATK:' + starter.baseAtk + ' DEF:' + starter.baseDef +
            '</div>' +
            '</div>';
    });
}

function selectStarter(starterId) {
    player.team = [createFolkmom(starterId, 5)];
    player.starterChosen = true;
    player.followerIndex = 0;
    markDexCaught(starterId);
    closeMenu();
    ensurePlayerPosition();
    loadTrainerSheet();
    setupControls();
    generateMap();
    updateHUD();
    updatePartyBar(true);
    renderHotbar();
    refreshFollower();
    addChatMessage('Local', 'Você escolheu ' + player.team[0].name + ' como parceiro inicial!', 'system');
    addChatMessage('Equipe', player.team[0].name + ' entrou no time.', 'system');
    showToast('Você escolheu ' + player.team[0].name + '!', 'success');
    gameLoop();
    saveGame();
}

function generateMap() {
    for(let y = 0; y < 15; y++) {
        gameMap[y] = [];
        for(let x = 0; x < 20; x++) {
            if(Math.random() < 0.35) gameMap[y][x] = 0;
            else if(Math.random() < 0.08) gameMap[y][x] = 4;
            else gameMap[y][x] = 1;
        }
    }
    for(let i = 0; i < 25; i++) {
        let x = Math.floor(Math.random() * 20);
        let y = Math.floor(Math.random() * 15);
        if(gameMap[y][x] !== 4) gameMap[y][x] = 2;
    }

    // Nunca nascer (ou ficar preso) dentro de uma árvore.
    const startX = Math.floor(player.x / 40);
    const startY = Math.floor(player.y / 40);
    for(let dy = -1; dy <= 1; dy++) {
        for(let dx = -1; dx <= 1; dx++) {
            const tx = startX + dx;
            const ty = startY + dy;
            if(ty >= 0 && ty < 15 && tx >= 0 && tx < 20 && gameMap[ty][tx] === 2) {
                gameMap[ty][tx] = 1;
            }
        }
    }
}

function gameLoop() {
    if(document.getElementById('gameScreen').style.display === 'none') return;
    updatePlayer();
    drawMap();
    drawFollower();
    drawPlayer();
    updateHUD();
    checkItemPickup();
    trackFps();
    requestAnimationFrame(gameLoop);
}

function trackFps() {
    fpsFrames++;
    const now = performance.now();
    if(now - fpsLast >= 500) {
        currentFps = Math.round((fpsFrames * 1000) / (now - fpsLast));
        fpsFrames = 0;
        fpsLast = now;
        const el = document.getElementById('hudFps');
        if(el) el.textContent = currentFps;
    }
}

function updatePlayer() {
    if(isGamePaused()) {
        player.moving = false;
        return;
    }
    const speed = 3;
    let dx = 0, dy = 0;
    if(keys['ArrowUp'] || keys['w'] || keys['W']) dy -= 1;
    if(keys['ArrowDown'] || keys['s'] || keys['S']) dy += 1;
    if(keys['ArrowLeft'] || keys['a'] || keys['A']) dx -= 1;
    if(keys['ArrowRight'] || keys['d'] || keys['D']) dx += 1;

    // Direcional analógico: a intensidade do arrasto vira velocidade.
    if(Math.hypot(touchVector.x, touchVector.y) > 0.12) {
        dx += touchVector.x;
        dy += touchVector.y;
    }

    player.moving = !!(dx || dy);
    const moveMag = Math.hypot(dx, dy);
    if(moveMag > 1) {
        dx /= moveMag;
        dy /= moveMag;
    }

    if(dx < 0) player.dir = 1;
    else if(dx > 0) player.dir = 2;
    else if(dy < 0) player.dir = 3;
    else if(dy > 0) player.dir = 0;

    if(!dx && !dy) return;

    const nextX = Math.max(16, Math.min(784, player.x + dx * speed));
    const nextY = Math.max(16, Math.min(584, player.y + dy * speed));
    const tileX = Math.floor(nextX / 40);
    const tileY = Math.floor(nextY / 40);
    const blocked = gameMap[tileY] && gameMap[tileY][tileX] === 2;
    if(!blocked) {
        player.x = nextX;
        player.y = nextY;
    }
}

function drawMap() {
    for(let y = 0; y < 15; y++) {
        for(let x = 0; x < 20; x++) {
            let tileX = x * 40;
            let tileY = y * 40;
            ctx.fillStyle = (x + y) % 2 === 0 ? '#7CFC00' : '#74e600';
            ctx.fillRect(tileX, tileY, 40, 40);

            if(gameMap[y][x] === 2) {
                ctx.fillStyle = 'rgba(34,139,34,0.28)';
                ctx.fillRect(tileX, tileY, 40, 40);
                ctx.font = '30px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('🌳', tileX + 20, tileY + 22);
            } else if(gameMap[y][x] === 4) {
                ctx.fillStyle = 'rgba(255,215,0,0.22)';
                ctx.beginPath();
                ctx.arc(tileX + 20, tileY + 20, 17, 0, Math.PI * 2);
                ctx.fill();
                ctx.font = '26px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('🔮', tileX + 20, tileY + 21);
            }
        }
    }
}

function drawPlayer() {
    const px = player.x;
    const py = player.y;
    const frame = player.moving ? (Math.floor(performance.now() / 160) % 3) : 0;
    const bob = player.moving && frame === 1 ? -1 : 0;

    ctx.save();
    // Sombra
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(px, py + 9, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    if(trainerReady) {
        ctx.drawImage(trainerSheet, frame * 32, (player.dir || 0) * 32, 32, 32, px - 16, py - 24 + bob, 32, 32);
    } else {
        ctx.font = '32px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🧍', px, py);
    }

    // Indicador para achar o treinador facilmente no mapa.
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, py - 34);
    ctx.lineTo(px - 6, py - 43);
    ctx.lineTo(px + 6, py - 43);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const label = 'VOCÊ';
    const labelWidth = ctx.measureText(label).width + 12;
    ctx.fillStyle = 'rgba(17,24,39,0.82)';
    ctx.fillRect(px - labelWidth / 2, py - 62, labelWidth, 16);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, px, py - 54);
    ctx.restore();
}

function refreshFollower() {
    if(!player || !Array.isArray(player.team) || player.team.length === 0) {
        followerMon = null;
        followerImg = null;
        followerReady = false;
        followerImageId = '';
        return;
    }
    if(!Number.isFinite(player.followerIndex) || player.followerIndex < 0 || player.followerIndex >= player.team.length) {
        player.followerIndex = 0;
    }
    const mon = player.team[player.followerIndex] || null;
    followerMon = mon;
    if(!mon) return;
    const id = mon.id;
    if(followerImageId === id && (followerReady || followerImg)) return;

    followerImageId = id;
    followerReady = false;
    followerImg = null;
    const img = new Image();
    img.onload = () => {
        if(followerImageId === id) {
            followerImg = img;
            followerReady = true;
        }
    };
    img.onerror = () => {
        if(followerImageId === id) {
            followerReady = false;
            followerImg = null;
        }
    };
    img.src = 'assets/sprites/' + id + '.png';
}

function drawFollower() {
    if(!followerMon) return;
    const dir = player.dir || 0;
    let fx = player.x;
    let fy = player.y + 4;
    if(dir === 0) fx -= 27;
    else if(dir === 1) fx += 25;
    else if(dir === 2) fx -= 25;
    else { fx += 25; fy += 2; }
    fx = Math.max(18, Math.min(782, fx));
    fy = Math.max(24, Math.min(582, fy));

    const frame = player.moving ? (Math.floor(performance.now() / 180) % 2) : 0;
    const bob = frame === 1 ? -1 : 0;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(fx, fy + 8, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    if(followerReady && followerImg) {
        ctx.drawImage(followerImg, fx - 16, fy - 22 + bob, 32, 32);
    } else {
        ctx.font = '25px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(followerMon.sprite || '🐾', fx, fy - 2 + bob);
    }

    // Pequeno marcador de seguidor.
    ctx.fillStyle = '#4ade80';
    ctx.strokeStyle = '#052e16';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(fx, fy + 16, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

function updateHUD() {
    if(!player || typeof player !== 'object') return;
    const nameEl = document.getElementById('playerName');
    if(nameEl) nameEl.textContent = player.trainerName || currentUser || 'Treinador';
    const levelEl = document.getElementById('playerLevel');
    if(levelEl) levelEl.textContent = player.level || 1;
    const moneyEl = document.getElementById('playerMoney');
    if(moneyEl) moneyEl.textContent = formatNumber(player.money || 0);
    updatePartyBar();
    renderHotbar();
    updateTopHUD();
}

function checkItemPickup() {
    let tileX = Math.floor(player.x / 40);
    let tileY = Math.floor(player.y / 40);
    if(tileY >= 0 && tileY < 15 && tileX >= 0 && tileX < 20) {
        if(gameMap[tileY][tileX] === 4) {
            const evoKeys = Object.keys(EVO_ITEMS);
            const randomEvo = evoKeys[Math.floor(Math.random() * evoKeys.length)];
            player.evoItems[randomEvo] = (player.evoItems[randomEvo] || 0) + 1;
            gameMap[tileY][tileX] = 1;
            addChatMessage('Local', 'Você encontrou ' + EVO_ITEMS[randomEvo].name + '! ' + EVO_ITEMS[randomEvo].desc, 'system');
            showToast('Encontrou: ' + EVO_ITEMS[randomEvo].name + '!', 'success');
            saveGame();
        }
    }
}

// ===================== MENUS / HUD CENTRAL =====================
function isMenuOpen() {
    const overlay = document.getElementById('menuOverlay');
    return !!overlay && overlay.style.display !== 'none';
}

function setMenu(title, html, wide) {
    const overlay = document.getElementById('menuOverlay');
    const box = document.getElementById('menuBox');
    if(!overlay || !box) return;
    document.getElementById('menuTitle').textContent = title;
    document.getElementById('menuContent').innerHTML = html;
    box.classList.toggle('menu-wide', !!wide);
    overlay.style.display = 'flex';
    const content = document.getElementById('menuContent');
    content.scrollTop = 0;
}

function openMenu(menu) {
    currentMenuType = menu;
    if(menu === 'team') renderTeamMenu();
    else if(menu === 'summary') openSummary(partySelectedIndex >= 0 ? partySelectedIndex : 0);
    else if(menu === 'items') renderBagMenu();
    else if(menu === 'trades') renderTradesMenu();
    else if(menu === 'phone') renderPhoneMenu();
    else if(menu === 'game') renderGameMenu();
    else if(menu === 'dex') renderDexMenu();
    else if(menu === 'card') renderTrainerCard();
    else if(menu === 'market') renderMarketMenu();
    else if(menu === 'pvp') renderPvpMenu();
    else if(menu === 'social') renderSocialMenu();
    else if(menu === 'help') renderHelpMenu();
    else setMenu('Menu', '<p>Menu indisponível.</p>', false);
}

function closeMenu() {
    const overlay = document.getElementById('menuOverlay');
    if(overlay) overlay.style.display = 'none';
    currentMenuType = '';
}

function formatNumber(value) {
    return Number(value || 0).toLocaleString('pt-BR');
}

function escapeHTML(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[ch]));
}

function formatPlayTime(seconds) {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

function monName(id) {
    const base = getFolkmomById(id);
    return base ? base.name : id;
}

function evolutionDescription(base) {
    if(!base) return 'Dados de evolução indisponíveis.';
    const targets = (base.evoTo || []).map(id => monName(id)).join(', ');
    if(base.evoType === 'level') {
        return 'Evolui no nível ' + base.evoLevel + ' para ' + (targets || '???') + '.';
    }
    if(base.evoType === 'item') {
        const item = EVO_ITEMS[base.evoItem];
        return 'Usa ' + (item ? item.name : base.evoItem) + ' para evoluir para ' + (targets || '???') + '.';
    }
    if(base.evoType === 'trade') {
        return 'Evolui por troca com ' + monName(base.tradeWith) + ' para ' + (targets || '???') + '.';
    }
    if(base.evoType === 'starter') return 'Forma inicial. Evolução especial em breve.';
    return 'Forma final de sua linhagem.';
}

function hpPercent(mon) {
    if(!mon) return 0;
    if(!mon.maxHp) mon.maxHp = mon.hp || 1;
    return Math.max(0, Math.min(100, (mon.hp / mon.maxHp) * 100));
}

function hpClass(mon) {
    const pct = hpPercent(mon);
    return pct > 50 ? '' : pct > 25 ? 'low' : 'critical';
}

function renderTeamMenu() {
    const team = player.team || [];
    let html = '<div class="menu-section-title"><span>Time de Folkmons</span><span>' + team.length + '/6</span></div>';
    if(team.length === 0) {
        html += '<div class="menu-note">Nenhum Folkmom no time. Use o Scanner para encontrar um parceiro.</div>';
        html += '<button class="menu-action" onclick="openMenu(\'phone\')">📱 Abrir Scanner</button>';
        setMenu('Meu Time', html, false);
        return;
    }

    team.forEach((mon, idx) => {
        const follower = idx === player.followerIndex;
        const pct = hpPercent(mon);
        html += '<div class="team-slot' + (follower ? ' selected' : '') + '">' +
            '<div class="monster-sprite">' + monsterSpriteHTML(mon, 'team-img') + '</div>' +
            '<div class="monster-info">' +
                '<strong>' + escapeHTML(mon.name) + '</strong> Lv.' + mon.level + ' ' +
                '<small>· ' + escapeHTML(mon.element) + '</small><br>' +
                '<small>' + escapeHTML(mon.folklore || '') + '</small>' +
                '<div class="hp-bar"><div class="hp-fill" style="width:' + pct + '%;background:' + (pct > 50 ? '#4ade80' : pct > 25 ? '#fbbf24' : '#f87171') + '"></div></div>' +
                '<small>PV ' + Math.max(0, mon.hp) + '/' + mon.maxHp + ' · ATK ' + mon.atk + ' · DEF ' + mon.def + '</small>' +
                '<div class="team-actions">' +
                    '<button class="mini-btn" onclick="openSummary(' + idx + ')">📋 Sumário</button>' +
                    '<button class="mini-btn" onclick="moveTeamMember(' + idx + ',-1)" ' + (idx === 0 ? 'disabled' : '') + '>↑</button>' +
                    '<button class="mini-btn" onclick="moveTeamMember(' + idx + ',1)" ' + (idx === team.length - 1 ? 'disabled' : '') + '>↓</button>' +
                    '<button class="mini-btn ' + (follower ? 'active' : '') + '" onclick="setFollower(' + idx + ')">🐾 ' + (follower ? 'Seguindo' : 'Seguidor') + '</button>' +
                '</div>' +
            '</div>' +
        '</div>';
    });
    html += '<div class="menu-note">O Folkmom com borda verde segue você pelo mapa. Use ↑/↓ para mudar a ordem do time.</div>';
    setMenu('Meu Time', html, true);
}

function openSummary(index) {
    const mon = player.team && player.team[index];
    if(!mon) return;
    currentMenuType = 'summary';
    const base = getFolkmomById(mon.id) || mon.baseData || {};
    const moves = getMoves(mon);
    const pct = hpPercent(mon);
    let html = '<div class="team-slot selected">' +
        '<div class="monster-sprite">' + monsterSpriteHTML(mon, 'team-img') + '</div>' +
        '<div class="monster-info">' +
            '<strong>' + escapeHTML(mon.name) + '</strong> Lv.' + mon.level + '<br>' +
            '<small>' + escapeHTML(mon.element) + ' · ' + escapeHTML(mon.folklore || '') + '</small>' +
            '<div class="hp-bar"><div class="hp-fill" style="width:' + pct + '%"></div></div>' +
            '<small>PV ' + Math.max(0, mon.hp) + '/' + mon.maxHp + '</small>' +
        '</div>' +
    '</div>';

    html += '<div class="menu-section"><div class="menu-section-title">Atributos</div><div class="trainer-stats">' +
        '<div class="stat-row"><span>HP</span><b>' + mon.hp + '/' + mon.maxHp + '</b></div>' +
        '<div class="stat-row"><span>Ataque</span><b>' + mon.atk + '</b></div>' +
        '<div class="stat-row"><span>Defesa</span><b>' + mon.def + '</b></div>' +
        '<div class="stat-row"><span>EXP</span><b>' + (mon.exp || 0) + '/' + (mon.expToNext || 1) + '</b></div>' +
    '</div></div>';

    html += '<div class="menu-section"><div class="menu-section-title">Golpes</div>';
    moves.forEach(move => {
        const detail = move.type === 'damage' ? ('Poder ' + move.power) : (move.desc || 'Efeito');
        html += '<div class="stat-row"><span>' + escapeHTML(move.name) + '</span><b>' + escapeHTML(move.element) + ' · ' + escapeHTML(detail) + '</b></div>';
    });
    html += '</div>';

    html += '<div class="menu-section"><div class="menu-section-title">Evolução</div><p>' + escapeHTML(evolutionDescription(base)) + '</p></div>';
    html += '<div class="menu-grid-2" style="margin-top:12px;">' +
        '<button class="menu-action" onclick="setFollower(' + index + ')">🐾 ' + (index === player.followerIndex ? 'Já é o seguidor' : 'Tornar seguidor') + '</button>' +
        '<button class="menu-action" onclick="openMenu(\'team\')">↩ Voltar ao time</button>' +
    '</div>';
    setMenu('Sumário · ' + mon.name, html, false);
}

function moveTeamMember(index, delta) {
    const target = index + delta;
    if(!player.team[index] || !player.team[target]) return;
    const previousFollower = player.followerIndex;
    const temp = player.team[target];
    player.team[target] = player.team[index];
    player.team[index] = temp;
    if(previousFollower === index) player.followerIndex = target;
    else if(previousFollower === target) player.followerIndex = index;
    refreshFollower();
    updatePartyBar(true);
    saveGame();
    renderTeamMenu();
}

function setFollower(index) {
    if(!player.team[index]) return;
    player.followerIndex = index;
    refreshFollower();
    updatePartyBar(true);
    saveGame();
    closePartyMenu();
    const mon = player.team[index];
    addChatMessage('Equipe', mon.name + ' agora segue você pelo mapa.', 'system');
    showToast(mon.name + ' está seguindo você!', 'success');
    if(isMenuOpen() && currentMenuType === 'team') renderTeamMenu();
    if(isMenuOpen() && currentMenuType === 'summary') openSummary(index);
}

function renderBagMenu() {
    const tabs = [
        ['heal', '🌿 Cura'],
        ['evo', '🔮 Evolução'],
        ['key', '🔑 Chaves']
    ];
    let html = '<div class="menu-toolbar">' + tabs.map(t =>
        '<button class="menu-tab ' + (bagTab === t[0] ? 'active' : '') + '" onclick="setBagTab(\'' + t[0] + '\')">' + t[1] + '</button>'
    ).join('') + '</div>';

    if(bagTab === 'heal') {
        html += '<div class="menu-section"><div class="menu-section-title"><span>Itens curativos</span><span>Arraste para os atalhos</span></div><div class="item-grid">';
        let has = false;
        Object.keys(ITEMS).forEach(itemId => {
            const item = ITEMS[itemId];
            const count = player.items[itemId] || 0;
            if(count <= 0 || item.effect !== 'heal') return;
            has = true;
            html += '<div class="item-card" draggable="true" ondragstart="dragItem(event,\'' + itemId + '\')">' +
                '<div class="item-sprite">' + item.sprite + '</div>' +
                '<strong>' + escapeHTML(item.name) + '</strong><br>x' + count +
                '<br><small>' + escapeHTML(item.desc) + '</small>' +
                '<div class="item-actions">' +
                    '<button class="mini-btn" onclick="useHealingItemOutside(\'' + itemId + '\')">Usar</button>' +
                    '<button class="mini-btn" onclick="assignItemToHotbar(\'' + itemId + '\')">→ Atalho</button>' +
                '</div>' +
            '</div>';
        });
        if(!has) html += '<div class="menu-note">Nenhum item curativo. Procure baús e o Mercado.</div>';
        html += '</div></div>';
    } else if(bagTab === 'evo') {
        html += '<div class="menu-section"><div class="menu-section-title"><span>Itens de evolução</span><span>' + Object.keys(EVO_ITEMS).length + ' tipos</span></div><div class="item-grid">';
        let has = false;
        Object.keys(EVO_ITEMS).forEach(itemId => {
            const count = player.evoItems[itemId] || 0;
            if(count <= 0) return;
            has = true;
            const item = EVO_ITEMS[itemId];
            const targets = countEvolutionTargets(itemId);
            html += '<div class="item-card">' +
                '<div class="item-sprite">' + item.sprite + '</div>' +
                '<strong>' + escapeHTML(item.name) + '</strong><br>x' + count +
                '<br><small>' + escapeHTML(item.desc) + '</small>' +
                '<div class="item-actions">' +
                    '<button class="mini-btn" onclick="useEvolutionItem(\'' + itemId + '\')" ' + (targets ? '' : 'disabled') + '>' +
                        (targets ? 'Evoluir (' + targets + ')' : 'Sem alvo') +
                    '</button>' +
                '</div>' +
            '</div>';
        });
        if(!has) html += '<div class="menu-note">Nenhum item de evolução. Explore o mapa para encontrar baús.</div>';
        html += '</div></div>';
        html += '<div class="menu-note">Itens de evolução são usados em Folkmons compatíveis que já estão no time.</div>';
    } else {
        html += '<div class="menu-section"><div class="menu-section-title">Itens-chave</div>' +
            '<div class="menu-grid-2">' +
                '<button class="menu-action" onclick="openMenu(\'phone\')">📱 Celular · Scanner</button>' +
                '<button class="menu-action" onclick="openMenu(\'dex\')">📖 Enciclore</button>' +
                '<button class="menu-action" onclick="openMenu(\'card\')">🪪 Cartão de Treinador</button>' +
                '<button class="menu-action" onclick="openMenu(\'help\')">❓ Manual de campo</button>' +
            '</div>' +
        '</div>';
        html += '<div class="menu-note">A Mochila guarda itens de cura, evolução e chaves. Arraste itens curativos para os atalhos 1-9.</div>';
    }
    setMenu('Mochila', html, false);
}

function setBagTab(tab) {
    bagTab = tab;
    renderBagMenu();
}

function countEvolutionTargets(itemId) {
    return (player.team || []).filter(mon => {
        const base = getFolkmomById(mon.id) || mon.baseData;
        return base && base.evoType === 'item' && base.evoItem === itemId && base.evoTo && base.evoTo.length;
    }).length;
}

function useHealingItemOutside(itemId) {
    const item = ITEMS[itemId];
    if(!item || item.effect !== 'heal' || !player.items[itemId] || player.items[itemId] <= 0) {
        showToast('Você não tem esse item.', 'error');
        return;
    }
    const target = (player.team || []).find(mon => mon.hp < mon.maxHp);
    if(!target) {
        showToast('Todos os Folkmons estão com PV cheio.', 'info');
        return;
    }
    const amount = item.value >= 999 ? target.maxHp : item.value;
    const before = target.hp;
    target.hp = Math.min(target.maxHp, target.hp + amount);
    player.items[itemId]--;
    const healed = target.hp - before;
    addChatMessage('Equipe', target.name + ' recuperou ' + healed + ' PV com ' + item.name + '.', 'system');
    showToast(target.name + ' recuperou ' + healed + ' PV!', 'success');
    saveGame();
    updatePartyBar(true);
    renderHotbar();
    if(isMenuOpen() && currentMenuType === 'items') renderBagMenu();
}

function useEvolutionItem(itemId) {
    const item = EVO_ITEMS[itemId];
    if(!item || !player.evoItems[itemId] || player.evoItems[itemId] <= 0) return;
    const mon = (player.team || []).find(m => {
        const base = getFolkmomById(m.id) || m.baseData;
        return base && base.evoType === 'item' && base.evoItem === itemId && base.evoTo && base.evoTo.length;
    });
    if(!mon) {
        showToast('Nenhum Folkmom do time usa ' + item.name + '.', 'error');
        return;
    }
    const base = getFolkmomById(mon.id) || mon.baseData;
    if(!evolveMonster(mon, base.evoTo[0], 'item')) return;
    player.evoItems[itemId]--;
    saveGame();
    updatePartyBar(true);
    refreshFollower();
    renderHotbar();
    if(isMenuOpen()) openSummary(player.team.indexOf(mon));
}

function renderTradesMenu() {
    const pairs = [
        ['FM011', 'FM012'],
        ['FM013', 'FM014'],
        ['FM015', 'FM016'],
        ['FM017', 'FM018'],
        ['FM019', 'FM020']
    ];
    let html = '<p>Existem 10 Folkmons que evoluem por troca. Tenha o par correto no time e realize a troca.</p>';
    pairs.forEach(pair => {
        const a = getFolkmomById(pair[0]);
        const b = getFolkmomById(pair[1]);
        if(!a || !b) return;
        const hasA = (player.team || []).some(m => m.id === pair[0]);
        const hasB = (player.team || []).some(m => m.id === pair[1]);
        const ready = hasA && hasB;
        html += '<div class="team-slot' + (ready ? ' selected' : '') + '">' +
            '<div class="monster-sprite">' + (ready ? '🔁' : '⏳') + '</div>' +
            '<div class="monster-info">' +
                '<strong>' + a.name + '</strong> + <strong>' + b.name + '</strong><br>' +
                '<small>→ ' + monName(a.evoTo && a.evoTo[0]) + ' + ' + monName(b.evoTo && b.evoTo[0]) + '</small><br>' +
                '<small style="color:' + (ready ? '#4ade80' : '#94a3b8') + '">' + (ready ? 'Par pronto no time!' : 'Falta um dos dois no time.') + '</small>' +
            '</div>' +
        '</div>';
    });
    html += '<button class="menu-action" onclick="doTradeMenu()" style="width:100%;margin-top:8px;">🔁 Realizar troca (se tiver par)</button>' +
        '<p id="tradeMsg" class="msg" style="text-align:left;font-size:10px;"></p>' +
        '<div class="menu-note">A troca evolui os dois Folkmons e conta para o Enciclore. Trocas online entre jogadores chegam com a conta na nuvem.</div>';
    setMenu('Trocas de Evolução', html, true);
}

function renderPhoneMenu() {
    const percent = Math.max(0, Math.min(150, currentScanPercent || 0));
    let status = 'Pronto';
    if(scanInterval) status = 'Escaneando...';
    else if(percent >= 100) status = 'Scan completo! Pode consertar';
    else if(percent > 0) status = 'Scan parcial';
    const statusColor = percent >= 100 ? '#4ade80' : scanInterval ? '#facc15' : '#e2e8f0';
    let html = '<h3>Scan para capturar Folkmons</h3>' +
        '<p>Use o celular para escanear a área. Quanto maior o percentual, maior a chance de encontrar e capturar um Folkmom.</p>' +
        '<div style="text-align:center;padding:24px;background:linear-gradient(135deg,#1e293b 0%,#0f172a 60%,#422006 100%);border:1px solid rgba(250,204,21,.35);border-radius:12px;margin:14px 0;color:white;">' +
            '<div style="font-size:64px;line-height:1;">📱</div>' +
            '<div style="margin-top:8px;font-size:26px;color:#facc15;"><strong id="scanPercent">' + percent + '%</strong></div>' +
            '<div style="margin-top:4px;font-size:11px;color:' + statusColor + ';">Status: <span id="scanStatus">' + status + '</span></div>' +
        '</div>' +
        '<div class="menu-grid-2">' +
            '<button class="menu-action" onclick="startScan()">📡 Iniciar Scan</button>' +
            '<button class="menu-action" onclick="fixScan()">🔧 Consertar Scan (100%+)</button>' +
        '</div>' +
        '<p id="phoneMsg" class="msg" style="text-align:left;font-size:11px;margin-top:8px;"></p>' +
        '<div class="menu-note">Dica: abra o Scanner com a tecla <b>E</b>. O Scan é a forma de capturar Folkmons neste mundo.</div>';
    setMenu('Scanner Folclórico', html, false);
}

function renderGameMenu() {
    const chatOn = player.settings ? player.settings.chat !== false : true;
    const hotbarOn = player.settings ? player.settings.hotbar !== false : true;
    const touchOn = !!(player.settings && player.settings.touchControls);
    let html = '<div class="menu-section"><div class="menu-section-title">Jogo</div><div class="menu-grid-2">' +
        '<button class="menu-action" onclick="openMenu(\'card\')">🪪 Cartão de Treinador</button>' +
        '<button class="menu-action" onclick="openMenu(\'items\')">🎒 Mochila</button>' +
        '<button class="menu-action" onclick="openMenu(\'team\')">🐾 Meu time</button>' +
        '<button class="menu-action" onclick="openMenu(\'trades\')">🔁 Trocas</button>' +
        '<button class="menu-action" onclick="manualSave()">💾 Salvar agora</button>' +
        '<button class="menu-action" onclick="toggleFullscreen()">⛶ Tela cheia</button>' +
    '</div></div>';

    html += '<div class="menu-section"><div class="menu-section-title">Interface</div><div class="menu-grid-2">' +
        '<button class="menu-action" onclick="toggleHUDPanel(\'chat\')">💬 Chat: <b style="color:' + (chatOn ? '#4ade80' : '#f87171') + '">' + (chatOn ? 'ligado' : 'desligado') + '</b></button>' +
        '<button class="menu-action" onclick="toggleHUDPanel(\'hotbar\')">⌨️ Atalhos: <b style="color:' + (hotbarOn ? '#4ade80' : '#f87171') + '">' + (hotbarOn ? 'ligado' : 'desligado') + '</b></button>' +
        '<button class="menu-action" style="grid-column:1/-1" onclick="toggleTouchControls()">🕹️ Direcional de toque: <b style="color:' + (touchOn ? '#4ade80' : '#f87171') + '">' + (touchOn ? 'ativado' : 'desativado') + '</b></button>' +
    '</div></div>';

    html += '<div class="menu-section"><div class="menu-section-title">Conta</div><div class="menu-grid-2">' +
        '<button class="menu-action" onclick="openChangePassword()">🔐 Trocar senha</button>' +
        '<button class="menu-action danger" onclick="confirmLogout()">🚪 Sair da conta</button>' +
    '</div></div>';
    html += '<div class="menu-note">Mods: nenhum instalado. O cliente Folkmons usa sprites locais e não requer mods. ' +
        (CLOUD_ENABLED ? 'Sessão na nuvem ativa.' : 'Conta local: os dados ficam neste navegador.') + '</div>';
    setMenu('Menu do Jogo', html, false);
}

function toggleHUDPanel(name) {
    const element = document.getElementById(name === 'chat' ? 'chatPanel' : 'hotbar');
    if(!element) return;
    const nowHidden = element.classList.toggle('hidden');
    if(!player.settings) player.settings = { chat: true, hotbar: true };
    player.settings[name] = !nowHidden;
    saveGame();
    if(currentMenuType === 'game' && isMenuOpen()) renderGameMenu();
}

function applyHUDVisibility() {
    if(!player.settings) player.settings = { chat: true, hotbar: true };
    const chat = document.getElementById('chatPanel');
    const hotbar = document.getElementById('hotbar');
    if(chat) chat.classList.toggle('hidden', player.settings.chat === false);
    if(hotbar) hotbar.classList.toggle('hidden', player.settings.hotbar === false);
}

function manualSave() {
    saveGame();
    showToast('Jogo salvo!', 'success');
    addChatMessage('Local', 'Progresso salvo.', 'system');
}

function confirmLogout() {
    if(window.confirm('Sair da conta? O progresso será salvo.')) logout();
}

function toggleFullscreen() {
    const target = document.documentElement;
    if(!document.fullscreenElement) {
        if(target.requestFullscreen) target.requestFullscreen().catch(() => {});
    } else if(document.exitFullscreen) {
        document.exitFullscreen();
    }
}

// ===================== CHAT, RELÓGIO E FPS =====================
function initChatUI() {
    chatState.active = 'Local';
    chatState.messages = {};
    chatState.unread = {};
    chatState.initialized = true;
    CHAT_TABS.forEach(tab => {
        chatState.messages[tab] = [];
        chatState.unread[tab] = false;
    });

    const name = (player && player.trainerName) || currentUser || 'Treinador';
    addChatMessage('Local', 'Bem-vindo(a), ' + name + '! Use WASD/setas para andar e E para abrir o Scanner.', 'system', null, true);
    addChatMessage('Global', 'Canal global em modo local. A conversa entre jogadores chega com a conta na nuvem.', 'system', null, true);
    addChatMessage('Comércio', 'O Mercado Folclórico (GTL) tem ofertas locais no menu inferior direito.', 'system', null, true);
    addChatMessage('Sussurro', 'Nenhuma conversa privada. Use este canal quando a nuvem estiver ativa.', 'system', null, true);
    addChatMessage('Equipe', 'Seu time aparece no canto superior direito. Clique em um Folkmom para ver sumário, ordem ou seguidor.', 'system', null, true);
    addChatMessage('Batalha', 'Os registros das batalhas também aparecem neste canal.', 'system', null, true);
    renderChat();
}

function addChatMessage(tab, text, type, sender, noUnread) {
    if(!chatState.messages[tab]) chatState.messages[tab] = [];
    const messageType = type || 'system';
    const from = sender || (messageType === 'user'
        ? ((player && player.trainerName) || currentUser || 'Você')
        : messageType === 'battle' ? 'Batalha' : 'Sistema');
    chatState.messages[tab].push({
        text: String(text == null ? '' : text),
        type: messageType,
        from: from,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    });
    while(chatState.messages[tab].length > 120) chatState.messages[tab].shift();
    if(!noUnread && tab !== chatState.active) chatState.unread[tab] = true;
    if(chatState.initialized) renderChat();
}

function renderChat() {
    const tabsEl = document.getElementById('chatTabs');
    const messagesEl = document.getElementById('chatMessages');
    if(!tabsEl || !messagesEl) return;

    tabsEl.innerHTML = CHAT_TABS.map(tab =>
        '<button class="chat-tab ' + (tab === chatState.active ? 'active' : '') + '" onclick="switchChatTab(\'' + tab + '\')">' +
            tab + (chatState.unread[tab] ? '<span class="chat-unread"></span>' : '') +
        '</button>'
    ).join('');

    const list = chatState.messages[chatState.active] || [];
    if(list.length === 0) {
        messagesEl.innerHTML = '<div class="chat-line system"><span class="chat-from">Sistema:</span> Nenhuma mensagem neste canal.</div>';
    } else {
        messagesEl.innerHTML = list.map(message => {
            const cls = message.type === 'system' ? ' system' : message.type === 'user' ? ' user' : message.type === 'battle' ? ' battle' : '';
            return '<div class="chat-line' + cls + '">' +
                '<span class="chat-time">' + message.time + '</span>' +
                '<span class="chat-from">' + escapeHTML(message.from) + ':</span> ' +
                escapeHTML(message.text) +
            '</div>';
        }).join('');
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }
    const input = document.getElementById('chatInput');
    if(input) input.placeholder = 'Falar no canal ' + chatState.active + '...';
}

function switchChatTab(tab) {
    if(!CHAT_TABS.includes(tab)) return;
    chatState.active = tab;
    chatState.unread[tab] = false;
    renderChat();
}

function sendChat() {
    const input = document.getElementById('chatInput');
    if(!input) return;
    const text = input.value.trim();
    if(!text) return;
    input.value = '';

    if(text === '/scan') { openMenu('phone'); return; }
    if(text === '/ajuda' || text === '/help') { openMenu('help'); return; }
    if(text === '/salvar' || text === '/save') { manualSave(); return; }

    addChatMessage(chatState.active, text, 'user');
}

function toggleChat() {
    const panel = document.getElementById('chatPanel');
    if(!panel) return;
    const collapsed = panel.classList.toggle('collapsed');
    const button = panel.querySelector('.chat-toggle');
    if(button) button.textContent = collapsed ? '+' : '–';
}

function startPlayTimer() {
    if(playTimer) return;
    playTimer = setInterval(() => {
        if(!currentUser || !player || !player.stats) return;
        const screen = document.getElementById('gameScreen');
        if(!screen || screen.style.display === 'none') return;
        player.stats.playSeconds = (player.stats.playSeconds || 0) + 1;
    }, 1000);
}

function startHUDTimer() {
    if(hudTimer) return;
    hudTimer = setInterval(updateTopHUD, 1000);
    updateTopHUD();
}

function updateTopHUD() {
    const now = Date.now();
    if(now - lastTopHudUpdate < 250) return;
    lastTopHudUpdate = now;

    const locationEl = document.getElementById('hudLocationName');
    if(locationEl) locationEl.textContent = 'Sertão Folclórico';

    const channelEl = document.getElementById('hudChannel');
    if(channelEl) channelEl.textContent = 'Canal 1 · ' + (CLOUD_ENABLED ? 'Nuvem' : 'Local');

    const clockEl = document.getElementById('hudClock');
    if(clockEl) {
        const elapsed = Math.max(0, (Date.now() - gameSessionStart) / 1000);
        const worldSeconds = 6 * 3600 + 30 * 60 + Math.floor(elapsed * 12);
        const daySeconds = ((worldSeconds % 86400) + 86400) % 86400;
        const hours = String(Math.floor(daySeconds / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((daySeconds % 3600) / 60)).padStart(2, '0');
        clockEl.textContent = hours + ':' + minutes;
        clockEl.title = 'Relógio do mundo acelerado';
    }

    const pingEl = document.getElementById('hudPing');
    if(pingEl) {
        pingEl.textContent = CLOUD_ENABLED ? 'nuvem' : '0 ms';
        pingEl.title = CLOUD_ENABLED ? 'Latência medida pela sessão na nuvem' : 'Modo local: sem servidor';
    }

    const fpsEl = document.getElementById('hudFps');
    if(fpsEl && currentFps > 0) fpsEl.textContent = currentFps;

    if(player && typeof player === 'object') {
        const nameEl = document.getElementById('playerName');
        if(nameEl) nameEl.textContent = player.trainerName || currentUser || 'Treinador';
        const levelEl = document.getElementById('playerLevel');
        if(levelEl) levelEl.textContent = player.level || 1;
        const moneyEl = document.getElementById('playerMoney');
        if(moneyEl) moneyEl.textContent = formatNumber(player.money || 0);
    }
}

function showToast(text, type) {
    const el = document.getElementById('toast');
    if(!el) return;
    const item = {
        text: String(text == null ? '' : text),
        type: type || 'info'
    };
    if(!toastCurrent) {
        displayToast(item);
        return;
    }
    toastQueue.push(item);
    if(toastQueue.length > 8) toastQueue.shift();
    updateToastQueue();
}

function displayToast(item) {
    const el = document.getElementById('toast');
    if(!el) return;
    clearTimeout(toastTimer);
    toastCurrent = item;
    el.className = 'toast show ' + item.type;
    el.style.display = 'block';
    const textEl = document.getElementById('toastText');
    if(textEl) textEl.textContent = item.text;
    updateToastQueue();
    toastTimer = setTimeout(() => {
        if(toastCurrent === item) advanceToast();
    }, 6000);
}

function updateToastQueue() {
    const el = document.getElementById('toastQueueCount');
    if(!el) return;
    if(toastQueue.length > 0) {
        el.textContent = '+' + toastQueue.length + ' na fila';
        el.classList.add('visible');
    } else {
        el.textContent = '';
        el.classList.remove('visible');
    }
}

function advanceToast() {
    if(!toastCurrent) {
        if(toastQueue.length) displayToast(toastQueue.shift());
        return;
    }
    clearTimeout(toastTimer);
    toastCurrent = null;
    if(toastQueue.length) displayToast(toastQueue.shift());
    else hideToast();
}

function cancelToast() {
    clearTimeout(toastTimer);
    toastQueue = [];
    toastCurrent = null;
    hideToast();
}

function hideToast() {
    const el = document.getElementById('toast');
    if(!el) return;
    clearTimeout(toastTimer);
    el.classList.remove('show');
    el.style.display = 'none';
    updateToastQueue();
}

// ===================== BARRA DA EQUIPE =====================
function updatePartyBar(force) {
    const slots = document.getElementById('partySlots');
    const count = document.getElementById('partyCount');
    if(!slots) return;

    const team = (player && Array.isArray(player.team)) ? player.team : [];
    const signature = team.map(mon => mon ? (mon.id + ':' + mon.level + ':' + mon.hp + ':' + mon.maxHp + ':' + mon.name) : 'empty').join('|') +
        '|f' + (player ? player.followerIndex : 0);
    if(!force && signature === lastPartySignature) return;
    lastPartySignature = signature;

    if(count) count.textContent = team.length + '/6';
    let html = '';
    for(let i = 0; i < 6; i++) {
        const mon = team[i];
        if(!mon) {
            html += '<div class="party-slot empty" title="Espaço vazio">+</div>';
            continue;
        }
        const pct = hpPercent(mon);
        const hpCls = hpClass(mon);
        const follower = i === (player ? player.followerIndex : -1);
        html += '<button class="party-slot ' + (follower ? 'follower ' : '') + (mon.hp <= 0 ? 'fainted' : '') + '" ' +
            'onclick="openPartyMenu(' + i + ')" title="' + escapeHTML(mon.name) + ' Lv.' + mon.level + ' · PV ' + Math.max(0, mon.hp) + '/' + mon.maxHp + '">' +
            monsterSpriteHTML(mon, 'party-img') +
            '<span class="party-lv">' + mon.level + '</span>' +
            '<span class="party-hp"><i class="' + hpCls + '" style="width:' + pct + '%"></i></span>' +
        '</button>';
    }
    slots.innerHTML = html;
}

function openPartyMenu(index) {
    const mon = player && player.team && player.team[index];
    if(!mon) {
        openMenu('team');
        return;
    }
    partySelectedIndex = index;
    const context = document.getElementById('partyContext');
    const nameEl = document.getElementById('partyContextName');
    if(nameEl) nameEl.textContent = mon.name + ' · Lv.' + mon.level;
    if(context) context.style.display = 'block';
}

function closePartyMenu() {
    const context = document.getElementById('partyContext');
    if(context) context.style.display = 'none';
}

function partyAction(action) {
    const index = partySelectedIndex;
    const mon = player && player.team && player.team[index];
    if(!mon) { closePartyMenu(); return; }
    if(action === 'summary') {
        closePartyMenu();
        openSummary(index);
    } else if(action === 'order') {
        closePartyMenu();
        openMenu('team');
    } else if(action === 'follower') {
        setFollower(index);
    }
}

// ===================== ATALHOS 1-9 =====================
function hotbarSignature() {
    if(!player || !Array.isArray(player.hotbar)) return '';
    return player.hotbar.map(id => {
        if(!id) return '-';
        return id + ':' + ((player.items && player.items[id]) || (player.evoItems && player.evoItems[id]) || 0);
    }).join('|');
}

function renderHotbar(force) {
    const slots = document.getElementById('hotbarSlots');
    if(!slots || !player) return;
    const signature = hotbarSignature();
    if(!force && signature === lastHotbarSignature) return;
    lastHotbarSignature = signature;

    let html = '';
    for(let i = 0; i < 9; i++) {
        const itemId = player.hotbar && player.hotbar[i];
        const item = itemId ? ITEMS[itemId] : null;
        const count = itemId ? ((player.items && player.items[itemId]) || (player.evoItems && player.evoItems[itemId]) || 0) : 0;
        html += '<button class="hotbar-slot ' + (itemId ? 'assigned ' : '') + '" ' +
            'onclick="useHotbarSlot(' + i + ')" ' +
            'oncontextmenu="clearHotbarSlot(event,' + i + ')" ' +
            'ondragover="event.preventDefault();this.classList.add(\'drag-over\')" ' +
            'ondragleave="this.classList.remove(\'drag-over\')" ' +
            'ondrop="dropHotbarItem(event,' + i + ')" ' +
            'title="' + (item ? escapeHTML(item.name) + ' · ' + count + ' unidade(s)' : 'Atalho vazio — arraste um item da Mochila') + '">' +
            '<span class="slot-key">' + (i + 1) + '</span>' +
            '<span class="slot-icon">' + (item ? item.sprite : '+') + '</span>' +
            (item ? '<span class="slot-count">' + count + '</span>' : '') +
        '</button>';
    }
    slots.innerHTML = html;
}

function useHotbarSlot(index) {
    if(!player || !player.hotbar) return;
    const itemId = player.hotbar[index];
    if(!itemId) {
        showToast('Atalho vazio. Arraste um item curativo da Mochila.', 'info');
        openMenu('items');
        return;
    }
    const item = ITEMS[itemId];
    if(!item) {
        showToast('Item desconhecido.', 'error');
        return;
    }
    if(item.effect === 'heal') {
        useHealingItemOutside(itemId);
    } else {
        showToast('Use este item pela Mochila.', 'info');
    }
}

function dragItem(event, itemId) {
    if(!event || !event.dataTransfer) return;
    event.dataTransfer.setData('text/plain', itemId);
    event.dataTransfer.effectAllowed = 'copy';
}

function dropHotbarItem(event, index) {
    if(event) event.preventDefault();
    const slot = event && event.currentTarget;
    if(slot) slot.classList.remove('drag-over');
    const itemId = event && event.dataTransfer ? event.dataTransfer.getData('text/plain') : '';
    const item = ITEMS[itemId];
    if(!item || item.effect !== 'heal') {
        showToast('Coloque apenas itens curativos nos atalhos.', 'error');
        return;
    }
    if(!player.hotbar) player.hotbar = Array(9).fill(null);
    player.hotbar[index] = itemId;
    renderHotbar(true);
    saveGame();
    showToast(item.name + ' no atalho ' + (index + 1) + '.', 'success');
}

function assignItemToHotbar(itemId) {
    const item = ITEMS[itemId];
    if(!item || item.effect !== 'heal') return;
    if(!player.hotbar) player.hotbar = Array(9).fill(null);
    let index = player.hotbar.findIndex(id => !id);
    if(index < 0) index = 0;
    player.hotbar[index] = itemId;
    renderHotbar(true);
    saveGame();
    showToast(item.name + ' no atalho ' + (index + 1) + '.', 'success');
    addChatMessage('Local', item.name + ' foi colocado no atalho ' + (index + 1) + '.', 'system');
}

function clearHotbarSlot(event, index) {
    if(event) event.preventDefault();
    if(!player || !player.hotbar) return;
    player.hotbar[index] = null;
    renderHotbar(true);
    saveGame();
    showToast('Atalho ' + (index + 1) + ' limpo.', 'info');
}

// ===================== FOLCLORÉDEX =====================
const DEX_ELEMENTS = ['Agua', 'Grama', 'Fogo', 'Eletrico', 'Vento', 'Terra', 'Trevas'];

function dexCounts() {
    const seen = Object.keys((player.dex && player.dex.seen) || {}).length;
    const caught = Object.keys((player.dex && player.dex.caught) || {}).length;
    return { seen, caught, total: ALL_FOLKMONS.length };
}

function renderDexMenu() {
    const counts = dexCounts();
    const pct = counts.total ? Math.round((counts.caught / counts.total) * 100) : 0;
    let html = '<div class="dex-summary">' +
        '<div class="dex-stat"><span>Total</span><strong>' + counts.total + '</strong></div>' +
        '<div class="dex-stat"><span>Vistos</span><strong style="color:#38bdf8">' + counts.seen + '</strong></div>' +
        '<div class="dex-stat"><span>Capturados</span><strong style="color:#4ade80">' + counts.caught + '</strong></div>' +
        '<div class="dex-stat"><span>Progresso</span><strong>' + pct + '%</strong></div>' +
    '</div>' +
    '<div class="dex-progress"><i style="width:' + pct + '%"></i></div>';

    html += '<div class="menu-toolbar">' +
        '<input id="dexSearch" type="text" placeholder="Buscar por nome, ID ou folclore..." value="' + escapeHTML(dexFilter.search) + '" oninput="updateDexSearch(this.value)">' +
        '<select id="dexElement" onchange="updateDexElement(this.value)">' +
            '<option value="all">Todos os elementos</option>' +
            DEX_ELEMENTS.map(el => '<option value="' + el + '" ' + (dexFilter.element === el ? 'selected' : '') + '>' + el + '</option>').join('') +
        '</select>' +
    '</div>' +
    '<div class="menu-toolbar">' +
        '<button class="menu-tab ' + (dexFilter.status === 'all' ? 'active' : '') + '" onclick="dexSetStatus(\'all\')">Todos</button>' +
        '<button class="menu-tab ' + (dexFilter.status === 'seen' ? 'active' : '') + '" onclick="dexSetStatus(\'seen\')">Vistos</button>' +
        '<button class="menu-tab ' + (dexFilter.status === 'caught' ? 'active' : '') + '" onclick="dexSetStatus(\'caught\')">Capturados</button>' +
        '<span id="dexGridCount" style="margin-left:auto;color:#64748b;font-size:9px;"></span>' +
    '</div>' +
    '<div id="dexGrid" class="dex-grid"></div>' +
    '<div class="menu-note">Vistos aparecem em azul; capturados, em verde. Abra um registro para ver atributos, folclore e evolução.</div>';
    setMenu('Enciclore', html, true);
    refreshDexGrid();
}

function dexMatches(base) {
    const seen = player.dex && player.dex.seen && player.dex.seen[base.id];
    const caught = player.dex && player.dex.caught && player.dex.caught[base.id];
    if(dexFilter.status === 'seen' && !seen) return false;
    if(dexFilter.status === 'caught' && !caught) return false;
    if(dexFilter.element !== 'all') {
        const elements = (base.element || '').split('/').map(e => e.trim());
        if(!elements.includes(dexFilter.element)) return false;
    }
    if(dexFilter.search) {
        const haystack = [base.id, base.name, base.folklore, base.desc, base.element].join(' ').toLowerCase();
        if(!haystack.includes(dexFilter.search.toLowerCase())) return false;
    }
    return true;
}

function refreshDexGrid() {
    const grid = document.getElementById('dexGrid');
    if(!grid) return;
    const list = ALL_FOLKMONS.filter(dexMatches);
    const counter = document.getElementById('dexGridCount');
    if(counter) counter.textContent = list.length + ' registro(s)';
    if(list.length === 0) {
        grid.innerHTML = '<div class="menu-note" style="grid-column:1/-1;">Nenhum Folkmom encontrado com esses filtros.</div>';
        return;
    }
    grid.innerHTML = list.map(base => {
        const seen = !!(player.dex && player.dex.seen && player.dex.seen[base.id]);
        const caught = !!(player.dex && player.dex.caught && player.dex.caught[base.id]);
        const cls = caught ? 'caught' : seen ? 'seen' : '';
        const element = (base.element || 'Trevas').split('/')[0].trim();
        return '<div class="dex-card ' + cls + '" onclick="openDexEntry(\'' + base.id + '\')">' +
            '<span class="dex-id">' + escapeHTML(base.id) + '</span>' +
            '<span class="dex-check">' + (caught ? '✓' : seen ? '◉' : '?') + '</span>' +
            '<div class="monster-sprite">' + monsterSpriteHTML(base, 'dex-img') + '</div>' +
            '<span class="dex-name">' + escapeHTML(base.name) + '</span>' +
            '<span class="dex-el el-' + elementSlug(element) + '">' + escapeHTML(base.element || '') + '</span>' +
        '</div>';
    }).join('');
}

function updateDexSearch(value) {
    dexFilter.search = value || '';
    refreshDexGrid();
}

function updateDexElement(value) {
    dexFilter.element = value || 'all';
    refreshDexGrid();
}

function dexSetStatus(status) {
    dexFilter.status = status;
    renderDexMenu();
}

function openDexEntry(id) {
    const base = getFolkmomById(id);
    if(!base) return;
    currentMenuType = 'dexEntry';
    const seen = !!(player.dex && player.dex.seen && player.dex.seen[id]);
    const caught = !!(player.dex && player.dex.caught && player.dex.caught[id]);
    const status = caught ? 'Capturado' : seen ? 'Visto' : 'Desconhecido';
    const statusColor = caught ? '#4ade80' : seen ? '#38bdf8' : '#64748b';
    const desc = base.desc || ('Folclore: ' + (base.folklore || 'mistério do sertão'));
    let html = '<div class="team-slot selected">' +
        '<div class="monster-sprite">' + monsterSpriteHTML(base, 'team-img') + '</div>' +
        '<div class="monster-info">' +
            '<strong>' + escapeHTML(base.name) + '</strong> <small>· ' + escapeHTML(base.id) + '</small><br>' +
            '<small>' + escapeHTML(base.element || '') + ' · ' + escapeHTML(base.folklore || '') + '</small><br>' +
            '<small style="color:' + statusColor + '">' + status + '</small>' +
        '</div>' +
    '</div>';
    html += '<div class="menu-section"><div class="menu-section-title">Registro</div><p>' + escapeHTML(desc) + '</p>' +
        '<div class="trainer-stats" style="margin-top:8px;">' +
            '<div class="stat-row"><span>HP base</span><b>' + (base.baseHp || '?') + '</b></div>' +
            '<div class="stat-row"><span>Ataque base</span><b>' + (base.baseAtk || '?') + '</b></div>' +
            '<div class="stat-row"><span>Defesa base</span><b>' + (base.baseDef || '?') + '</b></div>' +
            '<div class="stat-row"><span>Raridade</span><b>' + escapeHTML(base.rarity || 'comum') + '</b></div>' +
        '</div>' +
    '</div>';
    html += '<div class="menu-section"><div class="menu-section-title">Evolução</div><p>' + escapeHTML(evolutionDescription(base)) + '</p></div>';
    html += '<div class="menu-grid-2" style="margin-top:12px;">' +
        '<button class="menu-action" onclick="openMenu(\'dex\')">↩ Voltar ao Enciclore</button>' +
        '<button class="menu-action" onclick="closeMenu()">Fechar</button>' +
    '</div>';
    setMenu('Enciclore · ' + base.name, html, false);
}

// ===================== CARTÃO DE TREINADOR =====================
function renderTrainerCard() {
    const stats = player.stats || {};
    const name = player.trainerName || currentUser || 'Treinador';
    const teamLevel = Math.max(1, ...(player.team || []).map(m => m.level || 1));
    let html = '<div class="trainer-card">' +
        '<div class="trainer-avatar" title="Seu treinador"></div>' +
        '<div class="trainer-card-main">' +
            '<div class="trainer-card-name">' + escapeHTML(name) + '</div>' +
            '<div class="trainer-card-sub">' + (CLOUD_ENABLED ? 'Conta na nuvem · Supabase' : 'Conta local · neste navegador') + ' · Nível de treinador ' + (player.level || 1) + '</div>' +
            '<div class="trainer-stats">' +
                '<div class="stat-row"><span>Dinheiro</span><b>$' + formatNumber(player.money || 0) + '</b></div>' +
                '<div class="stat-row"><span>Pontos de Batalha</span><b>' + formatNumber(stats.bp || 0) + ' BP</b></div>' +
                '<div class="stat-row"><span>Batalhas vencidas</span><b>' + formatNumber(stats.battlesWon || 0) + '</b></div>' +
                '<div class="stat-row"><span>Capturados</span><b>' + formatNumber(stats.captures || 0) + '</b></div>' +
                '<div class="stat-row"><span>Scans</span><b>' + formatNumber(stats.scans || 0) + '</b></div>' +
                '<div class="stat-row"><span>Evoluções</span><b>' + formatNumber(stats.evolves || 0) + '</b></div>' +
                '<div class="stat-row"><span>PvP</span><b>' + formatNumber(stats.pvpWins || 0) + 'V / ' + formatNumber(stats.pvpLosses || 0) + 'D</b></div>' +
                '<div class="stat-row"><span>Tempo de jogo</span><b>' + formatPlayTime(stats.playSeconds || 0) + '</b></div>' +
            '</div>' +
        '</div>' +
    '</div>';
    html += '<div class="menu-section"><div class="menu-section-title">Insígnias <span>0/8</span></div><div class="badge-row">' +
        Array.from({ length: 8 }, (_, i) => '<span class="badge-slot" title="Insígnia ' + (i + 1) + ' — em breve">' + (i + 1) + '</span>').join('') +
    '</div><div class="menu-note">As insígnias serão conquistadas em desafios de líderes de região em uma próxima atualização.</div></div>';
    html += '<div class="menu-section"><div class="menu-section-title">Equipe <span>' + (player.team || []).length + '/6</span></div>' +
        '<div class="trainer-stats">' +
            '<div class="stat-row"><span>Maior nível</span><b>' + teamLevel + '</b></div>' +
            '<div class="stat-row"><span>Enciclore</span><b>' + dexCounts().caught + '/' + dexCounts().total + '</b></div>' +
        '</div></div>';
    html += '<div class="menu-grid-2" style="margin-top:12px;">' +
        '<button class="menu-action" onclick="openMenu(\'items\')">🎒 Mochila</button>' +
        '<button class="menu-action" onclick="openMenu(\'dex\')">📖 Enciclore</button>' +
    '</div>';
    setMenu('Cartão de Treinador', html, true);
}

// ===================== MERCADO / GTL =====================
function ensureMarketOffers() {
    if(marketOffers.length) return;
    marketOffers = [];
    const bases = FOLKMONS.main;
    const healing = ['cura_simples', 'cura_media', 'cura_total'];
    const evoKeys = Object.keys(EVO_ITEMS);
    const baseLevel = Math.max(5, (player.team && player.team[0] && player.team[0].level) || 5);

    for(let i = 0; i < 6; i++) {
        if(i < 4) {
            const base = bases[Math.floor(Math.random() * bases.length)];
            const level = Math.max(3, Math.min(60, baseLevel + Math.floor(Math.random() * 7) - 2));
            const value = (base.baseHp || 40) + (base.baseAtk || 10) + (base.baseDef || 10);
            marketOffers.push({
                type: 'mon',
                id: base.id,
                level: level,
                price: Math.round(value * 3 + level * 10)
            });
        } else if(i === 4) {
            const itemId = healing[Math.floor(Math.random() * healing.length)];
            const item = ITEMS[itemId];
            marketOffers.push({
                type: 'item',
                itemKind: 'heal',
                id: itemId,
                count: 1 + Math.floor(Math.random() * 3),
                price: Math.round((item.value >= 999 ? 160 : item.value) * 2.2)
            });
        } else {
            const itemId = evoKeys[Math.floor(Math.random() * evoKeys.length)];
            const item = EVO_ITEMS[itemId];
            marketOffers.push({
                type: 'item',
                itemKind: 'evo',
                id: itemId,
                count: 1,
                price: 180 + Math.floor(Math.random() * 100)
            });
        }
    }
}

function marketSellValue(mon) {
    const base = getFolkmomById(mon.id) || mon.baseData || {};
    const value = (base.baseHp || 35) + (base.baseAtk || 10) + (base.baseDef || 10);
    return Math.max(30, Math.round(value * 2 + (mon.level || 1) * 8));
}

function renderMarketMenu() {
    ensureMarketOffers();
    let html = '<div class="menu-toolbar" style="justify-content:space-between;">' +
        '<span style="color:#94a3b8;font-size:10px;">Saldo: <b style="color:#facc15;">$' + formatNumber(player.money || 0) + '</b></span>' +
        '<button class="menu-tab" onclick="refreshMarketOffers()">🔄 Renovar ofertas</button>' +
    '</div>';
    html += '<div class="menu-note" style="margin-top:0;margin-bottom:10px;">Mercado local simulado. Compras usam o dinheiro do jogo; o mercado entre jogadores chega com a conta na nuvem.</div>';

    html += '<div class="menu-section-title"><span>Ofertas</span><span>6 disponíveis</span></div>';
    marketOffers.forEach((offer, index) => {
        if(offer.type === 'mon') {
            const base = getFolkmomById(offer.id);
            if(!base) return;
            const mon = createFolkmom(offer.id, offer.level);
            const disabled = (player.money || 0) < offer.price || (player.team || []).length >= 6;
            html += '<div class="market-offer">' +
                '<div class="monster-sprite">' + monsterSpriteHTML(mon, 'scan-img') + '</div>' +
                '<div class="market-offer-info"><strong>' + escapeHTML(base.name) + ' Lv.' + offer.level + '</strong>' +
                    '<small>' + escapeHTML(base.element) + ' · ' + escapeHTML(base.folklore || '') + ' · ' + escapeHTML(base.rarity || 'comum') + '</small>' +
                '</div>' +
                '<div class="market-price">$' + formatNumber(offer.price) + '<small>comprar</small></div>' +
                '<button class="mini-btn" onclick="buyMarketOffer(' + index + ')" ' + (disabled ? 'disabled' : '') + '>Comprar</button>' +
            '</div>';
        } else {
            const item = offer.itemKind === 'heal' ? ITEMS[offer.id] : EVO_ITEMS[offer.id];
            if(!item) return;
            const disabled = (player.money || 0) < offer.price;
            html += '<div class="market-offer">' +
                '<div class="monster-sprite" style="font-size:28px;">' + item.sprite + '</div>' +
                '<div class="market-offer-info"><strong>' + escapeHTML(item.name) + ' x' + offer.count + '</strong>' +
                    '<small>' + escapeHTML(offer.itemKind === 'heal' ? item.desc : 'Item de evolução') + '</small>' +
                '</div>' +
                '<div class="market-price">$' + formatNumber(offer.price) + '<small>comprar</small></div>' +
                '<button class="mini-btn" onclick="buyMarketOffer(' + index + ')" ' + (disabled ? 'disabled' : '') + '>Comprar</button>' +
            '</div>';
        }
    });

    html += '<div class="menu-section"><div class="menu-section-title"><span>Vender do time</span><span>50% do valor</span></div>';
    if((player.team || []).length <= 1) {
        html += '<div class="menu-note">Você precisa manter pelo menos um Folkmom no time.</div>';
    } else {
        (player.team || []).forEach((mon, index) => {
            const value = marketSellValue(mon);
            html += '<div class="market-offer" style="padding:6px 8px;">' +
                '<div class="monster-sprite" style="width:36px;height:36px;">' + monsterSpriteHTML(mon, 'scan-img') + '</div>' +
                '<div class="market-offer-info"><strong>' + escapeHTML(mon.name) + ' Lv.' + mon.level + '</strong><small>' + escapeHTML(mon.element) + '</small></div>' +
                '<div class="market-price">$' + formatNumber(value) + '</div>' +
                '<button class="mini-btn danger" onclick="sellFolkmom(' + index + ')">Vender</button>' +
            '</div>';
        });
    }
    html += '</div>';
    setMenu('Mercado Folclórico (GTL)', html, true);
}

function buyMarketOffer(index) {
    const offer = marketOffers[index];
    if(!offer) return;
    if((player.money || 0) < offer.price) {
        showToast('Dinheiro insuficiente.', 'error');
        return;
    }
    if(offer.type === 'mon') {
        if((player.team || []).length >= 6) {
            showToast('Time cheio (6/6).', 'error');
            return;
        }
        const mon = createFolkmom(offer.id, offer.level);
        if(!mon) return;
        player.money -= offer.price;
        player.team.push(mon);
        markDexCaught(mon.id);
        addChatMessage('Comércio', 'Compra realizada: ' + mon.name + ' Lv.' + mon.level + ' por $' + formatNumber(offer.price) + '.', 'system');
        showToast(mon.name + ' entrou no time!', 'success');
        updatePartyBar(true);
        refreshFollower();
    } else if(offer.itemKind === 'heal') {
        player.money -= offer.price;
        player.items[offer.id] = (player.items[offer.id] || 0) + offer.count;
        addChatMessage('Comércio', 'Compra realizada: ' + ITEMS[offer.id].name + ' x' + offer.count + '.', 'system');
        showToast(ITEMS[offer.id].name + ' x' + offer.count + ' comprado!', 'success');
        renderHotbar();
    } else {
        player.money -= offer.price;
        player.evoItems[offer.id] = (player.evoItems[offer.id] || 0) + offer.count;
        addChatMessage('Comércio', 'Compra realizada: ' + EVO_ITEMS[offer.id].name + '.', 'system');
        showToast(EVO_ITEMS[offer.id].name + ' comprado!', 'success');
    }
    marketOffers.splice(index, 1);
    updateHUD();
    saveGame();
    renderMarketMenu();
}

function sellFolkmom(index) {
    if((player.team || []).length <= 1) {
        showToast('Você precisa manter pelo menos um Folkmom.', 'error');
        return;
    }
    const mon = player.team[index];
    if(!mon) return;
    const value = marketSellValue(mon);
    if(!window.confirm('Vender ' + mon.name + ' Lv.' + mon.level + ' por $' + value + '?')) return;
    player.money = (player.money || 0) + value;
    player.team.splice(index, 1);
    if(player.followerIndex >= player.team.length) player.followerIndex = 0;
    markDexCaught(mon.id);
    addChatMessage('Comércio', 'Venda realizada: ' + mon.name + ' por $' + formatNumber(value) + '.', 'system');
    showToast(mon.name + ' vendido por $' + formatNumber(value) + '!', 'success');
    refreshFollower();
    updatePartyBar(true);
    renderHotbar();
    updateHUD();
    saveGame();
    renderMarketMenu();
}

function refreshMarketOffers() {
    marketOffers = [];
    ensureMarketOffers();
    renderMarketMenu();
    showToast('Ofertas renovadas.', 'info');
}

// ===================== ARENA PVP =====================
const PVP_RANKING = [
    { name: 'Curupira', rating: 1210 },
    { name: 'Iara', rating: 1160 },
    { name: 'Boitatá', rating: 1105 },
    { name: 'Saci', rating: 1060 },
    { name: 'Cuca', rating: 1020 },
    { name: 'Anhangá', rating: 985 },
    { name: 'Mula', rating: 940 },
    { name: 'Boto', rating: 900 }
];

function renderPvpMenu() {
    const stats = player.stats || {};
    const rating = stats.pvpRating || 1000;
    const rows = PVP_RANKING.concat([{ name: player.trainerName || currentUser || 'Você', rating: rating, you: true }])
        .sort((a, b) => b.rating - a.rating);
    let html = '<div class="pvp-box">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;">' +
            '<div><div style="color:#94a3b8;font-size:9px;text-transform:uppercase;letter-spacing:.08em;">Seu rating</div>' +
            '<div class="pvp-rating">' + rating + '</div></div>' +
            '<div style="text-align:right;color:#94a3b8;font-size:9px;line-height:1.6;">' +
                '<div><b style="color:#4ade80;">' + formatNumber(stats.pvpWins || 0) + '</b> vitórias</div>' +
                '<div><b style="color:#f87171;">' + formatNumber(stats.pvpLosses || 0) + '</b> derrotas</div>' +
                '<div><b style="color:#facc15;">' + formatNumber(stats.bp || 0) + '</b> BP</div>' +
            '</div>' +
        '</div>' +
    '</div>';
    html += '<div class="menu-note">Duelo local 1v1 contra treinadores simulados. A fila online e os torneios chegam com a conta na nuvem.</div>';
    html += '<button class="menu-action" style="width:100%;margin-top:10px;" onclick="startPvpBattle()">⚔️ Procurar duelo local</button>';
    html += '<div class="menu-section"><div class="menu-section-title">Ranking local</div><div class="pvp-ranking">';
    rows.forEach((row, index) => {
        html += '<div class="ranking-row ' + (row.you ? 'you' : '') + '">' +
            '<span>#' + (index + 1) + ' ' + escapeHTML(row.name) + (row.you ? ' (você)' : '') + '</span>' +
            '<b>' + row.rating + '</b>' +
        '</div>';
    });
    html += '</div></div>';
    setMenu('Arena PvP', html, false);
}

function startPvpBattle() {
    if(!player.team || player.team.length === 0) {
        showToast('Monte um time antes de duelar.', 'error');
        return;
    }
    const healthy = player.team.find(mon => mon.hp > 0);
    if(!healthy) {
        showToast('Seu time está sem PV. Use itens curativos.', 'error');
        return;
    }
    const bases = FOLKMONS.main;
    const base = bases[Math.floor(Math.random() * bases.length)];
    const playerLevel = healthy.level || 5;
    const level = Math.max(3, playerLevel + Math.floor(Math.random() * 3) - 1);
    const enemy = createFolkmom(base.id, level);
    closeMenu();
    startBattleScan(enemy, { isScan: false, kind: 'pvp' });
}

function recordPvpWin() {
    if(!player.stats) player.stats = {};
    player.stats.pvpWins = (player.stats.pvpWins || 0) + 1;
    player.stats.pvpRating = Math.max(0, (player.stats.pvpRating || 1000) + 18);
    player.stats.bp = (player.stats.bp || 0) + 12;
    addChatMessage('Batalha', 'Duelo PvP vencido! Rating +18 e +12 BP.', 'battle');
}

function recordPvpLoss() {
    if(!player.stats) player.stats = {};
    player.stats.pvpLosses = (player.stats.pvpLosses || 0) + 1;
    player.stats.pvpRating = Math.max(0, (player.stats.pvpRating || 1000) - 12);
    addChatMessage('Batalha', 'Duelo PvP perdido. Rating -12.', 'battle');
}

// ===================== COMUNIDADE / SOCIAL =====================
function friendCode() {
    const source = (player.trainerName || currentUser || 'folkmons').toLowerCase();
    let hash = 0;
    for(let i = 0; i < source.length; i++) hash = ((hash << 5) - hash) + source.charCodeAt(i);
    const code = Math.abs(hash).toString(36).toUpperCase().slice(0, 6).padStart(6, '0');
    return 'FLK-' + code;
}

function renderSocialMenu() {
    let html = '<div class="menu-section"><div class="menu-section-title">Lista de amigos</div>' +
        '<p style="color:#94a3b8;font-size:10px;">Seu código de treinador:</p>' +
        '<div class="social-code">' + friendCode() + '</div>' +
        '<div class="menu-toolbar"><input id="friendInput" type="text" maxlength="20" placeholder="Nome de um amigo...">' +
        '<button class="menu-tab" onclick="addFriend()">Adicionar</button></div>';
    if(!player.friends || player.friends.length === 0) {
        html += '<div class="menu-note">Nenhum amigo adicionado. No modo local, a lista é apenas um caderno de nomes; a conexão real chega com a nuvem.</div>';
    } else {
        player.friends.forEach((friend, index) => {
            html += '<div class="friend-row"><span>' + escapeHTML(friend) + '</span>' +
                '<button class="mini-btn danger" onclick="removeFriend(' + index + ')">Remover</button></div>';
        });
    }
    html += '</div>';

    html += '<div class="menu-section"><div class="menu-section-title">Guilda / Time</div>';
    if(player.guild) {
        html += '<div class="social-card"><div class="social-card-info"><strong>' + escapeHTML(player.guild) + '</strong><small>Guilda local · 1 membro</small></div>' +
            '<button class="mini-btn danger" onclick="leaveGuild()">Sair</button></div>';
    } else {
        html += '<div class="menu-toolbar"><input id="guildInput" type="text" maxlength="24" placeholder="Nome da guilda...">' +
            '<button class="menu-tab" onclick="createGuild()">Criar guilda</button></div>';
    }
    html += '</div>';

    html += '<div class="menu-section"><div class="menu-section-title">Correio</div>' +
        '<div class="social-card"><div class="social-card-info"><strong>Boas-vindas ao Folkmons</strong><small>Sistema · A aventura começa no Sertão Folclórico.</small></div></div>' +
        '<div class="social-card"><div class="social-card-info"><strong>Atualização da HUD</strong><small>Sistema · Menu no estilo cliente de MMO, chat, equipe e atalhos.</small></div></div>' +
        '<div class="social-card"><div class="social-card-info"><strong>Conta na nuvem</strong><small>Sistema · Quando ativada, seus dados sincronizam entre dispositivos.</small></div></div>' +
    '</div>';

    html += '<div class="menu-section"><div class="menu-section-title">Trocas</div>' +
        '<button class="menu-action" onclick="openMenu(\'trades\')">🔁 Trocas de evolução</button></div>';
    html += '<div class="menu-note">Amigos, guilda e correio entre jogadores serão online com a conta na nuvem. Por enquanto, tudo fica salvo localmente.</div>';
    setMenu('Comunidade', html, true);
}

function addFriend() {
    const input = document.getElementById('friendInput');
    if(!input) return;
    const name = input.value.trim();
    if(name.length < 2) {
        showToast('Digite um nome com pelo menos 2 caracteres.', 'error');
        return;
    }
    if(!player.friends) player.friends = [];
    if(player.friends.includes(name)) {
        showToast('Esse nome já está na lista.', 'info');
        return;
    }
    player.friends.push(name);
    saveGame();
    renderSocialMenu();
    showToast(name + ' adicionado à lista local.', 'success');
}

function removeFriend(index) {
    if(!player.friends) return;
    player.friends.splice(index, 1);
    saveGame();
    renderSocialMenu();
}

function createGuild() {
    const input = document.getElementById('guildInput');
    if(!input) return;
    const name = input.value.trim();
    if(name.length < 2) {
        showToast('Digite um nome de guilda válido.', 'error');
        return;
    }
    player.guild = name;
    saveGame();
    renderSocialMenu();
    showToast('Guilda ' + name + ' criada (modo local).', 'success');
}

function leaveGuild() {
    if(!player.guild) return;
    if(!window.confirm('Sair da guilda ' + player.guild + '?')) return;
    player.guild = '';
    saveGame();
    renderSocialMenu();
}

// ===================== AJUDA =====================
function renderHelpMenu() {
    const html = '' +
        '<details class="help-item" open><summary>⌨️ Controles no mapa</summary><div><b>WASD</b> ou <b>setas</b> movem o treinador. <b>E</b> abre o Scanner. <b>1-9</b> usam os atalhos. <b>Esc</b> fecha menus. O Folkmom seguidor escolhido caminha ao seu lado.</div></details>' +
        '<details class="help-item"><summary>📱 Android, direcional e mensagens</summary><div>Em celulares e tablets, o <b>direcional analógico</b> aparece à esquerda. Arraste o dedo para andar em qualquer direção e intensidade. Ative ou desative em <b>Menu do Jogo → Interface</b>. Quando aparecer uma mensagem, toque nela ou em <b>Continuar</b> para avançar; <b>Cancelar</b> fecha e limpa a fila. Em paisagem a área do jogo fica maior.</div></details>' +
        '<details class="help-item"><summary>📱 Como capturar Folkmons</summary><div>Abra o <b>Scanner</b> (botão Scan ou tecla E), inicie o Scan e aguarde passar de 100%. Depois clique em <b>Consertar Scan</b>. Ao encontrar um Folkmom, vença a batalha e escolha <b>Adicionar ao time</b>.</div></details>' +
        '<details class="help-item"><summary>⚔️ Batalha</summary><div>Escolha <b>Atacar</b> para ver os 4 golpes, <b>Trocar</b> para mudar o Folkmom em campo, <b>Item</b> para curar e <b>Fugir</b> para sair. As barras mostram PV; o log registra dano, vantagens de elemento, EXP, níveis e recompensas. Atalhos: 1-4 golpes, 5 itens, 6 troca, 0 fugir.</div></details>' +
        '<details class="help-item"><summary>🐾 Equipe e seguidor</summary><div>Clique em um slot no canto superior direito para abrir o submenu com <b>Sumário</b>, <b>Ordem do time</b> e <b>Seguidor</b>. O seguidor aparece no mapa e pode ser trocado a qualquer momento.</div></details>' +
        '<details class="help-item"><summary>🎒 Mochila, atalhos e evolução</summary><div>A Mochila tem abas de cura, evolução e chaves. Arraste itens curativos para os atalhos 1-9 ou use o botão <b>→ Atalho</b>. Itens de evolução evoluem Folkmons compatíveis do time. Alguns Folkmons também evoluem por nível ou troca.</div></details>' +
        '<details class="help-item"><summary>📖 Enciclore, Mercado e PvP</summary><div>O <b>Enciclore</b> registra vistos e capturados. O <b>Mercado (GTL)</b> permite comprar e vender Folkmons e itens com dinheiro do jogo. A <b>Arena PvP</b> oferece duelos locais 1v1 e ranking; o online chega com a nuvem.</div></details>' +
        '<details class="help-item"><summary>☁️ Conta, nuvem e senha</summary><div>O jogo funciona com conta local neste navegador. Quando o Supabase estiver ativado, o login por e-mail sincroniza o save na nuvem. A troca de senha fica no <b>Menu do Jogo</b>. Nunca compartilhe a chave <b>service_role</b>; apenas a chave pública anon pode ficar no site.</div></details>' +
        '<details class="help-item"><summary>🎨 Sprites e folclore</summary><div>Os sprites usam fundo chroma verde e serão substituídos/misturados depois. O jogo não usa nomes ou assets de outras franquias de criaturas: todos os Folkmons são inspirados no folclore brasileiro.</div></details>' +
        '<div class="menu-grid-2" style="margin-top:12px;">' +
            '<button class="menu-action" onclick="openMenu(\'phone\')">📱 Abrir Scanner</button>' +
            '<button class="menu-action" onclick="openMenu(\'team\')">🐾 Ver time</button>' +
        '</div>';
    setMenu('Ajuda & FAQ', html, false);
}

// ===================== EVOLUÇÃO =====================
function evolveMonster(mon, newId, source) {
    const base = getFolkmomById(newId);
    if(!mon || !base) return false;
    const oldName = mon.name;
    mon.id = base.id;
    mon.name = base.name;
    mon.element = base.element;
    mon.folklore = base.folklore;
    mon.sprite = base.sprite;
    mon.baseData = base;
    mon.maxHp = Math.floor(base.baseHp + mon.level * 2.5);
    mon.hp = mon.maxHp;
    mon.atk = Math.floor(base.baseAtk + mon.level * 1.8);
    mon.def = Math.floor(base.baseDef + mon.level * 1.3);
    if(!mon.expToNext) mon.expToNext = mon.level * 120;
    player.stats.evolves = (player.stats.evolves || 0) + 1;
    markDexCaught(base.id);
    addChatMessage('Equipe', oldName + ' evoluiu para ' + base.name + '!', 'system');
    showToast('Evolução! ' + oldName + ' → ' + base.name, 'success');
    if(currentBattle) {
        addBattleLog(oldName + ' evoluiu para ' + base.name + '!', 'log-good');
        renderBattleSprites();
        updateBattleUI();
    }
    refreshFollower();
    updatePartyBar(true);
    saveGame();
    return true;
}

function checkLevelEvolution(mon) {
    let guard = 0;
    while(mon && guard++ < 3) {
        const base = getFolkmomById(mon.id);
        if(!base || base.evoType !== 'level' || !base.evoLevel || mon.level < base.evoLevel || !base.evoTo || !base.evoTo.length) break;
        if(!evolveMonster(mon, base.evoTo[0], 'level')) break;
    }
}

let currentScanPercent = 0;
let scanInterval = null;

function startScan() {
    if(scanInterval) return;
    const msg = document.getElementById('phoneMsg');
    const percentEl = document.getElementById('scanPercent');
    const statusEl = document.getElementById('scanStatus');
    if(!msg || !percentEl || !statusEl) {
        renderPhoneMenu();
        return;
    }
    currentScanPercent = 0;
    msg.textContent = '';
    msg.style.color = '';
    statusEl.textContent = 'Escaneando...';
    addChatMessage('Local', 'Scan iniciado. Mantenha o sinal até 100%.', 'system');
    
    scanInterval = setInterval(() => {
        currentScanPercent += Math.floor(Math.random() * 15) + 5;
        if(currentScanPercent > 150) currentScanPercent = 150;
        percentEl.textContent = currentScanPercent + '%';
        
        if(currentScanPercent >= 100) {
            statusEl.textContent = 'Scan Completo! Pode consertar';
            statusEl.style.color = '#4CAF50';
        } else if(currentScanPercent >= 70) {
            statusEl.textContent = 'Quase completo...';
        }
    }, 400);
}

function fixScan() {
    if(scanInterval) {
        clearInterval(scanInterval);
        scanInterval = null;
    }
    
    const msg = document.getElementById('phoneMsg');
    const statusEl = document.getElementById('scanStatus');
    if(!msg || !statusEl) {
        if(currentScanPercent >= 100) generateScannedFolkmom();
        return;
    }
    
    if(currentScanPercent < 100) {
        msg.style.color = '#f87171';
        msg.textContent = 'Scan insuficiente! Necessário >= 100%';
        statusEl.textContent = 'Falhou';
        statusEl.style.color = '#f87171';
        addChatMessage('Local', 'Falha no Scan: é preciso chegar a 100%.', 'system');
        return;
    }
    
    msg.style.color = '#38bdf8';
    msg.textContent = 'Consertando sistema de Scan...';
    statusEl.textContent = 'Consertando...';
    statusEl.style.color = '#38bdf8';
    
    setTimeout(() => {
        const success = Math.random() < 0.8 + (currentScanPercent / 500);
        if(success) {
            msg.style.color = '#4ade80';
            msg.textContent = 'Scan consertado com sucesso!';
            statusEl.textContent = 'Gerando Folkmom...';
            statusEl.style.color = '#facc15';
            addChatMessage('Local', 'Scan consertado! Um Folkmom está se materializando...', 'system');
            setTimeout(() => {
                generateScannedFolkmom();
            }, 1500);
        } else {
            msg.style.color = '#fb923c';
            msg.textContent = 'Falha ao consertar. Tente novamente com scan maior!';
            statusEl.textContent = 'Erro';
            statusEl.style.color = '#fb923c';
            currentScanPercent = Math.floor(currentScanPercent * 0.5);
            const percentEl = document.getElementById('scanPercent');
            if(percentEl) percentEl.textContent = currentScanPercent + '%';
            addChatMessage('Local', 'O Scan falhou. Tente novamente.', 'system');
        }
    }, 2000);
}

function generateScannedFolkmom() {
    // Gerar aleatório dos 50 principais
    const randIdx = Math.floor(Math.random() * FOLKMONS.main.length);
    const baseFolkmom = FOLKMONS.main[randIdx];
    const wildLevel = Math.floor((player.level || 5) + Math.random() * 4 - 1);
    const wild = createFolkmom(baseFolkmom.id, Math.max(3, wildLevel));
    markDexSeen(wild.id);
    const phoneMsg = document.getElementById('phoneMsg');
    if(phoneMsg) {
        phoneMsg.innerHTML = '<strong style="color:#4ade80;">Folkmom escaneado!</strong><br>' +
            monsterSpriteHTML(wild, 'scan-img') + ' ' + wild.name + ' | ' + wild.element + ' | Lv.' + wild.level + '<br>' +
            '<em>' + wild.folklore + '</em>';
    }
    
    player.stats.scans++;
    addChatMessage('Local', 'Scan concluído: ' + wild.name + ' Lv.' + wild.level + ' (' + wild.element + ').', 'system');
    showToast('Folkmom detectado: ' + wild.name + '!', 'success');
    saveGame();
    
    setTimeout(() => {
        closeMenu();
        // Iniciar batalha para capturar
        startBattleScan(wild);
    }, 2000);
}

function doTradeMenu() {
    const msg = document.getElementById('tradeMsg');
    // Verifica pares de troca
    const pairs = [
        ['FM011','FM012'], ['FM012','FM011'],
        ['FM013','FM014'], ['FM014','FM013'],
        ['FM015','FM016'], ['FM016','FM015'],
        ['FM017','FM018'], ['FM018','FM017'],
        ['FM019','FM020'], ['FM020','FM019']
    ];
    
    let foundPair = null;
    for(let pair of pairs) {
        let has1 = player.team.find(m => m.id === pair[0]);
        let has2 = player.team.find(m => m.id === pair[1]);
        if(has1 && has2 && has1.id !== has2.id) {
            foundPair = pair;
            break;
        }
    }
    
    if(!foundPair) {
        if(msg) {
            msg.style.color = '#f87171';
            msg.textContent = 'Você precisa ter o par correto de Folkmons para trocar!';
        }
        showToast('Falta o par correto no time.', 'error');
        return;
    }
    
    // Realizar troca
    let mon1 = player.team.find(m => m.id === foundPair[0]);
    let mon2 = player.team.find(m => m.id === foundPair[1]);
    
    player.team = player.team.filter(m => m.id !== foundPair[0] && m.id !== foundPair[1]);
    
    // Evoluir ambos
    let base1 = getFolkmomById(foundPair[0]);
    if(base1.evoType === 'trade' && base1.evoTo.length > 0) {
        const evolved = createFolkmom(base1.evoTo[0], mon1.level);
        player.team.push(evolved);
        markDexCaught(evolved.id);
    }
    let base2 = getFolkmomById(foundPair[1]);
    if(base2.evoType === 'trade' && base2.evoTo.length > 0) {
        const evolved = createFolkmom(base2.evoTo[0], mon2.level);
        player.team.push(evolved);
        markDexCaught(evolved.id);
    }
    
    if(msg) {
        msg.style.color = '#4ade80';
        msg.textContent = 'Troca realizada! Ambos evoluíram por troca!';
    }
    player.stats.evolves = (player.stats.evolves || 0) + 2;
    if(player.followerIndex >= player.team.length) player.followerIndex = 0;
    addChatMessage('Equipe', 'Troca concluída! Os dois Folkmons evoluíram.', 'system');
    showToast('Troca concluída! Ambos evoluíram!', 'success');
    refreshFollower();
    updatePartyBar(true);
    saveGame();
    renderTradesMenu();
}

// ===================== BATALHA =====================
// Tabela simples de vantagens. Multiplicamos pelos dois tipos do alvo.
const TYPE_CHART = {
    Fogo:     { Grama: 2, Vento: 1.5, Agua: 0.5, Fogo: 0.5, Terra: 0.5, Trevas: 1.5 },
    Agua:     { Fogo: 2, Terra: 2, Grama: 0.5, Agua: 0.5, Eletrico: 1 },
    Grama:    { Agua: 2, Terra: 2, Fogo: 0.5, Grama: 0.5, Vento: 0.5, Eletrico: 1 },
    Eletrico: { Agua: 2, Vento: 2, Terra: 0, Grama: 0.5, Eletrico: 0.5 },
    Vento:    { Grama: 2, Terra: 2, Eletrico: 0.5, Vento: 0.5, Fogo: 1 },
    Terra:    { Eletrico: 2, Fogo: 2, Vento: 0.5, Grama: 0.5, Terra: 1 },
    Trevas:   { Vento: 1.5, Trevas: 0.5, Fogo: 0.5, Agua: 0.5, Grama: 0.5, Eletrico: 0.5, Terra: 0.5 }
};

const MOVES = {
    Fogo: [
        { name: 'Brasa', power: 12, element: 'Fogo', type: 'damage' },
        { name: 'Labareda', power: 18, element: 'Fogo', type: 'damage' },
        { name: 'Explosão Solar', power: 26, element: 'Fogo', type: 'damage' },
        { name: 'Fogo Interior', power: 0, element: 'Fogo', type: 'buff', value: 0.25, desc: '+25% ATK' }
    ],
    Agua: [
        { name: "Jato d'Água", power: 12, element: 'Agua', type: 'damage' },
        { name: 'Onda', power: 18, element: 'Agua', type: 'damage' },
        { name: 'Maré Alta', power: 26, element: 'Agua', type: 'damage' },
        { name: 'Névoa Restauradora', power: 0, element: 'Agua', type: 'heal', value: 0.25, desc: 'Recupera 25% PV' }
    ],
    Grama: [
        { name: 'Chicote de Cipó', power: 12, element: 'Grama', type: 'damage' },
        { name: 'Folha Navalha', power: 18, element: 'Grama', type: 'damage' },
        { name: 'Tempestade Verde', power: 26, element: 'Grama', type: 'damage' },
        { name: 'Pólen Curativo', power: 0, element: 'Grama', type: 'heal', value: 0.25, desc: 'Recupera 25% PV' }
    ],
    Eletrico: [
        { name: 'Faísca', power: 12, element: 'Eletrico', type: 'damage' },
        { name: 'Choque', power: 18, element: 'Eletrico', type: 'damage' },
        { name: 'Raio', power: 26, element: 'Eletrico', type: 'damage' },
        { name: 'Descarga', power: 0, element: 'Eletrico', type: 'buff', value: 0.25, desc: '+25% ATK' }
    ],
    Vento: [
        { name: 'Rajada', power: 12, element: 'Vento', type: 'damage' },
        { name: 'Ciclone', power: 18, element: 'Vento', type: 'damage' },
        { name: 'Vendaval', power: 26, element: 'Vento', type: 'damage' },
        { name: 'Brisa', power: 0, element: 'Vento', type: 'heal', value: 0.25, desc: 'Recupera 25% PV' }
    ],
    Terra: [
        { name: 'Pedrada', power: 12, element: 'Terra', type: 'damage' },
        { name: 'Terremoto', power: 18, element: 'Terra', type: 'damage' },
        { name: 'Deslizamento', power: 26, element: 'Terra', type: 'damage' },
        { name: 'Poeira', power: 0, element: 'Terra', type: 'debuff', value: 0.20, desc: '-20% ATK inimigo' }
    ],
    Trevas: [
        { name: 'Sombra', power: 12, element: 'Trevas', type: 'damage' },
        { name: 'Mordida Sombria', power: 18, element: 'Trevas', type: 'damage' },
        { name: 'Abismo', power: 26, element: 'Trevas', type: 'damage' },
        { name: 'Maldição', power: 0, element: 'Trevas', type: 'debuff', value: 0.20, desc: '-20% ATK inimigo' }
    ]
};

function getMoves(mon) {
    const els = (mon.element || 'Trevas').split('/').map(e => e.trim());
    const primary = MOVES[els[0]] || MOVES.Trevas;
    const secondary = els[1] ? MOVES[els[1]] : null;
    if(secondary) return [primary[0], primary[2], secondary[0], secondary[1]];
    return primary.slice(0, 4);
}

function elementSlug(el) {
    const map = { Agua: 'agua', Eletrico: 'eletrico', Grama: 'grama', Fogo: 'fogo', Vento: 'vento', Terra: 'terra', Trevas: 'trevas' };
    return map[el] || 'trevas';
}

function typeEffectiveness(moveEl, targetEl) {
    let mult = 1;
    (targetEl || '').split('/').forEach(t => {
        const row = TYPE_CHART[moveEl];
        if(row && typeof row[t] === 'number') mult *= row[t];
    });
    return Math.max(0, Math.min(4, mult));
}

function effectivenessText(mult) {
    if(mult === 0) return { text: 'Não afeta o alvo...', cls: 'log-bad' };
    if(mult >= 2) return { text: 'É super eficaz!', cls: 'log-good' };
    if(mult > 1) return { text: 'É eficaz!', cls: 'log-good' };
    if(mult < 1) return { text: 'Não é muito eficaz...', cls: 'log-warn' };
    return { text: '', cls: '' };
}

function calcDamage(attacker, defender, move, atkMod) {
    const atk = (attacker.atk || 10) * (atkMod || 1);
    const def = defender.def || 1;
    const power = move.power || 1;
    const base = power * 0.9 + atk * 0.55 - def * 0.35;
    const stab = (attacker.element || '').split('/').includes(move.element) ? 1.2 : 1;
    const eff = typeEffectiveness(move.element, defender.element);
    const variance = 0.85 + Math.random() * 0.15;
    return {
        damage: eff === 0 ? 0 : Math.max(1, Math.floor(base * stab * eff * variance)),
        eff: eff
    };
}

function startBattleScan(enemy, options) {
    const opts = options || {};
    if(!player.team || player.team.length === 0) {
        showToast('Sem Folkmons no time!', 'error');
        return;
    }
    const healthy = player.team.find(m => m.hp > 0);
    if(!healthy) {
        showToast('Seu time está sem PV! Use um item curativo.', 'error');
        return;
    }

    currentBattle = {
        enemy: enemy,
        playerMonster: healthy,
        isScan: opts.isScan !== false,
        kind: opts.kind || 'scan',
        busy: false,
        over: false,
        lossCounted: false,
        playerAtkMod: 1,
        enemyAtkMod: 1
    };

    markDexSeen(enemy.id);
    document.getElementById('battleScreen').style.display = 'flex';
    fitBattleScreen();
    document.getElementById('battlePlayerName').style.color = '';
    document.getElementById('battleLog').innerHTML = '';
    const modeLabel = document.getElementById('battleModeLabel');
    if(modeLabel) {
        if(currentBattle.kind === 'pvp') {
            modeLabel.style.display = 'block';
            modeLabel.textContent = 'Duelo PvP local · 1v1';
        } else {
            modeLabel.style.display = 'none';
        }
    }
    renderBattleSprites();
    updateBattleUI();
    addBattleLog((currentBattle.kind === 'pvp' ? 'Duelo PvP! ' : 'Um Folkmom selvagem apareceu: ') + enemy.name + ' Lv.' + enemy.level + '!');
    addChatMessage('Batalha', (currentBattle.kind === 'pvp' ? 'Duelo PvP contra ' : 'Batalha selvagem contra ') + enemy.name + ' Lv.' + enemy.level + '.', 'battle');
    battleMenu('main');
}

function renderBattleSprites() {
    if(!currentBattle) return;
    document.getElementById('enemySprite').innerHTML = monsterSpriteHTML(currentBattle.enemy, 'battle-img');
    document.getElementById('playerSprite').innerHTML = monsterSpriteHTML(currentBattle.playerMonster, 'battle-img');
}

function setHpBar(barId, textId, mon) {
    if(!mon.maxHp) mon.maxHp = mon.hp || 1;
    const pct = Math.max(0, Math.min(100, mon.hp / mon.maxHp * 100));
    const bar = document.getElementById(barId);
    bar.style.width = pct + '%';
    bar.style.background = pct > 50 ? '#4CAF50' : pct > 25 ? '#ffb300' : '#e53935';
    document.getElementById(textId).textContent = Math.max(0, mon.hp) + '/' + mon.maxHp;
}

function updateBattleUI() {
    if(!currentBattle) return;
    const pMon = currentBattle.playerMonster;
    const eMon = currentBattle.enemy;
    document.getElementById('battlePlayerName').textContent = pMon.name;
    document.getElementById('battlePlayerLevel').textContent = pMon.level;
    document.getElementById('enemyName').textContent = eMon.name;
    document.getElementById('enemyLevel').textContent = eMon.level;
    setHpBar('playerHpBar', 'playerHpText', pMon);
    setHpBar('enemyHpBar', 'enemyHpText', eMon);
    updatePartyBar();
}

function addBattleLog(text, cls) {
    const log = document.getElementById('battleLog');
    if(!log) return;
    const line = document.createElement('div');
    if(cls) line.className = cls;
    line.innerHTML = text;
    log.appendChild(line);
    while(log.children.length > 30) log.removeChild(log.firstChild);
    log.scrollTop = log.scrollHeight;
    const plain = String(text).replace(/<[^>]*>/g, '');
    addChatMessage('Batalha', plain, 'battle');
}

function shakeSprite(id) {
    const el = document.getElementById(id);
    if(!el) return;
    el.classList.remove('hit');
    void el.offsetWidth;
    el.classList.add('hit');
    setTimeout(() => el.classList.remove('hit'), 350);
}

function battleMenu(menu) {
    const box = document.getElementById('battleMainActions');
    if(!box || !currentBattle || currentBattle.over) return;
    const p = currentBattle.playerMonster;

    if(menu === 'main') {
        box.innerHTML =
            '<button class="battle-btn" onclick="battleAction(\'attack\')">⚔️ Atacar</button>' +
            '<button class="battle-btn" onclick="battleAction(\'switch\')">🔄 Trocar</button>' +
            '<button class="battle-btn" onclick="battleAction(\'item\')">🎒 Item</button>' +
            '<button class="battle-btn" onclick="battleAction(\'run\')">🏃 Fugir</button>' +
            '<div class="battle-hotkey-hint">Atalhos: 1–4 golpes · 5 itens · 6 trocar · 0 fugir</div>';
        return;
    }

    if(menu === 'moves') {
        const moves = getMoves(p);
        let html = '<div class="battle-menu-heading">Golpes de ' + p.name + '</div>';
        moves.forEach((m, i) => {
            const detail = m.type === 'damage' ? ('Poder ' + m.power) : (m.desc || 'Efeito');
            html += '<button class="battle-btn move-btn move-' + elementSlug(m.element) + '" onclick="useMove(' + i + ')">' +
                '<span>' + m.name + '</span><small>' + m.element + ' · ' + detail + '</small></button>';
        });
        html += '<button class="battle-btn battle-back" onclick="battleMenu(\'main\')">↩ Voltar</button>';
        box.innerHTML = html;
        return;
    }

    if(menu === 'items') {
        let html = '<div class="battle-menu-heading">Itens curativos</div>';
        let has = false;
        for(let id in player.items) {
            if(player.items[id] > 0 && ITEMS[id] && ITEMS[id].effect === 'heal') {
                has = true;
                const item = ITEMS[id];
                html += '<button class="battle-btn" onclick="useBattleItem(\'' + id + '\')">' +
                    item.sprite + ' ' + item.name + ' <small>x' + player.items[id] + '</small></button>';
            }
        }
        if(!has) html += '<div class="battle-menu-empty">Nenhum item curativo.</div>';
        html += '<button class="battle-btn battle-back" onclick="battleMenu(\'main\')">↩ Voltar</button>';
        box.innerHTML = html;
        return;
    }

    if(menu === 'switch') {
        let html = '<div class="battle-menu-heading">Trocar Folkmom</div>';
        player.team.forEach((mon, idx) => {
            const disabled = mon.hp <= 0 || mon === p;
            const label = mon.name + ' Lv.' + mon.level + ' · ' + Math.max(0, mon.hp) + '/' + mon.maxHp;
            html += '<button class="battle-btn" ' + (disabled ? 'disabled' : 'onclick="switchBattleMonster(' + idx + ')"') + '>' +
                label + (mon === p ? ' <small>(em campo)</small>' : '') + '</button>';
        });
        html += '<button class="battle-btn battle-back" onclick="battleMenu(\'main\')">↩ Voltar</button>';
        box.innerHTML = html;
    }
}

function battleAction(action) {
    if(!currentBattle || currentBattle.busy || currentBattle.over) return;
    if(action === 'attack') { battleMenu('moves'); return; }
    if(action === 'item') { battleMenu('items'); return; }
    if(action === 'switch') { battleMenu('switch'); return; }
    if(action === 'run') {
        currentBattle.busy = true;
        addBattleLog('Você fugiu da batalha!', 'log-warn');
        setTimeout(closeBattle, 700);
    }
}

function useMove(index) {
    if(!currentBattle || currentBattle.busy || currentBattle.over) return;
    const p = currentBattle.playerMonster;
    const move = getMoves(p)[index];
    if(!move) return;
    currentBattle.busy = true;
    addBattleLog(p.name + ' usou ' + move.name + '!');

    if(move.type === 'heal') {
        const amount = Math.floor(p.maxHp * (move.value || 0.25));
        const before = p.hp;
        p.hp = Math.min(p.maxHp, p.hp + amount);
        addBattleLog(p.name + ' recuperou ' + (p.hp - before) + ' PV!', 'log-good');
        updateBattleUI();
        setTimeout(enemyTurnScan, 900);
        return;
    }

    if(move.type === 'buff') {
        currentBattle.playerAtkMod = Math.min(2, currentBattle.playerAtkMod + (move.value || 0.25));
        addBattleLog(p.name + ' está mais forte! ATK +' + Math.round((move.value || 0.25) * 100) + '%', 'log-good');
        setTimeout(enemyTurnScan, 900);
        return;
    }

    if(move.type === 'debuff') {
        currentBattle.enemyAtkMod = Math.max(0.5, currentBattle.enemyAtkMod - (move.value || 0.2));
        addBattleLog(currentBattle.enemy.name + ' está mais fraco! ATK -' + Math.round((move.value || 0.2) * 100) + '%', 'log-good');
        setTimeout(enemyTurnScan, 900);
        return;
    }

    const result = calcDamage(p, currentBattle.enemy, move, currentBattle.playerAtkMod);
    currentBattle.enemy.hp -= result.damage;
    if(result.damage > 0) {
        addBattleLog('Causou ' + result.damage + ' de dano!', 'log-damage');
        shakeSprite('enemySprite');
    }
    const effText = effectivenessText(result.eff);
    if(effText.text) addBattleLog(effText.text, effText.cls);
    updateBattleUI();

    if(currentBattle.enemy.hp <= 0) {
        currentBattle.enemy.hp = 0;
        updateBattleUI();
        handleEnemyFaint();
        return;
    }
    setTimeout(enemyTurnScan, 900);
}

function enemyTurnScan() {
    if(!currentBattle || currentBattle.over) return;
    const e = currentBattle.enemy;
    const p = currentBattle.playerMonster;
    if(e.hp <= 0) { handleEnemyFaint(); return; }

    const damaging = getMoves(e).filter(m => m.type === 'damage');
    let move = damaging[Math.floor(Math.random() * damaging.length)] || MOVES.Trevas[0];
    if(damaging.length > 1 && Math.random() < 0.55) {
        move = damaging.slice().sort((a, b) => typeEffectiveness(b.element, p.element) - typeEffectiveness(a.element, p.element))[0];
    }

    addBattleLog(e.name + ' usou ' + move.name + '!');
    const result = calcDamage(e, p, move, currentBattle.enemyAtkMod);
    p.hp -= result.damage;
    if(result.damage > 0) {
        addBattleLog('Causou ' + result.damage + ' de dano!', 'log-damage');
        shakeSprite('playerSprite');
    }
    const effText = effectivenessText(result.eff);
    if(effText.text) addBattleLog(effText.text, effText.cls);
    updateBattleUI();

    if(p.hp <= 0) {
        p.hp = 0;
        updateBattleUI();
        handlePlayerFaint();
        return;
    }

    currentBattle.busy = false;
    battleMenu('main');
}

function handlePlayerFaint() {
    const p = currentBattle.playerMonster;
    addBattleLog(p.name + ' ficou sem PV!', 'log-bad');
    const idx = player.team.findIndex(m => m.hp > 0);

    if(idx >= 0) {
        setTimeout(() => {
            if(!currentBattle) return;
            currentBattle.playerMonster = player.team[idx];
            addBattleLog(player.team[idx].name + ' entrou em campo!', 'log-good');
            renderBattleSprites();
            updateBattleUI();
            currentBattle.busy = false;
            battleMenu('main');
        }, 1000);
        return;
    }

    currentBattle.over = true;
    currentBattle.busy = true;
    if(currentBattle.kind === 'pvp' && !currentBattle.lossCounted) {
        currentBattle.lossCounted = true;
        recordPvpLoss();
    }
    addBattleLog('Todos os seus Folkmons foram derrotados...', 'log-bad');
    document.getElementById('battleMainActions').innerHTML =
        '<div class="battle-menu-heading">Você perdeu a batalha</div>' +
        '<button class="battle-btn battle-back" onclick="finishBattleLoss()">Voltar ao mapa</button>';
}

function finishBattleLoss() {
    player.team.forEach(m => { m.hp = m.maxHp; });
    addChatMessage('Batalha', 'Seu time foi curado no centro de descanso.', 'battle');
    closeBattle();
    showToast('Seu time foi curado. Tente novamente!', 'info');
}

function handleEnemyFaint() {
    if(!currentBattle) return;
    currentBattle.over = true;
    currentBattle.busy = true;
    const e = currentBattle.enemy;
    const p = currentBattle.playerMonster;
    const pvp = currentBattle.kind === 'pvp';

    addBattleLog(e.name + ' foi derrotado!', 'log-good');
    player.stats.battlesWon = (player.stats.battlesWon || 0) + 1;
    if(pvp) recordPvpWin();
    else player.stats.bp = (player.stats.bp || 0) + 5;
    const money = 20 + e.level * 8;
    player.money = (player.money || 0) + money;
    updateHUD();
    gainBattleExp(p, e);
    updatePartyBar(true);
    saveGame();

    let html = '<div class="battle-menu-heading">Vitória! +' + money + ' moedas' +
        (pvp ? ' · +12 BP' : ' · +5 BP') + '</div>';
    if(currentBattle.isScan) {
        if(player.team.length < 6) {
            html += '<button class="battle-btn battle-capture" onclick="finishBattleCapture(true)">📥 Adicionar ' + e.name + ' ao time</button>';
        } else {
            html += '<div class="battle-menu-empty">Time cheio (6/6). Deixe este Folkmom ir.</div>';
        }
        html += '<button class="battle-btn battle-back" onclick="finishBattleCapture(false)">Deixar ir</button>';
    } else {
        html += '<button class="battle-btn battle-back" onclick="closeBattle()">Continuar</button>';
    }
    document.getElementById('battleMainActions').innerHTML = html;
}

function gainBattleExp(mon, enemy) {
    const gain = 25 + enemy.level * 10;
    if(typeof mon.exp !== 'number') mon.exp = 0;
    if(!mon.expToNext) mon.expToNext = mon.level * 120;
    mon.exp += gain;
    addBattleLog(mon.name + ' ganhou ' + gain + ' de EXP!', 'log-good');

    while(mon.exp >= mon.expToNext) {
        mon.exp -= mon.expToNext;
        mon.level++;
        mon.expToNext = mon.level * 120;
        mon.maxHp += 4;
        mon.hp = mon.maxHp;
        mon.atk += 2;
        mon.def += 1;
        addBattleLog(mon.name + ' subiu para o nível ' + mon.level + '!', 'log-good');
    }
    checkLevelEvolution(mon);
    updateBattleUI();
}

function finishBattleCapture(add) {
    if(!currentBattle) return;
    const e = currentBattle.enemy;
    if(add) {
        if(player.team.length >= 6) {
            showToast('Time cheio! Máximo 6 Folkmons.', 'error');
            return;
        }
        e.hp = e.maxHp;
        e.exp = 0;
        e.expToNext = e.level * 120;
        player.team.push(e);
        player.stats.captures = (player.stats.captures || 0) + 1;
        markDexCaught(e.id);
        addChatMessage('Equipe', e.name + ' foi adicionado ao time!', 'system');
        showToast(e.name + ' entrou no time!', 'success');
        refreshFollower();
        updatePartyBar(true);
    }
    closeBattle();
}

function useBattleItem(itemId) {
    if(!currentBattle || currentBattle.busy || currentBattle.over) return;
    const item = ITEMS[itemId];
    if(!item || !player.items[itemId] || player.items[itemId] <= 0) return;
    currentBattle.busy = true;
    const p = currentBattle.playerMonster;
    const amount = item.value >= 999 ? p.maxHp : item.value;
    const before = p.hp;
    p.hp = Math.min(p.maxHp, p.hp + amount);
    player.items[itemId]--;
    addBattleLog(p.name + ' usou ' + item.name + ' e recuperou ' + (p.hp - before) + ' PV!', 'log-good');
    updateBattleUI();
    saveGame();
    setTimeout(enemyTurnScan, 900);
}

function switchBattleMonster(index) {
    if(!currentBattle || currentBattle.busy || currentBattle.over) return;
    const mon = player.team[index];
    if(!mon || mon.hp <= 0 || mon === currentBattle.playerMonster) return;
    currentBattle.busy = true;
    currentBattle.playerMonster = mon;
    addBattleLog('Você chamou ' + mon.name + '!', 'log-good');
    renderBattleSprites();
    updateBattleUI();
    setTimeout(enemyTurnScan, 800);
}

function closeBattle() {
    document.getElementById('battleScreen').style.display = 'none';
    document.getElementById('battleLog').innerHTML = '';
    document.getElementById('battleMainActions').innerHTML = '';
    document.getElementById('battlePlayerName').style.color = '';
    const modeLabel = document.getElementById('battleModeLabel');
    if(modeLabel) modeLabel.style.display = 'none';
    currentBattle = null;
    saveGame();
    updateHUD();
    updatePartyBar(true);
    refreshFollower();
    renderHotbar();
}

setInterval(() => { if(currentUser && document.getElementById('gameScreen').style.display !== 'none') saveGame(); }, 30000);
window.addEventListener('resize', () => { fitGameClient(); fitBattleScreen(); });
window.addEventListener('orientationchange', () => { fitGameClient(); fitBattleScreen(); });
document.addEventListener('fullscreenchange', () => setTimeout(fitGameClient, 60));

// Ajusta a tela de autenticação e tenta reaproveitar a sessão da nuvem.
applyCloudUI();
if(CLOUD_ENABLED) {
    tryCloudAutoLogin();
}
