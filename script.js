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
document.getElementById("stop-btn").addEventListener("click", stopGame);
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
      // award point and remove drop
      score += 1;
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

  // Show end screen with appropriate message based on score
  showEndScreen();
}

// End screen messages
const winMessages = [
  "Amazing! You're a water-catching pro!",
  "You rocked it — the drops couldn't escape!",
  "Perfect aim! You saved the day!",
  "Unstoppable! Those drops never stood a chance!"
];

const loseMessages = [
  "Close one! Try again and beat your score!",
  "Almost there — practice makes perfect!",
  "Don't give up! You can get 20 next time!",
  "Nice effort! Give it another go!"
];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function showEndScreen() {
  const endScreen = document.getElementById('end-screen');
  const endMsg = document.getElementById('end-message');
  const endTitle = document.getElementById('end-title');
  if (!endScreen || !endMsg) return;

  if (score >= 20) {
    endTitle.textContent = 'You Win!';
    endMsg.textContent = randomFrom(winMessages);
  } else {
    endTitle.textContent = 'Time Up';
    endMsg.textContent = randomFrom(loseMessages);
  }

  endScreen.classList.remove('hidden');
}

function hideEndScreen() {
  const endScreen = document.getElementById('end-screen');
  if (endScreen) endScreen.classList.add('hidden');
}

// Wire up end-screen buttons
document.addEventListener('DOMContentLoaded', () => {
  const playAgain = document.getElementById('play-again-btn');
  const closeBtn = document.getElementById('close-end-btn');
  if (playAgain) playAgain.addEventListener('click', () => {
    hideEndScreen();
    startGame();
  });
  if (closeBtn) closeBtn.addEventListener('click', hideEndScreen);
});
