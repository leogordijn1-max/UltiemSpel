// Small synthesized sound layer; browsers start it only after the first gesture.
let audioContext = null;
let effectVolume = storageNumber("shadowSfx", 0.25, 0, 0.6);
let musicVolume = storageNumber("shadowMusic", 0.08, 0, 0.5);
let audioMuted = storageGet("shadowMuted", "false") === "true";
let musicOscillators = [];
let activeSoundVoices = 0;
const sfxLastByName = new Map();
const soundPresets = {
  shot: [420, 0.035, "triangle"], hit: [170, 0.07, "square"],
  crit: [385, 0.13, "triangle"], impact: [115, 0.13, "sawtooth"],
  block: [610, 0.06, "sine"], kill: [240, 0.10, "sine"],
  xp: [730, 0.045, "sine"], level: [910, 0.2, "triangle"],
  bomb: [79, 0.30, "sawtooth"], boss: [101, 0.48, "sawtooth"],
  gameover: [125, 0.62, "triangle"],
  victory: [880, 0.85, "triangle"], evolution: [1010, 0.66, "sine"],
  "boss-warn": [310, 0.30, "sawtooth"],
  dash: [520, 0.10, "triangle"], lightning: [340, 0.14, "sawtooth"],
  flame: [205, 0.13, "triangle"], frost: [840, 0.17, "sine"],
  fish: [670, 0.11, "triangle"], boomerang: [480, 0.12, "triangle"],
};

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
  const critical = ["victory", "evolution", "gameover", "boss", "boss-warn"].includes(name);
  const delay = name === "hit" ? 0.095 :
    name === "crit" ? .16 : name === "impact" ? .19 :
    name === "xp" ? 0.065 : name === "shot" ? 0.05 : name === "kill" ? 0.065 :
      critical ? 0.32 : 0.09;
  if (now - (sfxLastByName.get(name) ?? -100) < delay) return;
  if (activeSoundVoices >= (critical ? 15 : 9)) return;
  sfxLastByName.set(name, now);
  const [frequency, duration, type] = soundPresets[name] || soundPresets.hit;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(35, frequency * 0.55), now + duration);
  const loudness = critical ? 0.6 : name === "hit" ? 0.25 :
    name === "crit" ? .48 : name === "impact" ? .32 :
    name === "xp" ? 0.2 : 0.42;
  gain.gain.setValueAtTime(Math.min(0.18, effectVolume * loudness), now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  oscillator.connect(gain).connect(audioContext.destination);
  activeSoundVoices++;
  oscillator.onended = () => { activeSoundVoices = Math.max(0, activeSoundVoices - 1); };
  oscillator.start();
  oscillator.stop(now + duration);
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
