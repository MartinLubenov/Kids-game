/**
 * @fileOverview Core Application Management Module for Kids Educational Game
 * 
 * This module serves as the central controller for the Kids Educational Game Web Application.
 * It manages screen transitions, dynamic resource loading, game initialization, and 
 * provides a seamless, interactive experience across different game modules.
 * 
 * Key Responsibilities:
 * - Dynamic screen and game loading
 * - CSS and script resource management
 * - Sound and music control
 * - Error handling and fallback mechanisms
 * 
 * Design Principles:
 * - Modular architecture
 * - Lazy loading of game resources
 * - Centralized state management
 * - Responsive and accessible design
 * 
 * @module App
 * @requires ./gameModules/generatedGames.js
 * @requires ./components/loadingScreen/loadingScreen.js
 * @requires ./utils/errorHandler.js
 * @requires ./utils/soundManager.js
 * 
 * @author Martin Lubenov
 * @version 1.0.0
 * @license MIT
 */

import { games } from './gameModules/generatedGames.js';
import { LoadingScreen } from './components/loadingScreen/loadingScreen.js';
import { handleError, GameError, ErrorTypes } from './utils/errorHandler.js';
import soundManager from './utils/soundManager.js';
// import { unloadCSS } from './utils/helpers.js';

/**
 * Manages the entire application lifecycle, screen transitions, and game initialization.
 * 
 * @class App
 * @classdesc Central controller for the Kids Educational Game application
 * 
 * @property {Object} screens - Stores rendered screen HTML content
 * @property {Set} loadedCSS - Tracks loaded CSS files to prevent duplicate loading
 * @property {LoadingScreen} loadingScreen - Manages loading screen states and animations
 * 
 * @example
 * // Application is automatically initialized on page load
 * const app = new App();
 * // Users navigate between screens by clicking floor buttons
 */
class App {
    /**
     * Initializes the application state, sets up event listeners, and loads common sound sprites.
     * 
     * @constructor
     */
    constructor() {
        // Initialize application state
        this.screens = {};
        this.loadedCSS = new Set();
        this.loadingScreen = new LoadingScreen();

        // Bind methods to maintain correct 'this' context
        this.checkOrientation = this.checkOrientation.bind(this);
        this.init = this.init.bind(this);

        // Set up event listeners
        window.addEventListener('resize', this.checkOrientation);
        document.addEventListener('DOMContentLoaded', this.init);

        // Load common sound sprites for consistent audio experience
        soundManager.loadSound('commonSounds', 'sounds/commonSounds.mp3', {
            sprite: {
                "backToMainScreen": [
                    0,
                    1032.0181405895692,
                ],
                "error": [
                    3000,
                    1619.5918367346937
                ],
                "gameCompleted": [
                    6000,
                    3912.01814058957
                ],
                "homeBackgroundMusic": [
                    11000,
                    87405.71428571428
                ],
                "openGame": [
                    100000,
                    1008.0045351473927
                ],
                "success": [
                    103000,
                    3359.9999999999995
                ]
            }
        });
    }

    /**
     * Ensures the specified CSS file is loaded and applied to the document.
     * 
     * @async
     * @param {string} cssPath - Path to the CSS file to load
     * @returns {Promise<void>}
     */
    async ensureCSS(cssPath) {
        try {
            // Normalize cssPath to remove leading/trailing slashes and whitespaces
            const normalizedPath = cssPath.trim().replace(/^\/|\/$/g, '');

            // Check if the CSS is already loaded
            if (this.loadedCSS.has(normalizedPath)) {
                console.log(`CSS already loaded: ${normalizedPath}`);
                return;
            }

            // Create a new link element
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = normalizedPath;

            // Use a promise to handle loading
            await new Promise((resolve, reject) => {
                link.onload = () => {
                    this.loadedCSS.add(normalizedPath);
                    resolve();
                };
                link.onerror = () => {
                    reject(new GameError(
                        `Failed to load CSS: ${normalizedPath}`,
                        ErrorTypes.RESOURCE,
                        { cssPath: normalizedPath }
                    ));
                };

                // Append to head, avoiding duplicates
                const existingLink = Array.from(document.head.getElementsByTagName('link'))
                    .find(l => l.href.includes(normalizedPath));

                if (!existingLink) {
                    document.head.appendChild(link);
                } else {
                    console.warn(`Duplicate CSS detected: ${normalizedPath}`);
                    resolve();
                }
            });
        } catch (error) {
            handleError(
                error instanceof GameError ? error : new GameError(
                    'CSS loading failed',
                    ErrorTypes.ASSET_LOADING,
                    { cssPath, originalError: error.message }
                ),
                'App.ensureCSS'
            );
        }
    }

    /**
     * Removes the specified CSS file from the loaded CSS set.
     * 
     * @param {string} cssPath - Path to the CSS file to unload
     */
    untrackCSS(cssPath) {
        if (this.loadedCSS.has(cssPath)) {
            this.loadedCSS.delete(cssPath);
            console.log(`CSS untracked: ${cssPath}`);
        }
    }

    /**
     * Generates the home screen HTML content based on available games.
     * 
     * @returns {string} Home screen HTML content
     */
    generateHomeScreen() {
        console.log('Available games:', games);
        const floors = Object.keys(games)
            .reverse()
            .map(gameId => `<div class="floor" data-game="${gameId}">Етаж ${gameId.replace('game', '')}</div>`)
            .join('');

        return `
            <div class="container">
                <img src="logo.png" alt="Logo">
                <div class="building">
                    ${floors}
                </div>
            </div>
        `;
    }

    /**
     * Sets up event listeners for floor buttons to navigate between screens.
     */
    setupFloorListeners() {
        const gameIds = Object.keys(games);
        console.log('Setting up floor listeners for games:', gameIds);
        gameIds.forEach(gameId => {
            const floor = document.querySelector(`[data-game="${gameId}"]`);
            if (floor) {
                floor.addEventListener('click', () => {
                    this.loadScreen(gameId);
                });
            }
        });
    }

    /**
     * Loads the specified screen or game module.
     * 
     * @async
     * @param {string} screenId - ID of the screen or game module to load
     * @returns {Promise<void>}
     */
    async loadScreen(screenId) {
        console.log('Loading screen:', screenId);

        try {
            // Create a placeholder div to prevent content flash
            const placeholder = document.createElement('div');
            placeholder.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: white; z-index: 9998;';
            document.body.appendChild(placeholder);

            console.log('Loading global CSS...');
            // Load global CSS first
            await this.ensureCSS('style.css');
            await this.ensureCSS('components/loadingScreen/loadingScreen.css');

            if (screenId === 'home') {
                console.log('Generating home screen...');
                this.screens.home = this.generateHomeScreen();
                document.body.innerHTML = this.screens.home;
                // Add loaded class after a small delay to trigger transition
                setTimeout(() => {
                    document.querySelector('.container').classList.add('loaded');
                }, 100);
                this.setupFloorListeners();
                soundManager.play('commonSounds', 'homeBackgroundMusic');
                // soundManager.setVolume('commonSounds', 0.2)
                return;
            }

            this.loadingScreen.show(`Зареждане на ${screenId}...`);

            if (games[screenId]) {
                soundManager.stop('commonSounds', 'homeBackgroundMusic');
                const { script, style } = games[screenId];
                console.log('Loading game CSS:', style);

                // Load CSS first and ensure it's applied
                this.loadingScreen.updateMessage('Зареждане на стилове...');
                await this.ensureCSS(style);
                this.loadingScreen.updateProgress(1, 2);

                // Then load and start the game
                console.log('Loading game script:', script);
                this.loadingScreen.updateMessage('Зареждане на играта...');
                try {
                    const gameModule = await import(script);
                    this.loadingScreen.updateProgress(2, 2);

                    // Clear the body only after CSS is loaded
                    document.body.innerHTML = '';
                    soundManager.play('commonSounds', 'openGame');
                    soundManager.setVolume('commonSounds', 0.2)

                    // Start the game
                    await gameModule.startGame();

                    // Add loaded class to game screen
                    const gameContainer = document.querySelector('.game-screen');
                    if (gameContainer) {
                        gameContainer.classList.add('loaded');
                    }
                } catch (error) {
                    console.error('Failed to load game module:', error);
                    throw new GameError(
                        'Failed to load game module',
                        ErrorTypes.GAME_INITIALIZATION,
                        { screenId, script, error: error.message }
                    );
                }
            } else {
                throw new GameError(
                    'Game not found',
                    ErrorTypes.RESOURCE,
                    { screenId }
                );
            }
        } catch (error) {
            console.error('Error in loadScreen:', error);
            handleError(error, 'app.loadScreen', () => {
                this.screens.home = this.generateHomeScreen();
                document.body.innerHTML = this.screens.home;
                setTimeout(() => {
                    document.querySelector('.container').classList.add('loaded');
                }, 100);
                this.setupFloorListeners();
            });
        } finally {
            if (this.loadingScreen) {
                this.loadingScreen.hide();
            }
            // Remove the placeholder
            const placeholder = document.querySelector('div[style*="z-index: 9998"]');
            if (placeholder) {
                placeholder.remove();
            }
        }
    }

    /**
     * Checks the current screen orientation and updates the body class accordingly.
     */
    checkOrientation() {
        if (window.innerHeight > window.innerWidth) {
            document.body.classList.remove('landscape');
        } else {
            document.body.classList.add('landscape');
        }
    }

    /**
     * Initializes the application by loading the home screen and setting up event listeners.
     * 
     * @async
     */
    async init() {
        try {
            // Initialize background music
            // soundManager.loadSound('commonSounds', 'sounds/commonSounds.mp3', {
            //     sprite: {
            //         homeBackgroundMusic: [10000, 87405.71428571428]
            //     },
            //     loop: true
            // });
            // soundManager.play('commonSounds', 'homeBackgroundMusic');
            // soundManager.setVolume('commonSounds', 0.3)

            // Show loading screen
            await this.loadingScreen.show();
            await this.loadingScreen.updateMessage('Зареждане на игралния свят...');
            await this.loadingScreen.updateProgress(1, 4);

            // Load home screen
            await this.loadScreen('home');
            this.setupFloorListeners();

            // Hide loading screen
            await this.loadingScreen.hide();
        } catch (error) {
            handleError(new GameError(
                'Failed to initialize app',
                ErrorTypes.INITIALIZATION,
                { originalError: error.message }
            ));
        }
    }
}

// Create and initialize the app
const app = new App();

// Export necessary methods for external use
export const ensureCSS = (cssPath) => app.ensureCSS(cssPath);
export const untrackCSS = (cssPath) => app.untrackCSS(cssPath);
export const loadScreen = (screenId) => app.loadScreen(screenId);
