// Variables to control game state
let gameRunning = false; // Keeps track of whether game is active or not
let dropMaker; // Will store our timer that creates drops regularly
let score = 0; // Player score
const scoreEl = document.getElementById("score");
let timeLeft = 30; // seconds for the game
let timerInterval; // Interval for countdown
const timeEl = document.getElementById("time");

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

  // Reset game state
  gameRunning = false;
  score = 0;
  if (scoreEl) scoreEl.textContent = score;
  timeLeft = 30;
  if (timeEl) timeEl.textContent = timeLeft;

  // Hide modal/confetti if visible
  hideEndModal();
  stopConfetti();
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

function startGame() {
  // Prevent multiple games from running at once
  if (gameRunning) return;
  gameRunning = true;

  // Reset score when a new game starts
  score = 0;
  if (scoreEl) scoreEl.textContent = score;

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

  // Create new drops every second (1000 milliseconds)
  dropMaker = setInterval(createDrop, 1000);

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
}

function createDrop() {
  // Create a new div element that will be our water drop
  const drop = document.createElement("div");
  drop.className = "water-drop";

  // Make drops different sizes for visual variety
  const initialSize = 60;
  const sizeMultiplier = Math.random() * 0.8 + 0.5;
  const size = initialSize * sizeMultiplier;
  drop.style.width = drop.style.height = `${size}px`;

  // Randomly make some drops "bad" (red) which penalize the player if caught
  const isBad = Math.random() < 0.18; // ~18% chance
  if (isBad) {
    drop.classList.add('bad-drop');
    drop.dataset.bad = '1';
  }

  // Position the drop randomly across the game width
  // Subtract 60 pixels to keep drops fully inside the container
  const gameWidth = document.getElementById("game-container").offsetWidth;
  const xPosition = Math.random() * (gameWidth - 60);
  drop.style.left = xPosition + "px";

  // Make drops fall for 4 seconds
  drop.style.animationDuration = "4s";

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
      // If it's a bad drop, penalize; otherwise award a point
      if (drop.classList.contains('bad-drop')) {
        score = Math.max(0, score - 1);
      } else {
        score += 1;
      }
      if (scoreEl) scoreEl.textContent = score;
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

// Delegated click handler to reliably catch Play Again clicks
document.addEventListener('click', (e) => {
  const target = e.target;
  if (target && target.id === 'modal-play-again') {
    e.stopPropagation();
    e.preventDefault();
    hideEndModal();
    // give browsers a tiny moment to hide modal before starting
    setTimeout(startGame, 50);
  }
});

// Direct fallback handler in case delegated listener misses the click
const directPlayBtn = document.getElementById('modal-play-again');
if (directPlayBtn) {
  directPlayBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    hideEndModal();
    setTimeout(startGame, 50);
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
