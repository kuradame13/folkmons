// Folkmons - Jogo base folclore brasileiro
let currentUser = null;

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
        stats: { scans: 0, captures: 0, battlesWon: 0, evolves: 0 },
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
    if(!player.pos) player.pos = { x: 400, y: 300 };
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

    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'flex';
    document.getElementById('playerName').textContent = displayName || 'Treinador';
    initGame();
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

function setupControls() {
    if(controlsReady) return;
    controlsReady = true;
    document.addEventListener('keydown', (e) => {
        keys[e.key] = true;
        if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
    });
    document.addEventListener('keyup', (e) => { keys[e.key] = false; });
    window.addEventListener('blur', () => { keys = {}; });
}

// Inicializar jogo
function initGame() {
    canvas = document.getElementById('gameMap');
    ctx = canvas.getContext('2d');

    ensurePlayerPosition();
    loadTrainerSheet();
    setupControls();

    if(!player.starterChosen) {
        chooseStarter();
        return;
    }

    generateMap();
    updateHUD();
    gameLoop();
}

function chooseStarter() {
    document.getElementById('menuOverlay').style.display = 'flex';
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
    closeMenu();
    ensurePlayerPosition();
    loadTrainerSheet();
    setupControls();
    generateMap();
    updateHUD();
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
    drawPlayer();
    updateHUD();
    checkItemPickup();
    requestAnimationFrame(gameLoop);
}

function updatePlayer() {
    const speed = 3;
    let dx = 0, dy = 0;
    if(keys['ArrowUp'] || keys['w'] || keys['W']) dy -= 1;
    if(keys['ArrowDown'] || keys['s'] || keys['S']) dy += 1;
    if(keys['ArrowLeft'] || keys['a'] || keys['A']) dx -= 1;
    if(keys['ArrowRight'] || keys['d'] || keys['D']) dx += 1;

    player.moving = !!(dx || dy);
    if(dx && dy) { dx *= 0.7071; dy *= 0.7071; }

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

function updateHUD() {
    document.getElementById('playerLevel').textContent = player.level || 1;
    document.getElementById('playerMoney').textContent = player.money || 0;
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
            alert('Você encontrou: ' + EVO_ITEMS[randomEvo].name + '!\n' + EVO_ITEMS[randomEvo].desc);
            saveGame();
        }
    }
}

// Menu
function openMenu(menu) {
    document.getElementById('menuOverlay').style.display = 'flex';
    const title = document.getElementById('menuTitle');
    const content = document.getElementById('menuContent');
    
    if(menu === 'team') {
        title.textContent = 'Meu Time Folkmons';
        content.innerHTML = '';
        if(player.team.length === 0) content.innerHTML = '<p>Nenhum Folkmom no time</p>';
        else {
            player.team.forEach((mon, idx) => {
                content.innerHTML += '<div class="team-slot">' +
                    '<div class="monster-sprite">' + monsterSpriteHTML(mon, 'team-img') + '</div>' +
                    '<div class="monster-info">' +
                    '<strong>' + mon.name + '</strong> Lv.' + mon.level + ' | ' + mon.element + ' | ' + mon.folklore + '<br>' +
                    'HP: ' + mon.hp + '/' + mon.maxHp + ' | ATK: ' + mon.atk + ' | DEF: ' + mon.def + '<br>' +
                    '<div class="hp-bar"><div class="hp-fill" style="width:' + (mon.hp/mon.maxHp*100) + '%"></div></div>' +
                    '</div>' +
                    '</div>';
            });
        }
    } else if(menu === 'items') {
        title.textContent = 'Inventário';
        content.innerHTML = '<h4>Itens Curativos</h4><div class="item-grid">';
        for(let itemId in player.items) {
            if(player.items[itemId] > 0) {
                const item = ITEMS[itemId];
                content.innerHTML += '<div class="item-card"><div style="font-size:30px">' + item.sprite + '</div><strong>' + item.name + '</strong><br>x' + player.items[itemId] + '<br><small>' + item.desc + '</small></div>';
            }
        }
        content.innerHTML += '</div><h4 style="margin-top:15px;">Itens de Evolução</h4><div class="item-grid">';
        for(let itemId in player.evoItems) {
            if(player.evoItems[itemId] > 0) {
                const item = EVO_ITEMS[itemId];
                content.innerHTML += '<div class="item-card"><div style="font-size:30px">' + item.sprite + '</div><strong>' + item.name + '</strong><br>x' + player.evoItems[itemId] + '<br><small>' + item.desc + '</small></div>';
            }
        }
        content.innerHTML += '</div>';
    } else if(menu === 'trades') {
        title.textContent = 'Trocas para Evolução';
        content.innerHTML = '<p>10 Folkmons evoluem por troca. Troque o par correto!</p>' +
            '<div class="team-slot"><div class="monster-sprite">🐓</div><div class="monster-info"><strong>Galo-Fantasma (FM011)</strong> + <strong>Cão-Cinza (FM012)</strong> → <strong>Galo das Almas + Cão das Encruzilhadas</strong></div></div>' +
            '<div class="team-slot"><div class="monster-sprite">🦡</div><div class="monster-info"><strong>Tatu-Assombrado (FM013)</strong> + <strong>João-de-Barro (FM014)</strong> → Evoluções por troca</div></div>' +
            '<div class="team-slot"><div class="monster-sprite">🐸</div><div class="monster-info"><strong>Sapo-Prateado (FM015)</strong> + <strong>Rã-Vermelha (FM016)</strong> → Evoluções por troca</div></div>' +
            '<div class="team-slot"><div class="monster-sprite">🐬</div><div class="monster-info"><strong>Boto-Cinza (FM017)</strong> + <strong>Peixe-Boi (FM018)</strong> → Evoluções por troca</div></div>' +
            '<div class="team-slot"><div class="monster-sprite">🐵</div><div class="monster-info"><strong>Macaco-Prego (FM019)</strong> + <strong>Sagui-Fantasma (FM020)</strong> → Evoluções por troca</div></div>' +
            '<button onclick="doTradeMenu()" style="width:100%; padding:12px; margin-top:10px; background:#667eea; color:white; border:none; border-radius:8px;">Realizar Troca (se tiver par)</button>' +
            '<p id="tradeMsg" class="msg"></p>';
    } else if(menu === 'phone') {
        title.textContent = '📱 Celular - Sistema de Scan';
        content.innerHTML = '<h3>Scan para Capturar Folkmons</h3>' +
            '<p>Use o celular para escanear a área. Quanto maior o % de Scan, maior a chance!</p>' +
            '<div style="text-align:center; padding:30px; background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius:15px; margin:15px 0; color:white;">' +
            '<div style="font-size:80px">📱</div>' +
            '<div style="margin-top:10px; font-size:24px;"><strong id="scanPercent">0%</strong></div>' +
            '<div style="margin-top:5px;">Status: <span id="scanStatus">Pronto</span></div>' +
            '</div>' +
            '<button onclick="startScan()" style="width:100%; padding:12px; background:#4CAF50; color:white; border:none; border-radius:8px; margin-bottom:8px;">Iniciar Scan</button>' +
            '<button onclick="fixScan()" style="width:100%; padding:12px; background:#FF9800; color:white; border:none; border-radius:8px;">Consertar Scan (se >=100%)</button>' +
            '<p id="phoneMsg" class="msg"></p>';
    }
}

function closeMenu() {
    document.getElementById('menuOverlay').style.display = 'none';
}

let currentScanPercent = 0;
let scanInterval = null;

function startScan() {
    if(scanInterval) return;
    const msg = document.getElementById('phoneMsg');
    const percentEl = document.getElementById('scanPercent');
    const statusEl = document.getElementById('scanStatus');
    currentScanPercent = 0;
    msg.textContent = '';
    statusEl.textContent = 'Escaneando...';
    
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
    
    if(currentScanPercent < 100) {
        msg.style.color = 'red';
        msg.textContent = 'Scan insuficiente! Necessário >= 100%';
        statusEl.textContent = 'Falhou';
        return;
    }
    
    msg.style.color = 'blue';
    msg.textContent = 'Consertando sistema de Scan...';
    statusEl.textContent = 'Consertando...';
    
    setTimeout(() => {
        const success = Math.random() < 0.8 + (currentScanPercent / 500);
        if(success) {
            msg.style.color = 'green';
            msg.textContent = 'Scan consertado com sucesso!';
            statusEl.textContent = 'Gerando Folkmom...';
            setTimeout(() => {
                generateScannedFolkmom();
            }, 1500);
        } else {
            msg.style.color = 'orange';
            msg.textContent = 'Falha ao consertar. Tente novamente com scan maior!';
            statusEl.textContent = 'Erro';
            currentScanPercent = Math.floor(currentScanPercent * 0.5);
            document.getElementById('scanPercent').textContent = currentScanPercent + '%';
        }
    }, 2000);
}

function generateScannedFolkmom() {
    // Gerar aleatório dos 50 principais
    const randIdx = Math.floor(Math.random() * FOLKMONS.main.length);
    const baseFolkmom = FOLKMONS.main[randIdx];
    const wildLevel = Math.floor((player.level || 5) + Math.random() * 4 - 1);
    const wild = createFolkmom(baseFolkmom.id, Math.max(3, wildLevel));
    
    document.getElementById('phoneMsg').innerHTML = '<strong style="color:green;">Folkmom escaneado!</strong><br>' +
        monsterSpriteHTML(wild, 'scan-img') + ' ' + wild.name + ' | ' + wild.element + ' | Lv.' + wild.level + '<br>' +
        '<em>' + wild.folklore + '</em>';
    
    player.stats.scans++;
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
        msg.style.color = 'red';
        msg.textContent = 'Você precisa ter o par correto de Folkmons para trocar!';
        return;
    }
    
    // Realizar troca
    let mon1 = player.team.find(m => m.id === foundPair[0]);
    let mon2 = player.team.find(m => m.id === foundPair[1]);
    
    player.team = player.team.filter(m => m.id !== foundPair[0] && m.id !== foundPair[1]);
    
    // Evoluir ambos
    let base1 = getFolkmomById(foundPair[0]);
    if(base1.evoType === 'trade' && base1.evoTo.length > 0) {
        player.team.push(createFolkmom(base1.evoTo[0], mon1.level));
    }
    let base2 = getFolkmomById(foundPair[1]);
    if(base2.evoType === 'trade' && base2.evoTo.length > 0) {
        player.team.push(createFolkmom(base2.evoTo[0], mon2.level));
    }
    
    msg.style.color = 'green';
    msg.textContent = 'Troca realizada! Ambos evoluíram por troca!';
    player.stats.evolves += 2;
    saveGame();
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

function startBattleScan(enemy) {
    if(player.team.length === 0) { alert('Sem Folkmons no time!'); return; }
    const healthy = player.team.find(m => m.hp > 0);
    if(!healthy) { alert('Seu time está sem PV! Use um item curativo.'); return; }

    currentBattle = {
        enemy: enemy,
        playerMonster: healthy,
        isScan: true,
        busy: false,
        over: false,
        playerAtkMod: 1,
        enemyAtkMod: 1
    };

    document.getElementById('battleScreen').style.display = 'flex';
    document.getElementById('battlePlayerName').style.color = '';
    document.getElementById('battleLog').innerHTML = '';
    renderBattleSprites();
    updateBattleUI();
    addBattleLog('Um Folkmom selvagem apareceu: ' + enemy.name + ' Lv.' + enemy.level + '!');
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
}

function addBattleLog(text, cls) {
    const log = document.getElementById('battleLog');
    const line = document.createElement('div');
    if(cls) line.className = cls;
    line.innerHTML = text;
    log.appendChild(line);
    while(log.children.length > 30) log.removeChild(log.firstChild);
    log.scrollTop = log.scrollHeight;
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
            '<button class="battle-btn" onclick="battleAction(\'run\')">🏃 Fugir</button>';
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
    addBattleLog('Todos os seus Folkmons foram derrotados...', 'log-bad');
    document.getElementById('battleMainActions').innerHTML =
        '<div class="battle-menu-heading">Você perdeu a batalha</div>' +
        '<button class="battle-btn battle-back" onclick="finishBattleLoss()">Voltar ao mapa</button>';
}

function finishBattleLoss() {
    player.team.forEach(m => { m.hp = m.maxHp; });
    closeBattle();
    alert('Seu time foi curado no centro de descanso. Tente novamente!');
}

function handleEnemyFaint() {
    if(!currentBattle) return;
    currentBattle.over = true;
    currentBattle.busy = true;
    const e = currentBattle.enemy;
    const p = currentBattle.playerMonster;

    addBattleLog(e.name + ' foi derrotado!', 'log-good');
    player.stats.battlesWon = (player.stats.battlesWon || 0) + 1;
    const money = 20 + e.level * 8;
    player.money = (player.money || 0) + money;
    updateHUD();
    gainBattleExp(p, e);
    saveGame();

    let html = '<div class="battle-menu-heading">Vitória! +' + money + ' moedas</div>';
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
    updateBattleUI();
}

function finishBattleCapture(add) {
    if(!currentBattle) return;
    const e = currentBattle.enemy;
    if(add) {
        if(player.team.length >= 6) { alert('Time cheio! Máximo 6 Folkmons'); return; }
        e.hp = e.maxHp;
        e.exp = 0;
        e.expToNext = e.level * 120;
        player.team.push(e);
        player.stats.captures = (player.stats.captures || 0) + 1;
        alert(e.name + ' foi adicionado ao time!');
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
    currentBattle = null;
    saveGame();
    updateHUD();
}

setInterval(() => { if(currentUser && document.getElementById('gameScreen').style.display !== 'none') saveGame(); }, 30000);

// Ajusta a tela de autenticação e tenta reaproveitar a sessão da nuvem.
applyCloudUI();
if(CLOUD_ENABLED) {
    tryCloudAutoLogin();
}
