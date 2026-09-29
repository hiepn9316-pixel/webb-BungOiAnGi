const STORAGE_KEY = 'bungoi-sounds-enabled';
const SOUND_NOTES = {
    tap: [{ frequency: 680, endFrequency: 920, delay: 0, duration: 0.075, waveform: 'sine', volume: 0.035 }],
    roll: [
        { frequency: 240, endFrequency: 370, delay: 0, duration: 0.28, waveform: 'triangle', volume: 0.035 },
        { frequency: 310, endFrequency: 470, delay: 0.09, duration: 0.25, waveform: 'sine', volume: 0.025 },
        { frequency: 420, endFrequency: 640, delay: 0.2, duration: 0.22, waveform: 'triangle', volume: 0.03 },
        { frequency: 570, endFrequency: 820, delay: 0.32, duration: 0.2, waveform: 'sine', volume: 0.025 }
    ],
    success: [
        { frequency: 523.25, delay: 0, duration: 0.24, waveform: 'sine', volume: 0.04 },
        { frequency: 659.25, delay: 0.045, duration: 0.26, waveform: 'triangle', volume: 0.027 },
        { frequency: 783.99, delay: 0.09, duration: 0.3, waveform: 'sine', volume: 0.035 },
        { frequency: 1046.5, delay: 0.15, duration: 0.36, waveform: 'sine', volume: 0.025 }
    ],
    error: [
        { frequency: 392, endFrequency: 330, delay: 0, duration: 0.13, waveform: 'triangle', volume: 0.035 },
        { frequency: 293.66, endFrequency: 246.94, delay: 0.1, duration: 0.18, waveform: 'sine', volume: 0.03 }
    ]
};

let audioContext;
let soundEnabled = readSoundPreference();

function readSoundPreference() {
    try {
        return localStorage.getItem(STORAGE_KEY) !== 'false';
    } catch {
        return true;
    }
}

function saveSoundPreference() {
    try {
        localStorage.setItem(STORAGE_KEY, String(soundEnabled));
    } catch {
        // Sound still works when browser storage is unavailable.
    }
}

function updateSoundButton(button) {
    if (!button) return;
    const label = soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh';
    button.setAttribute('aria-label', label);
    button.setAttribute('aria-pressed', String(soundEnabled));
    button.title = label;
    button.classList.toggle('is-muted', !soundEnabled);
    button.querySelector('[data-sound-icon]').textContent = soundEnabled ? '🔊' : '🔇';
    button.querySelector('[data-sound-label]').textContent = soundEnabled ? 'Âm thanh bật' : 'Âm thanh tắt';
}

export function playUiSound(type = 'tap') {
    if (!soundEnabled) return;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    try {
        audioContext ??= new AudioContextClass();
        if (audioContext.state === 'suspended') void audioContext.resume();

        const startTime = audioContext.currentTime;
        (SOUND_NOTES[type] || SOUND_NOTES.tap).forEach(({ frequency, endFrequency, delay, duration, waveform, volume: peakVolume }) => {
            const oscillator = audioContext.createOscillator();
            const volume = audioContext.createGain();
            const noteStart = startTime + delay;
            oscillator.type = waveform || 'sine';
            oscillator.frequency.setValueAtTime(frequency, noteStart);
            if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, noteStart + duration);
            volume.gain.setValueAtTime(0.0001, noteStart);
            volume.gain.exponentialRampToValueAtTime(peakVolume || 0.04, noteStart + 0.012);
            volume.gain.exponentialRampToValueAtTime(0.0001, noteStart + duration);
            oscillator.connect(volume);
            volume.connect(audioContext.destination);
            oscillator.start(noteStart);
            oscillator.stop(noteStart + duration + 0.01);
        });
    } catch {
        // A sound failure must not interrupt the food-picking flow.
    }
}

export function initializeSounds() {
    const toggle = document.getElementById('sound-toggle');
    updateSoundButton(toggle);

    toggle?.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        saveSoundPreference();
        updateSoundButton(toggle);
        if (soundEnabled) playUiSound('tap');
    });

    document.addEventListener('click', (event) => {
        const target = event.target.closest('button, a, [role="button"], .dish-card');
        if (!target || target.id === 'sound-toggle'
            || target.matches('.btn-roll, .btn-wheel-spin, .wheel-hub, [data-action="reroll"]')) return;
        playUiSound('tap');
    }, true);

    document.addEventListener('change', (event) => {
        if (event.target.matches('select, input[type="checkbox"], input[type="radio"]')) {
            playUiSound('tap');
        }
    });
}