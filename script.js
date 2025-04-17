// Start game when button is clicked
let gameRunning = false;
let dropMaker;

document.getElementById('start-btn').addEventListener('click', startGame);

function startGame() {
    if (gameRunning) return;
    
    gameRunning = true;
    document.getElementById('start-btn').disabled = true;
    
    // Create new drop every second
    dropMaker = setInterval(createDrop, 1000);
}

function createDrop() {
    const drop = document.createElement('div');
    
    // 20% chance to make a bad drop
    if (Math.random() < 0.2) {
        drop.className = 'water-drop bad-drop';
    } else {
        drop.className = 'water-drop';
    }
    
    // Make drop a random size
    const size = Math.random() + 0.5;  // Random size between 0.5 and 1.5
    drop.style.transform = `scale(${size})`;
    
    // Put drop at random position
    const gameWidth = document.getElementById('game-container').offsetWidth;
    const xPosition = Math.random() * (gameWidth - 40);
    drop.style.left = xPosition + 'px';
    
    // Set how fast drop falls
    drop.style.animationDuration = '4s';
    
    // Remove drop when clicked
    drop.addEventListener('click', () => {
        drop.remove();
    });
    
    // Add drop to game
    document.getElementById('game-container').appendChild(drop);
    
    // Remove drop when it hits bottom
    drop.addEventListener('animationend', () => {
        drop.remove();
    });
}
