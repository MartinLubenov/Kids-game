import { unloadCSS } from '../../utils/helpers.js';
import { handleError, GameError, ErrorTypes } from '../../utils/errorHandler.js';
import { ensureCSS } from '../../app.js';
import soundManager from '../../utils/soundManager.js';

// Singleton instance
let instance = null;

export class PopUp {
    constructor() {
        if (instance) {
            return instance;
        }
        instance = this;

        this.popup = null;
        this.popupMessage = null;
        this.popupCloseButton = null;
        this.cssLoaded = false;
        this.cssLink = null;

        // Load common sounds
        soundManager.loadSound('popUpSounds', 'sounds/popUpSounds.mp3', {
            sprite: {
                "closePopUp": [
                    0,
                    168.0045351473923
                ],
                "openPopUp": [
                    1999.9999999999998,
                    288.00453514739235
                ]
            }
        });
    }

    /**
     * Loads the CSS for the popup
     * @private
     */
    async loadPopUpCSS() {
        if (!this.cssLoaded) {
            try {
                await ensureCSS('components/popUp/popUp.css');
                this.cssLoaded = true;
                this.cssLink = 'components/popUp/popUp.css';
            } catch (error) {
                handleError(
                    new GameError(
                        'Failed to load popup CSS',
                        ErrorTypes.RESOURCE,
                        { originalError: error.message }
                    ),
                    'popUp.loadPopUpCSS'
                );
            }
        }
    }

    /**
     * Shows a popup with a message and state
     * @param {string} message - Message to display
     * @param {number} state - Current game state
     */
    async showPopup(message, state) {
        try {
            // Play open popup sound
            soundManager.play('popUpSounds', 'openPopUp');

            await this.loadPopUpCSS();

            if (this.popup) {
                this.closePopup();
                // this.destroyPopUp()
            }

            this.popup = document.createElement('div');
            this.popup.className = 'popup';

            const popupContent = document.createElement('div');
            popupContent.className = 'popup-content';

            this.popupMessage = document.createElement('p');
            this.popupMessage.id = 'popup-message';
            this.popupMessage.textContent = message;

            this.popupCloseButton = document.createElement('button');
            this.popupCloseButton.id = 'popup-close';
            this.popupCloseButton.textContent = state === PopUpStates.INITIAL_GAME ? 'Започни' : 'Опитай отново';

            popupContent.appendChild(this.popupMessage);
            popupContent.appendChild(this.popupCloseButton);
            this.popup.appendChild(popupContent);

            document.body.appendChild(this.popup);

            return new Promise((resolve) => {
                const closeHandler = () => {
                    // Play close popup sound
                    soundManager.play('popUpSounds', 'closePopUp');

                    this.closePopup();
                    resolve();
                };

                this.popupCloseButton.addEventListener('click', closeHandler);
            });
        } catch (error) {
            handleError(
                new GameError(
                    'Failed to show popup',
                    ErrorTypes.RUNTIME,
                    { originalError: error.message }
                ),
                'popUp.showPopup'
            );
        }
    }

    /**
     * Closes and removes the popup
     */
    closePopup() {
        if (this.popup) {
            this.popup.remove();
            this.popup = null;
        }
    }

    /**
     * Destroys the popup and cleans up resources
     */
    destroyPopUp() {
        // Remove popup from DOM
        if (this.popup) {
            this.popup.remove();
            this.popup = null;
        }

        // Only unload CSS when completely destroying the popup component
        if (this.cssLoaded && this.cssLink) {
            unloadCSS(this.cssLink);
            this.cssLoaded = false;
            this.cssLink = null;
        }
    }
}

export const PopUpStates = {
    INITIAL_GAME: 0,
    MISTAKE_MADE: 1,
    TIME_EXPIRED: 2,
    GAME_LOST: 3,
    GAME_WON: 4
};
