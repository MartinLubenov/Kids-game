// import 'https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.3/howler.min.js';

const Howl = window.Howl;

class SoundManager {
    constructor() {
        this.sounds = new Map();
    }

    loadSound(id, src, options = {}) {
        if (this.sounds.has(id)) {
            console.log(`Sound ${id} already loaded`);
            return this.sounds.get(id);
        }

        const defaultOptions = {
            src: [src],
            html5: true,
            preload: true,
            ...options
        };

        const sound = new Howl(defaultOptions);
        this.sounds.set(id, sound);
        return sound;
    }

    play(id, sprite = null) {
        const sound = this.sounds.get(id);
        if (!sound) {
            console.warn(`Sound ${id} not found`);
            return null;
        }

        if (sprite) {
            return sound.play(sprite);
        }
        return sound.play();
    }

    stop(id) {
        const sound = this.sounds.get(id);
        if (sound) {
            sound.stop();
        }
    }

    pause(id) {
        const sound = this.sounds.get(id);
        if (sound) {
            sound.pause();
        }
    }

    resume(id) {
        const sound = this.sounds.get(id);
        if (sound) {
            sound.play();
        }
    }

    setVolume(id, volume) {
        const sound = this.sounds.get(id);
        if (sound) {
            sound.volume(volume);
        }
    }

    unload(id) {
        const sound = this.sounds.get(id);
        if (sound) {
            sound.unload();
            this.sounds.delete(id);
        }
    }

    unloadAll() {
        this.sounds.forEach(sound => sound.unload());
        this.sounds.clear();
    }
}

// Create a singleton instance
export const soundManager = new SoundManager();
export default soundManager;
