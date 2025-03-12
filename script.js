const dino = document.getElementById('dino');
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

const CHARACTERS = {
    dino: `
        <svg width="60" height="60" viewBox="0 0 60 60">
            <g fill="#535353">
                <!-- Head -->
                <rect x="30" y="5" width="5" height="5"/>
                <rect x="35" y="5" width="5" height="20"/>
                <rect x="40" y="10" width="5" height="15"/>
                <rect x="25" y="15" width="5" height="5"/>
                <!-- Eye -->
                <rect x="42" y="12" width="2" height="2" fill="#fff"/>
                <!-- Body -->
                <rect x="15" y="20" width="30" height="15"/>
                <!-- Leg -->
                <rect x="20" y="35" width="5" height="15"/>
                <rect x="15" y="45" width="5" height="5"/>
                <!-- Arm -->
                <rect x="30" y="25" width="10" height="5"/>
            </g>
        </svg>
    `,
    bird: `
        <svg width="60" height="60" viewBox="0 0 60 60">
            <g fill="#535353">
                <!-- Body -->
                <rect x="15" y="20" width="25" height="15"/>
                <!-- Head -->
                <rect x="35" y="15" width="10" height="10"/>
                <!-- Eye -->
                <rect x="40" y="17" width="2" height="2" fill="#fff"/>
                <!-- Beak -->
                <rect x="45" y="18" width="5" height="4"/>
                <!-- Wing -->
                <rect x="20" y="15" width="15" height="5"/>
                <!-- Legs -->
                <rect x="20" y="35" width="3" height="10"/>
                <rect x="30" y="35" width="3" height="10"/>
                <!-- Tail -->
                <rect x="10" y="25" width="5" height="5"/>
            </g>
        </svg>
    `,
    bunny: `
        <svg width="60" height="60" viewBox="0 0 60 60">
            <g fill="#535353">
                <!-- Body -->
                <rect x="15" y="25" width="25" height="20"/>
                <!-- Head -->
                <rect x="20" y="15" width="15" height="15"/>
                <!-- Ears -->
                <rect x="22" y="5" width="4" height="12"/>
                <rect x="29" y="5" width="4" height="12"/>
                <!-- Eye -->
                <rect x="25" y="18" width="2" height="2" fill="#fff"/>
                <!-- Legs -->
                <rect x="18" y="45" width="5" height="5"/>
                <rect x="32" y="45" width="5" height="5"/>
                <!-- Tail -->
                <rect x="40" y="35" width="5" height="5"/>
            </g>
        </svg>
    `
};

let currentCharacter = 'dino';

let isGameStarted = false;

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

function playVictorySound() {
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const gainNode1 = audioContext.createGain();
    const gainNode2 = audioContext.createGain();
    
    oscillator1.type = 'square';
    oscillator2.type = 'sawtooth';
    oscillator1.connect(gainNode1);
    oscillator2.connect(gainNode2);
    gainNode1.connect(audioContext.destination);
    gainNode2.connect(audioContext.destination);
    
    const now = audioContext.currentTime;
    const notes1 = [220, 440, 880, 1760, 880, 440, 220];
    const notes2 = [329.63, 659.25, 987.77, 1975.53, 987.77, 659.25, 329.63];
    const duration = 0.1;
    
    notes1.forEach((freq, i) => {
        oscillator1.frequency.setValueAtTime(freq, now + i * duration);
        gainNode1.gain.setValueAtTime(0.15, now + i * duration);
    });
    
    notes2.forEach((freq, i) => {
        oscillator2.frequency.setValueAtTime(freq, now + i * duration);
        gainNode2.gain.setValueAtTime(0.15, now + i * duration);
    });
    
    gainNode1.gain.exponentialRampToValueAtTime(0.01, now + notes1.length * duration);
    gainNode2.gain.exponentialRampToValueAtTime(0.01, now + notes2.length * duration);
    
    oscillator1.start(now);
    oscillator2.start(now);
    oscillator1.stop(now + notes1.length * duration + 0.1);
    oscillator2.stop(now + notes2.length * duration + 0.1);
}

function createMiniExplosion(x, y) {
    const explosion = document.createElement('div');
    explosion.className = 'mini-explosion';
    explosion.style.left = x + 'px';
    explosion.style.top = y + 'px';
    document.getElementById('game').appendChild(explosion);
    
    const angle = Math.random() * Math.PI * 2;
    const distance = 100 + Math.random() * 100;
    const duration = 0.5 + Math.random() * 0.5;
    
    explosion.style.transition = `all ${duration}s ease-out`;
    
    requestAnimationFrame(() => {
        explosion.style.transform = `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0)`;
        explosion.style.opacity = '0';
    });
    
    setTimeout(() => explosion.remove(), duration * 1000);
}

function createWinText(x, y) {
    const text = document.createElement('div');
    text.className = 'win-text';
    text.textContent = 'YOU WIN!';
    text.style.left = x + 'px';
    text.style.top = y + 'px';
    
    // Random color
    const hue = Math.random() * 360;
    text.style.color = `hsl(${hue}, 100%, 50%)`;
    
    document.getElementById('game').appendChild(text);
    
    // Random explosion direction
    const angle = Math.random() * Math.PI * 2;
    const distance = 100 + Math.random() * 200;
    const duration = 0.5 + Math.random() * 0.5;
    
    text.style.transition = `all ${duration}s cubic-bezier(0.4, 0, 0.2, 1)`;
    
    requestAnimationFrame(() => {
        text.style.transform = `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) rotate(${Math.random() * 360}deg)`;
        text.style.opacity = '0';
    });
    
    setTimeout(() => text.remove(), duration * 1000);
}

function celebrateVictory() {
    const game = document.getElementById('game');
    const rect = game.getBoundingClientRect();
    
    // Stop the game
    isGameOver = true;
    
    // Update game over message
    gameOverElement.textContent = 'YOU WIN! Click to try again!';
    gameOverElement.classList.remove('hidden');
    gameOverElement.classList.add('win');
    
    // Create main explosion
    const explosion = document.createElement('div');
    explosion.className = 'explosion';
    game.appendChild(explosion);
    setTimeout(() => explosion.classList.add('active'), 10);
    
    // Add continuous mini explosions and win text
    const effectsInterval = setInterval(() => {
        const x = Math.random() * rect.width;
        const y = Math.random() * rect.height;
        createMiniExplosion(x, y);
        createWinText(x, y);
    }, 100);
    
    // Add psychedelic effect
    game.classList.add('victory');
    
    // Play victory sound on repeat
    const soundInterval = setInterval(playVictorySound, 1000);
    
    // Remove effects after celebration
    setTimeout(() => {
        explosion.remove();
        game.classList.remove('victory');
        clearInterval(effectsInterval);
        clearInterval(soundInterval);
    }, 3000);
}

function jump() {
    if (!isGameStarted) {
        startGame();
        return;
    }
    
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
        dino.style.animation = `jumpAndSpin 0.8s cubic-bezier(0.4, 0, 0.2, 1)`;
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
        this.minDistance = 300;
        this.spawnChance = 0.03;
        this.gameSpeed = 12;
    }

    createCactus() {
        const cactus = document.createElement('div');
        cactus.className = 'cactus';
        
        // Randomly choose cactus variation
        const variation = Math.floor(Math.random() * 4); // 0-3 variations
        const height = 40 + Math.random() * 20; // Random height between 40-60px
        
        // Base SVG with random height
        const svg = `
            <svg width="30" height="${height}" viewBox="0 0 30 ${height}">
                <g fill="#535353">
                    <!-- Main stem -->
                    <rect x="12" y="0" width="6" height="${height}"/>
        `;

        // Different variations of branches
        const variations = {
            0: `
                <!-- Single right branch -->
                <rect x="18" y="${height * 0.4}" width="10" height="6"/>
                <rect x="22" y="${height * 0.4}" width="6" height="15"/>
            `,
            1: `
                <!-- Single left branch -->
                <rect x="2" y="${height * 0.3}" width="10" height="6"/>
                <rect x="2" y="${height * 0.3}" width="6" height="15"/>
            `,
            2: `
                <!-- Double branches -->
                <rect x="2" y="${height * 0.4}" width="10" height="6"/>
                <rect x="2" y="${height * 0.4}" width="6" height="12"/>
                <rect x="18" y="${height * 0.6}" width="10" height="6"/>
                <rect x="22" y="${height * 0.6}" width="6" height="12"/>
            `,
            3: `
                <!-- Triple branches -->
                <rect x="2" y="${height * 0.3}" width="10" height="6"/>
                <rect x="2" y="${height * 0.3}" width="6" height="12"/>
                <rect x="18" y="${height * 0.5}" width="10" height="6"/>
                <rect x="22" y="${height * 0.5}" width="6" height="12"/>
                <rect x="2" y="${height * 0.7}" width="10" height="6"/>
                <rect x="2" y="${height * 0.7}" width="6" height="12"/>
            `
        };

        cactus.innerHTML = `
            ${svg}
                ${variations[variation]}
            </g>
            </svg>
        `;
        
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
            cactus.position -= this.gameSpeed;

            // Make sure the position is updated
            if (cactus.element) {
                cactus.element.style.right = `${600 - cactus.position}px`;
            }

            // Remove if off screen
            if (cactus.position <= -50) {
                if (cactus.element && cactus.element.parentNode) {
                    cactus.element.remove();
                }
                this.cacti.splice(i, 1);
                score += 1;
                scoreElement.textContent = `Score: ${score}`;
                
                // Check for victory condition
                if (score === 5) {
                    celebrateVictory();
                }
                continue;
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
    if (window.gameLoop) {
        clearInterval(window.gameLoop);
    }

    window.gameLoop = setInterval(() => {
        if (isGameOver || !isGameStarted) {
            clearInterval(window.gameLoop);
            return;
        }
        cactusManager.update();
    }, 50);
}

function gameOver() {
    isGameOver = true;
    gameOverElement.classList.remove('hidden');
    document.getElementById('game').classList.add('game-over');
    playDeathSound();
}

function resetGame() {
    if (isGameOver) {
        isGameOver = false;
        isGameStarted = true;
        score = 0;
        scoreElement.textContent = 'Score: 0';
        gameOverElement.classList.add('hidden');
        document.getElementById('game').classList.remove('game-over');
        gameOverElement.classList.remove('win');
        
        // Switch character
        const characters = Object.keys(CHARACTERS);
        const nextIndex = (characters.indexOf(currentCharacter) + 1) % characters.length;
        currentCharacter = characters[nextIndex];
        
        document.getElementById('dino').innerHTML = CHARACTERS[currentCharacter];
        
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

// Add touch event listeners for mobile
document.addEventListener('touchstart', (event) => {
    event.preventDefault(); // Prevent default touch behaviors
    if (isGameOver) {
        resetGame();
    } else {
        jump();
    }
}, { passive: false });

document.addEventListener('touchend', () => {
    isHoldingJump = false;
});

// Add ground pattern creation
function createGroundPattern() {
    const groundContainer = document.createElement('div');
    groundContainer.className = 'ground-pattern';
    
    // Create repeating ground pattern with wider width
    const pattern = `
        <svg width="1200" height="20" viewBox="0 0 1200 20">
            <defs>
                <pattern id="ground" x="0" y="0" width="40" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 0 15 L 5 15 L 10 13 L 15 15 L 20 14 L 25 15 L 30 13 L 35 15 L 40 14" 
                          stroke="#999" 
                          stroke-width="2" 
                          fill="none"/>
                </pattern>
            </defs>
            <rect width="2400" height="20" fill="url(#ground)"/>
        </svg>
    `;
    
    groundContainer.innerHTML = pattern;
    document.getElementById('game').appendChild(groundContainer);
}

// Update initial character setup
window.onload = function() {
    document.getElementById('dino').innerHTML = CHARACTERS[currentCharacter];
    createGroundPattern();
    // Don't start movement until game starts
}

// Add start game function
function startGame() {
    isGameStarted = true;
    document.getElementById('start-message').style.display = 'none';
    moveCactus();
} 