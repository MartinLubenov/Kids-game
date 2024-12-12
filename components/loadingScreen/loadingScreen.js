/**
 * LoadingScreen Component
 * Displays an animated loading screen with optional progress and message
 */
export class LoadingScreen {
    constructor() {
        this.element = null;
        this.progressElement = null;
        this.messageElement = null;
        this.isHiding = false;
    }

    /**
     * Creates and shows the loading screen
     * @param {string} [message='Loading...'] Initial loading message
     * @returns {Promise<void>}
     */
    show(message = 'Зареждане...') {
        return new Promise((resolve) => {
            if (this.element) {
                resolve();
                return;
            }

            this.element = document.createElement('div');
            this.element.className = 'loading-screen';
            
            const content = document.createElement('div');
            content.className = 'loading-content';

            // Create animated loader
            const loader = document.createElement('div');
            loader.className = 'loader';
            for (let i = 0; i < 3; i++) {
                const dot = document.createElement('div');
                dot.className = 'dot';
                loader.appendChild(dot);
            }

            // Create message element
            this.messageElement = document.createElement('p');
            this.messageElement.className = 'loading-message';
            this.messageElement.textContent = message;

            // Create progress element
            this.progressElement = document.createElement('div');
            this.progressElement.className = 'loading-progress';
            
            content.appendChild(loader);
            content.appendChild(this.messageElement);
            content.appendChild(this.progressElement);
            this.element.appendChild(content);

            document.body.appendChild(this.element);
            
            // Allow a frame for the loading screen to render
            requestAnimationFrame(() => resolve());
        });
    }

    /**
     * Updates the loading message
     * @param {string} message New message to display
     */
    updateMessage(message) {
        if (this.messageElement) {
            this.messageElement.textContent = message;
        }
    }

    /**
     * Updates the loading progress
     * @param {number} current Current progress value
     * @param {number} total Total progress value
     */
    updateProgress(current, total) {
        if (this.progressElement) {
            const percentage = Math.round((current / total) * 100);
            this.progressElement.textContent = `${percentage}%`;
        }
    }

    /**
     * Hides and removes the loading screen
     * @returns {Promise<void>}
     */
    hide() {
        return new Promise((resolve) => {
            // If already hiding or no element exists, resolve immediately
            if (this.isHiding || !this.element) {
                resolve();
                return;
            }

            this.isHiding = true;

            // Add fade-out class for smooth transition
            if (this.element) {
                this.element.classList.add('fade-out');
            }

            // Wait for animation to complete
            setTimeout(() => {
                try {
                    // Check if element and parent still exist
                    if (this.element && this.element.parentNode) {
                        this.element.parentNode.removeChild(this.element);
                    }
                } catch (error) {
                    console.warn('Loading screen element already removed:', error);
                }

                // Reset all properties
                this.element = null;
                this.progressElement = null;
                this.messageElement = null;
                this.isHiding = false;
                resolve();
            }, 500); // Match this with CSS transition duration
        });
    }
}
