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

// Sistema de autenticação
function showTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    if(tab === 'login') document.getElementById('loginTab').classList.add('active');
    else if(tab === 'register') document.getElementById('registerTab').classList.add('active');
    else if(tab === 'changePass') document.getElementById('changePassTab').classList.add('active');
}

function getUsers() {
    return JSON.parse(localStorage.getItem('folkmonsUsers') || '{}');
}

function saveUsers(users) {
    localStorage.setItem('folkmonsUsers', JSON.stringify(users));
}

function register() {
    const username = document.getElementById('regUsername').value.trim();
    const pass = document.getElementById('regPassword').value;
    const pass2 = document.getElementById('regPassword2').value;
    const msg = document.getElementById('regMsg');
    
    if(username.length < 3) { msg.style.color = 'red'; msg.textContent = 'Usuário deve ter pelo menos 3 caracteres'; return; }
    if(pass.length < 4) { msg.style.color = 'red'; msg.textContent = 'Senha deve ter pelo menos 4 caracteres'; return; }
    if(pass !== pass2) { msg.style.color = 'red'; msg.textContent = 'Senhas não coincidem'; return; }
    
    const users = getUsers();
    if(users[username]) { msg.style.color = 'red'; msg.textContent = 'Usuário já existe'; return; }
    
    users[username] = {
        password: pass,
        data: {
            level: 1,
            money: 500,
            team: [],
            items: { cura_simples: 5 },
            evoItems: {},
            missions: [],
            stats: { scans: 0, captures: 0, battlesWon: 0, evolves: 0 },
            pos: {x: 400, y: 300},
            starterChosen: false
        }
    };
    
    saveUsers(users);
    msg.style.color = 'green';
    msg.textContent = 'Conta criada com sucesso!';
    document.getElementById('regUsername').value = '';
    document.getElementById('regPassword').value = '';
    document.getElementById('regPassword2').value = '';
}

function login() {
    const username = document.getElementById('loginUsername').value.trim();
    const pass = document.getElementById('loginPassword').value;
    const msg = document.getElementById('loginMsg');
    
    const users = getUsers();
    if(!users[username]) { msg.style.color = 'red'; msg.textContent = 'Usuário não encontrado'; return; }
    if(users[username].password !== pass) { msg.style.color = 'red'; msg.textContent = 'Senha incorreta'; return; }
    
    currentUser = username;
    player = JSON.parse(JSON.stringify(users[username].data));
    
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'flex';
    document.getElementById('playerName').textContent = username;
    
    initGame();
}

function changePassword() {
    const username = document.getElementById('cpUsername').value.trim();
    const oldPass = document.getElementById('cpOldPass').value;
    const newPass = document.getElementById('cpNewPass').value;
    const newPass2 = document.getElementById('cpNewPass2').value;
    const msg = document.getElementById('cpMsg');
    
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

function logout() {
    saveGame();
    currentUser = null;
    document.getElementById('gameScreen').style.display = 'none';
    document.getElementById('authScreen').style.display = 'flex';
}

function saveGame() {
    if(!currentUser) return;
    const users = getUsers();
    users[currentUser].data = JSON.parse(JSON.stringify(player));
    saveUsers(users);
}

let player = {};
let canvas, ctx;
let keys = {};
let gameMap = [];
let currentBattle = null;

// Inicializar jogo
function initGame() {
    canvas = document.getElementById('gameMap');
    ctx = canvas.getContext('2d');
    
    if(!player.starterChosen) {
        chooseStarter();
        return;
    }
    
    generateMap();
    updateHUD();
    
    document.addEventListener('keydown', (e) => { keys[e.key] = true; });
    document.addEventListener('keyup', (e) => { keys[e.key] = false; });
    
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
    generateMap();
    updateHUD();
    
    document.addEventListener('keydown', (e) => { keys[e.key] = true; });
    document.addEventListener('keyup', (e) => { keys[e.key] = false; });
    
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
    let newX = player.x;
    let newY = player.y;
    if(keys['ArrowUp']) newY -= speed;
    if(keys['ArrowDown']) newY += speed;
    if(keys['ArrowLeft']) newX -= speed;
    if(keys['ArrowRight']) newX += speed;
    if(newX >= 0 && newX < 800 && newY >= 0 && newY < 600) {
        player.x = newX; player.y = newY;
    }
}

function drawMap() {
    ctx.fillStyle = '#7CFC00';
    ctx.fillRect(0, 0, 800, 600);
    for(let y = 0; y < 15; y++) {
        for(let x = 0; x < 20; x++) {
            let tileX = x * 40;
            let tileY = y * 40;
            if(gameMap[y][x] === 2) {
                ctx.fillStyle = '#228B22';
                ctx.fillRect(tileX, tileY, 40, 40);
                ctx.fillText('🌳', tileX + 10, tileY + 28);
            } else if(gameMap[y][x] === 4) {
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(tileX + 20, tileY + 20, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillText('🔮', tileX + 12, tileY + 28);
            }
        }
    }
}

function drawPlayer() {
    ctx.font = '32px Arial';
    ctx.fillText('🧍', player.x - 16, player.y + 12);
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

// Batalha simplificada
function startBattleScan(enemy) {
    if(player.team.length === 0) { alert('Sem Folkmons no time!'); return; }
    currentBattle = { enemy: enemy, playerMonster: player.team[0], isScan: true };
    document.getElementById('battleScreen').style.display = 'flex';
    document.getElementById('enemyName').textContent = enemy.name;
    document.getElementById('enemyLevel').textContent = enemy.level;
    document.getElementById('enemySprite').innerHTML = monsterSpriteHTML(enemy, 'battle-img');
    document.getElementById('battlePlayerName').textContent = currentBattle.playerMonster.name;
    document.getElementById('battlePlayerLevel').textContent = currentBattle.playerMonster.level;
    document.getElementById('playerSprite').innerHTML = monsterSpriteHTML(currentBattle.playerMonster, 'battle-img');
    document.getElementById('battleLog').innerHTML = '';
    addBattleLog('Folkmom escaneado apareceu! Lv.' + enemy.level);
    updateBattleUI();
}

function updateBattleUI() {
    const pMon = currentBattle.playerMonster;
    const eMon = currentBattle.enemy;
    document.getElementById('playerHpBar').style.width = (pMon.hp / pMon.maxHp * 100) + '%';
    document.getElementById('playerHpText').textContent = pMon.hp + '/' + pMon.maxHp;
    document.getElementById('enemyHpBar').style.width = (eMon.hp / eMon.maxHp * 100) + '%';
    document.getElementById('enemyHpText').textContent = eMon.hp + '/' + eMon.maxHp;
}

function addBattleLog(text) {
    const log = document.getElementById('battleLog');
    log.innerHTML += '<div>' + text + '</div>';
    log.scrollTop = log.scrollHeight;
}

function battleAction(action) {
    if(!currentBattle) return;
    if(action === 'attack') {
        const damage = Math.floor(currentBattle.playerMonster.atk * (0.9 + Math.random() * 0.3));
        currentBattle.enemy.hp -= damage;
        addBattleLog(currentBattle.playerMonster.name + ' causou ' + damage + ' dano!');
        updateBattleUI();
        if(currentBattle.enemy.hp <= 0) {
            addBattleLog('Folkmom enfraquecido!');
            setTimeout(() => {
                if(confirm('Deseja tentar adicionar ao time?')) {
                    if(player.team.length >= 6) {
                        alert('Time cheio! Máximo 6 Folkmons');
                        document.getElementById('battleScreen').style.display = 'none';
                        currentBattle = null;
                    } else {
                        player.team.push(currentBattle.enemy);
                        player.stats.captures++;
                        alert(currentBattle.enemy.name + ' foi adicionado ao time!');
                        document.getElementById('battleScreen').style.display = 'none';
                        currentBattle = null;
                    }
                } else {
                    document.getElementById('battleScreen').style.display = 'none';
                    currentBattle = null;
                }
                document.getElementById('battleLog').innerHTML = '';
            }, 1000);
            return;
        }
        setTimeout(enemyTurnScan, 800);
    } else if(action === 'item') {
        if(player.items.cura_simples > 0) {
            currentBattle.playerMonster.hp = Math.min(currentBattle.playerMonster.maxHp, currentBattle.playerMonster.hp + 30);
            player.items.cura_simples--;
            addBattleLog(currentBattle.playerMonster.name + ' recuperou 30 PV!');
            updateBattleUI();
            setTimeout(enemyTurnScan, 800);
        } else {
            addBattleLog('Sem itens curativos!');
        }
    } else if(action === 'run') {
        addBattleLog('Fugiu da batalha!');
        setTimeout(() => {
            document.getElementById('battleScreen').style.display = 'none';
            currentBattle = null;
            document.getElementById('battleLog').innerHTML = '';
        }, 800);
    }
}

function enemyTurnScan() {
    const damage = Math.floor(currentBattle.enemy.atk * (0.8 + Math.random() * 0.4));
    currentBattle.playerMonster.hp -= damage;
    addBattleLog(currentBattle.enemy.name + ' causou ' + damage + ' dano!');
    updateBattleUI();
    if(currentBattle.playerMonster.hp <= 0) {
        addBattleLog(currentBattle.playerMonster.name + ' ficou fraco!');
        document.getElementById('battlePlayerName').style.color = 'red';
    }
}

setInterval(() => { if(currentUser && document.getElementById('gameScreen').style.display !== 'none') saveGame(); }, 30000);
