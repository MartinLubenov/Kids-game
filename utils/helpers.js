import { handleError, GameError, ErrorTypes } from './errorHandler.js';
import { untrackCSS } from '../app.js';

export function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function unloadCSS(filename) {
    try {
        if (!filename) {
            throw new GameError(
                'No filename provided for CSS unloading',
                ErrorTypes.RESOURCE,
                { filename }
            );
        }

        const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
        let found = false;

        links.forEach(link => {
            if (link.href && link.href.includes(filename)) {
                document.head.removeChild(link);
                console.log(`Премахнат CSS файл: ${filename}`);
                untrackCSS(filename);
                found = true;
            }
        });

        if (!found) {
            throw new GameError(
                'CSS file not found',
                ErrorTypes.RESOURCE,
                { filename }
            );
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
