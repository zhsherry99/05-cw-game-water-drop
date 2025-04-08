// Game state variables
let gameActive = false;  // Tracks if game is currently running
let gameInterval;        // Stores the interval that creates drops
let score = 0;          // Tracks player's score

// Event listener for the start button
document.getElementById('start-btn').addEventListener('click', startGame);

// Game initialization function
function startGame() {
    // Prevent multiple game instances
    if (gameActive) return;
    
    // Set up initial game state
    gameActive = true;
    score = 0;
    document.getElementById('start-btn').disabled = true;
    document.getElementById('score').textContent = score;
    
    // Start creating drops every 1000ms (1 second)
    gameInterval = setInterval(createDrop, 1000);
}

// Function to create and manage individual water drops
function createDrop() {
    const drop = document.createElement('div');
    
    // Randomly determine if this drop is good or bad (20% chance of bad)
    const isBadDrop = Math.random() < 0.2;
    drop.className = isBadDrop ? 'water-drop bad-drop' : 'water-drop';
    
    // Create random size variation for visual interest
    const scale = 0.8 + Math.random() * 0.7;  // Results in 80% to 150% of original size
    drop.style.transform = `scale(${scale})`;
    
    // Position drop randomly along the width of the game container
    const gameWidth = document.getElementById('game-container').offsetWidth;
    const randomX = Math.random() * (gameWidth - 40);
    drop.style.left = `${randomX}px`;
    
    // Set drop animation speed
    drop.style.animationDuration = '4s';
    
    // Handle scoring when drop is clicked
    drop.addEventListener('click', () => {
        if (isBadDrop) {
            // Subtract point for clicking bad drop, but don't go below zero
            if (score > 0) score--;
        } else {
            // Add point for clicking good drop
            score++;
        }
        document.getElementById('score').textContent = score.toString();
        drop.remove();  // Remove drop after it's clicked
    });
    
    // Add drop to game container
    document.getElementById('game-container').appendChild(drop);
    
    // Remove drop if it reaches bottom without being clicked
    drop.addEventListener('animationend', () => {
        drop.remove();
    });
}
