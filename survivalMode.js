// survivalMode.js
// ============================
// CHAOS KEYBOARD BATTLE - SURVIVAL MODE
// ============================

let canvas, ctx;
let paused = false;
let gameOverState = false;
let startTime = 0;
let enemySpawnInterval, powerUpSpawnInterval;
const enemySpawnRate = 2000;
const powerUpSpawnRate = 10000;
let animationFrameId;

// Audio elements (from index.html)
let bgMusic, shootSound, hitSound, shieldBreakSound;

// Player name
let playerName = 'Player 1';

// Entity arrays
const enemies = [];
const enemyBullets = [];
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

// Input state
const keys = {};

// Attach keyboard listeners
function attachEventListeners() {
  document.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key.toLowerCase() === 'p') togglePause();
  });
  document.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
  });
}

// Spawn a new enemy that will chase & shoot
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

// Spawn a random power‑up
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

// Player shoots a bullet
function shootBullet() {
  if (shootSound) {
    shootSound.currentTime = 0;
    shootSound.play();
  }
  player.bullets.push({
    x: player.x + player.width / 2 - 5,
    y: player.y,
    width: 10,
    height: 10,
    speed: 6,
  });
}

// Player dash mechanic
function dash() {
  if (player.dashCooldown <= 0) {
    player.speed = player.baseSpeed * 3;
    player.dashCooldown = 2000;
    setTimeout(() => player.speed = player.baseSpeed, 300);
  }
}

// AABB collision check
function isColliding(a, b) {
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}

// Determine current wave based on time
function getWave() {
  return Math.floor((Date.now() - startTime) / 30000) + 1;
}

// Main update loop
function update() {
  if (paused) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const wave = getWave();

  // --- Player movement ---
  if (keys['a'] && player.x > 0)               player.x -= player.speed;
  if (keys['d'] && player.x + player.width < canvas.width)  player.x += player.speed;
  if (keys['w'] && player.y > 0)               player.y -= player.speed;
  if (keys['s'] && player.y + player.height < canvas.height) player.y += player.speed;

  // --- Shooting ---
  if (keys[' '] && Date.now() - player.lastShot > 300) {
    shootBullet();
    player.lastShot = Date.now();
  }

  // --- Shield & Dash ---
  player.shieldActive = !!keys['q'];
  if (keys['e']) dash();
  if (player.dashCooldown > 0) player.dashCooldown -= 16;

  // Update player bullets
  player.bullets.forEach((b, i) => {
    b.y -= b.speed;
    if (b.y < 0) player.bullets.splice(i, 1);
  });

  // --- Enemies: chase & shoot ---
  enemies.forEach((enemy, ei) => {
    // Move toward player
    const dx = (player.x + player.width/2) - (enemy.x + enemy.width/2);
    const dy = (player.y + player.height/2) - (enemy.y + enemy.height/2);
    const dist = Math.hypot(dx, dy) || 1;
    enemy.x += (dx/dist) * enemy.speed;
    enemy.y += (dy/dist) * enemy.speed;

    // Remove off-screen
    if (enemy.y > canvas.height) return enemies.splice(ei, 1);

    // Enemy shooting
    if (Date.now() - enemy.lastShot > 2000) {
      enemy.lastShot = Date.now();
      const sx = enemy.x + enemy.width/2;
      const sy = enemy.y + enemy.height/2;
      const angle = Math.atan2(
        (player.y + player.height/2) - sy,
        (player.x + player.width/2) - sx
      );
      enemyBullets.push({
        x: sx, y: sy, width: 10, height: 10,
        vx: Math.cos(angle)*4,
        vy: Math.sin(angle)*4
      });
    }

    // Collision with player
    if (isColliding(player, enemy)) {
      if (!player.shieldActive) {
        player.health -= 10;
        if (hitSound) { hitSound.currentTime = 0; hitSound.play(); }
      } else if (shieldBreakSound) {
        shieldBreakSound.currentTime = 0;
        shieldBreakSound.play();
      }
      return enemies.splice(ei, 1);
    }

    // Player bullets vs enemy
    player.bullets.forEach((b, bi) => {
      if (isColliding(b, enemy)) {
        enemy.health -= 20;
        player.bullets.splice(bi, 1);
        if (enemy.health <= 0) {
          player.score += 10;
          if (hitSound) { hitSound.currentTime = 0; hitSound.play(); }
          enemies.splice(ei, 1);
        }
      }
    });
  });

  // --- Enemy bullets update ---
  enemyBullets.forEach((b, i) => {
    b.x += b.vx;
    b.y += b.vy;
    if (b.y > canvas.height || b.x < 0 || b.x > canvas.width)
      return enemyBullets.splice(i, 1);
    if (isColliding(b, player)) {
      if (!player.shieldActive) {
        player.health -= 10;
        if (hitSound) { hitSound.currentTime = 0; hitSound.play(); }
      } else if (shieldBreakSound) {
        shieldBreakSound.currentTime = 0;
        shieldBreakSound.play();
      }
      enemyBullets.splice(i, 1);
    }
  });

  // --- Power‑ups ---
  powerUps.forEach((pu, i) => {
    if (Date.now() - pu.spawnTime > 5000) return powerUps.splice(i,1);
    if (isColliding(player, pu)) {
      switch (pu.type) {
        case 'health': player.health = Math.min(100, player.health + 20); break;
        case 'shield': player.shieldActive = true;                 break;
        case 'speed':  player.speed += 2;                         break;
        case 'bullet':
          player.bullets.forEach(bl => {
            if (bl.vx !== undefined) {
              bl.vx *= 1.5; bl.vy *= 1.5;
            }
          });
          break;
      }
      powerUps.splice(i,1);
    }
  });

  // --- Draw everything ---
  ctx.fillStyle = 'blue';
  ctx.fillRect(player.x, player.y, player.width, player.height);
  if (player.shieldActive) {
    ctx.strokeStyle = 'cyan';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(
      player.x + player.width/2,
      player.y + player.height/2,
      player.width, 0, Math.PI*2
    );
    ctx.stroke();
  }
  ctx.fillStyle = 'red';
  player.bullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));
  ctx.fillStyle = 'green';
  enemies.forEach(e => ctx.fillRect(e.x, e.y, e.width, e.height));
  ctx.fillStyle = 'orange';
  enemyBullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));

  // --- UI Stats ---
  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.fillText(`Health: ${player.health}`, 10, 30);
  ctx.fillText(`Score: ${player.score}`, 10, 60);
  ctx.fillText(`Wave: ${wave}`, 10, 90);
  ctx.fillText(`Time: ${Math.floor((Date.now() - startTime)/1000)}s`, 10, 120);

  // Check end conditions
  if (player.health <= 0) return showLoseScreen();

  // Next frame
  animationFrameId = requestAnimationFrame(update);
}

// Show lose overlay
function showLoseScreen() {
  gameOverState = true;
  clearInterval(enemySpawnInterval);
  clearInterval(powerUpSpawnInterval);
  if (bgMusic) bgMusic.pause();
  const title = document.getElementById('gameOverTitle');
  if (title) title.innerText = `${playerName} 👎🏻!`;
  const overlay = document.getElementById('gameOverScreen');
  if (overlay) overlay.classList.remove('hidden');
}

// Show win overlay (call when wave condition met)
function showWinScreen() {
  gameOverState = true;
  clearInterval(enemySpawnInterval);
  clearInterval(powerUpSpawnInterval);
  if (bgMusic) bgMusic.pause();
  const title = document.getElementById('gameOverTitle');
  if (title) title.innerText = `${playerName} 🏆!`;
  const overlay = document.getElementById('gameOverScreen');
  if (overlay) overlay.classList.remove('hidden');
}

// Initialize and start Survival Mode
function survivalStartGame() {
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');

  // Grab player name and audio
  playerName = document.getElementById('p1Name').value.trim() || 'Player 1';
  bgMusic = document.getElementById('bgMusic');
  shootSound = document.getElementById('shootSound');
  hitSound = document.getElementById('hitSound');
  shieldBreakSound = document.getElementById('shieldBreakSound');

  // Start background music
  if (bgMusic) {
    bgMusic.currentTime = 0;
    bgMusic.loop = true;
    bgMusic.volume = 0.5;
    bgMusic.play();
  }

  // Volume slider control
  const volSlider = document.getElementById('volumeSlider');
  if (volSlider) {
    volSlider.value = bgMusic ? bgMusic.volume : 0.5;
    volSlider.addEventListener('input', e => {
      const v = parseFloat(e.target.value);
      [bgMusic, shootSound, hitSound, shieldBreakSound].forEach(s => {
        if (s) s.volume = v;
      });
    });
  }

  attachEventListeners();

  // Reset player state
  player.x = canvas.width/2 - 25;
  player.y = canvas.height - 100;
  player.health = 100;
  player.score = 0;
  player.bullets = [];
  player.shieldActive = false;
  player.speed = player.baseSpeed;
  player.lastShot = 0;
  player.dashCooldown = 0;

  // Clear arrays
  enemies.length = 0;
  enemyBullets.length = 0;
  powerUps.length = 0;
  gameOverState = false;
  paused = false;

  // Start timers
  startTime = Date.now();
  enemySpawnInterval = setInterval(spawnEnemy, enemySpawnRate);
  powerUpSpawnInterval = setInterval(spawnPowerUp, powerUpSpawnRate);

  // Kick off the loop
  animationFrameId = requestAnimationFrame(update);
}

// Toggle pause/resume
function togglePause() {
  paused = !paused;
  const ps = document.getElementById('pauseScreen');
  if (ps) ps.classList.toggle('hidden');
  if (bgMusic) paused ? bgMusic.pause() : bgMusic.play();
  if (paused) {
    clearInterval(enemySpawnInterval);
    clearInterval(powerUpSpawnInterval);
    cancelAnimationFrame(animationFrameId);
  } else if (!gameOverState) {
    enemySpawnInterval = setInterval(spawnEnemy, enemySpawnRate);
    powerUpSpawnInterval = setInterval(spawnPowerUp, powerUpSpawnRate);
    animationFrameId = requestAnimationFrame(update);
  }
}

// Restart helpers
function restartGame() { location.reload(); }
function playAgain() {
  clearInterval(enemySpawnInterval);
  clearInterval(powerUpSpawnInterval);
  const overlay = document.getElementById('gameOverScreen');
  if (overlay) overlay.classList.add('hidden');
  survivalStartGame();
}

// Expose to HTML buttons
window.survivalStartGame = survivalStartGame;
window.togglePause       = togglePause;
window.restartGame       = restartGame;
window.playAgain         = playAgain;
