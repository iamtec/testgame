const dino = document.getElementById('dino');
const cactus = document.getElementById('cactus');
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('game-over');

let isJumping = false;
let isGameOver = false;
let score = 0;

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playJumpSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'square';
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Jump sound: Quick upward arpeggio
    const now = audioContext.currentTime;
    oscillator.frequency.setValueAtTime(220, now); // A3
    oscillator.frequency.setValueAtTime(440, now + 0.08); // A4
    oscillator.frequency.setValueAtTime(880, now + 0.16); // A5
    
    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    oscillator.start(now);
    oscillator.stop(now + 0.2);
}

function playDeathSound() {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'square';
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Death sound: Descending pattern
    const now = audioContext.currentTime;
    oscillator.frequency.setValueAtTime(880, now); // A5
    oscillator.frequency.setValueAtTime(587.33, now + 0.1); // D5
    oscillator.frequency.setValueAtTime(440, now + 0.2); // A4
    oscillator.frequency.setValueAtTime(220, now + 0.3); // A3
    
    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    
    oscillator.start(now);
    oscillator.stop(now + 0.4);
}

function jump() {
    if (!isJumping && !isGameOver) {
        isJumping = true;
        dino.classList.add('jump');
        playJumpSound();

        setTimeout(() => {
            dino.classList.remove('jump');
            isJumping = false;
        }, 800);
    }
}

function moveCactus() {
    let position = 600;
    
    const move = setInterval(() => {
        if (position <= -20) {
            position = 600;
            score += 1;
            scoreElement.textContent = `Score: ${score}`;
        }

        if (isGameOver) {
            clearInterval(move);
            return;
        }

        position -= 8;
        cactus.style.right = `${600 - position}px`;

        // Get the actual transformed position of the dino and cactus
        const dinoRect = dino.getBoundingClientRect();
        const cactusRect = cactus.getBoundingClientRect();

        // Create smaller collision boxes
        const dinoCollisionBox = {
            left: dinoRect.left + 15,  // Shrink collision box from left
            right: dinoRect.right - 15, // Shrink collision box from right
            top: dinoRect.top + 10,     // Shrink collision box from top
            bottom: dinoRect.bottom - 5  // Shrink collision box from bottom
        };

        const cactusCollisionBox = {
            left: cactusRect.left + 5,   // Shrink collision box from left
            right: cactusRect.right - 5,  // Shrink collision box from right
            top: cactusRect.top + 5,      // Shrink collision box from top
            bottom: cactusRect.bottom     // Keep bottom the same for ground collision
        };

        // Check for collision using smaller collision boxes
        if (
            cactusCollisionBox.left < dinoCollisionBox.right &&
            cactusCollisionBox.right > dinoCollisionBox.left &&
            cactusCollisionBox.top < dinoCollisionBox.bottom &&
            cactusCollisionBox.bottom > dinoCollisionBox.top
        ) {
            gameOver();
        }
    }, 50);
}

function gameOver() {
    isGameOver = true;
    gameOverElement.classList.remove('hidden');
    playDeathSound();
}

function resetGame() {
    if (isGameOver) {
        isGameOver = false;
        score = 0;
        scoreElement.textContent = 'Score: 0';
        gameOverElement.classList.add('hidden');
        cactus.style.right = '0px';
        moveCactus();
    }
}

// Event listeners
document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        jump();
    }
});

document.addEventListener('mousedown', () => {
    if (isGameOver) {
        resetGame();
    } else {
        jump();
    }
});

// Start the game
moveCactus(); 