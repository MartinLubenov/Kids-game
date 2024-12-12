import { games } from './gameModules/generatedGames.js';
import { LoadingScreen } from './components/loadingScreen/loadingScreen.js';
import { handleError, GameError, ErrorTypes } from './utils/errorHandler.js';
import soundManager from './utils/soundManager.js';
// import { unloadCSS } from './utils/helpers.js';

class App {
    constructor() {
        this.screens = {};
        this.loadedCSS = new Set();
        this.loadingScreen = new LoadingScreen();

        // Bind methods to maintain correct 'this' context
        this.checkOrientation = this.checkOrientation.bind(this);
        this.init = this.init.bind(this);

        // Set up event listeners
        window.addEventListener('resize', this.checkOrientation);
        document.addEventListener('DOMContentLoaded', this.init);
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

    async ensureCSS(cssPath) {
        if (this.loadedCSS.has(cssPath)) {
            console.log(`CSS already loaded: ${cssPath}`);
            return;
        }

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = cssPath;

        return new Promise((resolve, reject) => {
            link.onload = () => {
                this.loadedCSS.add(cssPath);
                console.log(`CSS loaded successfully: ${cssPath}`);
                resolve();
            };
            link.onerror = () => {
                reject(new Error(`Failed to load CSS: ${cssPath}`));
            };
            document.head.appendChild(link);
        });
    }

    untrackCSS(cssPath) {
        if (this.loadedCSS.has(cssPath)) {
            this.loadedCSS.delete(cssPath);
            console.log(`CSS untracked: ${cssPath}`);
        }
    }

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
                // soundManager.play('commonSounds', 'homeBackgroundMusic');
                // soundManager.setVolume('commonSounds', 0.2)
                return;
            }

            this.loadingScreen.show(`Зареждане на ${screenId}...`);

            if (games[screenId]) {
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

    checkOrientation() {
        if (window.innerHeight > window.innerWidth) {
            document.body.classList.remove('landscape');
        } else {
            document.body.classList.add('landscape');
        }
    }

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
