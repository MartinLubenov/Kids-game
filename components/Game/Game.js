import { LoadingScreen } from '../loadingScreen/loadingScreen.js';
import { PopUp } from '../popUp/popUp.js';
import { handleError, GameError, ErrorTypes } from '../../utils/errorHandler.js';
import { ensureCSS } from '../../app.js';
import { getCurrentGameCssPath, unloadCSS } from '../../utils/helpers.js';
import { soundManager } from '../../utils/soundManager.js';

/**
 * Base Game class that provides a standardized structure and common functionality 
 * for all games in the educational game application.
 * 
 * @class Game
 * @description 
 * - Manages game lifecycle (initialization, start, destroy)
 * - Provides common UI components like loading screen and popups
 * - Handles error management
 * - Supports sound management
 * - Provides utility methods for game navigation
 */
export class Game {
    /**
     * Constructor initializes core game components
     * @constructor
     * @property {LoadingScreen} loadingScreen - Manages game loading UI
     * @property {PopUp} popUp - Manages game popup interactions
     * @property {boolean} gameStarted - Tracks game initialization state
     * @property {string|null} cssPath - Path to game-specific CSS
     * @property {Map} sounds - Manages game-specific sound resources
     */
    constructor() {
        this.loadingScreen = new LoadingScreen();
        this.popUp = new PopUp();
        this.gameStarted = false;
        this.cssPath = null;
        this.sounds = new Map(); // Store sound IDs specific to this game instance
    }

    /**
     * Sound Management Methods
     * Provides a consistent interface for loading and controlling game sounds
     */

    /**
     * Loads a sound for the game with unique identification
     * @protected
     * @param {string} id - Unique identifier for the sound
     * @param {string} src - Path to the sound file
     * @param {Object} [options={}] - Additional Howler sound options
     * @returns {Howl} The loaded sound object
     */
    loadSound(id, src, options = {}) {
        const gameSpecificId = `${this.constructor.name}_${id}`;
        const sound = soundManager.loadSound(gameSpecificId, src, options);
        this.sounds.set(id, gameSpecificId);
        return sound;
    }

    /**
     * Plays a previously loaded sound
     * @protected
     * @param {string} id - Sound identifier
     * @param {string} [sprite] - Optional sprite identifier for sprite sheets
     * @returns {number|null} Sound playback ID or null if sound not found
     */
    playSound(id, sprite = null) {
        const gameSpecificId = this.sounds.get(id);
        if (!gameSpecificId) {
            console.warn(`Sound ${id} not found in game ${this.constructor.name}`);
            return null;
        }
        return soundManager.play(gameSpecificId, sprite);
    }

    /**
     * Stops a playing sound
     * @protected
     * @param {string} id - Sound identifier
     */
    stopSound(id) {
        const gameSpecificId = this.sounds.get(id);
        if (gameSpecificId) {
            soundManager.stop(gameSpecificId);
        }
    }

    /**
     * Sets volume for a specific sound
     * @protected
     * @param {string} id - Sound identifier
     * @param {number} volume - Volume level (0.0 to 1.0)
     */
    setSoundVolume(id, volume) {
        const gameSpecificId = this.sounds.get(id);
        if (gameSpecificId) {
            soundManager.setVolume(gameSpecificId, volume);
        }
    }

    /**
     * Initializes base game components
     * @protected
     * @param {string} gameName - Name of the game for loading screen
     * @throws {GameError} If initialization fails
     */
    async initialize(gameName) {
        try {
            // Show loading screen with game name
            await this.loadingScreen.show(`Зареждане на игра "${gameName}"...`);
            
            // Load game-specific CSS
            this.cssPath = getCurrentGameCssPath();
            if (this.cssPath) {
                await ensureCSS(this.cssPath);
            }
        } catch (error) {
            // Handle initialization errors
            handleError(
                error instanceof GameError ? error : new GameError(
                    'Failed to initialize game',
                    ErrorTypes.GAME_INITIALIZATION,
                    { originalError: error.message }
                ),
                'Game.initialize'
            );
        }
    }

    /**
     * Abstract method to start the game
     * Must be implemented by child classes
     * @abstract
     * @throws {Error} If not implemented in child class
     */
    async startGame() {
        throw new Error('startGame method must be implemented by child class');
    }

    /**
     * Destroys the game and cleans up resources
     * @protected
     * Performs cleanup tasks:
     * - Unload game-specific sounds
     * - Remove game-specific CSS
     * - Hide loading screen
     * - Close popups
     * - Reset game state
     */
    async destroy() {
        try {
            // Unload game-specific sounds
            this.sounds.forEach((gameSpecificId) => {
                soundManager.unload(gameSpecificId);
            });
            this.sounds.clear();

            // Unload game-specific CSS
            if (this.cssPath) {
                unloadCSS(this.cssPath);
            }

            // Hide loading screen if visible
            if (this.loadingScreen) {
                await this.loadingScreen.hide();
            }

            // Close any open popups
            if (this.popUp) {
                this.popUp.closePopup();
            }

            // Reset game state
            this.gameStarted = false;
        } catch (error) {
            // Handle destruction errors
            handleError(
                error instanceof GameError ? error : new GameError(
                    'Failed to destroy game',
                    ErrorTypes.RUNTIME,
                    { originalError: error.message }
                ),
                'Game.destroy'
            );
        }
    }

    /**
     * Handles returning to the home screen
     * @protected
     * Performs cleanup and navigates back to home screen
     */
    async handleBackToHome() {
        try {
            // Destroy current game
            await this.destroy();
            soundManager.play('commonSounds', 'backToMainScreen');
            // Set location hash and load home screen
            window.location.hash = '#home';
            const { loadScreen } = await import('../../app.js');
            await loadScreen('home');
        } catch (error) {
            // Handle navigation errors
            handleError(
                error instanceof GameError ? error : new GameError(
                    'Failed to return to home screen',
                    ErrorTypes.RUNTIME,
                    { originalError: error.message }
                ),
                'Game.handleBackToHome'
            );
        }
    }
}