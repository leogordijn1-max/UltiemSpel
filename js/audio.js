// Small synthesized sound layer; browsers start it only after the first gesture.
let audioContext = null;
let effectVolume = storageNumber("shadowSfx", 0.25, 0, 0.6);
let musicVolume = storageNumber("shadowMusic", 0.08, 0, 0.5);
let audioMuted = storageGet("shadowMuted", "false") === "true";
let musicOscillators = [];
let lastSfxAt = 0;
let activeSoundVoices = 0;

function startAudio() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  audioContext ||= new AudioContextClass();
  if (audioContext.state === "suspended") audioContext.resume();
  if (!musicOscillators.length) {
    for (const [frequency, type] of [[55, "sine"], [82.4, "triangle"]]) {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      gain.gain.value = 0;
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start();
      musicOscillators.push({ oscillator, gain });
    }
  }
  updateMusicGain();
}

function updateMusicGain() {
  for (const { gain } of musicOscillators) {
    gain.gain.setTargetAtTime(audioMuted ? 0 : musicVolume * 0.12, audioContext.currentTime, 0.25);
  }
}

function playSfx(name = "hit") {
  if (audioMuted || effectVolume <= 0) return;
  startAudio();
  if (!audioContext) return;
  const now = audioContext.currentTime;
  if (now - lastSfxAt < 0.045 || activeSoundVoices >= 14) return;
  lastSfxAt = now;
  const presets = {
    shot: [420, 0.035, "triangle"], hit: [170, 0.07, "square"], block: [580, 0.06, "sine"],
    kill: [240, 0.11, "sine"], xp: [720, 0.06, "sine"],
    level: [880, 0.18, "triangle"], bomb: [72, 0.3, "sawtooth"],
    boss: [95, 0.5, "sawtooth"], gameover: [110, 0.65, "triangle"],
  };
  const [frequency, duration, type] = presets[name] || presets.hit;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(35, frequency * 0.55), audioContext.currentTime + duration);
  gain.gain.setValueAtTime(Math.min(0.18, effectVolume * 0.45), audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
  oscillator.connect(gain).connect(audioContext.destination);
  activeSoundVoices++;
  oscillator.onended = () => { activeSoundVoices = Math.max(0, activeSoundVoices - 1); };
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
}

function configureAudio() {
  const effects = $("effectVolume");
  const music = $("musicVolume");
  const mute = $("muteAudio");
  if (!effects || !music || !mute) return;
  effects.value = effectVolume;
  music.value = musicVolume;
  mute.checked = audioMuted;
  effects.oninput = () => { effectVolume = Number(effects.value); storageSet("shadowSfx", effectVolume); };
  music.oninput = () => { musicVolume = Number(music.value); storageSet("shadowMusic", musicVolume); updateMusicGain(); };
  mute.onchange = () => { audioMuted = mute.checked; storageSet("shadowMuted", audioMuted); updateMusicGain(); };
}
