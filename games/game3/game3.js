/**
 * @fileOverview Memory Card Game Module for Kids Educational Game
 * 
 * This module implements an interactive memory card matching game
 * where children find pairs of identical cards.
 * 
 * Game Mechanics:
 * - Card grid generation
 * - Card flipping interaction
 * - Pair matching validation
 * - Move and time tracking
 * - Sound and visual feedback
 * 
 * Learning Objectives:
 * - Memory enhancement
 * - Concentration skills
 * - Pattern recognition
 * - Visual memory
 * - Cognitive processing speed
 * 
 * Key Features:
 * - Dynamic card grid
 * - Randomized card placement
 * - Progressive difficulty
 * - Error handling
 * - Responsive design
 * 
 * @module MemoryGame
 * @requires ../../components/Game/Game.js
 * @requires ../../components/popUp/popUp.js
 * @requires ../../utils/errorHandler.js
 * @requires ../../utils/soundManager.js
 * 
 * @author Martin Lubenov
 * @version 1.0.0
 * @license MIT
 */

import { Game } from '../../components/Game/Game.js';
import { PopUpStates } from '../../components/popUp/popUp.js';
import { handleError, GameError, ErrorTypes } from '../../utils/errorHandler.js';
import soundManager from '../../utils/soundManager.js';
// import { getCurrentGameCssPath } from '../../utils/helpers.js';

const CARDS = [
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'
];

export class MemoryGame extends Game {
    constructor() {
        super();
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.isLocked = false;
        this.moves = 0;
    }

    /**
     * Initializes and starts the game
     */
    async startGame() {
        try {
            await this.initialize('Намери двойките');
            await this.loadGameAssets();
            await this.setupGameScreen();
            await this.setupEventListeners();
            soundManager.loadSound('game3Sounds', 'games/game3/sounds/game3Sounds.mp3', {
                sprite: {
                    "closeCard": [
                        0,
                        360
                    ],
                    "openCard": [
                        2000,
                        240.00000000000023
                    ]
                }
            });

            // Show initial popup
            await this.popUp.showPopup(
                'Добре дошли в играта "Намери двойките"! Намерете всички съвпадащи двойки карти.',
                PopUpStates.INITIAL_GAME
            );

        } catch (error) {
            handleError(
                error instanceof GameError ? error : new GameError(
                    'Failed to start game',
                    ErrorTypes.GAME_INITIALIZATION,
                    { originalError: error.message }
                ),
                'MemoryGame.startGame'
            );
        }
    }

    /**
     * Loads game assets
     * @private
     */
    async loadGameAssets() {
        try {
            // const cssPath = getCurrentGameCssPath();
            await this.loadingScreen.updateMessage('Зареждане на играта...');
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
     * Sets up the game screen
     * @private
     */
    async setupGameScreen() {
        await this.loadingScreen.updateMessage('Подготовка на игралното поле...');

        // Create game screen HTML
        const gameScreen = `
            <div class="game-screen">
                <div class="game-header">
                    <h2>Намери двойките</h2>
                    <div class="moves">Ходове: <span id="moves-count">0</span></div>
                </div>
                <div class="game-board">
                    ${CARDS.map((card, index) => `
                        <div class="card" data-index="${index}" data-emoji="${card}">
                            <div class="card-inner">
                                <div class="card-front"></div>
                                <div class="card-back">${card}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <button id="back">Назад</button>
            </div>
        `;
        document.body.innerHTML = gameScreen;

        await this.loadingScreen.updateProgress(2, 3);
        await this.loadingScreen.updateProgress(3, 3);
        await this.loadingScreen.hide();

        // Shuffle cards after rendering
        this.shuffleCards();
    }

    /**
     * Sets up event listeners
     * @private
     */
    setupEventListeners() {
        // Select all card elements
        this.cards = Array.from(document.querySelectorAll('.card'));

        // Add click listeners to cards
        this.cards.forEach(card => {
            card.addEventListener('click', () => this.handleCardClick(card));
        });

        // Setup back button
        const backButton = document.getElementById('back');
        backButton.addEventListener('click', this.handleBackToHome.bind(this));
    }

    /**
     * Shuffles the cards
     * @private
     */
    shuffleCards() {
        const cardValues = CARDS.sort(() => Math.random() - 0.5);
        const cardElements = document.querySelectorAll('.card-back');

        cardElements.forEach((cardBack, index) => {
            cardBack.textContent = cardValues[index];
            cardBack.parentElement.parentElement.dataset.emoji = cardValues[index];
        });
    }

    /**
     * Handles card click events
     * @private
     * @param {HTMLElement} card - The clicked card element
     */
    handleCardClick(card) {
        // Prevent clicking if game is locked, card is already flipped, or two cards are already flipped
        if (this.isLocked || card.classList.contains('flipped') || this.flippedCards.length === 2) {
            return;
        }

        // Flip the card
        card.classList.add('flipped');
        soundManager.play('game3Sounds', 'openCard');
        this.flippedCards.push(card);

        if (this.flippedCards.length === 2) {
            // Lock the game to prevent further clicks
            this.isLocked = true;

            // Wait for the card flipping animation to complete before checking match
            setTimeout(() => {
                this.checkMatch();
            }, 500);
        }
    }

    /**
     * Checks if the flipped cards match
     * @private
     */
    checkMatch() {
        this.moves++;
        this.updateMovesDisplay();
        const [card1, card2] = this.flippedCards;

        if (card1.dataset.emoji === card2.dataset.emoji) {
            soundManager.play('commonSounds', 'success');
            // Match found
            this.matchedPairs++;

            // Add match class to both cards
            card1.classList.add('card-match');
            card2.classList.add('card-match');

            // Disable these cards
            card1.removeEventListener('click', () => this.handleCardClick(card1));
            card2.removeEventListener('click', () => this.handleCardClick(card2));

            // Reset flipped cards and unlock game
            this.flippedCards = [];
            this.isLocked = false;

            // Check if game is complete
            if (this.matchedPairs === CARDS.length / 2) {
                this.handleGameComplete();
            }
        } else {
            soundManager.play('commonSounds', 'error');
            // No match
            // Add mismatch class to both cards
            card1.classList.add('card-mismatch');
            card2.classList.add('card-mismatch');

            // Flip cards back after a delay
            setTimeout(() => {
                soundManager.play('game3Sounds', 'closeCard');
                card1.classList.remove('flipped', 'card-mismatch');
                card2.classList.remove('flipped', 'card-mismatch');
                this.flippedCards = [];
                this.isLocked = false;
            }, 1000);
        }
    }

    /**
     * Updates the moves display
     * @private
     */
    updateMovesDisplay() {
        const movesDisplay = document.getElementById('moves-count');
        if (movesDisplay) {
            movesDisplay.textContent = this.moves;
        }
    }

    /**
     * Handles game completion
     * @private
     */
    async handleGameComplete() {
        soundManager.play('commonSounds', 'gameCompleted');
        await this.popUp.showPopup(
            `Поздравления! Завършихте играта с ${this.moves} хода!`,
            PopUpStates.GAME_WON
        ).then(() => {
            // Return to home screen after popup
            this.handleBackToHome();
        });
    }

    /**
     * Cleans up game resources before destruction
     * @override
     */
    async destroy() {
        // Remove event listeners
        this.cards.forEach(card => {
            card.removeEventListener('click', () => this.handleCardClick(card));
        });

        // Call parent destroy method
        await super.destroy();
    }
}

// Export the game start function
export const startGame = () => {
    const game = new MemoryGame();
    return game.startGame();
};
