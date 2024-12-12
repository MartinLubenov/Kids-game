/**
 * Game 1 - Object Finding Game
 * A simple educational game where children need to find specific objects in a grid of images.
 * The game features a timer, multiple attempts, and dynamic image shuffling.
 */

import { Game } from '../../components/Game/Game.js';
import { PopUpStates } from '../../components/popUp/popUp.js';
import { shuffleArray, getGameImages } from '../../utils/helpers.js';
import { handleError, GameError, ErrorTypes } from '../../utils/errorHandler.js';

export class ObjectFindingGame extends Game {
    constructor() {
        super();
        this.attempts = 3;
        this.timeLeft = 20;
        this.timerInterval = null;
        this.targetObject = null;
        this.pictureList = [];
        this.popUpState = PopUpStates.INITIAL_GAME;
        this.gameElements = {
            timeLeftElement: null,
            attemptsElement: null,
            picture: null,
            backButton: null
        };
        this.gameStarted = false;
    }

    /**
     * Initializes and starts the game
     */
    async startGame() {
        try {
            await this.initialize('Търсачи');
            await this.loadGameAssets();
            await this.setupGameScreen();
            await this.setupEventListeners();
            
            // Show initial popup and wait for it to be closed
            await this.popUp.showPopup(
                'Здравей, малък приключенец! Готов ли си да откриеш любимия си обект?',
                PopUpStates.INITIAL_GAME
            );

            // Start the game after popup is closed
            this.gameStarted = true;
            this.startTimer();

        } catch (error) {
            handleError(
                error instanceof GameError ? error : new GameError(
                    'Failed to start game',
                    ErrorTypes.GAME_INITIALIZATION,
                    { originalError: error.message }
                ),
                'ObjectFindingGame.startGame'
            );
        }
    }

    /**
     * Loads game assets and images
     * @private
     */
    async loadGameAssets() {
        // Load and preload images
        this.pictureList = await getGameImages('game1');
        
        if (this.pictureList.length === 0) {
            throw new GameError(
                'No images found for game1',
                ErrorTypes.RESOURCE,
                { gameName: 'game1' }
            );
        }

        const preloadPromises = this.pictureList.map(img => {
            return new Promise((resolve, reject) => {
                const image = new Image();
                image.onload = () => resolve();
                image.onerror = () => reject(new Error(`Failed to load image: ${img.name}`));
                image.src = img.img;
            });
        });

        try {
            await Promise.all(preloadPromises);
        } catch (error) {
            throw new GameError(
                'Failed to preload game images',
                ErrorTypes.RESOURCE,
                { originalError: error.message }
            );
        }

        await this.loadingScreen.updateProgress(2, 4);
        await this.loadingScreen.updateMessage('Подготовка на игралното поле...');

        // Format and shuffle picture list
        this.pictureList = this.pictureList.map(img => ({
            name: img.name.charAt(0).toUpperCase() + img.name.slice(1),
            img: img.img
        }));
        shuffleArray(this.pictureList);
        
        await this.loadingScreen.updateProgress(3, 4);
        this.targetObject = this.pictureList[Math.floor(Math.random() * this.pictureList.length)];
    }

    /**
     * Sets up the game screen HTML
     * @private
     */
    async setupGameScreen() {
        const gameScreen = `
            <div class="game-screen">
                <h1>Търсачи</h1>
                <div class="picture-container">
                    ${this.pictureList.map(object => `
                        <div class="object" id="${object.name}">
                            <img src="${object.img}" alt="${object.name}" />
                        </div>
                    `).join('')}
                </div>
                <div class="hint">
                    <p>Търсете: <span id="target-object">${this.targetObject.name}</span></p>
                    <p id="attempts-text">Опити до победата: <span id="attempts-left">${this.attempts}</span></p>
                    <p id="timer-text">Време: <span id="time-left">${this.timeLeft}</span> секунди</p>
                </div>
                <button id="back">Назад в игралния свят</button>
            </div>
        `;

        await this.loadingScreen.updateProgress(4, 4);
        await this.loadingScreen.hide();
        
        document.body.innerHTML = gameScreen;
        
        // Cache DOM elements
        this.gameElements = {
            timeLeftElement: document.getElementById('time-left'),
            attemptsElement: document.getElementById('attempts-left'),
            picture: document.querySelectorAll('.object'),
            backButton: document.getElementById('back')
        };

        // Style attempts counter
        this.gameElements.attemptsElement.style.fontSize = "1.5rem";
        this.gameElements.attemptsElement.style.color = "#ff5733";
    }

    /**
     * Sets up event listeners for game interaction
     * @private
     */
    setupEventListeners() {
        this.gameElements.picture.forEach(object => {
            object.addEventListener('click', this.handleObjectClick.bind(this));
        });

        this.gameElements.backButton.addEventListener('click', this.handleBackToHome.bind(this));
    }

    /**
     * Handles object click events
     * @private
     */
    async handleObjectClick(event) {
        if (!this.gameStarted) return;

        const object = event.currentTarget;
        const objectId = object.id;

        if (objectId === this.targetObject.name) {
            object.classList.add('found');
            this.popUpState = PopUpStates.GAME_WON;
            clearInterval(this.timerInterval);
            
            await this.popUp.showPopup(
                'Браво! Намери правилния обект! Искаш ли да играеш отново?',
                PopUpStates.GAME_WON
            );

            // Wait for popup to close and then retry the game
            await this.retryGame();
        } else {
            object.classList.add('not-found');
            this.attempts--;
            this.gameElements.attemptsElement.textContent = this.attempts;

            if (this.attempts === 0) {
                clearInterval(this.timerInterval);
                this.popUpState = PopUpStates.GAME_LOST;
                
                await this.popUp.showPopup(
                    'Опа! Свършиха ти опитите. Искаш ли да опиташ отново?',
                    PopUpStates.GAME_LOST
                );

                // Wait for popup to close and then retry the game
                await this.retryGame();
            } else {
                // Show mistake popup
                await this.popUp.showPopup(
                    'Опа! Това не е правилният обект. Опитай пак!',
                    PopUpStates.MISTAKE_MADE
                );
            }
        }
    }

    /**
     * Resets the game for a new attempt
     * @private
     */
    async retryGame() {
        // Reset game state
        this.attempts = 3;
        this.timeLeft = 20;
        this.gameStarted = true;
        
        // Shuffle images
        shuffleArray(this.pictureList);
        this.targetObject = this.pictureList[Math.floor(Math.random() * this.pictureList.length)];
        
        // Update UI elements
        document.getElementById('target-object').textContent = this.targetObject.name;
        this.gameElements.attemptsElement.textContent = this.attempts;
        this.gameElements.timeLeftElement.textContent = this.timeLeft;
        
        // Remove visual states from previous game
        this.gameElements.picture.forEach(object => {
            object.classList.remove('found', 'not-found');
        });
        
        // Shuffle the DOM elements
        const pictureContainer = document.querySelector('.picture-container');
        const pictureElements = Array.from(pictureContainer.children);
        shuffleArray(pictureElements);
        pictureElements.forEach(element => {
            pictureContainer.appendChild(element);
        });
        
        // Restart the timer
        this.startTimer();
    }

    /**
     * Starts the game timer
     * @private
     */
    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        this.timerInterval = setInterval(async () => {
            this.timeLeft--;
            this.gameElements.timeLeftElement.textContent = this.timeLeft;

            if (this.timeLeft === 0) {
                clearInterval(this.timerInterval);
                this.popUpState = PopUpStates.TIME_EXPIRED;
                
                await this.popUp.showPopup(
                    'Времето изтече! Искаш ли да опиташ отново?',
                    PopUpStates.TIME_EXPIRED
                );

                // Wait for popup to close and then retry the game
                await this.retryGame();
            }
        }, 1000);
    }

    // /**
    //  * Prepares the game for the next round
    //  * @private
    //  */
    // async handleNextRound() {
    //     await this.retryGame();
    // }

    /**
     * Cleans up game resources before destruction
     * @override
     */
    async destroy() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        // Remove event listeners
        if (this.gameElements.picture) {
            this.gameElements.picture.forEach(object => {
                object.removeEventListener('click', this.handleObjectClick);
            });
        }
        
        if (this.gameElements.backButton) {
            this.gameElements.backButton.removeEventListener('click', this.handleBackToHome);
        }

        // Call parent destroy method
        await super.destroy();
    }
}

// Export the game start function
export const startGame = () => {
    const game = new ObjectFindingGame();
    return game.startGame();
};
