// Create a single AudioContext instance to be reused.
// It's created on the first sound play request to ensure it's user-initiated
// and compliant with browser autoplay policies.
let audioCtx: AudioContext | null = null;

const initializeAudioContext = () => {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.error("Web Audio API is not supported in this browser");
    }
  }
};

const playSound = (type: 'correct' | 'incorrect') => {
  // Lazily initialize AudioContext on first user interaction
  initializeAudioContext();
  if (!audioCtx) return;

  // Resume context if it was suspended
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.4, audioCtx.currentTime + 0.01); // Quick attack

  if (type === 'correct') {
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(660, audioCtx.currentTime); // E5
    oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1); // A5
  } else {
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(220, audioCtx.currentTime); // A3
    oscillator.frequency.exponentialRampToValueAtTime(110, audioCtx.currentTime + 0.2); // A2
  }

  oscillator.start(audioCtx.currentTime);
  // Fade out smoothly
  gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.2);
  oscillator.stop(audioCtx.currentTime + 0.2);
};

export const playCorrectSound = () => {
  playSound('correct');
};

export const playIncorrectSound = () => {
  playSound('incorrect');
};
