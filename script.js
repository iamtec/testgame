const dino = document.getElementById('dino');
const cactus = document.getElementById('cactus');
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('game-over');

let isJumping = false;
let isGameOver = false;
let score = 0;

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

let jumpPower = 0;
const MAX_JUMP_POWER = 180; // Maximum jump height
const MIN_JUMP_POWER = 120; // Minimum jump height
let isHoldingJump = false;

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
        isHoldingJump = true;
        jumpPower = MIN_JUMP_POWER;
        
        // Start charging jump if mouse is held
        const chargeInterval = setInterval(() => {
            if (isHoldingJump && jumpPower < MAX_JUMP_POWER) {
                jumpPower += 2;
            }
        }, 10);

        playJumpSound();
        dino.style.animation = 'none'; // Reset animation
        dino.offsetHeight; // Trigger reflow
        dino.style.animation = `jump 0.8s cubic-bezier(0.4, 0, 0.2, 1)`;
        dino.style.setProperty('--jump-height', `-${jumpPower}px`);

        setTimeout(() => {
            dino.classList.remove('jump');
            isJumping = false;
            clearInterval(chargeInterval);
        }, 800);
    }
}

// Create a class for cactus management
class CactusManager {
    constructor() {
        this.cacti = [];
        this.minDistance = 300; // Minimum distance between cacti
        this.spawnChance = 0.02; // 2% chance to spawn per frame
    }

    createCactus() {
        const cactus = document.createElement('div');
        cactus.className = 'cactus';
        document.getElementById('game').appendChild(cactus);
        return {
            element: cactus,
            position: 600
        };
    }

    canSpawnCactus() {
        if (this.cacti.length === 0) return true;
        return this.cacti[this.cacti.length - 1].position < 600 - this.minDistance;
    }

    update() {
        // Spawn new cactus
        if (this.canSpawnCactus() && Math.random() < this.spawnChance) {
            this.cacti.push(this.createCactus());
        }

        // Update existing cacti
        for (let i = this.cacti.length - 1; i >= 0; i--) {
            const cactus = this.cacti[i];
            cactus.position -= 8;
            cactus.element.style.right = `${600 - cactus.position}px`;

            // Remove if off screen
            if (cactus.position <= -50) {
                cactus.element.remove();
                this.cacti.splice(i, 1);
                score += 1;
                scoreElement.textContent = `Score: ${score}`;
            }

            // Collision detection
            const dinoRect = dino.getBoundingClientRect();
            const cactusRect = cactus.element.getBoundingClientRect();

            const dinoCollisionBox = {
                left: dinoRect.left + 15,
                right: dinoRect.right - 15,
                top: dinoRect.top + 10,
                bottom: dinoRect.bottom - 5
            };

            const cactusCollisionBox = {
                left: cactusRect.left + 5,
                right: cactusRect.right - 5,
                top: cactusRect.top + 5,
                bottom: cactusRect.bottom
            };

            if (
                cactusCollisionBox.left < dinoCollisionBox.right &&
                cactusCollisionBox.right > dinoCollisionBox.left &&
                cactusCollisionBox.top < dinoCollisionBox.bottom &&
                cactusCollisionBox.bottom > dinoCollisionBox.top
            ) {
                gameOver();
            }
        }
    }

    reset() {
        this.cacti.forEach(cactus => cactus.element.remove());
        this.cacti = [];
    }
}

const cactusManager = new CactusManager();

function moveCactus() {
    const move = setInterval(() => {
        if (isGameOver) {
            clearInterval(move);
            return;
        }
        cactusManager.update();
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
        cactusManager.reset();
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

document.addEventListener('mouseup', () => {
    isHoldingJump = false;
});

// Start the game
moveCactus(); 