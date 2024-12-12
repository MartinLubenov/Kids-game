/**
 * Error types enum for consistent error categorization
 */
export const ErrorTypes = {
    ASSET_LOADING: 'ASSET_LOADING',
    GAME_INITIALIZATION: 'GAME_INITIALIZATION',
    RUNTIME: 'RUNTIME',
    NETWORK: 'NETWORK',
    RESOURCE: 'RESOURCE'
};

/**
 * Custom error class for game-specific errors
 */
export class GameError extends Error {
    constructor(message, type, details = {}) {
        super(message);
        this.name = 'GameError';
        this.type = type;
        this.details = details;
        this.timestamp = new Date().toISOString();
    }
}

/**
 * Handles errors globally and provides appropriate user feedback
 * @param {Error} error - The error object
 * @param {string} context - Where the error occurred
 * @param {Function} [fallback] - Optional fallback function to handle recovery
 */
export function handleError(error, context, fallback = null) {
    // Log the error with context
    console.error(`Error in ${context}:`, {
        message: error.message,
        type: error instanceof GameError ? error.type : 'UNKNOWN',
        details: error instanceof GameError ? error.details : {},
        stack: error.stack
    });

    // Handle different error types
    if (error instanceof GameError) {
        switch (error.type) {
            case ErrorTypes.ASSET_LOADING:
                showUserFriendlyError('Не можахме да заредим необходимите ресурси. Моля, опитайте отново.');
                break;
            case ErrorTypes.GAME_INITIALIZATION:
                showUserFriendlyError('Възникна проблем при стартиране на играта. Моля, опитайте отново.');
                break;
            case ErrorTypes.RUNTIME:
                showUserFriendlyError('Нещо се обърка. Нека опитаме отново!');
                break;
            case ErrorTypes.NETWORK:
                showUserFriendlyError('Проблем с връзката. Моля, проверете интернет връзката си.');
                break;
            case ErrorTypes.RESOURCE:
                showUserFriendlyError('Липсват някои ресурси. Моля, презаредете страницата.');
                break;
            default:
                showUserFriendlyError('Възникна неочаквана грешка. Моля, опитайте отново.');
        }
    } else {
        showUserFriendlyError('Възникна неочаквана грешка. Моля, опитайте отново.');
    }

    // Execute fallback if provided
    if (typeof fallback === 'function') {
        try {
            fallback();
        } catch (fallbackError) {
            console.error('Error in fallback handler:', fallbackError);
            // If fallback fails, redirect to home as last resort
            window.location.href = '/';
        }
    }
}

/**
 * Shows a user-friendly error message
 * @param {string} message - The message to show to the user
 */
function showUserFriendlyError(message) {
    // Create or get error container
    let errorContainer = document.getElementById('error-container');
    if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.id = 'error-container';
        errorContainer.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #ff5733;
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 16px;
        `;
        document.body.appendChild(errorContainer);
    }

    // Add error message with icon
    errorContainer.innerHTML = `
        ⚠️ ${message}
        <button onclick="this.parentElement.remove()" style="
            background: none;
            border: none;
            color: white;
            margin-left: 10px;
            cursor: pointer;
            font-size: 20px;
        ">×</button>
    `;

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (errorContainer.parentNode) {
            errorContainer.remove();
        }
    }, 5000);
}

// /**
//  * Wraps an async function with error handling
//  * @param {Function} fn - The async function to wrap
//  * @param {string} context - The context for error reporting
//  * @param {Function} [fallback] - Optional fallback function
//  * @returns {Function} Wrapped function with error handling
//  */
// export function withErrorHandling(fn, context, fallback = null) {
//     return async (...args) => {
//         try {
//             return await fn(...args);
//         } catch (error) {
//             handleError(error, context, fallback);
//             throw error; // Re-throw to allow for further handling if needed
//         }
//     };
// }
