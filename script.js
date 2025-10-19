// Variables to control game state
let gameRunning = false; // Keeps track of whether game is active 
let dropMaker; // Will store our timer that creates drops regularly
let score = 0; 
const scoreEl = document.getElementById("score");
let timeLeft = 30; 
let timerInterval; // Interval for countdown
const timeEl = document.getElementById("time");
// Track whether we've shown the halfway banner this round
let halfwayShown = false;

// Wait for button click to start the game
document.getElementById("start-btn").addEventListener("click", startGame);
// stop-btn acts as Restart: reset game state and begin anew
document.getElementById("stop-btn").addEventListener("click", restartGame);

function restartGame() {
  // Stop ongoing game silently (don't show modal)
  if (dropMaker) { clearInterval(dropMaker); dropMaker = null; }
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  if (bucketMoveInterval) { clearInterval(bucketMoveInterval); bucketMoveInterval = null; }
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);

  // Remove existing drops
  const container = document.getElementById('game-container');
  if (container) {
    const drops = container.querySelectorAll('.water-drop');
    drops.forEach(d => d.remove());
  }

  // GAME RESE
  gameRunning = false;
  score = 0;
  if (scoreEl) scoreEl.textContent = score;
  // Reset halfway banner flag when restarting
  halfwayShown = false;
  removeHalfwayBanner();
  timeLeft = 30;
  if (timeEl) timeEl.textContent = timeLeft;

  // Hide modal/confetti if visible
  hideEndModal();
  stopConfetti();
  // Stop background music when the user presses Restart
  try {
    bgMusic.pause();
    bgMusic.currentTime = 0;
  } catch (err) {
    // ignore
  }
  // Also reset the bucket (jerry can) to the horizontal center of the game container
  try {
    const containerEl = document.getElementById('game-container');
    const bucketEl = document.getElementById('bucket');
    if (containerEl && bucketEl) {
      const left = Math.max(0, (containerEl.offsetWidth - bucketEl.offsetWidth) / 2);
      bucketEl.style.left = left + 'px';
    }
  } catch (err) {
    // ignore DOM issues
  }
  // Clear difficulty selection so player must pick again
  try {
    const ds = document.getElementById('difficulty-select');
    if (ds) {
      ds.selectedIndex = 0; // placeholder
      ds.classList.remove('difficulty-blink');
    }
    currentDifficulty = '';
    ensureDifficultySelected();
  } catch (err) {
    // ignore
  }
  // Do NOT auto-start: wait for player to click Start Game
  // Keep gameRunning=false so startGame() may be called by the player
}
// Keyboard movement for bucket
let moveLeft = false;
let moveRight = false;
let bucketMoveInterval;

function handleKeyDown(e) {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') moveLeft = true;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') moveRight = true;
}

function handleKeyUp(e) {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') moveLeft = false;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') moveRight = false;
}

function createDrop() {
  // ...existing code...
  const drop = document.createElement("div");
  drop.className = "water-drop";
  // apply configured animation duration:
  drop.style.animationDuration = difficulties[currentDifficulty].animationDuration;
  // ...existing code...
}

const difficulties = {
  easy:   { dropInterval: 900, badChance: 0.2, animationDuration: "9s" },
  normal: { dropInterval: 500, badChance: 0.3, animationDuration: "10s" },
  hard:   { dropInterval: 400, badChance: 0.4, animationDuration: "11s" }
};
let currentDifficulty = '';

// Round-robin images for bad drops (keep filenames matched to /img/)
const badImages = [
  'img/brown-leaf.png',
  'img/banana-png.webp',
  'img/trash-bag-png.png'
];
let badImageIndex = 0;

// Preload sound for good-drop catches
const waterDropSound = new Audio('Sound effects/droplet.mp3');
waterDropSound.preload = 'auto';

// Background music (looping) played while the game is running
const bgMusic = new Audio('Sound effects/bg-music.mp3');
bgMusic.preload = 'auto';
bgMusic.loop = true;
bgMusic.volume = 0.45; // reasonable default volume

// Short start sound played when the game starts or when Play Again is pressed
const gameStartSound = new Audio('Sound effects/start.mp3');
gameStartSound.preload = 'auto';
gameStartSound.loop = false;
gameStartSound.volume = 0.85;

const startBtn = document.getElementById('start-btn');
// Start disabled initially until player picks a difficulty
if (startBtn) startBtn.disabled = true;

// Prevent starting if no difficulty selected
function ensureDifficultySelected() {
  if (!currentDifficulty) {
    // provide a gentle UX hint and block start
    if (startBtn) {
      startBtn.disabled = true;
      startBtn.title = 'Choose a difficulty to enable Start';
    }
    return false;
  }
  if (startBtn) {
    startBtn.disabled = false;
    startBtn.title = '';
  }
  return true;
}

const diffSelect = document.getElementById('difficulty-select');
if (diffSelect) {
  // At load the placeholder option will be selected; wait for a real choice
  ensureDifficultySelected();
  diffSelect.addEventListener('change', (e) => {
    // Only accept non-empty selections
    if (e.target.value) {
      currentDifficulty = e.target.value;
    }
    ensureDifficultySelected();
    // If a game is running, apply new drop rate immediately
    if (gameRunning && dropMaker) {
      clearInterval(dropMaker);
      dropMaker = setInterval(createDrop, difficulties[currentDifficulty].dropInterval);
    }
  });
}



function startGame() {
  // Prevent multiple games from running at once
  if (gameRunning) return;
  if (!ensureDifficultySelected()) {
    // trigger a visible blinking red outline on the difficulty select for 2s
    try {
      if (diffSelect) {
        diffSelect.classList.remove('difficulty-blink');
        // force reflow to restart animation
        // eslint-disable-next-line no-unused-expressions
        void diffSelect.offsetWidth;
        diffSelect.classList.add('difficulty-blink');
        setTimeout(() => { if (diffSelect) diffSelect.classList.remove('difficulty-blink'); }, 2000);
      }
    } catch (err) {
      // ignore
    }
    return;
  }
  // Play a short start sound (best-effort)
  try {
    gameStartSound.currentTime = 0;
    const p = gameStartSound.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  } catch (err) {
    // ignore playback errors
  }
  gameRunning = true;

  // Reset score when a new game starts
  score = 0;
  if (scoreEl) scoreEl.textContent = score;
  // reset halfway state when starting a new game
  halfwayShown = false;
  removeHalfwayBanner();

  // Reset and start the countdown timer
  timeLeft = 30;
  if (timeEl) timeEl.textContent = timeLeft;
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!gameRunning) return;
    timeLeft -= 1;
    if (timeEl) timeEl.textContent = timeLeft;
    if (timeLeft <= 0) {
      // time's up, end the game
      clearInterval(timerInterval);
      timerInterval = null;
      stopGame();
    }
  }, 1000);

  if (dropMaker) { clearInterval(dropMaker); dropMaker = null; }
  dropMaker = setInterval(createDrop, difficulties[currentDifficulty].dropInterval);

  // Center bucket in the container
  const container = document.getElementById('game-container');
  const bucket = document.getElementById('bucket');
  if (container && bucket) {
    const cRect = container.getBoundingClientRect();
    // position bucket so it's centered horizontally
    const left = Math.max(0, (cRect.width - bucket.offsetWidth) / 2);
    bucket.style.left = left + 'px';
  }

  // Start bucket movement loop
  if (!bucketMoveInterval) {
    bucketMoveInterval = setInterval(() => {
      const bucket = document.getElementById('bucket');
      const container = document.getElementById('game-container');
      if (!bucket || !container) return;
      const step = 8; // pixels per tick
      let left = parseFloat(bucket.style.left) || 0;
      if (moveLeft) left -= step;
      if (moveRight) left += step;
      // Constrain
      left = Math.max(0, Math.min(left, container.offsetWidth - bucket.offsetWidth));
      bucket.style.left = left + 'px';
    }, 16); // ~60fps
  }

  // Add keyboard listeners
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  // ensure modal is hidden when starting a new game
  hideEndModal();

  // Start background music (best-effort): modern browsers require user gesture
  try {
    // Use cloneNode so we don't interrupt a previous Audio instance used elsewhere
    // but keep a single instance for bg music so we can pause/reset it reliably.
    bgMusic.currentTime = 0;
    const playPromise = bgMusic.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch((err) => {
        // autoplay exceptions are expected in some contexts; ignore silently
        // console.debug('bgMusic.play() prevented:', err);
      });
    }
  } catch (err) {
    // swallow any errors related to playback
  }
}

function createDrop() {
  // Create a new div element that will be our water drop
  const drop = document.createElement("div");
  drop.className = "water-drop";

  // Make drops different sizes for visual variety
  const initialSize = 60;
  const sizeMultiplier = Math.random() * 0.2 + 0.5;
  const size = initialSize * sizeMultiplier;
  drop.style.width = drop.style.height = `${size}px`;

  // Randomly make some drops "bad" (red) which penalize the player if caught
  const isBad = Math.random() < difficulties[currentDifficulty].badChance;
  if (isBad) {
    drop.classList.add('bad-drop');
    drop.dataset.bad = '1';
    // assign the next bad image in round-robin order
    const img = badImages[badImageIndex % badImages.length];
    drop.style.backgroundImage = `url('${img}')`;
    drop.style.backgroundSize = 'contain';
    drop.style.backgroundRepeat = 'no-repeat';
    drop.style.backgroundPosition = 'center';
    badImageIndex += 1;
  }

  // Position the drop randomly across the game width
  // Subtract 60 pixels to keep drops fully inside the container
  const gameWidth = document.getElementById("game-container").offsetWidth;
  const xPosition = Math.random() * (gameWidth - 60);
  drop.style.left = xPosition + "px";

  // Make drops fall for 4 seconds
  drop.style.animationDuration = difficulties[currentDifficulty].animationDuration;

  // Add the new drop to the game screen
  document.getElementById("game-container").appendChild(drop);

  // Each frame, check if the drop intersects the bucket; if so, award point and remove
  const container = document.getElementById('game-container');
  const bucket = document.getElementById('bucket');

  // Use a short interval to check collision during the drop's fall
  const collisionChecker = setInterval(() => {
    if (!gameRunning) return;
    if (!document.body.contains(drop)) {
      clearInterval(collisionChecker);
      return;
    }

    const dropRect = drop.getBoundingClientRect();
    const bucketRect = bucket.getBoundingClientRect();

    // Simple AABB collision
    const intersects = !(dropRect.right < bucketRect.left ||
                         dropRect.left > bucketRect.right ||
                         dropRect.bottom < bucketRect.top ||
                         dropRect.top > bucketRect.bottom);

    if (intersects) {
      // points
      const wasBad = drop.classList.contains('bad-drop');
      if (wasBad) {
        score = Math.max(0, score - 1);
        // briefly shake the bucket for feedback
        const bucketEl = document.getElementById('bucket');
        if (bucketEl) {
          bucketEl.classList.remove('shake');
          // force reflow to restart animation if already present
          // eslint-disable-next-line no-unused-expressions
          void bucketEl.offsetWidth;
          bucketEl.classList.add('shake');
          // remove the class after the animation completes
          setTimeout(() => bucketEl.classList.remove('shake'), 500);
        }
      } else {
        score += 1;
        // play water drop sound for good catches (allow overlap)
        try {
          const s = waterDropSound.cloneNode();
          s.play().catch(() => {});
        } catch (err) {
          waterDropSound.currentTime = 0;
          waterDropSound.play().catch(() => {});
        }
      }
      if (scoreEl) scoreEl.textContent = score;
      // If player reaches 10 points and we haven't shown the halfway message yet, show it
      if (score === 10 && !halfwayShown) {
        halfwayShown = true;
        showHalfwayBanner();
      }
      drop.remove();
      clearInterval(collisionChecker);
    }
  }, 50);

  // Remove drops that reach the bottom (weren't clicked)
  drop.addEventListener("animationend", () => {
    drop.remove(); // Clean up drops that weren't caught
  });
}

function stopGame() {
  if (!gameRunning) return;

  gameRunning = false;

  // Stop creating new drops
  if (dropMaker) {
    clearInterval(dropMaker);
    dropMaker = null;
  }

  // Clear countdown timer
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  // Remove any existing drops from the screen
  const container = document.getElementById("game-container");
  const drops = container.querySelectorAll('.water-drop');
  drops.forEach(d => d.remove());

  // Stop bucket movement loop and keyboard handlers
  if (bucketMoveInterval) {
    clearInterval(bucketMoveInterval);
    bucketMoveInterval = null;
  }
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);

  // Stop background music and reset to start so it will play from the beginning next game
  try {
    bgMusic.pause();
    bgMusic.currentTime = 0;
  } catch (err) {
    // ignore
  }
}

// Inline end messages (shown in the score panel)
const winMessages = [
  'Amazing! You caught them all!',
  'Champion catcher — great job!',
  'Perfect game — you win!'
];

const loseMessages = [
  'Nice try — give it another go!',
  'So close! Practice and try again!',
  'Keep going — you can beat 20 points!'
];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Show end modal when game stops
const originalStopGame = stopGame;
stopGame = function() {
  originalStopGame();
  // show centered modal and confetti if winning
  showEndModal();
};

function showEndModal() {
  const modal = document.getElementById('end-modal');
  const msg = document.getElementById('end-modal-message');
  const title = document.getElementById('end-modal-title');
  if (!modal || !msg) return;
  if (score > 20) {
    title.textContent = 'Congratulations!';
    msg.textContent = randomFrom(winMessages);
  } else {
    title.textContent = 'Time Up';
    msg.textContent = randomFrom(loseMessages);
  }
  // Make sure modal is visible even if an inline style was previously applied
  modal.style.display = 'flex';
  modal.classList.remove('hidden');
  // Trigger confetti after the modal is visible so we can position bursts beside it
  if (score > 20) runConfetti();
}

function hideEndModal() {
  const modal = document.getElementById('end-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
  stopConfetti();
}

// Show a transient "Halfway there" banner at the top of the game container
function showHalfwayBanner() {
  const container = document.getElementById('game-container');
  if (!container) return;
  // If already present, don't add another
  if (container.querySelector('.halfway-banner')) return;
  const el = document.createElement('div');
  el.className = 'halfway-banner';
  el.textContent = 'Halfway there — keep going!';
  container.appendChild(el);
  // Auto-hide after 2.8s
  setTimeout(() => {
    el.style.transition = 'opacity 200ms ease, transform 200ms ease';
    el.style.opacity = '0';
    el.style.transform = 'translateX(-50%) translateY(-6px)';
    setTimeout(() => { el.remove(); }, 300);
  }, 2800);
}

function removeHalfwayBanner() {
  const container = document.getElementById('game-container');
  if (!container) return;
  const existing = container.querySelectorAll('.halfway-banner');
  existing.forEach(e => e.remove());
}

// Delegated click handler to reliably catch Play Again clicks
document.addEventListener('click', (e) => {
  const target = e.target;
  if (target && target.id === 'modal-play-again') {
    e.stopPropagation();
    e.preventDefault();
    hideEndModal();
    // Do NOT auto-start. Force the player to re-select difficulty before starting again.
    try {
      currentDifficulty = '';
      const ds = document.getElementById('difficulty-select');
      if (ds) ds.selectedIndex = 0; // choose the placeholder
      ensureDifficultySelected();
      if (ds) ds.focus();
    } catch (err) {
      // ignore
    }
  }
});

// Direct fallback handler in case delegated listener misses the click
const directPlayBtn = document.getElementById('modal-play-again');
if (directPlayBtn) {
  directPlayBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    hideEndModal();
    // Force difficulty re-selection instead of auto-starting
    try {
      currentDifficulty = '';
      if (diffSelect) diffSelect.selectedIndex = 0;
      ensureDifficultySelected();
      if (diffSelect) diffSelect.focus();
    } catch (err) {
      // ignore
    }
  });
}

// Confetti (small, short burst)
let confettiTimer;
let confettiStopTimeout;
function runConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  canvas.classList.remove('hidden');
  const ctx = canvas.getContext('2d');
  const DPR = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * DPR;
  canvas.height = window.innerHeight * DPR;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  ctx.scale(DPR, DPR);
  // Two small radial bursts: left and right of the modal
    // Single radial burst from center of the viewport
    const pieces = [];
    const colors = ['#ff0a54','#ff477e','#ffd166','#06d6a0','#4cc9f0','#9b5de5'];
    const COUNT = 56; // total pieces for the central burst
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    for (let i = 0; i < COUNT; i++) {
      const angle = Math.random() * Math.PI * 2; // full circle
      const speed = 0.8 + Math.random() * 2.2; // gentle speeds
      pieces.push({
        x: centerX + (Math.random() - 0.5) * 10,
        y: centerY + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 2 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.3
      });
    }

    const gravity = 0.06;
    const drag = 0.995;

  function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of pieces) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.r, p.r * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      p.x += p.vx;
      p.y += p.vy;
      p.vx *= drag;
      p.vy *= drag;
      p.vy += gravity;
      p.rot += p.rotSpeed;
    }
    confettiTimer = requestAnimationFrame(frame);
  }
  frame();

  // stop after ~1.2 seconds for a quick double-burst
  if (confettiStopTimeout) clearTimeout(confettiStopTimeout);
  confettiStopTimeout = setTimeout(() => stopConfetti(), 1200);
}

function stopConfetti() {
  if (confettiTimer) { cancelAnimationFrame(confettiTimer); confettiTimer = null; }
  if (confettiStopTimeout) { clearTimeout(confettiStopTimeout); confettiStopTimeout = null; }
  const canvas = document.getElementById('confetti-canvas');
  if (canvas) canvas.classList.add('hidden');
}
