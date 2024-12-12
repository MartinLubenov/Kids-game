import { Game } from '../../components/Game/Game.js';
import { PopUpStates } from '../../components/popUp/popUp.js';
// import { shuffleArray, getCurrentGameCssPath } from '../../utils/helpers.js';
import { handleError, GameError, ErrorTypes } from '../../utils/errorHandler.js';

export class LightSequenceGame extends Game {
    constructor() {
        super();
        this.colors = ['red', 'blue', 'green', 'yellow', 'orange', 'purple'];
        this.buttons = [];
        this.sequence = [];
        this.playerSequence = [];
        this.level = 0;
    }

    /**
     * Initializes and starts the game
     */
    async startGame() {
        try {
            await this.initialize('Последователност на светлини');
            await this.loadGameAssets();
            await this.setupGameScreen();
            await this.setupEventListeners();
            
            // Hide game screen initially
            const gameScreenElement = document.querySelector('.game-screen');
            // if (gameScreenElement) {
            //     gameScreenElement.style.display = 'none';
            // }
            
            // Show initial popup and start game
            await this.popUp.showPopup(
                'Научи се да повтаряш светлинната последователност!',
                PopUpStates.INITIAL_GAME
            ).then(() => {
                // Show game screen when popup closes
                if (gameScreenElement) {
                    gameScreenElement.style.display = 'flex';
                }
                
                // Add a small delay before starting the first sequence
                setTimeout(() => {
                    this.playSequence();
                }, 500);
            });

        } catch (error) {
            handleError(
                error instanceof GameError ? error : new GameError(
                    'Failed to start game',
                    ErrorTypes.GAME_INITIALIZATION,
                    { originalError: error.message }
                ),
                'LightSequenceGame.startGame'
            );
        }
    }

    /**
     * Loads game assets and prepares game components
     * @private
     */
    async loadGameAssets() {
        try {
            await this.loadingScreen.updateMessage('Подготовка на играта...');
            await this.loadingScreen.updateProgress(1, 3);
        } catch (error) {
            throw new GameError(
                'Failed to load game assets',
                ErrorTypes.RESOURCE,
                { originalError: error.message }
            );
        }
    }

    /**
     * Sets up the game screen HTML
     * @private
     */
    async setupGameScreen() {
        const gameScreen = `
            <div class="game-screen">
                <div id="level-counter" class="level-counter">Ниво: 0</div>
                <h1>Последователност на светлини</h1>
                <div class="buttons-container">
                    ${this.colors
                        .map(
                            (color, index) =>
                                `<button class="color-button" data-index="${index}" style="background-color: ${color};"></button>`
                        )
                        .join('')}
                </div>
                <button id="back">Назад</button>
            </div>
        `;
        document.body.innerHTML = gameScreen;
        
        await this.loadingScreen.updateMessage('Подготовка на игралното поле...');
        await this.loadingScreen.updateProgress(2, 3);

        // Setup color buttons
        const colorButtons = document.querySelectorAll('.color-button');
        colorButtons.forEach((button, index) => {
            this.buttons.push(button);
        });

        await this.loadingScreen.updateProgress(3, 3);
        await this.loadingScreen.hide();

        // Update initial level display
        this.updateLevelDisplay();
    }

    /**
     * Sets up event listeners for game interaction
     * @private
     */
    setupEventListeners() {
        this.buttons.forEach((button, index) => {
            button.addEventListener('click', () => {
                if (!button.disabled) {
                    this.handleButtonClick(index);
                }
            });
        });

        const backButton = document.getElementById('back');
        backButton.addEventListener('click', this.handleBackToHome.bind(this));
    }

    /**
     * Updates the level display
     * @private
     */
    updateLevelDisplay() {
        const levelElement = document.getElementById('level-counter');
        if (levelElement) {
            levelElement.textContent = `Ниво: ${this.level + 1}`;
        }
    }

    /**
     * Handles button click events
     * @private
     * @param {number} index - Index of the clicked button
     */
    async handleButtonClick(index) {
        const clickedButton = this.buttons[index];
        
        // Remove active class from all buttons first
        this.buttons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        clickedButton.classList.add('active');
        
        // Remove active class after a short delay
        setTimeout(() => {
            clickedButton.classList.remove('active');
        }, 200);

        this.playerSequence.push(index);

        // Compare player sequence with the game sequence
        if (this.playerSequence[this.playerSequence.length - 1] !== this.sequence[this.playerSequence.length - 1]) {
            await this.popUp.showPopup('Грешка! Опитайте отново от началото.', PopUpStates.GAME_LOST);
            this.resetGame();
            // Add a small delay before starting the next sequence
            setTimeout(() => {
                this.playSequence();
            }, 500);
            return;
        }

        // Check if player completed the current sequence
        if (this.playerSequence.length === this.sequence.length) {
            this.level++;
            this.updateLevelDisplay();
            await this.popUp.showPopup(`Поздравления! Преминахте ниво ${this.level}.`, PopUpStates.INITIAL_GAME);
            
            // Add a small delay before starting the next sequence
            setTimeout(() => {
                this.playSequence();
            }, 500);
        }
    }

    /**
     * Plays the current sequence of lights
     * @private
     */
    async playSequence() {
        // Clear previous sequence input
        this.playerSequence = [];
        
        // Add a new random button to the sequence
        this.sequence.push(Math.floor(Math.random() * this.buttons.length));

        // Disable buttons during sequence playback
        this.buttons.forEach(btn => (btn.disabled = true));

        // Play the entire sequence with a clear pause between buttons
        for (const index of this.sequence) {
            const button = this.buttons[index];
            
            // Activate button
            button.classList.add('active');
            await new Promise(resolve => setTimeout(resolve, 500)); // Light up time
            
            // Deactivate button
            button.classList.remove('active');
            await new Promise(resolve => setTimeout(resolve, 300)); // Pause between buttons
        }

        // Re-enable buttons for player input
        this.buttons.forEach(btn => (btn.disabled = false));
    }

    /**
     * Resets the game state
     * @private
     */
    resetGame() {
        this.sequence = [];
        this.playerSequence = [];
        this.level = 0;
        this.updateLevelDisplay();
    }

    /**
     * Cleans up game resources before destruction
     * @override
     */
    async destroy() {
        // Remove event listeners
        this.buttons.forEach((button, index) => {
            button.removeEventListener('click', () => this.handleButtonClick(index));
        });

        // Call parent destroy method
        await super.destroy();
    }
}

// Export the game start function
export const startGame =() => {
    const game = new LightSequenceGame();
    return game.startGame();
};