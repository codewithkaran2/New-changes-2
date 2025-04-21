// survivalMode.js
// ============================
// CHAOS KEYBOARD BATTLE - SURVIVAL MODE
// ============================

let canvas, ctx;
let paused = false;
let gameOverState = false;
let startTime = 0;
let enemySpawnInterval, powerUpSpawnInterval;
let enemySpawnRate = 2000;
let powerUpSpawnRate = 10000;
let animationFrameId;
let bgMusic;
let playerName = '';

const enemyBullets = [];
const enemies = [];
const powerUps = [];

// Player setup
const player = {
  x: 0,
  y: 0,
  width: 50,
  height: 50,
  speed: 5,
  baseSpeed: 5,
  health: 100,
  score: 0,
  bullets: [],
  shieldActive: false,
  dashCooldown: 0,
  lastShot: 0,
};

// Controls
const keys = {};

// Attach key listeners and pause toggle
function attachEventListeners() {
  document.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key.toLowerCase() === 'p') togglePause();
  });
  document.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
  });
}

function spawnEnemy() {
  enemies.push({
    x: Math.random() * (canvas.width - 50),
    y: -50,
    width: 50,
    height: 50,
    speed: Math.random() * 2 + 1 + getWave() * 0.2,
    health: 30 + getWave() * 5,
    lastShot: Date.now(),
  });
}

function spawnPowerUp() {
  const types = ["health", "shield", "speed", "bullet"];
  const type = types[Math.floor(Math.random() * types.length)];
  powerUps.push({
    x: Math.random() * (canvas.width - 30),
    y: Math.random() * (canvas.height - 30),
    width: 30,
    height: 30,
    type,
    spawnTime: Date.now(),
  });
}

function shootBullet() {
  player.bullets.push({
    x: player.x + player.width / 2 - 5,
    y: player.y,
    width: 10,
    height: 10,
    speed: 6,
  });
}

function dash() {
  if (player.dashCooldown <= 0) {
    player.speed = player.baseSpeed * 3;
    player.dashCooldown = 2000;
    setTimeout(() => player.speed = player.baseSpeed, 300);
  }
}

function isColliding(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function getWave() {
  return Math.floor((Date.now() - startTime) / 30000) + 1;
}

function update() {
  if (paused) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const wave = getWave();

  // Player Movement
  if (keys.a && player.x > 0) player.x -= player.speed;
  if (keys.d && player.x + player.width < canvas.width) player.x += player.speed;
  if (keys.w && player.y > 0) player.y -= player.speed;
  if (keys.s && player.y + player.height < canvas.height) player.y += player.speed;

  // Shooting
  if (keys[" "] && Date.now() - player.lastShot > 300) {
    shootBullet();
    player.lastShot = Date.now();
  }

  // Shield & Dash
  player.shieldActive = !!keys.q;
  if (keys.e) dash();
  if (player.dashCooldown > 0) player.dashCooldown -= 16;

  // Update player bullets
  player.bullets.forEach((b, i) => {
    b.y -= b.speed;
    if (b.y < 0) player.bullets.splice(i, 1);
  });

  // Enemies: chase & shoot
  enemies.forEach((enemy, ei) => {
    const dx = (player.x + player.width/2) - (enemy.x + enemy.width/2);
    const dy = (player.y + player.height/2) - (enemy.y + enemy.height/2);
    const dist = Math.hypot(dx, dy) || 1;
    enemy.x += dx/dist * enemy.speed;
    enemy.y += dy/dist * enemy.speed;

    if (enemy.y > canvas.height) return enemies.splice(ei, 1);

    if (Date.now() - enemy.lastShot > 2000) {
      enemy.lastShot = Date.now();
      const sx = enemy.x + enemy.width/2;
      const sy = enemy.y + enemy.height/2;
      const angle = Math.atan2((player.y+player.height/2) - sy, (player.x+player.width/2) - sx);
      enemyBullets.push({ x: sx, y: sy, width: 10, height: 10, vx: Math.cos(angle)*4, vy: Math.sin(angle)*4 });
    }

    if (isColliding(player, enemy)) {
      if (!player.shieldActive) player.health -= 10;
      return enemies.splice(ei, 1);
    }

    player.bullets.forEach((b, bi) => {
      if (isColliding(b, enemy)) {
        enemy.health -= 20;
        player.bullets.splice(bi, 1);
        if (enemy.health <= 0) { player.score += 10; enemies.splice(ei, 1); }
      }
    });
  });

  // Enemy bullets
  enemyBullets.forEach((b, i) => {
    b.x += b.vx; b.y += b.vy;
    if (b.y > canvas.height || b.x < 0 || b.x > canvas.width) return enemyBullets.splice(i, 1);
    if (isColliding(b, player)) { if (!player.shieldActive) player.health -= 10; enemyBullets.splice(i, 1); }
  });

  // Power-ups
  powerUps.forEach((pu, pi) => {
    if (Date.now() - pu.spawnTime > 5000) return powerUps.splice(pi,1);
    if (isColliding(player, pu)) {
      switch(pu.type) {
        case 'health': player.health = Math.min(100, player.health +20); break;
        case 'shield': player.shieldActive = true; break;
        case 'speed': player.speed += 2; break;
        case 'bullet': player.bullets.forEach(bl => { if(bl.vx && bl.vy){ bl.vx*=1.5; bl.vy*=1.5; }}); break;
      }
      powerUps.splice(pi,1);
    }
  });

  // Draw UI & Entities
  ctx.fillStyle='blue'; ctx.fillRect(player.x, player.y, player.width, player.height);
  if(player.shieldActive){ ctx.strokeStyle='cyan'; ctx.lineWidth=5; ctx.beginPath(); ctx.arc(player.x+player.width/2,player.y+player.height/2,player.width,0,Math.PI*2); ctx.stroke(); }
  ctx.fillStyle='red'; player.bullets.forEach(b=>ctx.fillRect(b.x,b.y,b.width,b.height));
  ctx.fillStyle='green'; enemies.forEach(e=>ctx.fillRect(e.x,e.y,e.width,e.height));
  ctx.fillStyle='orange'; enemyBullets.forEach(b=>ctx.fillRect(b.x,b.y,b.width,b.height));

  ctx.fillStyle='white'; ctx.font='20px Arial';
  ctx.fillText(`Health: ${player.health}`,10,30);
  ctx.fillText(`Score: ${player.score}`,10,60);
  ctx.fillText(`Wave: ${wave}`,10,90);
  ctx.fillText(`Time: ${Math.floor((Date.now()-startTime)/1000)}s`,10,120);

  if(player.health<=0) return showLoseScreen();

  animationFrameId = requestAnimationFrame(update);
}

// Show Lose Screen
function showLoseScreen(){
  gameOverState=true;
  clearInterval(enemySpawnInterval); clearInterval(powerUpSpawnInterval);
  if(bgMusic) bgMusic.pause();
  const gs = document.getElementById('gameOverScreen');
  const rt = document.getElementById('resultText');
  if(rt){ rt.innerText = `${playerName}👎🏻!`; rt.style.color='red'; }
  if(gs) gs.classList.remove('hidden');
}

// Show Win Screen (call when win condition met)
function showWinScreen(){
  gameOverState=true;
  clearInterval(enemySpawnInterval); clearInterval(powerUpSpawnInterval);
  if(bgMusic) bgMusic.pause();
  const gs = document.getElementById('gameOverScreen');
  const rt = document.getElementById('resultText');
  if(rt){ rt.innerText = `${playerName}🏆!`; rt.style.color='green'; }
  if(gs) gs.classList.remove('hidden');
}

function survivalStartGame(){
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');
  playerName = document.getElementById('player1NameInput').value || 'Player 1';
  bgMusic = document.getElementById('bgMusic');
  if(bgMusic){ bgMusic.currentTime=0; bgMusic.loop=true; bgMusic.play(); }
  attachEventListeners();
  player.x=canvas.width/2-25; player.y=canvas.height-100; player.health=100; player.score=0;
  player.bullets=[]; player.shieldActive=false; player.speed=player.baseSpeed; player.lastShot=0; player.dashCooldown=0;
  enemies.length=0; enemyBullets.length=0; powerUps.length=0; gameOverState=false; paused=false;
  startTime=Date.now();
  enemySpawnInterval=setInterval(spawnEnemy, enemySpawnRate);
  powerUpSpawnInterval=setInterval(spawnPowerUp, powerUpSpawnRate);
  animationFrameId=requestAnimationFrame(update);
}

function togglePause(){
  paused=!paused;
  const ps = document.getElementById('pauseScreen'); if(ps){ if(paused) ps.classList.remove('hidden'); else ps.classList.add('hidden'); }
  if(bgMusic){ if(paused) bgMusic.pause(); else bgMusic.play(); }
  if(paused){ clearInterval(enemySpawnInterval); clearInterval(powerUpSpawnInterval); cancelAnimationFrame(animationFrameId); }
  else if(!gameOverState){ enemySpawnInterval=setInterval(spawnEnemy, enemySpawnRate); powerUpSpawnInterval=setInterval(spawnPowerUp, powerUpSpawnRate); animationFrameId=requestAnimationFrame(update); }
}

function restartGame(){ location.reload(); }
function playAgain(){ clearInterval(enemySpawnInterval); clearInterval(powerUpSpawnInterval); const gs=document.getElementById('gameOverScreen'); if(gs) gs.classList.add('hidden'); survivalStartGame(); }

// Expose functions globally
window.survivalStartGame = survivalStartGame;
window.togglePause = togglePause;
window.restartGame = restartGame;
window.playAgain = playAgain;
