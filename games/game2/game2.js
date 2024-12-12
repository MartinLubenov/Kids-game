import { Game } from '../../components/Game/Game.js';
import { PopUpStates } from '../../components/popUp/popUp.js';
import { shuffleArray, getCurrentGameCssPath } from '../../utils/helpers.js';
import { handleError, GameError, ErrorTypes } from '../../utils/errorHandler.js';

export class PuzzleGame extends Game {
    constructor() {
        super();
        this.activePiece = null;
        this.offsetX = 0;
        this.offsetY = 0;
        this.startX = 0;
        this.startY = 0;
        this.selectedDirectory = '';
        this.puzzleSize = 9;
        this.imageDirectories = ['ball', 'bear', 'book', 'cup', 'lamp'];
    }

    /**
     * Initializes and starts the game
     */
    async startGame() {
        try {
            await this.initialize('Пъзелчовци');
            await this.loadGameAssets();
            await this.setupGameScreen();
            await this.setupEventListeners();
            
            // Show initial popup and start game
            await this.popUp.showPopup(
                'Подреди пъзела, като преместиш парченцата на точните им места!',
                PopUpStates.INITIAL_GAME
            );

        } catch (error) {
            handleError(
                error instanceof GameError ? error : new GameError(
                    'Failed to start game',
                    ErrorTypes.GAME_INITIALIZATION,
                    { originalError: error.message }
                ),
                'PuzzleGame.startGame'
            );
        }
    }

    /**
     * Loads game assets and prepares game components
     * @private
     */
    async loadGameAssets() {
        try {
            // Select random image directory
            this.selectedDirectory = this.imageDirectories[
                Math.floor(Math.random() * this.imageDirectories.length)
            ];

            await this.loadingScreen.updateMessage('Подготовка на пъзела...');
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
                <h1>Пъзелчовци</h1>
                <div class="puzzle-container">
                    <div class="puzzle-board"></div>
                    <div class="puzzle-pieces"></div>
                </div>
                <button id="back">Назад</button>
            </div>
        `;
        document.body.innerHTML = gameScreen;

        await this.loadingScreen.updateMessage('Подготовка на игралното поле...');
        await this.loadingScreen.updateProgress(2, 3);

        // Create puzzle board and pieces
        this.createPuzzleBoard();
        this.createPuzzlePieces();

        await this.loadingScreen.updateProgress(3, 3);
        await this.loadingScreen.hide();
    }

    /**
     * Creates puzzle board slots
     * @private
     */
    createPuzzleBoard() {
        const puzzleBoard = document.querySelector('.puzzle-board');
        const pieces = Array.from({ length: this.puzzleSize }, (_, i) => i + 1);

        pieces.forEach(i => {
            const slot = document.createElement('div');
            slot.classList.add('puzzle-slot', 'empty-slot');
            slot.setAttribute('data-slot', i);
            puzzleBoard.appendChild(slot);
        });
    }

    /**
     * Creates and shuffles puzzle pieces
     * @private
     */
    createPuzzlePieces() {
        const puzzlePieces = document.querySelector('.puzzle-pieces');
        const pieces = Array.from({ length: this.puzzleSize }, (_, i) => i + 1);
        const shuffledPieces = shuffleArray([...pieces]);

        shuffledPieces.forEach(piece => {
            const pieceElement = document.createElement('div');
            pieceElement.classList.add('puzzle-piece');
            pieceElement.setAttribute('data-piece', piece);
            
            // Set the piece's image dynamically
            pieceElement.style.backgroundImage = `url('games/game2/images/${this.selectedDirectory}/${piece}.png')`;
            pieceElement.style.backgroundSize = 'cover';
            pieceElement.style.backgroundPosition = 'center';

            puzzlePieces.appendChild(pieceElement);
        });
    }

    /**
     * Sets up event listeners for game interaction
     * @private
     */
    setupEventListeners() {
        const puzzlePieces = document.querySelectorAll('.puzzle-piece');
        const backButton = document.getElementById('back');

        puzzlePieces.forEach(piece => {
            piece.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
            piece.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
            piece.addEventListener('touchend', this.handleTouchEnd.bind(this));
        });

        backButton.addEventListener('click', this.handleBackToHome.bind(this));
    }

    /**
     * Handles touch start event for puzzle pieces
     * @private
     * @param {TouchEvent} event - Touch start event
     */
    handleTouchStart(event) {
        event.preventDefault();
        const touch = event.touches[0];
        this.activePiece = event.target.closest('.puzzle-piece');
        if (!this.activePiece) return;

        const rect = this.activePiece.getBoundingClientRect();
        this.offsetX = touch.clientX - rect.left;
        this.offsetY = touch.clientY - rect.top;
        this.startX = rect.left;
        this.startY = rect.top;

        // Create a clone for dragging
        const clone = this.activePiece.cloneNode(true);
        clone.style.position = 'fixed';
        clone.style.left = rect.left + 'px';
        clone.style.top = rect.top + 'px';
        clone.style.zIndex = '1000';
        clone.style.opacity = '0.8';
        clone.id = 'dragging-piece';
        document.body.appendChild(clone);

        // Hide original piece
        this.activePiece.style.visibility = 'hidden';
    }

    /**
     * Handles touch move event for puzzle pieces
     * @private
     * @param {TouchEvent} event - Touch move event
     */
    handleTouchMove(event) {
        event.preventDefault();
        const dragPiece = document.getElementById('dragging-piece');
        if (!dragPiece) return;

        const touch = event.touches[0];
        dragPiece.style.left = (touch.clientX - this.offsetX) + 'px';
        dragPiece.style.top = (touch.clientY - this.offsetY) + 'px';

        // Highlight potential drop target
        const dropTarget = document.elementFromPoint(
            touch.clientX - window.scrollX,
            touch.clientY - window.scrollY
        );
        
        // Remove previous hover effects
        document.querySelectorAll('.empty-slot.hover').forEach(slot => {
            slot.classList.remove('hover');
        });

        // Add hover effect to current target if it's a valid slot
        if (dropTarget && dropTarget.classList.contains('empty-slot')) {
            dropTarget.classList.add('hover');
        }
    }

    /**
     * Handles touch end event for puzzle pieces
     * @private
     * @param {TouchEvent} event - Touch end event
     */
    async handleTouchEnd(event) {
        if (!this.activePiece) return;

        const dragPiece = document.getElementById('dragging-piece');
        if (!dragPiece) return;

        const touch = event.changedTouches[0];
        const dropTarget = document.elementFromPoint(
            touch.clientX - window.scrollX,
            touch.clientY - window.scrollY
        );

        // Remove hover effects
        document.querySelectorAll('.empty-slot.hover').forEach(slot => {
            slot.classList.remove('hover');
        });

        if (dropTarget && dropTarget.classList.contains('empty-slot')) {
            const pieceNumber = parseInt(this.activePiece.getAttribute('data-piece'));
            const slotNumber = parseInt(dropTarget.getAttribute('data-slot'));

            if (pieceNumber === slotNumber) {
                // Correct placement
                dropTarget.appendChild(this.activePiece);
                dropTarget.classList.remove('empty-slot');
                this.activePiece.style.visibility = 'visible';
                this.activePiece.style.position = 'static';
                this.checkPuzzleCompletion();
            } else {
                // Wrong placement
                this.activePiece.style.visibility = 'visible';
                await this.popUp.showPopup('Това парченце не е за там!', PopUpStates.MISTAKE_MADE);
            }
        } else {
            // No valid drop target
            this.activePiece.style.visibility = 'visible';
        }

        // Clean up
        dragPiece.remove();
        this.activePiece = null;
    }

    /**
     * Checks if the puzzle is completed
     * @private
     */
    async checkPuzzleCompletion() {
        const emptySlots = document.querySelectorAll('.empty-slot');
        if (emptySlots.length === 0) {
            setTimeout(async () => {
                await this.popUp.showPopup('Браво! Успешно подреди пъзела!', PopUpStates.GAME_WON);
                // Restart the game
                await this.retryGame();
            }, 500);
        }
    }

    /**
     * Restarts the game with a new puzzle
     * @private
     */
    async retryGame() {
        // Reload game assets and reset game screen
        await this.loadGameAssets();
        await this.setupGameScreen();
        await this.setupEventListeners();
    }

    /**
     * Cleans up game resources before destruction
     * @override
     */
    async destroy() {
        // Remove event listeners
        const puzzlePieces = document.querySelectorAll('.puzzle-piece');
        puzzlePieces.forEach(piece => {
            piece.removeEventListener('touchstart', this.handleTouchStart);
            piece.removeEventListener('touchmove', this.handleTouchMove);
            piece.removeEventListener('touchend', this.handleTouchEnd);
        });

        // Call parent destroy method
        await super.destroy();
    }
}

// Export the game start function
export const startGame = () => {
    const game = new PuzzleGame();
    return game.startGame();
};