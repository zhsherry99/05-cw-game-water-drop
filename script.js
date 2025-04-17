// Variables to control game state
let gameRunning = false;  // Keeps track of whether game is active or not
let dropMaker;           // Will store our timer that creates drops regularly

// Wait for button click to start the game
document.getElementById('start-btn').addEventListener('click', startGame);

function startGame() {
    // Prevent multiple games from running at once
    if (gameRunning) return;
    
    gameRunning = true;
    
    // Create new drops every second (1000 milliseconds)
    dropMaker = setInterval(createDrop, 1000);
}

function createDrop() {
    // Create a new div element that will be our water drop
    const drop = document.createElement('div');
    
    // 20% chance to make a bad drop (pollutant)
    // Math.random() gives number between 0-1, so < 0.2 is 20% chance
    if (Math.random() < 0.2) {
        drop.className = 'water-drop bad-drop';
    } else {
        drop.className = 'water-drop';
    }
    
    // Make drops different sizes for visual variety
    // Will be between 0.5 (half size) and 1.5 (150% size)
    const size = Math.random() + 0.5;
    drop.style.transform = `scale(${size})`;
    
    // Position the drop randomly across the game width
    // Subtract 40 pixels to keep drops fully inside the container
    const gameWidth = document.getElementById('game-container').offsetWidth;
    const xPosition = Math.random() * (gameWidth - 40);
    drop.style.left = xPosition + 'px';
    
    // Make drops fall for 4 seconds
    drop.style.animationDuration = '4s';
    
    // When player clicks a drop, make it disappear
    drop.addEventListener('click', () => {
        drop.remove();  // Removes the drop from the game
    });
    
    // Add the new drop to the game screen
    document.getElementById('game-container').appendChild(drop);
    
    // Remove drops that reach the bottom (weren't clicked)
    drop.addEventListener('animationend', () => {
        drop.remove();  // Clean up drops that weren't caught
    });
}
