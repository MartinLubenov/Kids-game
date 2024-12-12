/**
 * @fileOverview Utility Helper Functions for Kids Educational Game
 * 
 * This module provides a collection of utility functions to support
 * various game mechanics, resource management, and dynamic content loading.
 * 
 * Key Features:
 * - Array manipulation (shuffling)
 * - Random number generation
 * - CSS resource management
 * - Dynamic image loading
 * - Error-safe utility functions
 * 
 * Design Principles:
 * - Modular and reusable functions
 * - Comprehensive error handling
 * - Dynamic resource management
 * 
 * @module Helpers
 * @requires ./errorHandler.js
 * @requires ../app.js
 * 
 * @author Martin Lubenov
 * @version 1.0.0
 * @license MIT
 */

import { handleError, GameError, ErrorTypes } from './errorHandler.js';
import { untrackCSS } from '../app.js';

/**
 * Shuffles the elements of an array in-place and returns the array.
 * 
 * @param {Array} array - The array to be shuffled.
 * @returns {Array} The shuffled array.
 */
export function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Generates a random integer within a specified range.
 * 
 * @param {number} min - The minimum value (inclusive).
 * @param {number} max - The maximum value (inclusive).
 * @returns {number} A random integer between min and max.
 */
export function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Unloads a CSS file from the document.
 * 
 * @param {string} filename - The filename of the CSS file to unload.
 * @throws {GameError} If the filename is not provided or the CSS file is not found.
 */
export function unloadCSS(filename) {
    try {
        if (!filename) {
            throw new GameError(
                'No filename provided for CSS unloading',
                ErrorTypes.RESOURCE,
                { filename }
            );
        }

        // Normalize filename to ensure consistent matching
        const normalizedFilename = filename.replace(/^\//, '');

        const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
        let found = false;

        links.forEach(link => {
            // Check if the link's href contains the normalized filename
            if (link.href && link.href.includes(normalizedFilename)) {
                document.head.removeChild(link);
                console.log(`Премахнат CSS файл: ${normalizedFilename}`);
                untrackCSS(normalizedFilename);
                found = true;
            }
        });

        if (!found) {
            console.warn(`CSS file not found: ${normalizedFilename}`);
            // Instead of throwing an error, log a warning and continue
            // This prevents breaking the game flow if a CSS file is not present
        }
    } catch (error) {
        handleError(
            error instanceof GameError ? error : new GameError(
                'Failed to unload CSS file',
                ErrorTypes.ASSET_LOADING,
                { filename, originalError: error.message }
            ),
            'helpers.unloadCSS'
        );
    }
}

/**
 * Retrieves the current game CSS path.
 * 
 * @returns {string|null} The current game CSS path or null if not found.
 */
export function getCurrentGameCssPath() {
    try {
        const links = Array.from(document.getElementsByTagName('link'));
        const gameCssLink = links.find(link => 
            link.href && link.href.includes('/game') && link.href.endsWith('.css')
        );

        if (!gameCssLink) {
            throw new GameError(
                'No game CSS file found',
                ErrorTypes.RESOURCE
            );
        }

        const fullPath = gameCssLink.href;
        const pathParts = fullPath.split('/');
        const gameIndex = pathParts.findIndex(part => part.startsWith('game'));
        if (gameIndex !== -1) {
            return pathParts.slice(gameIndex).join('/');
        }
    } catch (error) {
        handleError(
            error instanceof GameError ? error : new GameError(
                'Failed to get current game CSS path',
                ErrorTypes.RUNTIME,
                { originalError: error.message }
            ),
            'helpers.getCurrentGameCssPath'
        );
        return null;
    }
}

/**
 * Retrieves a list of game images for a given game name.
 * 
 * @param {string} gameName - The name of the game.
 * @returns {Promise<Array>} A promise resolving to an array of game image objects.
 */
export async function getGameImages(gameName) {
    try {
        if (!gameName) {
            throw new GameError(
                'No game name provided',
                ErrorTypes.RESOURCE,
                { gameName }
            );
        }

        const response = await fetch(`/games/${gameName}/images/`);
        const text = await response.text();
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = text;
        
        const imageFiles = Array.from(tempDiv.getElementsByTagName('a'))
            .map(a => a.href)
            .filter(href => href.match(/\.(png|jpg|jpeg|gif)$/i))
            .map(href => {
                const fileName = href.split('/').pop();
                const name = fileName.split('.')[0];
                return {
                    name: name.charAt(0).toUpperCase() + name.slice(1),
                    img: `games/${gameName}/images/${fileName}`
                };
            });
            
        return imageFiles;
    } catch (error) {
        handleError(
            error instanceof GameError ? error : new GameError(
                'Failed to load game images',
                ErrorTypes.ASSET_LOADING,
                { gameName, originalError: error.message }
            ),
            'helpers.getGameImages'
        );
        return [];
    }
}
