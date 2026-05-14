import React, { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:          '#0A0A0F',
  surface:     '#111118',
  elevated:    '#1A1A24',
  accent:      '#6B5CE7',
  danger:      '#E94560',
  success:     '#1D9E75',
  textPri:     '#F0F0F5',
  textSec:     '#888899',
  control:     '#2A2A38',
  border:      '#1E1E28',
  well:        '#0D0D14',
  warn:        '#F5A623',
  accentMuted: 'rgba(107,92,231,0.13)',
  // Studio theme
  wood:        '#2E1A0E',
  woodLight:   '#4A2C17',
  vuGreen:     '#1EC94A',
  vuAmber:     '#F5A623',
  vuRed:       '#E94560',
  metalDark:   '#14141E',
  metalMid:    '#2A2A3C',
  metalLight:  '#3A3A52',
}

let _knobId = 0

// ─── Collaborators ────────────────────────────────────────────────────────────
const COLLAB_COLORS = ['#6B5CE7', '#1D9E75', '#E94560', '#F5A623', '#00B4D8']
const COLLABORATORS = [
  { id: 'luke',   name: 'Luke',   initial: 'L', color: COLLAB_COLORS[0], role: 'Owner'  },
  { id: 'anna',   name: 'Anna',   initial: 'A', color: COLLAB_COLORS[1], role: 'Editor' },
  { id: 'miguel', name: 'Miguel', initial: 'M', color: COLLAB_COLORS[2], role: 'Editor' },
  { id: 'priya',  name: 'Priya',  initial: 'P', color: COLLAB_COLORS[3], role: 'Viewer' },
]
const CURRENT_USER = COLLABORATORS[0]
const IS_VIEWER = CURRENT_USER.role === 'Viewer'

// ─── Types ────────────────────────────────────────────────────────────────────
type Tool = 'select' | 'cut'

interface ClipData {
  id: string
  bar: number
  len: number
  label: string
  fadeIn: number       // bars
  fadeOut: number      // bars
  fadeInCurve: number  // bezier tension 0..1, 0.5 = linear
  fadeOutCurve: number // bezier tension 0..1, 0.5 = linear
  crossfadeLocked: boolean // true = symmetry lock: dragging one curve mirrors partner (equal-power mode)
  assetUrl: string | null  // synthetic key referencing a procedural audio generator
}

interface Track {
  id: string
  name: string
  type: 'Audio' | 'MIDI' | 'Bus'
  owner: typeof COLLABORATORS[number]
  armed: boolean
  muted: boolean
  soloed: boolean
  volume: number
  pan: number           // -100 to 100, 0 = center
  lockedBy: string | null  // collaborator id, null = unlocked
  audioInput: string | null  // e.g. "In 1–2", null = no input
  clips: ClipData[]
}

type PluginType = 'compressor' | 'reverb' | 'delay' | 'maximizer' | 'eq' | 'limiter'
interface PluginSlot {
  id: string
  type: PluginType
  enabled: boolean
  params: Record<string, number>
}

interface DragState {
  clipId: string
  sourceTrackId: string
  targetTrackId: string
  mode: 'move' | 'resize-left' | 'resize-right' | 'fade-in' | 'fade-out'
  startClientX: number
  startClientY: number
  startBar: number
  startLen: number
  startFadeIn: number
  startFadeOut: number
  barOffset: number    // click position within clip, in bars
  previewBar: number
  valid: boolean       // cross-track type compatibility
  // Pre-overlap fade lengths — stored when overlap is first detected, restored on separation
  _preFadeIn: number | null
  _preFadeOut: number | null
}

interface CtxMenu {
  x: number; y: number
  clipId: string; trackId: string
  clipType: 'Audio' | 'MIDI' | 'Bus'
}

// ─── Constants ────────────────────────────────────────────────────────────────
const BAR_W       = 72
const BARS        = 32
const TRACK_H     = 64
const RULER_H     = 24
const HANDLE_W    = 8
const FADE_HDL_W  = 12
const TRANSPORT_H = 52   // px — matches TransportBar height
const STATUS_BAR_H = 28  // px — matches StatusBar height

// ─── Virtual instruments for Bounce modal ─────────────────────────────────────
const VIRTUAL_INSTRUMENTS = [
  { id: 'grand-piano',    name: 'Grand Piano',      category: 'Keys',        presets: ['Steinway D', 'Upright Jazz', 'Studio Bright', 'Soft Room'] },
  { id: 'electric-piano', name: 'Electric Piano',   category: 'Keys',        presets: ['Rhodes Warm', 'Wurlitzer 200', 'Suitcase Mk II'] },
  { id: 'organ',          name: 'Hammond Organ',    category: 'Keys',        presets: ['B3 Full Draw', 'Gospel Wheels', 'Jazz Combo', 'Rock Grind'] },
  { id: 'synth-lead',     name: 'Synth Lead',       category: 'Synth',       presets: ['Warm Saw', 'Bright Square', 'Analog Mono', 'PWM Lead'] },
  { id: 'synth-pad',      name: 'Synth Pad',        category: 'Synth',       presets: ['Lush Pad', 'Strings Hybrid', 'Slow Evolve', 'Choir Pad'] },
  { id: 'bass-synth',     name: 'Bass Synth',       category: 'Bass',        presets: ['Sub Bass', 'Acid 303', 'Moog Bass', 'Reese Bass'] },
  { id: 'electric-bass',  name: 'Electric Bass',    category: 'Bass',        presets: ['Fingered DI', 'Slap Funk', 'Fretless Mwah', 'Pick Bright'] },
  { id: 'elec-guitar',    name: 'Electric Guitar',  category: 'Guitar',      presets: ['Clean Strat', 'Crunch Marshall', 'Lead Overdrive', 'Funk Rhythm'] },
  { id: 'acou-guitar',    name: 'Acoustic Guitar',  category: 'Guitar',      presets: ['Steel String', 'Fingerpicked', 'Strummed Folk'] },
  { id: 'strings',        name: 'String Ensemble',  category: 'Orchestral',  presets: ['Lush Strings', 'Pizzicato', 'Staccato', 'Solo Violin'] },
  { id: 'brass',          name: 'Brass Section',    category: 'Orchestral',  presets: ['Full Section', 'Solo Trumpet', 'Trombone', 'Sax Section'] },
  { id: 'drums',          name: 'Drum Kit',         category: 'Drums',       presets: ['Studio Rock', 'Brushes Jazz', 'Electronic', 'Vintage MPC', 'Trap Kit'] },
]
const INSTR_CATEGORIES = ['All', ...Array.from(new Set(VIRTUAL_INSTRUMENTS.map(i => i.category)))]

const HUMANIZER_STYLES = [
  { id: 'rock',    label: 'Rock',    desc: 'Aggressive, tight, driving' },
  { id: 'blues',   label: 'Blues',   desc: 'Laid back, swing feel' },
  { id: 'jazz',    label: 'Jazz',    desc: 'Swing 8ths, dynamic, rubato' },
  { id: 'funk',    label: 'Funk',    desc: 'Tight on the 1, syncopated' },
  { id: 'soul',    label: 'Soul',    desc: 'Warm, behind the beat' },
  { id: 'country', label: 'Country', desc: 'Clean, melodic, shuffle' },
  { id: 'hiphop',  label: 'Hip Hop', desc: 'Quantized feel, pocket groove' },
]

// ─── Seed tracks ─────────────────────────────────────────────────────────────
// ─── Procedural audio synthesis keys ─────────────────────────────────────────
// Each key maps to a synthesis function in the audio engine below.
// The "URL" is a synthetic identifier — no actual file is fetched.
const AUDIO_KEY = {
  kick:   'synth://kick',
  snare:  'synth://snare',
  hihat:  'synth://hihat',
  bass:   'synth://bass',
  lead:   'synth://lead',
  pad:    'synth://pad',
  vox:    'synth://vox',
} as const

let _clipSeq = 0
const mkClip = (bar: number, len: number, label: string, assetUrl: string | null = null): ClipData => ({
  id: `clip-${++_clipSeq}`, bar, len, label,
  fadeIn: 0, fadeOut: 0, fadeInCurve: 0.7, fadeOutCurve: 0.7,
  crossfadeLocked: true,
  assetUrl,
})

const INITIAL_TRACKS: Track[] = [
  { id: 't1', name: 'Kick',       type: 'Audio', owner: COLLABORATORS[0], armed: false, muted: false, soloed: false, volume: 85, pan: 0,   lockedBy: null,   audioInput: null,     clips: [mkClip(0,4,'Kick A', AUDIO_KEY.kick), mkClip(4,4,'Kick A', AUDIO_KEY.kick), mkClip(10,2,'Fill', AUDIO_KEY.kick)] },
  { id: 't2', name: 'Snare',      type: 'Audio', owner: COLLABORATORS[1], armed: false, muted: false, soloed: false, volume: 78, pan: 0,   lockedBy: null,   audioInput: null,     clips: [mkClip(0,8,'Snare Ptn', AUDIO_KEY.snare)] },
  { id: 't3', name: 'Hi-Hat',     type: 'Audio', owner: COLLABORATORS[1], armed: false, muted: false, soloed: false, volume: 60, pan: 20,  lockedBy: null,   audioInput: 'In 1–2', clips: [mkClip(0,16,'HH 16th', AUDIO_KEY.hihat)] },
  { id: 't4', name: 'Bass Line',  type: 'MIDI',  owner: COLLABORATORS[2], armed: true,  muted: false, soloed: false, volume: 90, pan: 0,   lockedBy: 'luke', audioInput: null,     clips: [mkClip(2,6,'Bass A', AUDIO_KEY.bass), mkClip(10,4,'Bass B', AUDIO_KEY.bass)] },
  { id: 't5', name: 'Lead Synth', type: 'MIDI',  owner: COLLABORATORS[0], armed: false, muted: false, soloed: false, volume: 72, pan: -15, lockedBy: null,   audioInput: null,     clips: [mkClip(4,8,'Lead A', AUDIO_KEY.lead)] },
  { id: 't6', name: 'Pad',        type: 'MIDI',  owner: COLLABORATORS[3], armed: false, muted: true,  soloed: false, volume: 55, pan: 0,   lockedBy: null,   audioInput: null,     clips: [mkClip(0,12,'Pad Chord', AUDIO_KEY.pad)] },
  { id: 't7', name: 'Vox Bus',    type: 'Bus',   owner: COLLABORATORS[0], armed: false, muted: false, soloed: false, volume: 95, pan: 0,   lockedBy: null,   audioInput: null,     clips: [] },
]

// ─── Audio engine ─────────────────────────────────────────────────────────────
// Single shared AudioContext — created on first user gesture to satisfy autoplay policy.
let _audioCtx: AudioContext | null = null
let _masterGain: GainNode | null = null
let _masterAnalyser: AnalyserNode | null = null

function getAudioCtx(): AudioContext {
  if (!_audioCtx) {
    _audioCtx = new AudioContext()
    _masterGain = _audioCtx.createGain()
    _masterGain.gain.value = 0.95
    _masterAnalyser = _audioCtx.createAnalyser()
    _masterAnalyser.fftSize = 256
    _masterAnalyser.smoothingTimeConstant = 0
    _masterGain.connect(_masterAnalyser)
    _masterAnalyser.connect(_audioCtx.destination)
  }
  if (_audioCtx.state === 'suspended') _audioCtx.resume()
  return _audioCtx
}

// Decoded buffer cache: assetUrl → AudioBuffer
const _bufferCache = new Map<string, AudioBuffer>()

// Waveform sample cache: assetUrl → downsampled Float32Array for canvas drawing
const _waveformCache = new Map<string, Float32Array>()

// ── Procedural synthesis ──────────────────────────────────────────────────────
// Each generator produces a 2-bar loop at 128 BPM (≈3.75 s at 44100 Hz).
// All audio is stereo for panning to work correctly.

function synthKick(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate
  const dur = 0.55
  const buf = ctx.createBuffer(2, Math.ceil(sr * dur), sr)
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    for (let i = 0; i < d.length; i++) {
      const t = i / sr
      // Sine with pitch envelope (60→30 Hz in 0.15 s) + click transient
      const freq = 60 * Math.exp(-t * 25)
      const phase = 2 * Math.PI * freq * t
      const env = Math.exp(-t * 8)
      const click = t < 0.003 ? (Math.random() * 2 - 1) * 0.6 : 0
      d[i] = Math.sin(phase) * env * 0.9 + click
    }
  }
  return buf
}

function synthSnare(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate
  const dur = 0.35
  const buf = ctx.createBuffer(2, Math.ceil(sr * dur), sr)
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    for (let i = 0; i < d.length; i++) {
      const t = i / sr
      const toneEnv = Math.exp(-t * 18)
      const noiseEnv = Math.exp(-t * 12)
      const tone = Math.sin(2 * Math.PI * 180 * t) * toneEnv * 0.4
      const noise = (Math.random() * 2 - 1) * noiseEnv * 0.7
      d[i] = (tone + noise) * 0.85
    }
  }
  return buf
}

function synthHihat(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate
  // 2-bar 16th-note pattern at 128 BPM = 16 hits over 3.75 s
  const barDur = 60 / 128 * 4
  const totalDur = barDur * 2
  const buf = ctx.createBuffer(2, Math.ceil(sr * totalDur), sr)
  const hitDur = 0.06
  const hitSamples = Math.ceil(sr * hitDur)
  const barSamples = Math.ceil(sr * barDur)
  const sixteenthSamples = barSamples / 4
  const hits16 = 8  // 8 hits per bar × 2 bars = 16 total

  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    for (let hit = 0; hit < hits16 * 2; hit++) {
      const start = Math.floor(hit * sixteenthSamples)
      const isAccent = hit % 2 === 0
      const amp = isAccent ? 0.65 : 0.38
      for (let j = 0; j < hitSamples && start + j < d.length; j++) {
        const t = j / sr
        const env = Math.exp(-t / (hitDur * 0.4))
        d[start + j] += (Math.random() * 2 - 1) * env * amp
      }
    }
  }
  return buf
}

function synthBass(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate
  const barDur = 60 / 128 * 4
  const totalDur = barDur * 2
  const buf = ctx.createBuffer(2, Math.ceil(sr * totalDur), sr)
  // Simple two-note bassline: C2 (65.4 Hz) and G2 (98 Hz)
  const notes = [
    { start: 0, dur: 0.45, freq: 65.4 },
    { start: 0.5, dur: 0.45, freq: 65.4 },
    { start: 1.0, dur: 0.45, freq: 98.0 },
    { start: 1.5, dur: 0.45, freq: 65.4 },
    { start: 2.0, dur: 0.45, freq: 65.4 },
    { start: 2.5, dur: 0.45, freq: 73.4 },
    { start: 3.0, dur: 0.45, freq: 98.0 },
    { start: 3.5, dur: 0.45, freq: 87.3 },
  ]
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    for (const note of notes) {
      const startSample = Math.floor(note.start * sr)
      const durSamples  = Math.ceil(note.dur * sr)
      for (let j = 0; j < durSamples && startSample + j < d.length; j++) {
        const t = j / sr
        const env = Math.exp(-t * 3) * (1 - Math.exp(-t * 80))
        // Saw wave approximation (4 partials) for that gritty synth bass feel
        const saw = Math.sin(2 * Math.PI * note.freq * t)
               + Math.sin(2 * Math.PI * note.freq * 2 * t) * 0.5
               + Math.sin(2 * Math.PI * note.freq * 3 * t) * 0.25
               + Math.sin(2 * Math.PI * note.freq * 4 * t) * 0.12
        d[startSample + j] += saw * env * 0.35
      }
    }
  }
  return buf
}

function synthLead(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate
  const barDur = 60 / 128 * 4
  const totalDur = barDur * 2
  const buf = ctx.createBuffer(2, Math.ceil(sr * totalDur), sr)
  // Pentatonic lead melody in A minor (A4=440, C5=523, E5=659, G5=784)
  const melody = [
    { start: 0,    dur: 0.3,  freq: 440  },
    { start: 0.35, dur: 0.15, freq: 523  },
    { start: 0.55, dur: 0.4,  freq: 659  },
    { start: 1.0,  dur: 0.25, freq: 784  },
    { start: 1.3,  dur: 0.2,  freq: 659  },
    { start: 1.55, dur: 0.4,  freq: 523  },
    { start: 2.0,  dur: 0.5,  freq: 440  },
    { start: 2.6,  dur: 0.3,  freq: 392  },
    { start: 3.0,  dur: 0.25, freq: 440  },
    { start: 3.3,  dur: 0.6,  freq: 523  },
  ]
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    for (const note of melody) {
      const startSample = Math.floor(note.start * sr)
      const durSamples  = Math.ceil(note.dur * sr)
      for (let j = 0; j < durSamples && startSample + j < d.length; j++) {
        const t = j / sr
        const attack = Math.min(t / 0.01, 1)
        const release = Math.max(0, 1 - (t - (note.dur - 0.04)) / 0.04)
        const env = attack * Math.min(release, 1) * 0.55
        // Square-ish wave (odd harmonics)
        const sq = Math.sin(2 * Math.PI * note.freq * t)
               + Math.sin(2 * Math.PI * note.freq * 3 * t) * 0.33
               + Math.sin(2 * Math.PI * note.freq * 5 * t) * 0.2
        // Add slight vibrato
        const vib = Math.sin(2 * Math.PI * 5.5 * t) * 0.015 * Math.min(t / 0.1, 1)
        d[startSample + j] += (sq + vib) * env
      }
    }
  }
  return buf
}

function synthPad(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate
  const barDur = 60 / 128 * 4
  const totalDur = barDur * 4  // 4-bar pad loop for lushness
  const buf = ctx.createBuffer(2, Math.ceil(sr * totalDur), sr)
  // Slow-attack chord: Am add9 (A2, E3, A3, B3, E4)
  const freqs = [110, 165, 220, 247, 330]
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    const detune = ch === 0 ? 1.003 : 0.997  // stereo width via slight detuning
    for (let i = 0; i < d.length; i++) {
      const t = i / sr
      const attack = Math.min(t / 1.2, 1)
      const release = Math.max(0, 1 - Math.max(0, t - (totalDur - 1.5)) / 1.5)
      const env = attack * release * 0.18
      let sample = 0
      for (const f of freqs) {
        // Sine + detuned sub for lush pad character
        sample += Math.sin(2 * Math.PI * f * detune * t)
              + Math.sin(2 * Math.PI * f * detune * 2 * t) * 0.2
      }
      d[i] = sample * env
    }
  }
  return buf
}

function synthVox(ctx: AudioContext): AudioBuffer {
  const sr = ctx.sampleRate
  const barDur = 60 / 128 * 4
  const totalDur = barDur * 2
  const buf = ctx.createBuffer(2, Math.ceil(sr * totalDur), sr)
  // Formant-ish vocal chop: 4 one-shot stabs with pitch variation
  const chops = [
    { start: 0,    dur: 0.25, freq: 330, formant: 800  },
    { start: 0.75, dur: 0.2,  freq: 370, formant: 1000 },
    { start: 1.5,  dur: 0.3,  freq: 294, formant: 750  },
    { start: 2.5,  dur: 0.35, freq: 349, formant: 900  },
    { start: 3.2,  dur: 0.2,  freq: 330, formant: 850  },
  ]
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    for (const chop of chops) {
      const startSample = Math.floor(chop.start * sr)
      const durSamples  = Math.ceil(chop.dur * sr)
      for (let j = 0; j < durSamples && startSample + j < d.length; j++) {
        const t = j / sr
        const env = Math.exp(-t * 6) * (1 - Math.exp(-t * 200))
        // Fundamental + formant resonance approximation
        const fund = Math.sin(2 * Math.PI * chop.freq * t)
        const form = Math.sin(2 * Math.PI * chop.formant * t) * 0.35
        const breath = (Math.random() * 2 - 1) * 0.05
        d[startSample + j] += (fund + form + breath) * env * 0.5
      }
    }
  }
  return buf
}

// Returns a synthesized AudioBuffer for a given synthetic URL key
function synthesizeBuffer(key: string, ctx: AudioContext): AudioBuffer {
  switch (key) {
    case AUDIO_KEY.kick:  return synthKick(ctx)
    case AUDIO_KEY.snare: return synthSnare(ctx)
    case AUDIO_KEY.hihat: return synthHihat(ctx)
    case AUDIO_KEY.bass:  return synthBass(ctx)
    case AUDIO_KEY.lead:  return synthLead(ctx)
    case AUDIO_KEY.pad:   return synthPad(ctx)
    case AUDIO_KEY.vox:   return synthVox(ctx)
    default: return ctx.createBuffer(2, ctx.sampleRate, ctx.sampleRate)
  }
}

// Resolves an assetUrl to an AudioBuffer, synthesizing and caching on first call.
// Returns null if AudioContext hasn't been initialized yet.
function resolveBuffer(assetUrl: string): AudioBuffer | null {
  if (!_audioCtx) return null
  const cached = _bufferCache.get(assetUrl)
  if (cached) return cached
  const buf = synthesizeBuffer(assetUrl, _audioCtx)
  _bufferCache.set(assetUrl, buf)
  return buf
}

// Downsamples channel data to `targetSamples` points for waveform canvas drawing.
function buildWaveformPeaks(buf: AudioBuffer, targetSamples: number): Float32Array {
  const src = buf.getChannelData(0)
  const peaks = new Float32Array(targetSamples)
  const blockSize = Math.floor(src.length / targetSamples)
  for (let i = 0; i < targetSamples; i++) {
    let peak = 0
    const offset = i * blockSize
    for (let j = 0; j < blockSize; j++) {
      const abs = Math.abs(src[offset + j] ?? 0)
      if (abs > peak) peak = abs
    }
    peaks[i] = peak
  }
  return peaks
}

// Active playback nodes — stored outside React state to avoid re-render coupling
interface ActiveSource {
  source: AudioBufferSourceNode
  gain: GainNode
  analyser: AnalyserNode
  panner: StereoPannerNode
}
const _activeSources = new Map<string, ActiveSource>()  // trackId → nodes

// Per-track plugin node map: trackId → (pluginId → primary AudioNode)
// Delay also stores a feedback GainNode under key `${pluginId}__fb`
const _pluginNodeMap: Map<string, Map<string, AudioNode>> = new Map()

// Generates a synthetic reverb impulse response via filtered noise + exponential decay.
// No file fetch — entirely procedural.
function createReverbIR(ctx: AudioContext, duration: number, decay: number): AudioBuffer {
  const sr = ctx.sampleRate
  const length = Math.ceil(sr * duration)
  const ir = ctx.createBuffer(2, length, sr)
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch)
    for (let i = 0; i < length; i++) {
      const t = i / sr
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t / duration, decay)
    }
  }
  return ir
}

// Creates a Web Audio node (or nodes) for a given plugin type.
// Returns the primary AudioNode that signals enter and exit through.
// For delay, also wires the internal feedback loop and stores the feedback GainNode
// in the track's plugin node map under key `${pluginId}__fb`.
function createPluginNode(
  ctx: AudioContext,
  plugin: PluginSlot,
  trackPluginMap: Map<string, AudioNode>,
): AudioNode {
  switch (plugin.type) {
    case 'compressor': {
      const comp = ctx.createDynamicsCompressor()
      comp.threshold.value = -24
      comp.knee.value      = 30
      comp.ratio.value     = 4
      comp.attack.value    = 0.003
      comp.release.value   = 0.25
      return comp
    }
    case 'reverb': {
      const conv = ctx.createConvolver()
      conv.buffer = createReverbIR(ctx, 2.5, 3)
      return conv
    }
    case 'delay': {
      const delay = ctx.createDelay(2)
      delay.delayTime.value = 0.25
      const fb = ctx.createGain()
      fb.gain.value = 0.3
      // Internal feedback loop: delay → fb → delay
      delay.connect(fb)
      fb.connect(delay)
      // Store feedback gain for cleanup
      trackPluginMap.set(`${plugin.id}__fb`, fb)
      return delay
    }
    case 'eq': {
      const eq = ctx.createBiquadFilter()
      eq.type      = 'peaking'
      eq.frequency.value = 1000
      eq.gain.value      = 0
      return eq
    }
    case 'limiter':
    case 'maximizer': {
      const lim = ctx.createDynamicsCompressor()
      lim.threshold.value = -3
      lim.knee.value      = 0
      lim.ratio.value     = 20
      lim.attack.value    = 0.001
      lim.release.value   = 0.1
      return lim
    }
  }
}

// Disconnects and removes all plugin nodes for a single track.
function clearTrackPluginNodes(trackId: string) {
  const map = _pluginNodeMap.get(trackId)
  if (!map) return
  for (const node of map.values()) {
    try { node.disconnect() } catch { /* already disconnected */ }
  }
  map.clear()
  _pluginNodeMap.delete(trackId)
}

// Wires the plugin chain for a single track between `source` and `gain`.
// Creates missing nodes, skips nodes that already exist (reconcile).
// Disabled plugins are bypassed: signal flows directly from the previous
// node to the next enabled plugin (or to `gain` if none remain).
function rewirePluginChain(
  ctx: AudioContext,
  trackId: string,
  plugins: PluginSlot[],
  source: AudioBufferSourceNode,
  gain: GainNode,
) {
  if (!_pluginNodeMap.has(trackId)) _pluginNodeMap.set(trackId, new Map())
  const map = _pluginNodeMap.get(trackId)!

  // Ensure all enabled plugin nodes are created
  for (const plugin of plugins) {
    if (!map.has(plugin.id)) {
      const node = createPluginNode(ctx, plugin, map)
      map.set(plugin.id, node)
    }
  }

  // Remove nodes for plugins no longer in the chain
  const currentIds = new Set(plugins.map(p => p.id))
  for (const key of [...map.keys()]) {
    const baseId = key.replace('__fb', '')
    if (!currentIds.has(baseId)) {
      try { map.get(key)!.disconnect() } catch { /* ok */ }
      map.delete(key)
    }
  }

  // Disconnect source so we can rewire cleanly
  try { source.disconnect() } catch { /* ok */ }

  // Disconnect all plugin primary nodes (feedback loops stay internal)
  for (const plugin of plugins) {
    const node = map.get(plugin.id)
    if (node) try { node.disconnect() } catch { /* ok */ }
  }

  // Build ordered list of enabled plugins only
  const enabled = plugins.filter(p => p.enabled)

  if (enabled.length === 0) {
    source.connect(gain)
    return
  }

  // source → first enabled plugin
  source.connect(map.get(enabled[0].id)!)

  // chain enabled plugins in order
  for (let i = 0; i < enabled.length - 1; i++) {
    map.get(enabled[i].id)!.connect(map.get(enabled[i + 1].id)!)
  }

  // last enabled plugin → fader gain
  map.get(enabled[enabled.length - 1].id)!.connect(gain)
}

function stopAllSources() {
  for (const { source, gain, analyser, panner } of _activeSources.values()) {
    try { source.stop(); source.disconnect(); gain.disconnect(); analyser.disconnect(); panner.disconnect() } catch { /* already stopped */ }
  }
  _activeSources.clear()
  // Also clear all plugin nodes when transport stops
  for (const trackId of [..._pluginNodeMap.keys()]) {
    clearTrackPluginNodes(trackId)
  }
}

// RMS over the analyser's time-domain buffer — returns 0..1 (approximately; clamp upstream)
function readRMS(analyser: AnalyserNode): number {
  const buf = new Float32Array(analyser.fftSize)
  analyser.getFloatTimeDomainData(buf)
  let sum = 0
  for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i]
  return Math.sqrt(sum / buf.length)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }
function snapBar(v: number) { return Math.round(v * 2) / 2 } // snap to half-bar

// DAW fader law: unity (0 dB) at 75% travel, +6 dB at 100%, -inf at 0%.
// Piecewise log curve matching Pro Tools / Logic convention.
function faderToDb(fader: number): number {
  if (fader <= 0) return -Infinity
  const f = fader / 100
  if (f <= 0.75) {
    // Map 0..0.75 → -60..0 dB logarithmically
    return 60 * (Math.log10(f / 0.75) / Math.log10(1 / 0.75)) // 0 dB at f=0.75
  }
  // Map 0.75..1 → 0..+6 dB linearly
  return ((f - 0.75) / 0.25) * 6
}

function formatDb(db: number): string {
  if (!isFinite(db)) return '-∞ dB'
  if (db < -90) return '-∞ dB'
  return `${db >= 0 ? '+' : ''}${db.toFixed(1)} dB`
}

// Bezier fade gain: gain(t) = 2·curve·t·(1−t) + t² where curve ∈ [0.05, 0.95]
// At curve=0.5 this reduces to gain(t)=t (linear).
function fadeGain(t: number, curve: number): number {
  return 2 * curve * t * (1 - t) + t * t
}

// SVG path for the filled fade overlay (darkened region representing attenuation)
function fadePath(w: number, h: number, curve: number, dir: 'in' | 'out'): string {
  const N = 32
  if (dir === 'in') {
    // Fade-in: gain goes 0→1. The dark overlay covers the gain-attenuated area (below the gain curve).
    // We trace the bottom of the clip up through the bezier gain curve.
    let pts = `M0,${h}`
    for (let i = 0; i <= N; i++) {
      const t = i / N
      const g = fadeGain(t, curve)
      pts += ` L${t * w},${h * (1 - g)}`
    }
    pts += ` L${w},${h} Z`
    return pts
  } else {
    // Fade-out: gain goes 1→0. Overlay covers area above the gain curve.
    let pts = `M0,0`
    for (let i = 0; i <= N; i++) {
      const t = i / N
      const g = fadeGain(t, curve)
      const fadeOutGain = 1 - g
      pts += ` L${t * w},${h * (1 - fadeOutGain)}`
    }
    pts += ` L${w},${h} L0,${h} Z`
    return pts
  }
}

// SVG polyline path tracing just the gain curve line (for the visible curve overlay)
function fadeCurveLine(w: number, h: number, curve: number, dir: 'in' | 'out'): string {
  const N = 32
  const pts: string[] = []
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const g = dir === 'in' ? fadeGain(t, curve) : 1 - fadeGain(t, curve)
    pts.push(`${t * w},${h * (1 - g)}`)
  }
  return 'M' + pts.join(' L')
}

// Midpoint handle Y position for a given curve and direction
function fadeMidpointY(h: number, curve: number, dir: 'in' | 'out'): number {
  const g = dir === 'in' ? fadeGain(0.5, curve) : 1 - fadeGain(0.5, curve)
  return h * (1 - g)
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ collab, size = 24, ring = false }: { collab: typeof COLLABORATORS[number]; size?: number; ring?: boolean }) {
  return (
    <div
      title={`${collab.name} (${collab.role})`}
      style={{ width: size, height: size, backgroundColor: collab.color, fontSize: size * 0.42,
        border: ring ? `2px solid ${collab.color}` : `2px solid ${C.bg}`,
        boxShadow: ring ? `0 0 0 1px ${C.bg}` : 'none' }}
      className="rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 cursor-default select-none"
    >
      {collab.initial}
    </div>
  )
}

// ─── TransBtn / MiniBtn ───────────────────────────────────────────────────────
function TransBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center justify-center rounded transition-all hover:brightness-125 active:brightness-90"
      style={{ width: 28, height: 28, background: C.control, color: C.textSec }}>
      {label}
    </button>
  )
}

function MiniBtn({ active, activeColor, label, title, disabled = false, onClick, pulse = false }: {
  active: boolean
  activeColor: string
  label: string
  title: string
  disabled?: boolean
  onClick?: () => void
  pulse?: boolean
}) {
  const pulseRing = pulse && active
    ? { boxShadow: `0 0 0 2px ${activeColor}44, 0 0 8px ${activeColor}33` }
    : {}
  return (
    <button
      aria-label={title}
      aria-pressed={active}
      title={disabled ? 'View only' : title}
      disabled={disabled}
      onClick={e => { e.stopPropagation(); onClick?.() }}
      className={`w-5 h-5 rounded text-xs font-bold flex items-center justify-center transition-all hover:brightness-125 active:scale-95${pulse && active ? ' record-pulse' : ''}`}
      style={{ background: active ? activeColor : C.control, color: active ? '#fff' : C.textSec,
        opacity: disabled ? 0.3 : 1, pointerEvents: disabled ? 'none' : 'auto', cursor: disabled ? 'not-allowed' : 'pointer',
        ...pulseRing }}>
      {label}
    </button>
  )
}

// ─── Knob ────────────────────────────────────────────────────────────────────
function Knob({ value, onChange, size = 32, label, color }: {
  value: number       // 0–100
  onChange?: (v: number) => void
  size?: number
  label?: string
  color?: string
}) {
  const gid  = useRef(`kg-${++_knobId}`).current
  const dragRef = useRef<{ startY: number; startVal: number } | null>(null)

  // Map 0–100 → angle –135° to +135°
  const angle    = (value / 100) * 270 - 135
  const toRad    = (deg: number) => (deg * Math.PI) / 180
  const angleRad = toRad(angle)

  const cx = size / 2
  const cy = size / 2
  const rOuter = size / 2 - 1
  const rKnob  = rOuter - 2
  const rArc   = rOuter - 0.5

  const arcStart = toRad(-135)

  function arcSegment(fromRad: number, toRad_: number, radius: number) {
    const x1 = cx + radius * Math.sin(fromRad)
    const y1 = cy - radius * Math.cos(fromRad)
    const x2 = cx + radius * Math.sin(toRad_)
    const y2 = cy - radius * Math.cos(toRad_)
    const large = (toRad_ - fromRad) > Math.PI ? 1 : 0
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`
  }

  const trackEnd = toRad(135)

  // Pointer tip position
  const tipR = rKnob - 3
  const px   = cx + tipR * Math.sin(angleRad)
  const py   = cy - tipR * Math.cos(angleRad)

  function onMouseDown(e: React.MouseEvent) {
    e.preventDefault()
    dragRef.current = { startY: e.clientY, startVal: value }
    const onMove = (me: MouseEvent) => {
      if (!dragRef.current) return
      const delta = dragRef.current.startY - me.clientY
      const next  = clamp(dragRef.current.startVal + delta * 0.7, 0, 100)
      onChange?.(Math.round(next))
    }
    const onUp = () => {
      dragRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const arcColor = color ?? C.accent

  return (
    <div className="flex flex-col items-center gap-0.5 select-none" style={{ cursor: 'ns-resize' }}>
      <svg width={size} height={size} onMouseDown={onMouseDown} style={{ display: 'block' }}>
        <defs>
          <radialGradient id={`${gid}-body`} cx="35%" cy="28%" r="70%">
            <stop offset="0%"   stopColor={C.metalLight} />
            <stop offset="45%"  stopColor={C.metalMid} />
            <stop offset="100%" stopColor={C.metalDark} />
          </radialGradient>
          <radialGradient id={`${gid}-shine`} cx="32%" cy="22%" r="55%">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.18)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>

        {/* Track background arc */}
        <path d={arcSegment(arcStart, trackEnd, rArc)}
          fill="none" stroke={C.well} strokeWidth="2" strokeLinecap="round" />

        {/* Value arc */}
        {value > 0 && (
          <path d={arcSegment(arcStart, angleRad, rArc)}
            fill="none" stroke={arcColor} strokeWidth="2" strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 2px ${arcColor}88)` }} />
        )}

        {/* Knob body */}
        <circle cx={cx} cy={cy} r={rKnob} fill={`url(#${gid}-body)`} />
        {/* Shine */}
        <circle cx={cx} cy={cy} r={rKnob} fill={`url(#${gid}-shine)`} />
        {/* Outer ring shadow */}
        <circle cx={cx} cy={cy} r={rKnob} fill="none"
          stroke="rgba(0,0,0,0.6)" strokeWidth="1" />

        {/* Pointer line */}
        <line x1={cx} y1={cy} x2={px} y2={py}
          stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" strokeLinecap="round" />
        {/* Pointer tip dot */}
        <circle cx={px} cy={py} r="1.5" fill="rgba(255,255,255,0.9)" />
      </svg>
      {label !== undefined && (
        <span style={{ fontSize: 9, color: C.textSec, letterSpacing: '0.04em', lineHeight: 1 }}>{label}</span>
      )}
    </div>
  )
}

// ─── StudioFader ─────────────────────────────────────────────────────────────
function StudioFader({ value, onChange, height = 80, ariaLabel = 'Volume' }: {
  value: number       // 0–100
  onChange?: (v: number) => void
  height?: number
  ariaLabel?: string
}) {
  const capH   = 22
  const capW   = 22
  const trackW = 6
  const padV   = 2
  const travel = height - capH - padV * 2
  const capTop = padV + (1 - value / 100) * travel
  const dragRef = useRef<{ startY: number; startVal: number } | null>(null)

  function onMouseDown(e: React.MouseEvent) {
    e.preventDefault()
    dragRef.current = { startY: e.clientY, startVal: value }
    const onMove = (me: MouseEvent) => {
      if (!dragRef.current) return
      const delta = dragRef.current.startY - me.clientY
      const next  = clamp(dragRef.current.startVal + (delta / travel) * 100, 0, 100)
      onChange?.(Math.round(next))
    }
    const onUp = () => {
      dragRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowUp')   { e.preventDefault(); onChange?.(Math.min(100, Math.round(value) + 1)) }
    if (e.key === 'ArrowDown') { e.preventDefault(); onChange?.(Math.max(0,   Math.round(value) - 1)) }
  }

  const trackLeft = (capW - trackW) / 2

  return (
    <div className="relative flex-shrink-0 select-none" style={{ width: capW, height }}>
      {/* Groove */}
      <div className="absolute rounded-full"
        style={{
          width: trackW, height: height - padV * 2,
          top: padV, left: trackLeft,
          background: `linear-gradient(180deg, ${C.metalDark} 0%, ${C.well} 100%)`,
          boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.9), inset 0 -1px 2px rgba(255,255,255,0.04)',
        }}>
        {/* Level fill */}
        <div className="absolute bottom-0 w-full rounded-full"
          style={{ height: `${value}%`, background: 'rgba(107,92,231,0.18)' }} />
      </div>

      {/* Fader cap — interactive slider element */}
      <div
        role="slider"
        aria-label={ariaLabel}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value)}
        tabIndex={0}
        className="absolute cursor-ns-resize outline-none focus-visible:ring-1"
        style={{
          top: capTop, left: 0, width: capW, height: capH,
          borderRadius: 3,
          background: `linear-gradient(180deg, ${C.metalLight} 0%, ${C.metalMid} 42%, #1C1C2A 50%, ${C.metalMid} 58%, ${C.metalLight} 100%)`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.75), inset 0 1px 1px rgba(255,255,255,0.12)',
        }}
        onMouseDown={onMouseDown}
        onKeyDown={onKeyDown}
      >
        {/* Center white line */}
        <div className="absolute" style={{
          top: capH / 2 - 0.5, left: 2, right: 2, height: 1,
          background: 'rgba(255,255,255,0.92)', borderRadius: 1,
        }} />
        {/* Grip ridges above center */}
        {[-5, -3].map(d => (
          <div key={d} className="absolute" style={{
            top: capH / 2 + d, left: 3, right: 3, height: 1,
            background: 'rgba(255,255,255,0.18)',
          }} />
        ))}
        {/* Grip ridges below center */}
        {[3, 5].map(d => (
          <div key={d} className="absolute" style={{
            top: capH / 2 + d, left: 3, right: 3, height: 1,
            background: 'rgba(255,255,255,0.18)',
          }} />
        ))}
      </div>
    </div>
  )
}

// ─── PanKnob ──────────────────────────────────────────────────────────────────
function PanKnob({ pan, onChange }: { pan: number; onChange?: (v: number) => void }) {
  // pan: -100 to 100; renders a center-detented mini slider bar
  const dragRef = useRef<{ startX: number; startPan: number } | null>(null)
  const [hovered, setHovered] = useState(false)

  const absVal    = Math.abs(pan)
  const side      = pan < 0 ? 'L' : pan > 0 ? 'R' : null
  const leftFill  = pan < 0 ? (absVal / 100) : 0
  const rightFill = pan > 0 ? (absVal / 100) : 0

  function onMouseDown(e: React.MouseEvent) {
    if (!onChange) return
    e.preventDefault(); e.stopPropagation()
    dragRef.current = { startX: e.clientX, startPan: pan }
    const onMove = (me: MouseEvent) => {
      if (!dragRef.current) return
      const delta = me.clientX - dragRef.current.startX
      onChange(clamp(dragRef.current.startPan + Math.round(delta * 0.8), -100, 100))
    }
    const onUp = () => {
      dragRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  function onDoubleClick(e: React.MouseEvent) {
    if (!onChange) return
    e.preventDefault(); e.stopPropagation()
    onChange(0)
  }

  const interactiveAttrs = onChange ? {
    onMouseDown,
    onDoubleClick,
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); onChange(clamp(pan - 1, -100, 100)) }
      if (e.key === 'ArrowRight') { e.preventDefault(); onChange(clamp(pan + 1, -100, 100)) }
      if (e.key === 'Home') { e.preventDefault(); onChange(0) }
    },
    role: 'slider' as const,
    'aria-label': 'Pan',
    'aria-valuenow': pan,
    'aria-valuemin': -100,
    'aria-valuemax': 100,
    tabIndex: 0,
    style: { width: 40, height: 32, cursor: 'ew-resize' },
  } : {
    style: { width: 40, height: 32, cursor: 'default' },
  }

  // When center and hovered (interactive), show C in textPri to signal interactivity
  const centerLabelColor = (onChange && hovered && pan === 0) ? C.textPri : C.textSec

  return (
    <div className="flex flex-col items-center gap-0.5 flex-shrink-0 focus-visible:outline-none"
      {...interactiveAttrs}>
      {/* Label row */}
      <div className="flex items-center justify-center" style={{ height: 12 }}>
        {side !== null
          ? <span style={{ fontSize: 9, color: C.accent, fontWeight: 700, letterSpacing: '0.04em' }}>{side} {absVal}</span>
          : <span style={{ fontSize: 9, color: centerLabelColor }}>C</span>
        }
      </div>
      {/* Bar */}
      <div className="flex rounded-sm overflow-hidden" style={{ width: 36, height: 6, background: C.control, gap: 1 }}>
        {/* Left half */}
        <div className="relative flex-1 flex justify-end" style={{ background: C.well }}>
          <div style={{ width: `${leftFill * 100}%`, height: '100%', background: C.accent, borderRadius: '2px 0 0 2px' }} />
        </div>
        {/* Center notch */}
        <div style={{ width: 1, background: C.border, flexShrink: 0 }} />
        {/* Right half */}
        <div className="relative flex-1" style={{ background: C.well }}>
          <div style={{ width: `${rightFill * 100}%`, height: '100%', background: C.accent, borderRadius: '0 2px 2px 0' }} />
        </div>
      </div>
    </div>
  )
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────
function Toolbar({ tool, setTool }: { tool: Tool; setTool: (t: Tool) => void }) {
  const tools: { id: Tool; icon: string; label: string }[] = [
    { id: 'select', icon: '↖', label: 'Select (V)' },
    { id: 'cut',    icon: '✂', label: 'Cut / Razor (C)' },
  ]
  return (
    <div className="flex items-center gap-1 px-3 flex-shrink-0 border-b border-r"
      style={{ height: RULER_H, background: C.surface, borderColor: C.border }}>
      {tools.map(t => (
        <button key={t.id} title={t.label} onClick={() => setTool(t.id)}
          className="flex items-center justify-center rounded text-xs transition-all hover:brightness-125"
          style={{ width: 22, height: 18, background: tool === t.id ? C.accent : C.control,
            color: tool === t.id ? '#fff' : C.textSec, fontSize: 13 }}>
          {t.icon}
        </button>
      ))}
      <span className="text-xs ml-2" style={{ color: C.textSec }}>
        {tool === 'select' ? 'Drag to move · handles to resize · fade triangles to adjust · drag midpoint handle to bend curve' :
                             'Click clip to split at cursor'}
      </span>
    </div>
  )
}

// ─── TrackHeader ──────────────────────────────────────────────────────────────
interface TrackHeaderProps {
  track: Track
  selected?: boolean
  onSelect?: () => void
  onToggleMute?: () => void
  onToggleSolo?: () => void
  onToggleArm?: () => void
  onPanChange?: (trackId: string, value: number) => void
}
function TrackHeader({ track, selected = false, onSelect, onToggleMute, onToggleSolo, onToggleArm, onPanChange }: TrackHeaderProps) {
  const lockingCollab = track.lockedBy !== null && track.lockedBy !== CURRENT_USER.id
    ? COLLABORATORS.find(c => c.id === track.lockedBy) ?? null
    : null

  return (
    <div
      className="flex items-center gap-1.5 px-2 border-b flex-shrink-0 group relative cursor-pointer"
      onClick={onSelect}
      style={{
        height: TRACK_H,
        background: selected
          ? `linear-gradient(90deg, ${track.owner.color}30 0%, ${C.elevated} 48px)`
          : `linear-gradient(90deg, ${track.owner.color}18 0%, ${C.surface} 48px)`,
        borderColor: selected ? track.owner.color : C.border,
        outline: selected ? `1px solid ${track.owner.color}44` : 'none',
      }}>
      <div className="flex-shrink-0 rounded-full" style={{ width: 4, height: 40, background: track.owner.color }} />
      {track.armed && <div className="absolute left-0 top-0 bottom-0 record-pulse" style={{ width: 3, background: C.danger, borderRadius: '0 2px 2px 0' }} />}
      <Avatar collab={track.owner} size={20} ring />

      {/* Center column: name + type */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5" style={{ maxWidth: 68 }}>
        <p
          className="text-xs font-medium truncate"
          title={track.name}
          style={{ color: C.textPri, opacity: track.muted ? 0.5 : 1, transition: 'opacity 0.15s' }}
        >
          {track.name}
        </p>
        <p className="text-xs" style={{ color: C.textSec }}>{track.type}</p>
      </div>

      {/* Right column: R/M/S + PanKnob — always visible, side by side */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <div className="flex items-center gap-0.5">
          {lockingCollab !== null && (
            <span title={`${lockingCollab.name} is recording`} style={{ fontSize: 12, color: lockingCollab.color, lineHeight: 1 }}>🔒</span>
          )}
          <MiniBtn active={track.armed}  activeColor={C.danger}  label="R" title={lockingCollab ? `${lockingCollab.name} is recording` : 'Record arm'} disabled={IS_VIEWER || lockingCollab !== null} onClick={onToggleArm}  pulse={track.armed} />
          <MiniBtn active={track.muted}  activeColor={C.warn}    label="M" title="Mute" disabled={IS_VIEWER} onClick={onToggleMute} />
          <MiniBtn active={track.soloed} activeColor={C.success} label="S" title="Solo" disabled={IS_VIEWER} onClick={onToggleSolo} />
        </div>
        <PanKnob pan={track.pan} onChange={onPanChange ? (v) => onPanChange(track.id, v) : undefined} />
      </div>
      {/* Audio input badge */}
      {track.audioInput !== null && (
        <div className="absolute bottom-1 right-1.5 flex items-center gap-0.5 rounded px-1 py-0.5"
          style={{ background: C.control, fontSize: 9, lineHeight: 1.2 }}>
          <span style={{ fontSize: 9 }}>🎙</span>
          <span style={{ color: track.armed ? C.success : C.textSec, fontWeight: track.armed ? 700 : 400 }}>
            {track.audioInput}
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Clip ─────────────────────────────────────────────────────────────────────
interface ClipProps {
  clip: ClipData
  track: Track
  tool: Tool
  isDragging: boolean
  isGhost: boolean
  selected: boolean
  onDragStart: (clipId: string, trackId: string, mode: DragState['mode'], e: React.MouseEvent, barOffset?: number) => void
  onContextMenu: (e: React.MouseEvent, clipId: string, trackId: string) => void
  onCut: (clipId: string, trackId: string, bar: number) => void
  onUpdate: (trackId: string, clipId: string, patch: Partial<ClipData>) => void
  onSelect: (clipId: string) => void
  audioCtxReady: boolean
}

interface FadeHandleDrag {
  dir: 'in' | 'out'
  startY: number
  startCurve: number
  clipH: number
}

function Clip({ clip, track, tool, isDragging, isGhost, selected, onDragStart, onContextMenu, onCut, onUpdate, onSelect, audioCtxReady }: ClipProps) {
  const [hovered, setHovered] = useState(false)
  const [fadeDrag, setFadeDrag] = useState<FadeHandleDrag | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const clipW = clip.len * BAR_W - 4
  const clipH = TRACK_H - 12 // top-1.5 + bottom-1.5 = 12px total

  // Waveform rendering: draw once when clip dimensions or assetUrl changes.
  // We attempt to resolve the buffer immediately if AudioCtx already exists,
  // otherwise we skip — the canvas stays invisible and won't re-attempt unless
  // the clip re-mounts (e.g. after first gesture triggers ctx initialization).
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !clip.assetUrl) return
    const w = clipW
    const h = clipH
    canvas.width  = w
    canvas.height = h

    const cacheKey = `${clip.assetUrl}:${w}`
    let peaks = _waveformCache.get(cacheKey)

    if (!peaks) {
      const buf = resolveBuffer(clip.assetUrl)
      if (!buf) {
        // AudioContext not yet initialized — draw a seeded ghost waveform so the
        // clip isn't a blank grey box on cold load. Bars are deterministic per clip
        // id so they don't flicker between renders.
        const ctx2d = canvas.getContext('2d')
        if (!ctx2d) return
        ctx2d.clearRect(0, 0, w, h)
        ctx2d.fillStyle = `${track.owner.color}14`  // 8% opacity background tint
        ctx2d.fillRect(0, 0, w, h)
        const BAR_COUNT = 24
        const barW = Math.max(1, Math.floor(w / BAR_COUNT) - 1)
        const midY = h / 2
        ctx2d.fillStyle = `${track.owner.color}2E`  // 18% opacity bars
        // Deterministic seed from clip id: sum char codes then mix with a prime
        const seed = clip.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
        for (let i = 0; i < BAR_COUNT; i++) {
          // Cheap LCG-style hash so each bar has a stable, varied height
          const hash = Math.abs(Math.sin((seed + i * 127) * 0.31731))
          const barH = (0.15 + hash * 0.7) * midY
          const x = Math.round((i / BAR_COUNT) * w)
          ctx2d.fillRect(x, midY - barH, barW, barH * 2)
        }
        return
      }
      peaks = buildWaveformPeaks(buf, w)
      _waveformCache.set(cacheKey, peaks)
    }

    const ctx2d = canvas.getContext('2d')
    if (!ctx2d) return
    ctx2d.clearRect(0, 0, w, h)

    const midY = h / 2
    // Slightly brighten the owner color for the waveform fill vs. clip background
    ctx2d.fillStyle   = `${track.owner.color}CC`
    ctx2d.strokeStyle = `${track.owner.color}FF`
    ctx2d.lineWidth   = 1

    // Draw mirrored peaks as a filled waveform
    ctx2d.beginPath()
    ctx2d.moveTo(0, midY)
    for (let x = 0; x < peaks.length; x++) {
      const peakH = peaks[x] * midY * 0.92
      ctx2d.lineTo(x, midY - peakH)
    }
    for (let x = peaks.length - 1; x >= 0; x--) {
      const peakH = peaks[x] * midY * 0.92
      ctx2d.lineTo(x, midY + peakH)
    }
    ctx2d.closePath()
    ctx2d.fill()
    // Outline stroke for top edge definition
    ctx2d.beginPath()
    for (let x = 0; x < peaks.length; x++) {
      const peakH = peaks[x] * midY * 0.92
      if (x === 0) ctx2d.moveTo(x, midY - peakH)
      else         ctx2d.lineTo(x, midY - peakH)
    }
    ctx2d.stroke()
  }, [clip.assetUrl, clipW, clipH, track.owner.color, audioCtxReady])

  const texture = track.type === 'Audio'
    ? `repeating-linear-gradient(180deg, ${track.owner.color}22 0px, ${track.owner.color}22 1px, ${track.owner.color}0A 1px, ${track.owner.color}0A 4px)`
    : `repeating-linear-gradient(90deg, ${track.owner.color}18 0px, ${track.owner.color}18 1px, ${track.owner.color}08 1px, ${track.owner.color}08 12px)`

  const fadeInPx  = clip.fadeIn  * BAR_W
  const fadeOutPx = clip.fadeOut * BAR_W
  const showHandles = (hovered || fadeDrag !== null) && tool === 'select'

  // Fade curve handle drag — attached to window to capture mouse outside the SVG
  useEffect(() => {
    if (!fadeDrag) return
    function onMove(e: MouseEvent) {
      const rawY = fadeDrag!.startY + (e.clientY - fadeDrag!.startY) + (e.clientY - fadeDrag!.startY)
      // Compute new curve from absolute mouse Y relative to clip top
      // We need a ref to the clip element — compute via initial startY and current mouse
      // Strategy: track delta from drag start, map to curve delta
      const deltaY = e.clientY - fadeDrag!.startY
      const normalizedDelta = deltaY / fadeDrag!.clipH
      let newCurve = fadeDrag!.startCurve - normalizedDelta
      // Snap to 0.5 within 4px of center
      const midPixelY = fadeDrag!.clipH * (fadeDrag!.dir === 'in'
        ? (1 - fadeGain(0.5, 0.5))
        : (1 - (1 - fadeGain(0.5, 0.5))))
      const currentPixelY = fadeDrag!.clipH * (1 - fadeGain(0.5, newCurve))
      if (Math.abs(currentPixelY - midPixelY) < 4) newCurve = 0.5
      newCurve = clamp(newCurve, 0.05, 0.95)
      const patch: Partial<ClipData> = fadeDrag!.dir === 'in'
        ? { fadeInCurve: newCurve }
        : { fadeOutCurve: newCurve }
      onUpdate(track.id, clip.id, patch)
    }
    function onUp() { setFadeDrag(null) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [fadeDrag, clip.id, track.id, onUpdate])

  function startFadeHandleDrag(e: React.MouseEvent, dir: 'in' | 'out') {
    e.stopPropagation()
    e.preventDefault()
    setFadeDrag({
      dir,
      startY: e.clientY,
      startCurve: dir === 'in' ? clip.fadeInCurve : clip.fadeOutCurve,
      clipH,
    })
    onSelect(clip.id)
  }

  function handleBodyMouseDown(e: React.MouseEvent) {
    if (tool === 'cut') return
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const clickXInClip = e.clientX - rect.left
    const barOffset = clickXInClip / BAR_W
    onSelect(clip.id)
    onDragStart(clip.id, track.id, 'move', e, barOffset)
  }

  function handleClipClick(e: React.MouseEvent) {
    if (tool !== 'cut') return
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const barInClip = clickX / BAR_W
    const cutBar = clip.bar + barInClip
    onCut(clip.id, track.id, cutBar)
  }

  return (
    <div
      className="absolute top-1.5 bottom-1.5 rounded overflow-hidden select-none"
      style={{
        left: clip.bar * BAR_W + 2,
        width: clipW,
        background: texture,
        borderLeft: `2px solid ${track.owner.color}`,
        boxShadow: `inset 0 0 0 1px ${track.owner.color}44`,
        outline: (hovered || selected) && !isDragging ? `1px solid ${track.owner.color}88` : 'none',
        opacity: isGhost ? 0.35 : isDragging ? 0.85 : track.muted ? 0.5 : 1,
        filter: hovered ? 'brightness(1.12)' : 'brightness(1)',
        cursor: tool === 'cut' ? 'crosshair' : isDragging ? 'grabbing' : 'grab',
        zIndex: isDragging ? 20 : 1,
        transition: isDragging ? 'none' : 'filter 0.1s, opacity 0.1s',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseDown={handleBodyMouseDown}
      onClick={handleClipClick}
      onContextMenu={e => { e.preventDefault(); onContextMenu(e, clip.id, track.id) }}
    >
      {/* Waveform canvas — only for clips with a resolved audio asset */}
      {clip.assetUrl !== null && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none"
          style={{ width: clipW, height: clipH, opacity: 0.55 }}
        />
      )}

      {/* Fade-in SVG overlay + bezier curve line + midpoint handle */}
      {fadeInPx > 0 && (
        <svg className="absolute top-0 left-0" style={{ width: fadeInPx, height: '100%', overflow: 'visible', zIndex: 12 }}
          preserveAspectRatio="none" viewBox={`0 0 ${fadeInPx} ${clipH}`}>
          {/* Dark attenuation fill */}
          <path d={fadePath(fadeInPx, clipH, clip.fadeInCurve, 'in')} fill={C.bg} opacity="0.72" style={{ pointerEvents: 'none' }} />
          {/* Visible bezier curve line */}
          {showHandles && (
            <>
              <path d={fadeCurveLine(fadeInPx, clipH, clip.fadeInCurve, 'in')}
                fill="none" stroke={track.owner.color} strokeWidth="1.5"
                style={{ filter: `drop-shadow(0 0 4px ${track.owner.color})`, pointerEvents: 'none' }} />
              {/* Midpoint drag handle */}
              <circle
                cx={fadeInPx * 0.5}
                cy={fadeMidpointY(clipH, clip.fadeInCurve, 'in')}
                r="5" fill="white" opacity="0.9"
                style={{ cursor: 'ns-resize', pointerEvents: 'all' }}
                onMouseDown={e => startFadeHandleDrag(e as unknown as React.MouseEvent, 'in')}
              />
            </>
          )}
        </svg>
      )}

      {/* Fade-out SVG overlay + bezier curve line + midpoint handle */}
      {fadeOutPx > 0 && (
        <svg className="absolute top-0" style={{ right: 0, width: fadeOutPx, height: '100%', overflow: 'visible', zIndex: 12 }}
          preserveAspectRatio="none" viewBox={`0 0 ${fadeOutPx} ${clipH}`}>
          <path d={fadePath(fadeOutPx, clipH, clip.fadeOutCurve, 'out')} fill={C.bg} opacity="0.72" style={{ pointerEvents: 'none' }} />
          {showHandles && (
            <>
              <path d={fadeCurveLine(fadeOutPx, clipH, clip.fadeOutCurve, 'out')}
                fill="none" stroke={track.owner.color} strokeWidth="1.5"
                style={{ filter: `drop-shadow(0 0 4px ${track.owner.color})`, pointerEvents: 'none' }} />
              <circle
                cx={fadeOutPx * 0.5}
                cy={fadeMidpointY(clipH, clip.fadeOutCurve, 'out')}
                r="5" fill="white" opacity="0.9"
                style={{ cursor: 'ns-resize', pointerEvents: 'all' }}
                onMouseDown={e => startFadeHandleDrag(e as unknown as React.MouseEvent, 'out')}
              />
            </>
          )}
        </svg>
      )}

      {/* Clip label */}
      <div className="absolute inset-0 flex items-center px-2">
        <span className="font-bold uppercase truncate pointer-events-none"
          style={{ fontSize: 10, letterSpacing: '0.08em', color: track.owner.color, textShadow: `0 0 8px ${track.owner.color}66` }}>
          {clip.label}
        </span>
      </div>

      {/* Left resize handle */}
      {tool === 'select' && (
        <div className="absolute top-0 bottom-0 left-0 flex items-center justify-center"
          style={{ width: HANDLE_W, cursor: 'ew-resize', zIndex: 10, background: `linear-gradient(90deg, ${track.owner.color}55, transparent)` }}
          onMouseDown={e => { e.stopPropagation(); onDragStart(clip.id, track.id, 'resize-left', e) }}
        >
          <div style={{ width: 2, height: 20, background: track.owner.color, borderRadius: 1, opacity: hovered ? 1 : 0.5 }} />
        </div>
      )}

      {/* Right resize handle */}
      {tool === 'select' && (
        <div className="absolute top-0 bottom-0 right-0 flex items-center justify-center"
          style={{ width: HANDLE_W, cursor: 'ew-resize', zIndex: 10, background: `linear-gradient(270deg, ${track.owner.color}55, transparent)` }}
          onMouseDown={e => { e.stopPropagation(); onDragStart(clip.id, track.id, 'resize-right', e) }}
        >
          <div style={{ width: 2, height: 20, background: track.owner.color, borderRadius: 1, opacity: hovered ? 1 : 0.5 }} />
        </div>
      )}

      {/* Fade-in handle (top-left triangle) */}
      {tool === 'select' && (
        <div title="Drag to adjust fade in"
          className="absolute top-0"
          style={{ left: Math.max(HANDLE_W, fadeInPx - FADE_HDL_W / 2), width: FADE_HDL_W, height: FADE_HDL_W, cursor: 'ew-resize', zIndex: 13 }}
          onMouseDown={e => { e.stopPropagation(); onDragStart(clip.id, track.id, 'fade-in', e) }}
        >
          <svg width={FADE_HDL_W} height={FADE_HDL_W} viewBox="0 0 12 12">
            <polygon points="0,0 12,0 12,12" fill={track.owner.color} opacity={hovered ? 0.9 : 0.55} />
          </svg>
        </div>
      )}

      {/* Fade-out handle (top-right triangle) */}
      {tool === 'select' && (
        <div title="Drag to adjust fade out"
          className="absolute top-0"
          style={{ right: Math.max(HANDLE_W, fadeOutPx - FADE_HDL_W / 2), width: FADE_HDL_W, height: FADE_HDL_W, cursor: 'ew-resize', zIndex: 13 }}
          onMouseDown={e => { e.stopPropagation(); onDragStart(clip.id, track.id, 'fade-out', e) }}
        >
          <svg width={FADE_HDL_W} height={FADE_HDL_W} viewBox="0 0 12 12">
            <polygon points="12,0 0,0 0,12" fill={track.owner.color} opacity={hovered ? 0.9 : 0.55} />
          </svg>
        </div>
      )}
    </div>
  )
}

// ─── Context Menu ─────────────────────────────────────────────────────────────
function ContextMenu({ menu, onBounce, onDelete, onDuplicate, onClose }: {
  menu: CtxMenu
  onBounce: () => void
  onDelete: () => void
  onDuplicate: () => void
  onClose: () => void
}) {
  useEffect(() => {
    const handler = () => onClose()
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [onClose])

  const items: { label: string; action: () => void; accent?: boolean; danger?: boolean; disabled?: boolean }[] = [
    ...(menu.clipType === 'MIDI' ? [{ label: '⊙  Bounce to Audio…', action: onBounce, accent: true }] : []),
    { label: '⌫  Delete clip',  action: onDelete,    danger: true },
    { label: '⧉  Duplicate',     action: onDuplicate },
    { label: '◫  Loop region',   action: onClose,     disabled: true },
    { label: '✎  Rename…',       action: onClose,     disabled: true },
  ]

  return (
    <div className="fixed z-50 rounded-lg shadow-2xl py-1 min-w-40"
      style={{ top: menu.y, left: menu.x, background: C.elevated, border: `1px solid ${C.border}` }}
      onMouseDown={e => e.stopPropagation()}>
      {items.map((item, i) => (
        <button key={i}
          onClick={() => { if (!item.disabled) { item.action(); onClose() } }}
          className="w-full text-left px-3 py-1.5 text-xs transition-all hover:brightness-125"
          style={{
            color: item.accent ? C.accent : item.danger ? C.danger : item.disabled ? C.textSec : C.textPri,
            background: 'transparent', display: 'block',
            opacity: item.disabled ? 0.4 : 1, cursor: item.disabled ? 'default' : 'pointer',
          }}>
          {item.label}{item.disabled ? ' (soon)' : ''}
        </button>
      ))}
    </div>
  )
}

// ─── Bounce Modal ─────────────────────────────────────────────────────────────
function BounceModal({ clipLabel, onBounce, onClose }: { clipLabel: string; onBounce: (instrId: string, preset: string, humanStyle: string | null) => void; onClose: () => void }) {
  const [category, setCategory]   = useState('All')

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])
  const [instrId, setInstrId]     = useState(VIRTUAL_INSTRUMENTS[0].id)
  const [preset, setPreset]       = useState(VIRTUAL_INSTRUMENTS[0].presets[0])
  const [humanize, setHumanize]   = useState(false)
  const [style, setStyle]         = useState(HUMANIZER_STYLES[0].id)
  const [rendering, setRendering] = useState(false)

  const visibleInstrs = category === 'All' ? VIRTUAL_INSTRUMENTS : VIRTUAL_INSTRUMENTS.filter(i => i.category === category)
  const activeInstr   = VIRTUAL_INSTRUMENTS.find(i => i.id === instrId) ?? VIRTUAL_INSTRUMENTS[0]

  function handleRender() {
    setRendering(true)
    setTimeout(() => { onBounce(instrId, preset, humanize ? style : null); setRendering(false) }, 1600)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.75)' }} onClick={onClose}>
      <div className="rounded-xl shadow-2xl flex flex-col" style={{ width: 580, maxHeight: '82vh', background: C.elevated, border: `1px solid ${C.control}` }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: C.border }}>
          <div>
            <h2 className="text-sm font-semibold" style={{ color: C.textPri }}>Bounce to Audio</h2>
            <p className="text-xs mt-0.5" style={{ color: C.textSec }}>"{clipLabel}" · MIDI → Audio</p>
          </div>
          <button onClick={onClose} className="text-lg leading-none transition-all hover:brightness-125" style={{ color: C.textSec }}>✕</button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: instrument browser */}
          <div className="flex flex-col border-r flex-shrink-0" style={{ width: 260, borderColor: C.border }}>
            {/* Category tabs */}
            <div className="flex gap-1 px-3 py-2 flex-wrap border-b flex-shrink-0" style={{ borderColor: C.border }}>
              {INSTR_CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setCategory(cat)}
                  className="rounded px-2 py-0.5 text-xs transition-all hover:brightness-125"
                  style={{ background: category === cat ? C.accent : C.control, color: category === cat ? '#fff' : C.textSec }}>
                  {cat}
                </button>
              ))}
            </div>
            {/* Instrument list */}
            <div className="overflow-y-auto flex-1">
              {visibleInstrs.map(instr => (
                <button key={instr.id} onClick={() => { setInstrId(instr.id); setPreset(instr.presets[0]) }}
                  className="w-full text-left px-3 py-2 border-b transition-all hover:brightness-125 flex items-center justify-between"
                  style={{ borderColor: C.border, background: instrId === instr.id ? C.accentMuted : 'transparent' }}>
                  <span className="text-xs font-medium" style={{ color: instrId === instr.id ? C.accent : C.textPri }}>{instr.name}</span>
                  <span className="text-xs" style={{ color: C.textSec }}>{instr.category}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right: presets + humanizer */}
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Presets */}
            <div className="flex-shrink-0 px-4 py-3 border-b" style={{ borderColor: C.border }}>
              <p className="text-xs font-semibold mb-2" style={{ color: C.textSec }}>PRESET</p>
              <div className="grid grid-cols-2 gap-1">
                {activeInstr.presets.map(p => (
                  <button key={p} onClick={() => setPreset(p)}
                    className="rounded px-2 py-1.5 text-xs text-left transition-all hover:brightness-125"
                    style={{ background: preset === p ? C.accent : C.control, color: preset === p ? '#fff' : C.textPri }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Humanizer */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold" style={{ color: C.textSec }}>AI HUMANIZER</p>
                  <p className="text-xs mt-0.5" style={{ color: C.textSec }}>Makes it sound like a live musician</p>
                </div>
                <button onClick={() => setHumanize(h => !h)}
                  className="rounded-full transition-all"
                  style={{ width: 36, height: 20, background: humanize ? C.accent : C.control, position: 'relative' }}>
                  <span className="absolute top-0.5 rounded-full transition-all"
                    style={{ width: 16, height: 16, background: '#fff', left: humanize ? 18 : 2, boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }} />
                </button>
              </div>

              {humanize && (
                <div className="grid grid-cols-2 gap-1.5">
                  {HUMANIZER_STYLES.map(s => (
                    <button key={s.id} onClick={() => setStyle(s.id)}
                      className="rounded-lg p-2.5 text-left transition-all hover:brightness-125"
                      style={{ background: style === s.id ? `${C.accent}33` : C.control, border: `1px solid ${style === s.id ? C.accent : 'transparent'}` }}>
                      <p className="text-xs font-semibold" style={{ color: style === s.id ? C.accent : C.textPri }}>{s.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: C.textSec }}>{s.desc}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-2 px-4 py-3 border-t flex-shrink-0" style={{ borderColor: C.border }}>
              <button onClick={onClose} className="flex-1 rounded py-2 text-xs transition-all hover:brightness-125"
                style={{ background: C.control, color: C.textSec }}>Cancel</button>
              <button onClick={handleRender} disabled={rendering}
                className="flex-1 rounded py-2 text-xs font-semibold transition-all hover:brightness-125 flex items-center justify-center gap-2"
                style={{ background: rendering ? C.control : C.accent, color: rendering ? C.textSec : '#fff' }}>
                {rendering ? (
                  <><span className="inline-block w-3 h-3 rounded-full border-2 border-t-transparent border-white animate-spin" />Rendering…</>
                ) : `⊙ Render${humanize ? ' + Humanize' : ''}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── ArrangeView ──────────────────────────────────────────────────────────────
interface ArrangeViewProps {
  tracks: Track[]
  setTracks: React.Dispatch<React.SetStateAction<Track[]>>
  isRecording: boolean
  playheadBar: number
  setPlayheadBar: (v: number) => void
  selectedTrackId?: string | null
  onSelectTrack?: (id: string) => void
  tool: Tool
  setTool: (t: Tool) => void
  audioCtxReady: boolean
  selectedClipId: string | null
  onSelectClip: (clipId: string) => void
}

function ArrangeView({ tracks, setTracks, isRecording, playheadBar, setPlayheadBar, selectedTrackId, onSelectTrack, tool, setTool, audioCtxReady, selectedClipId, onSelectClip }: ArrangeViewProps) {
  const [drag, setDrag]             = useState<DragState | null>(null)
  const [ctxMenu, setCtxMenu]       = useState<CtxMenu | null>(null)
  const [bounceTarget, setBounceTarget] = useState<{ clipId: string; trackId: string; clipLabel: string } | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  // ── Drag engine (window-level so fast moves don't break it) ────────────────
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!drag || !gridRef.current) return
    const deltaX   = e.clientX - drag.startClientX
    const deltaY   = e.clientY - drag.startClientY
    const deltaBars = deltaX / BAR_W

    if (drag.mode === 'move') {
      // Subtract barOffset so the clip stays anchored to the grab point, not its leading edge
      const previewBar = Math.max(0, snapBar(drag.startBar + deltaBars - drag.barOffset))

      // Which track is the mouse over?
      const gridRect   = gridRef.current.getBoundingClientRect()
      const relY       = e.clientY - gridRect.top - RULER_H + gridRef.current.scrollTop
      const rowIdx     = Math.floor(relY / TRACK_H)
      const targetTrack = tracks[clamp(rowIdx, 0, tracks.length - 1)]
      const sourceTrack = tracks.find(t => t.id === drag.sourceTrackId)!
      const valid       = targetTrack ? (targetTrack.type === sourceTrack.type || targetTrack.id === drag.sourceTrackId) : false

      setDrag(d => d ? { ...d, previewBar, targetTrackId: targetTrack?.id ?? drag.sourceTrackId, valid } : null)
      return
    }

    if (drag.mode === 'resize-right') {
      const newLen = Math.max(1, snapBar(drag.startLen + deltaBars))
      setTracks(prev => prev.map(t => t.id !== drag.sourceTrackId ? t : {
        ...t, clips: t.clips.map(c => c.id !== drag.clipId ? c : { ...c, len: newLen })
      }))
      return
    }

    if (drag.mode === 'resize-left') {
      const rawDelta  = snapBar(deltaBars)
      const newBar    = Math.max(0, drag.startBar + rawDelta)
      const newLen    = Math.max(1, drag.startLen - (newBar - drag.startBar))
      setTracks(prev => prev.map(t => t.id !== drag.sourceTrackId ? t : {
        ...t, clips: t.clips.map(c => c.id !== drag.clipId ? c : { ...c, bar: newBar, len: newLen })
      }))
      return
    }

    if (drag.mode === 'fade-in') {
      const newFadeIn = clamp(snapBar(drag.startFadeIn + deltaBars), 0, drag.startLen - drag.startFadeOut - 0.5)
      setTracks(prev => prev.map(t => t.id !== drag.sourceTrackId ? t : {
        ...t, clips: t.clips.map(c => c.id !== drag.clipId ? c : { ...c, fadeIn: Math.max(0, newFadeIn) })
      }))
      return
    }

    if (drag.mode === 'fade-out') {
      const newFadeOut = clamp(snapBar(drag.startFadeOut - deltaBars), 0, drag.startLen - drag.startFadeIn - 0.5)
      setTracks(prev => prev.map(t => t.id !== drag.sourceTrackId ? t : {
        ...t, clips: t.clips.map(c => c.id !== drag.clipId ? c : { ...c, fadeOut: Math.max(0, newFadeOut) })
      }))
      return
    }

    void deltaY
  }, [drag, tracks, setTracks])

  // Apply overlap-based crossfade auto-extension on a track's clips after a move.
  // For each clip pair that overlaps, extends fadeOut of earlier and fadeIn of later to overlap length.
  // If clips no longer overlap and preFade values are stored, restores them.
  function applyOverlapFades(clips: ClipData[], movedClipId: string, preFadeIn: number | null, preFadeOut: number | null): ClipData[] {
    const sorted = [...clips].sort((a, b) => a.bar - b.bar)
    return sorted.map((clip, i) => {
      if (i === 0) return clip
      const prev = sorted[i - 1]
      const overlapStart = clip.bar
      const overlapEnd   = prev.bar + prev.len
      const overlapBars  = overlapEnd - overlapStart
      if (overlapBars > 0) {
        // Clips overlap — auto-extend fades to match overlap
        if (clip.id === movedClipId) {
          return { ...clip, fadeIn: Math.max(clip.fadeIn, overlapBars) }
        }
        if (prev.id === movedClipId) {
          return clip // prev handled below via its own pass
        }
        return { ...clip, fadeIn: Math.max(clip.fadeIn, overlapBars) }
      } else if (clip.id === movedClipId && preFadeIn !== null) {
        // No longer overlapping — restore pre-overlap fade
        return { ...clip, fadeIn: preFadeIn }
      }
      return clip
    }).map((clip, i, arr) => {
      if (i >= arr.length - 1) return clip
      const next = arr[i + 1]
      const overlapEnd   = clip.bar + clip.len
      const overlapBars  = overlapEnd - next.bar
      if (overlapBars > 0 && clip.id === movedClipId) {
        return { ...clip, fadeOut: Math.max(clip.fadeOut, overlapBars) }
      } else if (overlapBars <= 0 && clip.id === movedClipId && preFadeOut !== null) {
        return { ...clip, fadeOut: preFadeOut }
      }
      return clip
    })
  }

  const handleMouseUp = useCallback(() => {
    if (!drag) return
    if (drag.mode === 'move') {
      if (drag.targetTrackId !== drag.sourceTrackId && drag.valid) {
        // Cross-track drop: move clip
        setTracks(prev => {
          const srcTrack  = prev.find(t => t.id === drag.sourceTrackId)!
          const clip      = srcTrack.clips.find(c => c.id === drag.clipId)!
          const newClip   = { ...clip, bar: drag.previewBar }
          return prev.map(t => {
            if (t.id === drag.sourceTrackId) return { ...t, clips: t.clips.filter(c => c.id !== drag.clipId) }
            if (t.id === drag.targetTrackId) return { ...t, clips: applyOverlapFades([...t.clips, newClip], drag.clipId, drag._preFadeIn, drag._preFadeOut) }
            return t
          })
        })
      } else if (drag.valid) {
        // Same-track move — apply overlap crossfade extension
        setTracks(prev => prev.map(t => {
          if (t.id !== drag.sourceTrackId) return t
          const movedClips = t.clips.map(c => c.id !== drag.clipId ? c : { ...c, bar: drag.previewBar })
          return { ...t, clips: applyOverlapFades(movedClips, drag.clipId, drag._preFadeIn, drag._preFadeOut) }
        }))
      }
    }
    setDrag(null)
  }, [drag, setTracks])

  useEffect(() => {
    if (!drag) return
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup',   handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup',   handleMouseUp)
    }
  }, [drag, handleMouseMove, handleMouseUp])

  // ── Start drag ───────────────────────────────────────────────────────────────
  function startDrag(clipId: string, trackId: string, mode: DragState['mode'], e: React.MouseEvent, barOffset = 0) {
    e.preventDefault()
    const track = tracks.find(t => t.id === trackId)!
    const clip  = track.clips.find(c => c.id === clipId)!
    setDrag({
      clipId, sourceTrackId: trackId, targetTrackId: trackId, mode,
      startClientX: e.clientX, startClientY: e.clientY,
      startBar: clip.bar, startLen: clip.len,
      startFadeIn: clip.fadeIn, startFadeOut: clip.fadeOut,
      barOffset, previewBar: clip.bar, valid: true,
      _preFadeIn: null, _preFadeOut: null,
    })
  }

  // ── Cut tool ─────────────────────────────────────────────────────────────────
  function cutClip(clipId: string, trackId: string, cutBar: number) {
    setTracks(prev => prev.map(t => {
      if (t.id !== trackId) return t
      const newClips = t.clips.flatMap(c => {
        if (c.id !== clipId) return [c]
        const splitAt = cutBar - c.bar
        if (splitAt <= 0.5 || splitAt >= c.len - 0.5) return [c]
        const left:  ClipData = { ...c, id: `${c.id}-a`, len: snapBar(splitAt), fadeOut: 0 }
        const right: ClipData = { ...c, id: `${c.id}-b`, bar: c.bar + snapBar(splitAt), len: c.len - snapBar(splitAt), fadeIn: 0 }
        return [left, right]
      })
      return { ...t, clips: newClips }
    }))
  }

  // ── Clip field update ─────────────────────────────────────────────────────────
  // When a fade curve is updated on a clip that is part of a locked crossfade pair,
  // the partner clip's opposing curve is mirrored as (1 - dragValue) atomically.
  // Only meaningful when two clips on the same track overlap (crossfade region exists).
  function updateClip(trackId: string, clipId: string, patch: Partial<ClipData>) {
    setTracks(prev => prev.map(t => {
      if (t.id !== trackId) return t
      const updatedClips = t.clips.map(c => c.id !== clipId ? c : { ...c, ...patch })
      const changedClip = updatedClips.find(c => c.id === clipId)
      if (!changedClip || !changedClip.crossfadeLocked) return { ...t, clips: updatedClips }

      // Detect overlap partner: find the clip whose end overlaps this clip's start (prev),
      // or whose start overlaps this clip's end (next).
      const sorted = [...updatedClips].sort((a, b) => a.bar - b.bar)
      const idx = sorted.findIndex(c => c.id === clipId)

      let mirroredClips = updatedClips

      if ('fadeInCurve' in patch && idx > 0) {
        const prev = sorted[idx - 1]
        const overlapBars = (prev.bar + prev.len) - changedClip.bar
        if (overlapBars > 0 && prev.crossfadeLocked) {
          // changedClip's fadeIn was dragged → mirror as prev's fadeOut = 1 - n
          mirroredClips = mirroredClips.map(c =>
            c.id === prev.id ? { ...c, fadeOutCurve: 1 - (patch.fadeInCurve as number) } : c
          )
        }
      }

      if ('fadeOutCurve' in patch && idx < sorted.length - 1) {
        const next = sorted[idx + 1]
        const overlapBars = (changedClip.bar + changedClip.len) - next.bar
        if (overlapBars > 0 && next.crossfadeLocked) {
          // changedClip's fadeOut was dragged → mirror as next's fadeIn = 1 - n
          mirroredClips = mirroredClips.map(c =>
            c.id === next.id ? { ...c, fadeInCurve: 1 - (patch.fadeOutCurve as number) } : c
          )
        }
      }

      return { ...t, clips: mirroredClips }
    }))
  }

  // ── Crossfade lock toggle ─────────────────────────────────────────────────────
  function toggleCrossfadeLock(trackId: string, clipIdA: string, clipIdB: string) {
    setTracks(prev => prev.map(t => {
      if (t.id !== trackId) return t
      const clipA = t.clips.find(c => c.id === clipIdA)
      if (!clipA) return t
      const newLocked = !clipA.crossfadeLocked
      return {
        ...t,
        clips: t.clips.map(c =>
          c.id === clipIdA || c.id === clipIdB ? { ...c, crossfadeLocked: newLocked } : c
        ),
      }
    }))
  }

  // ── Context menu ─────────────────────────────────────────────────────────────
  function openCtxMenu(e: React.MouseEvent, clipId: string, trackId: string) {
    const track = tracks.find(t => t.id === trackId)!
    setCtxMenu({ x: e.clientX, y: e.clientY, clipId, trackId, clipType: track.type })
  }

  // ── Bounce handler ────────────────────────────────────────────────────────────
  function handleBounce(instrId: string, preset: string, humanStyle: string | null) {
    if (!bounceTarget) return
    const srcTrack = tracks.find(t => t.id === bounceTarget.trackId)!
    const clip     = srcTrack.clips.find(c => c.id === bounceTarget.clipId)!
    const newTrack: Track = {
      id: `t-bounce-${Date.now()}`,
      name: `${srcTrack.name} (Audio)`,
      type: 'Audio',
      owner: srcTrack.owner,
      armed: false, muted: false, soloed: false, volume: srcTrack.volume,
      pan: srcTrack.pan, lockedBy: null, audioInput: null,
      clips: [{ ...clip, id: `${clip.id}-audio`, label: `${clip.label} [${preset}${humanStyle ? ' · ' + humanStyle : ''}]` }],
    }
    const srcIdx = tracks.findIndex(t => t.id === bounceTarget.trackId)
    setTracks(prev => [...prev.slice(0, srcIdx + 1), newTrack, ...prev.slice(srcIdx + 1)])
    setBounceTarget(null)
    setCtxMenu(null)
  }

  // ── Cursor for cut tool on grid rows ─────────────────────────────────────────
  const gridCursor = tool === 'cut' ? 'crosshair' : 'default'
  const anySoloed  = tracks.some(t => t.soloed)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar row */}
      <div className="flex flex-shrink-0">
        <Toolbar tool={tool} setTool={setTool} />
        <div className="flex-1 border-b" style={{ borderColor: C.border }} />
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Track headers — left column */}
        <div className="flex-shrink-0 flex border-r" style={{ width: 196, borderColor: C.border }}>
          {/* Wood grain left strip — Neve end cheek style */}
          <div className="wood-panel flex-shrink-0" style={{ width: 6 }} />
          <div className="flex flex-col flex-1" style={{ background: C.surface }}>
            <div className="flex-shrink-0 border-b" style={{ height: RULER_H, background: C.surface, borderColor: C.border }} />
            <div className="overflow-y-auto overflow-x-hidden flex-1">
              {tracks.map(t => (
                <TrackHeader
                  key={t.id}
                  track={t}
                  selected={selectedTrackId === t.id}
                  onSelect={() => onSelectTrack?.(t.id)}
                  onToggleMute={() => setTracks(prev => prev.map(tr => tr.id !== t.id ? tr : { ...tr, muted: !tr.muted }))}
                  onToggleSolo={() => setTracks(prev => prev.map(tr => tr.id !== t.id ? tr : { ...tr, soloed: !tr.soloed }))}
                  onToggleArm={() => setTracks(prev => prev.map(tr => tr.id !== t.id ? tr : { ...tr, armed: !tr.armed }))}
                  onPanChange={(trackId, v) => setTracks(prev => prev.map(tr => tr.id !== trackId ? tr : { ...tr, pan: v }))}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div ref={gridRef} className="flex-1 overflow-auto" style={{ background: C.bg, cursor: gridCursor }}
          onMouseDown={() => setCtxMenu(null)}>
          <div style={{ minWidth: BARS * BAR_W, position: 'relative' }}>
            {/* Ruler — click to seek */}
            <div className="flex sticky top-0 z-10 border-b select-none" style={{ height: RULER_H, background: C.surface, borderColor: C.border, cursor: 'pointer' }}
              onMouseDown={e => {
                if (!gridRef.current) return
                const rect = gridRef.current.getBoundingClientRect()
                const seek = (e.clientX - rect.left + gridRef.current.scrollLeft) / BAR_W
                setPlayheadBar(clamp(seek, 0, BARS))
                const onMove = (me: MouseEvent) => setPlayheadBar(clamp((me.clientX - rect.left + gridRef.current!.scrollLeft) / BAR_W, 0, BARS))
                const onUp   = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
                window.addEventListener('mousemove', onMove)
                window.addEventListener('mouseup', onUp)
              }}>
              {Array.from({ length: BARS }).map((_, i) => (
                <div key={i} className="flex-shrink-0 flex items-center border-r" style={{ width: BAR_W, borderColor: C.border }}>
                  <span className="text-xs pl-1.5"
                    style={{ color: i % 4 === 0 ? C.textSec : C.metalMid, fontWeight: i % 4 === 0 ? 600 : 400 }}>
                    {i + 1}
                  </span>
                </div>
              ))}
            </div>

            {/* Track rows */}
            {tracks.map((track, rowIdx) => {
              const dragIsHere   = drag?.mode === 'move' && drag.targetTrackId === track.id && drag.sourceTrackId !== track.id && drag.valid
              const dragClipData = dragIsHere && drag ? tracks.find(t => t.id === drag.sourceTrackId)?.clips.find(c => c.id === drag.clipId) : null
              // Find any presence entry whose activeTrackId matches this row
              const presenceOnRow = DEMO_PRESENCE.find(p => p.activeTrackId === track.id)

              return (
                <div key={track.id} className="flex relative border-b"
                  style={{
                    height: TRACK_H, borderColor: C.well,
                    background: track.armed && isRecording
                      ? `linear-gradient(90deg, ${C.danger}18 0%, ${rowIdx % 2 === 0 ? C.surface : C.bg} 200px)`
                      : rowIdx % 2 === 0 ? C.surface : C.bg,
                    opacity: anySoloed && !track.soloed ? 0.4 : 1,
                    borderLeft: presenceOnRow ? `2px solid ${presenceOnRow.color}` : undefined,
                  }}>
                  {/* Bar cells */}
                  {Array.from({ length: BARS }).map((_, i) => (
                    <div key={i} className="flex-shrink-0 border-r transition-colors relative"
                      style={{ width: BAR_W, borderColor: i % 4 === 3 ? C.border : C.well,
                        background: i % 4 === 0 ? 'rgba(255,255,255,0.025)' : 'transparent',
                        cursor: tool === 'cut' ? 'crosshair' : 'default' }}>
                      {[0.25, 0.5, 0.75].map(frac => (
                        <div key={frac} className="absolute top-0 bottom-0"
                          style={{ left: `${frac * 100}%`, width: 1, background: 'rgba(255,255,255,0.03)' }} />
                      ))}
                    </div>
                  ))}

                  {/* Clips */}
                  {track.clips.length > 0
                    ? track.clips.map(clip => {
                        const isThisDragging = drag?.clipId === clip.id && drag.mode === 'move'
                        const isGhost        = isThisDragging && drag?.targetTrackId !== track.id
                        const previewBar     = isThisDragging && drag ? drag.previewBar : clip.bar
                        const displayClip    = isThisDragging ? { ...clip, bar: previewBar } : clip
                        return (
                          <Clip key={clip.id} clip={displayClip} track={track} tool={tool}
                            isDragging={isThisDragging && drag?.targetTrackId === track.id}
                            isGhost={isGhost}
                            selected={selectedClipId === clip.id}
                            onDragStart={startDrag}
                            onContextMenu={openCtxMenu}
                            onCut={cutClip}
                            onUpdate={updateClip}
                            onSelect={onSelectClip}
                            audioCtxReady={audioCtxReady} />
                        )
                      })
                    : (
                      <div className="absolute inset-2 rounded flex items-center justify-center pointer-events-none"
                        style={{ border: `1px dashed ${C.border}` }}>
                        <span className="text-xs" style={{ color: C.textSec }}>Drop clips here</span>
                      </div>
                    )
                  }

                  {/* Crossfade lock icons — one per overlapping clip pair */}
                  {(() => {
                    const sorted = [...track.clips].sort((a, b) => a.bar - b.bar)
                    return sorted.slice(0, -1).flatMap((clipA, i) => {
                      const clipB = sorted[i + 1]
                      const overlapBars = (clipA.bar + clipA.len) - clipB.bar
                      if (overlapBars <= 0) return []
                      // Center of the crossfade zone in pixels
                      const overlapStartPx = clipB.bar * BAR_W
                      const overlapEndPx   = (clipA.bar + clipA.len) * BAR_W
                      const centerX = (overlapStartPx + overlapEndPx) / 2
                      const isLocked = clipA.crossfadeLocked
                      return [(
                        <button
                          key={`xflock-${clipA.id}-${clipB.id}`}
                          title={isLocked ? 'Crossfade: symmetry locked — click to unlock' : 'Crossfade: independent — click to lock'}
                          className="absolute flex items-center justify-center rounded"
                          style={{
                            left: centerX - 9,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: 18,
                            height: 18,
                            zIndex: 20,
                            background: C.elevated,
                            border: `1px solid ${isLocked ? C.border : C.accent}`,
                            color: isLocked ? C.textSec : C.accent,
                            cursor: 'pointer',
                          }}
                          onMouseDown={e => e.stopPropagation()}
                          onClick={e => { e.stopPropagation(); toggleCrossfadeLock(track.id, clipA.id, clipB.id) }}
                        >
                          {isLocked ? (
                            // Closed padlock — symmetry on
                            <svg width="10" height="11" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <rect x="1" y="5" width="8" height="6" rx="1" fill="currentColor" opacity="0.9" />
                              <path d="M3 5V3.5a2 2 0 0 1 4 0V5" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" />
                              <circle cx="5" cy="8" r="1" fill={C.bg} />
                            </svg>
                          ) : (
                            // Open padlock — independent
                            <svg width="10" height="11" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <rect x="1" y="5" width="8" height="6" rx="1" fill="currentColor" opacity="0.9" />
                              <path d="M3 5V3.5a2 2 0 0 1 4 0V2" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" />
                              <circle cx="5" cy="8" r="1" fill={C.bg} />
                            </svg>
                          )}
                        </button>
                      )]
                    })
                  })()}

                  {/* Ghost clip on cross-track drag target */}
                  {dragIsHere && drag && dragClipData && (
                    <div className="absolute top-1.5 bottom-1.5 rounded pointer-events-none"
                      style={{ left: drag.previewBar * BAR_W + 2, width: dragClipData.len * BAR_W - 4,
                        border: `2px dashed ${track.type === tracks.find(t => t.id === drag.sourceTrackId)?.type ? C.success : C.danger}`,
                        background: drag.valid ? `${C.success}12` : `${C.danger}12`, zIndex: 15 }} />
                  )}
                </div>
              )
            })}

            {/* ── Playhead ─────────────────────────────────────────────────── */}
            <div className="absolute top-0 bottom-0 pointer-events-none" style={{ left: playheadBar * BAR_W, zIndex: 30, width: 0 }}>
              {/* Triangle head on ruler */}
              <div className="sticky top-0" style={{ height: RULER_H, width: 0 }}>
                <svg width="13" height="11" style={{ position: 'absolute', top: 5, left: -6, filter: `drop-shadow(0 0 3px ${C.accent})` }}>
                  <polygon points="0,0 13,0 6.5,11" fill={C.accent} />
                </svg>
              </div>
              {/* Vertical line through tracks */}
              <div style={{ position: 'absolute', top: RULER_H, bottom: 0, left: 0, width: 1,
                background: C.accent, opacity: 0.75,
                boxShadow: `0 0 6px ${C.accent}88, 0 0 2px ${C.accent}` }} />
            </div>

            {/* ── Collaborator presence cursors ────────────────────────────── */}
            {DEMO_PRESENCE.map(presence => {
              const collab = COLLABORATORS.find(c => c.id === presence.userId)
              if (!collab) return null
              return (
                <div key={presence.userId} className="absolute top-0 bottom-0 pointer-events-none"
                  style={{ left: presence.playheadBar * BAR_W, zIndex: 25, width: 0 }}>
                  {/* Avatar chip at top */}
                  <div className="sticky top-0" style={{ height: RULER_H, width: 0 }}>
                    <div
                      className="absolute flex items-center justify-center rounded-full font-bold"
                      style={{
                        width: 18, height: 18, top: 3, left: -9,
                        background: presence.color, color: '#fff', fontSize: 9,
                        boxShadow: `0 0 4px ${presence.color}88`,
                      }}>
                      {collab.initial}
                    </div>
                  </div>
                  {/* Vertical line */}
                  <div style={{
                    position: 'absolute', top: RULER_H, bottom: 0, left: 0, width: 1,
                    background: presence.color, opacity: 0.6,
                  }} />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Context menu */}
      {ctxMenu && (
        <ContextMenu menu={ctxMenu}
          onBounce={() => {
            const track = tracks.find(t => t.id === ctxMenu.trackId)!
            const clip  = track.clips.find(c => c.id === ctxMenu.clipId)!
            setBounceTarget({ clipId: ctxMenu.clipId, trackId: ctxMenu.trackId, clipLabel: clip.label })
            setCtxMenu(null)
          }}
          onDelete={() => {
            setTracks(prev => prev.map(t =>
              t.id !== ctxMenu.trackId ? t : { ...t, clips: t.clips.filter(c => c.id !== ctxMenu.clipId) }
            ))
          }}
          onDuplicate={() => {
            setTracks(prev => prev.map(t => {
              if (t.id !== ctxMenu.trackId) return t
              const src = t.clips.find(c => c.id === ctxMenu.clipId)
              if (!src) return t
              const copy: ClipData = { ...src, id: `${src.id}-dup-${Date.now()}`, bar: src.bar + src.len }
              return { ...t, clips: [...t.clips, copy] }
            }))
          }}
          onClose={() => setCtxMenu(null)} />
      )}

      {/* Bounce modal */}
      {bounceTarget && (
        <BounceModal clipLabel={bounceTarget.clipLabel}
          onBounce={handleBounce}
          onClose={() => setBounceTarget(null)} />
      )}
    </div>
  )
}

// ─── VU meter constants ───────────────────────────────────────────────────────
const VU_SEGS   = 20
const VU_SEG_H  = 3
const VU_SEG_GAP = 1
// segment index thresholds (0-based, out of 20)
const VU_AMBER_START = 13   // segments 13–16 → amber
const VU_RED_START   = 17   // segments 17–19 → red
const VU_HEIGHT = VU_SEGS * VU_SEG_H + (VU_SEGS - 1) * VU_SEG_GAP  // 79px

const ATTACK_RATE      = 32   // per second
const DECAY_RATE       = 4    // per second
const PEAK_HOLD_MS     = 700
const PEAK_DROP_RATE   = 0.5  // normalized units per second
const TRANSIENT_DUR_MS = 120

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

function vuSegColor(segIdx: number): string {
  if (segIdx >= VU_RED_START) return C.vuRed
  if (segIdx >= VU_AMBER_START) return C.vuAmber
  return C.vuGreen
}

function alphaHex(a: number): string {
  const v = Math.round(Math.max(0, Math.min(1, a)) * 255).toString(16)
  return v.length === 1 ? '0' + v : v
}

function blendHex(a: string, b: string, t: number): string {
  const ar = parseInt(a.slice(1, 3), 16), ag = parseInt(a.slice(3, 5), 16), ab = parseInt(a.slice(5, 7), 16)
  const br = parseInt(b.slice(1, 3), 16), bg = parseInt(b.slice(3, 5), 16), bb = parseInt(b.slice(5, 7), 16)
  const r = Math.round(ar + (br - ar) * t)
  const g = Math.round(ag + (bg - ag) * t)
  const bl = Math.round(ab + (bb - ab) * t)
  return `rgb(${r},${g},${bl})`
}

// Mutable physics state per strip — lives outside React state to avoid re-renders
interface VUPhysics {
  levelL: number; levelR: number
  peakL: number; peakR: number
  peakHoldL: number; peakHoldR: number   // ms since peak was last refreshed
  transientStartL: number; transientStartR: number  // performance.now() timestamp
}

function makeVUPhysics(): VUPhysics {
  return { levelL: 0, levelR: 0, peakL: 0, peakR: 0, peakHoldL: 0, peakHoldR: 0, transientStartL: -Infinity, transientStartR: -Infinity }
}

function stepMeter(current: number, target: number, dt: number): number {
  if (target > current) return current + (target - current) * Math.min(1, ATTACK_RATE * dt)
  return current + (target - current) * Math.min(1, DECAY_RATE * dt)
}

function stepPeak(peakLevel: number, liveLevel: number, holdMs: number, dt: number): { peak: number; hold: number } {
  if (liveLevel >= peakLevel) return { peak: liveLevel, hold: 0 }
  if (holdMs < PEAK_HOLD_MS) return { peak: peakLevel, hold: holdMs + dt * 1000 }
  if (prefersReducedMotion) return { peak: liveLevel, hold: holdMs + dt * 1000 }
  return { peak: Math.max(liveLevel, peakLevel - PEAK_DROP_RATE * dt), hold: holdMs + dt * 1000 }
}

// Writes live physics to the actual DOM nodes for one channel of one strip.
// Called from the single shared rAF loop — never triggers React re-renders.
function renderVUChannel(
  segs: HTMLDivElement[],
  peakDot: HTMLDivElement,
  level: number,
  peakLevel: number,
  transientStart: number,
  now: number
) {
  const litCount = level * VU_SEGS
  const topLit   = Math.floor(litCount)
  const topFrac  = litCount - topLit

  const since = now - transientStart
  const flashIntensity = (!prefersReducedMotion && since < TRANSIENT_DUR_MS)
    ? 1 - since / TRANSIENT_DUR_MS
    : 0

  for (let s = 0; s < VU_SEGS; s++) {
    const seg = segs[s]
    if (!seg) continue
    const col = vuSegColor(s)

    if (s < topLit) {
      const isTop = s === topLit - 1
      const glowSize = isTop ? 4 + flashIntensity * 4 : 4
      const glowAlpha = isTop ? 0.6 + flashIntensity * 0.4 : 0.6
      seg.style.background = col
      seg.style.boxShadow = `0 0 ${glowSize}px ${col}${alphaHex(glowAlpha)}`
    } else if (s === topLit && topFrac > 0) {
      seg.style.background = blendHex(C.metalDark, col, topFrac)
      seg.style.boxShadow = topFrac > 0.05 ? `0 0 ${4 * topFrac}px ${col}${alphaHex(0.4 * topFrac)}` : 'none'
    } else {
      seg.style.background = C.metalDark
      seg.style.boxShadow = 'none'
    }
  }

  // Peak-hold dot
  if (peakLevel > 0.02) {
    const peakSegIdx = Math.floor(peakLevel * VU_SEGS)
    const dotBottom  = peakSegIdx * (VU_SEG_H + VU_SEG_GAP)
    const dotCol = peakSegIdx >= VU_RED_START ? C.danger : peakSegIdx >= VU_AMBER_START ? C.vuAmber : '#fff'
    peakDot.style.opacity = '1'
    peakDot.style.bottom = `${dotBottom}px`
    peakDot.style.background = dotCol
    peakDot.style.boxShadow = `0 0 4px ${dotCol}99`
  } else {
    peakDot.style.opacity = '0'
  }
}

// ─── MixerStrip ───────────────────────────────────────────────────────────────
interface MixerStripHandles {
  segRefs: [HTMLDivElement[], HTMLDivElement[]]  // [L segs, R segs], each length VU_SEGS
  peakDotRefs: [HTMLDivElement, HTMLDivElement]   // L dot, R dot
  dbReadoutRef: HTMLSpanElement | null
}
interface MixerStripProps {
  track: Track
  pluginCount: number
  onToggleMute: () => void
  onToggleSolo: () => void
  onVolChange: (v: number) => void
  onPanChange: (v: number) => void
  onSelectTrack: (trackId: string) => void
  selectedTrackId: string | null
  handlesRef: React.MutableRefObject<MixerStripHandles | null>
}
const MixerStrip = ({ track, pluginCount, onToggleMute, onToggleSolo, onVolChange, onPanChange, onSelectTrack, selectedTrackId, handlesRef }: MixerStripProps) => {
  const panKnobVal = (track.pan + 100) / 2
  const panLabel   = track.pan === 0 ? 'C' : `${Math.abs(track.pan)}${track.pan < 0 ? 'L' : 'R'}`

  // Refs for direct DOM writes from the rAF loop
  const segRefsL = useRef<HTMLDivElement[]>([])
  const segRefsR = useRef<HTMLDivElement[]>([])
  const peakDotL = useRef<HTMLDivElement | null>(null)
  const peakDotR = useRef<HTMLDivElement | null>(null)
  const dbReadout = useRef<HTMLSpanElement | null>(null)

  // Expose handles to parent so the single rAF loop can find our DOM nodes
  useEffect(() => {
    handlesRef.current = {
      segRefs: [segRefsL.current, segRefsR.current],
      peakDotRefs: [peakDotL.current!, peakDotR.current!],
      dbReadoutRef: dbReadout.current,
    }
  })

  return (
    <div className="flex flex-col items-center flex-shrink-0 rounded-lg overflow-hidden select-none"
      style={{ width: 64, background: C.elevated, border: `1px solid ${C.control}` }}>

      {/* Wood + owner color top cap */}
      <div className="wood-panel w-full flex-shrink-0"
        style={{ height: 8, borderBottom: `2px solid ${track.owner.color}` }} />

      {/* Panel body */}
      <div className="flex flex-col items-center gap-1.5 px-1.5 py-2 w-full">

        {/* Track name */}
        <p style={{
          fontSize: 8, letterSpacing: '0.08em', textTransform: 'uppercase',
          color: C.textSec, fontWeight: 700, width: '100%', textAlign: 'center',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {track.name}
        </p>

        {/* FX badge */}
        <button
          aria-label={`Open FX chain for ${track.name}`}
          onClick={e => { e.stopPropagation(); onSelectTrack(track.id) }}
          className="rounded px-1 py-px font-mono transition-all hover:brightness-150 focus-visible:outline-none active:scale-95"
          style={{
            fontSize: 8,
            background: selectedTrackId === track.id ? C.accent : C.control,
            color: selectedTrackId === track.id ? '#fff' : C.textSec,
            cursor: 'pointer', border: 'none',
            boxShadow: selectedTrackId === track.id ? `0 0 0 1px ${C.accent}` : 'none',
          }}
        >
          FX:{pluginCount}
        </button>

        {/* Pan knob */}
        <Knob
          value={panKnobVal}
          onChange={v => onPanChange(Math.round((v / 100) * 200 - 100))}
          size={28} label={panLabel} color={track.owner.color}
        />

        {/* M / S buttons */}
        <div className="flex gap-1">
          <button aria-label="Mute" aria-pressed={track.muted} onClick={onToggleMute}
            className="rounded font-bold flex items-center justify-center transition-all hover:brightness-125"
            style={{ width: 22, height: 14, fontSize: 8, background: track.muted ? C.warn : C.control, color: track.muted ? '#000' : C.textSec }}
            title="Mute">M</button>
          <button aria-label="Solo" aria-pressed={track.soloed} onClick={onToggleSolo}
            className="rounded font-bold flex items-center justify-center transition-all hover:brightness-125"
            style={{ width: 22, height: 14, fontSize: 8, background: track.soloed ? C.success : C.control, color: track.soloed ? '#fff' : C.textSec }}
            title="Solo">S</button>
        </div>

        {/* VU meters + Fader side by side */}
        <div className="flex items-end gap-1.5">
          {/* VU pair — role=presentation, aria-hidden: meter is decorative; dB readout is the a11y rep */}
          <div className="flex gap-px" role="presentation" aria-hidden="true" style={{ height: VU_HEIGHT }}>
            {([segRefsL, segRefsR] as const).map((refsObj, ch) => (
              <div key={ch} className="flex flex-col-reverse" style={{ gap: VU_SEG_GAP, width: 4, position: 'relative' }}>
                {Array.from({ length: VU_SEGS }, (_, i) => (
                  <div key={i}
                    ref={el => { if (el) refsObj.current[i] = el }}
                    style={{ height: VU_SEG_H, borderRadius: 1, background: C.metalDark }}
                  />
                ))}
                {/* Peak-hold dot */}
                <div
                  ref={el => { if (ch === 0) peakDotL.current = el; else peakDotR.current = el }}
                  style={{
                    position: 'absolute', left: -1, right: -1, height: 2,
                    borderRadius: 1, background: '#fff', opacity: 0,
                    pointerEvents: 'none',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Fader */}
          <StudioFader value={track.volume} onChange={onVolChange} height={VU_HEIGHT} />
        </div>

        {/* dB read-out — aria-live so screen readers pick up level changes */}
        <span
          ref={dbReadout}
          className="font-mono"
          aria-live="polite"
          aria-label={`${track.name} output level`}
          style={{ fontSize: 9, color: C.textSec }}
        >
          {formatDb(faderToDb(track.volume))}
        </span>

        {/* Owner avatar */}
        <Avatar collab={track.owner} size={16} ring />
      </div>

      {/* Wood bottom cap */}
      <div className="wood-panel w-full flex-shrink-0" style={{ height: 6 }} />
    </div>
  )
}

// ─── MixerPanel ───────────────────────────────────────────────────────────────
function MixerPanel({ tracks, setTracks, pluginChains, onSelectTrack, selectedTrackId }: {
  tracks: Track[]
  setTracks: React.Dispatch<React.SetStateAction<Track[]>>
  pluginChains: Record<string, PluginSlot[]>
  onSelectTrack: (trackId: string) => void
  selectedTrackId: string | null
}) {
  const [masterVol, setMasterVol] = useState(95)
  const [masterPan, setMasterPan] = useState(0)

  // Wire masterVol → _masterGain whenever it changes
  useEffect(() => {
    if (_masterGain) _masterGain.gain.value = masterVol / 100
  }, [masterVol])

  // Per-strip handles: DOM refs for the rAF loop to write to
  const stripHandlesRefs = useRef<(React.MutableRefObject<MixerStripHandles | null>)[]>([])
  // Per-strip physics: mutable, lives outside React state
  const physicsRef = useRef<VUPhysics[]>([])
  // Master strip DOM refs
  const masterSegRefsL = useRef<HTMLDivElement[]>([])
  const masterSegRefsR = useRef<HTMLDivElement[]>([])
  const masterPeakDotL = useRef<HTMLDivElement | null>(null)
  const masterPeakDotR = useRef<HTMLDivElement | null>(null)
  const masterDbReadout = useRef<HTMLSpanElement | null>(null)
  const masterPhysics   = useRef<VUPhysics>(makeVUPhysics())
  // Heartbeat override: when non-null, overrides the live RMS signal target for all strips
  // Set to null to return to live RMS mode. Written by the heartbeat sequence, read by the rAF loop.
  const heartbeatSignalRef = useRef<number | null>(null)

  // Keep handles and physics arrays sized to track count.
  // Grow-only: stable existing entries are preserved so the rAF loop never
  // loses its pointers when tracks change.
  while (stripHandlesRefs.current.length < tracks.length) {
    stripHandlesRefs.current.push({ current: null })
  }
  while (physicsRef.current.length < tracks.length) {
    physicsRef.current.push(makeVUPhysics())
  }

  // The single shared rAF loop for all strips
  const rafRef = useRef<number | null>(null)
  const lastFrameRef = useRef<number>(performance.now())
  const tracksRef    = useRef<Track[]>(tracks)
  tracksRef.current  = tracks   // always up to date without re-subscribing rAF

  useEffect(() => {
    function loop(now: number) {
      const dt = Math.min(0.05, (now - lastFrameRef.current) / 1000)
      lastFrameRef.current = now

      const liveTracks = tracksRef.current
      const anySoloed  = liveTracks.some(t => t.soloed)

      liveTracks.forEach((track, idx) => {
        const ph      = physicsRef.current[idx]
        if (!ph) return
        const handles = stripHandlesRefs.current[idx]?.current
        if (!handles) return

        const active  = _activeSources.get(track.id)
        const effectiveMute = track.muted || (anySoloed && !track.soloed)

        // Target RMS: heartbeat override during startup, otherwise live RMS when playing
        const rawRMS  = active ? readRMS(active.analyser) : 0
        const heartbeatOverride = heartbeatSignalRef.current
        const effectiveRMS = heartbeatOverride !== null ? heartbeatOverride : rawRMS
        const targetL = effectiveMute ? 0 : clamp(effectiveRMS, 0, 1)
        const targetR = effectiveMute ? 0 : clamp(effectiveRMS, 0, 1)

        // Detect transient jump before updating level
        const prevL = ph.levelL, prevR = ph.levelR
        ph.levelL = stepMeter(ph.levelL, targetL, dt)
        ph.levelR = stepMeter(ph.levelR, targetR, dt)

        if (targetL > prevL + 0.05) ph.transientStartL = now
        if (targetR > prevR + 0.05) ph.transientStartR = now

        const peakResL = stepPeak(ph.peakL, ph.levelL, ph.peakHoldL, dt)
        ph.peakL = peakResL.peak; ph.peakHoldL = peakResL.hold
        const peakResR = stepPeak(ph.peakR, ph.levelR, ph.peakHoldR, dt)
        ph.peakR = peakResR.peak; ph.peakHoldR = peakResR.hold

        renderVUChannel(handles.segRefs[0], handles.peakDotRefs[0], ph.levelL, ph.peakL, ph.transientStartL, now)
        renderVUChannel(handles.segRefs[1], handles.peakDotRefs[1], ph.levelR, ph.peakR, ph.transientStartR, now)
      })

      // Master strip
      const mph = masterPhysics.current
      const masterRMS = _masterAnalyser ? readRMS(_masterAnalyser) : 0
      const masterHbOverride = heartbeatSignalRef.current
      const masterTarget = clamp(masterHbOverride !== null ? masterHbOverride : masterRMS, 0, 1)
      const mprevL = mph.levelL, mprevR = mph.levelR
      mph.levelL = stepMeter(mph.levelL, masterTarget, dt)
      mph.levelR = stepMeter(mph.levelR, masterTarget * 0.97, dt)
      if (masterTarget > mprevL + 0.05) mph.transientStartL = now
      if (masterTarget > mprevR + 0.05) mph.transientStartR = now
      const mplRes = stepPeak(mph.peakL, mph.levelL, mph.peakHoldL, dt)
      mph.peakL = mplRes.peak; mph.peakHoldL = mplRes.hold
      const mprRes = stepPeak(mph.peakR, mph.levelR, mph.peakHoldR, dt)
      mph.peakR = mprRes.peak; mph.peakHoldR = mprRes.hold
      if (masterSegRefsL.current.length && masterPeakDotL.current) {
        renderVUChannel(masterSegRefsL.current, masterPeakDotL.current, mph.levelL, mph.peakL, mph.transientStartL, now)
      }
      if (masterSegRefsR.current.length && masterPeakDotR.current) {
        renderVUChannel(masterSegRefsR.current, masterPeakDotR.current, mph.levelR, mph.peakR, mph.transientStartR, now)
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, []) // intentionally empty — uses refs for live data

  // Heartbeat startup sequence — runs once on mount, drives VU signal targets
  // alongside fader bloom so meters perform with the startup animation.
  useEffect(() => {
    const BPM_HB = 72
    const BEAT_MS = Math.round(60000 / BPM_HB)
    const RISE_DUR  = Math.round(BEAT_MS * 0.38)
    const HOLD_DUR  = Math.round(BEAT_MS * 0.12)
    const FALL_DUR  = Math.round(BEAT_MS * 0.50)

    function easeOutQuint(t: number) { return 1 - Math.pow(1 - t, 5) }
    function easeInOutQuart(t: number) { return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2 }

    function animate(duration: number, easing: (t: number) => number, onUpdate: (v: number) => void): Promise<void> {
      return new Promise(resolve => {
        const start = performance.now()
        function tick() {
          const elapsed = performance.now() - start
          const t = Math.min(1, elapsed / duration)
          onUpdate(easing(t))
          if (t < 1) requestAnimationFrame(tick)
          else resolve()
        }
        requestAnimationFrame(tick)
      })
    }

    function wait(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)) }

    async function heartbeatBeat() {
      await animate(RISE_DUR, easeOutQuint, t => { heartbeatSignalRef.current = t * 0.95 })
      await wait(HOLD_DUR)
      // Gentle breath hold
      await animate(HOLD_DUR, x => x, t => { heartbeatSignalRef.current = 0.95 + Math.sin(t * Math.PI) * 0.04 })
      await animate(FALL_DUR, easeInOutQuart, t => { heartbeatSignalRef.current = (1 - t) * 0.95 })
    }

    async function run() {
      await wait(400)
      await heartbeatBeat()
      await wait(340)
      await heartbeatBeat()
      await wait(420)
      // Staggered motorized recall — signal follows fader rise then settles to 0
      const trackCount = tracksRef.current.length + 1 // +1 for master
      const STAGGER_MS = 80
      const promises = Array.from({ length: trackCount }, (_, i) =>
        new Promise<void>(resolve => setTimeout(async () => {
          await animate(520, t => 1 - Math.pow(1 - t, 4), t => {
            // Each strip independently ramps — we use the shared ref as an approximation
            // since strips overlap in time. Full per-strip independence would require
            // per-strip heartbeatSignalRef — deferred until per-strip rAF data is per-object.
            heartbeatSignalRef.current = t * 0.5
          })
          await animate(300, easeOutQuint, t => {
            heartbeatSignalRef.current = 0.5 * (1 - t)
          })
          resolve()
        }, i * STAGGER_MS))
      )
      await Promise.all(promises)
      heartbeatSignalRef.current = null // return to live RMS
    }

    run()
  }, []) // intentionally empty — runs once on mount

  return (
    <div className="flex-shrink-0 border-t flex flex-col overflow-hidden"
      style={{ background: C.surface, borderColor: C.border }}>

      {/* Wood top rail */}
      <div className="wood-panel w-full flex-shrink-0"
        style={{ height: 6, borderBottom: `1px solid rgba(255,255,255,0.07)` }} />

      {/* Strips row */}
      <div className="flex overflow-x-auto" style={{ padding: '10px 0', alignItems: 'flex-end' }}>

        {/* Left wood end cheek */}
        <div className="wood-panel flex-shrink-0 self-stretch rounded-l"
          style={{ width: 14, margin: '0 10px 0 10px', minHeight: 60, borderRight: `1px solid rgba(255,255,255,0.06)` }} />

        {/* Track strips */}
        <div className="flex gap-2 items-end">
          {tracks.map((t, idx) => (
            <MixerStrip
              key={t.id}
              track={t}
              pluginCount={pluginChains[t.id]?.length ?? 0}
              onToggleMute={() => setTracks(prev => prev.map(tr => tr.id !== t.id ? tr : { ...tr, muted: !tr.muted }))}
              onToggleSolo={() => setTracks(prev => prev.map(tr => tr.id !== t.id ? tr : { ...tr, soloed: !tr.soloed }))}
              onVolChange={v => setTracks(prev => prev.map(tr => tr.id !== t.id ? tr : { ...tr, volume: v }))}
              onPanChange={v => setTracks(prev => prev.map(tr => tr.id !== t.id ? tr : { ...tr, pan: v }))}
              onSelectTrack={onSelectTrack}
              selectedTrackId={selectedTrackId}
              handlesRef={stripHandlesRefs.current[idx] ?? { current: null }}
            />
          ))}

          {/* Master strip */}
          <div className="flex flex-col items-center flex-shrink-0 rounded-lg overflow-hidden"
            style={{ width: 64, background: C.elevated, border: `1px solid ${C.accent}44` }}>
            <div className="w-full flex-shrink-0"
              style={{ height: 8, background: C.accent, borderBottom: `2px solid ${C.accent}` }} />
            <div className="flex flex-col items-center gap-1.5 px-1.5 py-2 w-full">
              <p style={{ fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.accent, fontWeight: 800 }}>MSTR</p>
              <Knob value={masterPan} size={28} label={masterPan === 0 ? 'C' : `${Math.abs(masterPan)}${masterPan < 0 ? 'L' : 'R'}`} color={C.accent} onChange={setMasterPan} />
              <button
                aria-label="Open FX chain for Master"
                onClick={() => onSelectTrack('master')}
                className="rounded px-1 py-px font-mono transition-all hover:brightness-150 active:scale-95"
                style={{
                  fontSize: 8,
                  background: selectedTrackId === 'master' ? C.accent : C.control,
                  color: selectedTrackId === 'master' ? '#fff' : C.textSec,
                  cursor: 'pointer', border: 'none',
                }}
              >
                FX:—
              </button>
              <div style={{ height: 14 }} aria-hidden="true" />
              <div style={{ width: 16, height: 16 }} aria-hidden="true" />
              <div className="flex items-end gap-1.5">
                <div className="flex gap-px" role="presentation" aria-hidden="true" style={{ height: VU_HEIGHT }}>
                  {([masterSegRefsL, masterSegRefsR] as const).map((refsObj, ch) => (
                    <div key={ch} className="flex flex-col-reverse" style={{ gap: VU_SEG_GAP, width: 4, position: 'relative' }}>
                      {Array.from({ length: VU_SEGS }, (_, i) => (
                        <div key={i}
                          ref={el => { if (el) refsObj.current[i] = el }}
                          style={{ height: VU_SEG_H, borderRadius: 1, background: C.metalDark }}
                        />
                      ))}
                      <div
                        ref={el => { if (ch === 0) masterPeakDotL.current = el; else masterPeakDotR.current = el }}
                        style={{
                          position: 'absolute', left: -1, right: -1, height: 2,
                          borderRadius: 1, background: '#fff', opacity: 0,
                          pointerEvents: 'none',
                        }}
                      />
                    </div>
                  ))}
                </div>
                <StudioFader value={masterVol} onChange={setMasterVol} height={VU_HEIGHT} ariaLabel="Master volume" />
              </div>
              <span
                ref={masterDbReadout}
                className="font-mono"
                aria-live="polite"
                aria-label="Master output level"
                style={{ fontSize: 9, color: C.textSec }}
              >
                {formatDb(faderToDb(masterVol))}
              </span>
              <p style={{ fontSize: 8, fontWeight: 700, color: C.textPri }}>Master</p>
            </div>
            <div className="w-full flex-shrink-0" style={{ height: 6, background: `${C.accent}44` }} />
          </div>
        </div>

        {/* Right wood end cheek */}
        <div className="wood-panel flex-shrink-0 self-stretch rounded-r"
          style={{ width: 14, margin: '0 10px', minHeight: 60, borderLeft: `1px solid rgba(255,255,255,0.06)` }} />
      </div>
    </div>
  )
}

// ─── TransportBar ─────────────────────────────────────────────────────────────
interface TransportBarProps {
  isRecording: boolean; setIsRecording: (v: boolean | ((p: boolean) => boolean)) => void
  playing: boolean;     setPlaying: (v: boolean | ((p: boolean) => boolean)) => void
  bpm: number;          setBpm: (v: number) => void
  playheadBar: number;  setPlayheadBar: (v: number) => void
  showInvite: boolean;  setShowInvite: (v: boolean) => void
}
function TransportBar({ isRecording, setIsRecording, playing, setPlaying, bpm, setBpm, playheadBar, setPlayheadBar, showInvite, setShowInvite }: TransportBarProps) {

  const bar   = Math.floor(playheadBar) + 1
  const beat  = Math.floor((playheadBar % 1) * 4) + 1
  const ticks = Math.floor(((playheadBar * 4) % 1) * 960)
  const pos   = `${String(bar).padStart(3,'0')}.${beat}.${String(ticks).padStart(3,'0')}`

  return (
    <header className="flex items-center px-4 gap-5 flex-shrink-0 border-b" style={{ height: 52, background: C.surface, borderColor: C.border }}>
      <span className="font-bold text-sm tracking-widest" style={{ color: C.accent }}>COLLAB.DAW</span>
      <div style={{ width: 1, height: 28, background: C.border }} />
      <div className="flex items-center gap-2">
        <TransBtn label="⏮" onClick={() => { setPlaying(false); setPlayheadBar(0) }} />
        <button onClick={() => setPlaying(p => !p)}
          className="flex items-center justify-center rounded font-bold transition-all hover:brightness-125 active:brightness-90"
          style={{ width: 32, height: 28, background: playing ? C.accent : C.control, color: playing ? '#fff' : C.textSec,
            boxShadow: playing ? `0 0 12px ${C.success}66, 0 0 4px ${C.success}44` : 'none' }}>
          {playing ? '⏸' : '▶'}
        </button>
        {/* Stop: halt playback, keep playhead position. RTZ (⏮) already resets to bar 1. */}
        <TransBtn label="⏹" onClick={() => setPlaying(false)} />
        <button onClick={() => setIsRecording(r => !r)}
          className={`flex items-center justify-center rounded font-bold transition-all hover:brightness-125${isRecording ? ' record-pulse' : ''}`}
          style={{ width: 32, height: 28, background: isRecording ? C.danger : C.control,
            color: isRecording ? '#fff' : C.danger, boxShadow: isRecording ? `0 0 12px ${C.danger}66` : 'none' }}>
          ⏺
        </button>
      </div>
      <div className="flex items-center gap-1.5 rounded px-2.5 py-1"
        style={{ background: C.well, border: `1px solid ${C.border}`, boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.6)' }}>
        <span className="text-xs" style={{ color: C.textSec, letterSpacing: '0.05em' }}>BPM</span>
        <input type="number" value={bpm}
          onChange={e => setBpm(clamp(Number(e.target.value), 40, 300))}
          onBlur={e => setBpm(clamp(Number(e.target.value), 40, 300))}
          className="w-12 bg-transparent font-mono text-sm font-semibold tabular-nums text-right"
          style={{ color: C.success, outline: 'none', caretColor: C.accent }} min={40} max={300} />
      </div>
      <div className="flex items-center gap-1.5 rounded px-2.5 py-1"
        style={{ background: C.well, border: `1px solid ${C.border}`, boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.6)' }}>
        <span className="text-xs" style={{ color: C.textSec, letterSpacing: '0.05em' }}>POS</span>
        <span className="font-mono text-sm font-semibold tabular-nums" style={{ color: C.textPri }}>{pos}</span>
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        <span className="text-xs" style={{ color: C.textSec }}>Live session</span>
        <div className="flex -space-x-2">{COLLABORATORS.map(c => <Avatar key={c.id} collab={c} size={26} />)}</div>
        <button onClick={() => setShowInvite(true)}
          className="rounded px-3 py-1 text-xs font-medium transition-all hover:brightness-125"
          style={{ background: C.accentMuted, color: C.accent, border: `1px solid ${C.accent}44` }}>
          + Invite
        </button>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full inline-block" style={{ background: C.success, boxShadow: `0 0 6px ${C.success}` }} />
        <span className="text-xs" style={{ color: C.textSec }}>Connected</span>
      </div>
    </header>
  )
}

// ─── InviteModal ──────────────────────────────────────────────────────────────
function InviteModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail]   = useState('')
  const [role, setRole]     = useState<'Editor' | 'Viewer'>('Editor')
  const [sent, setSent]     = useState(false)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  function handleSend() {
    if (!email.trim()) return
    // Stub: real implementation will POST to /api/invites
    setSent(true)
    setTimeout(onClose, 1200)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div className="rounded-xl p-6 shadow-2xl w-96" style={{ background: C.elevated, border: `1px solid ${C.control}` }} onClick={e => e.stopPropagation()}>
        <h2 className="text-base font-semibold mb-1" style={{ color: C.textPri }}>Invite a collaborator</h2>
        <p className="text-sm mb-5" style={{ color: C.textSec }}>They'll join the live session with the role you assign.</p>
        {sent
          ? <p className="text-sm text-center py-4" style={{ color: C.success }}>Invite sent!</p>
          : <>
            <label className="block text-xs mb-1" style={{ color: C.textSec }}>Email address</label>
            <input type="email" placeholder="friend@studio.com" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full rounded px-3 py-2 text-sm mb-4" style={{ background: C.well, border: `1px solid ${C.control}`, color: C.textPri, outline: 'none' }} />
            <label className="block text-xs mb-2" style={{ color: C.textSec }}>Role</label>
            <div className="flex gap-2 mb-6">
              {(['Editor', 'Viewer'] as const).map(r => (
                <button key={r} onClick={() => setRole(r)} className="flex-1 rounded py-1.5 text-sm font-medium transition-all hover:brightness-110"
                  style={{ background: role === r ? C.accent : C.control, color: role === r ? '#fff' : C.textSec, border: `1px solid ${role === r ? C.accent : 'transparent'}` }}>
                  {r}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 rounded py-2 text-sm transition-all hover:brightness-110" style={{ background: C.control, color: C.textSec }}>Cancel</button>
              <button onClick={handleSend} disabled={!email.trim()}
                className="flex-1 rounded py-2 text-sm font-semibold transition-all hover:brightness-110 disabled:opacity-40"
                style={{ background: C.accent, color: '#fff', cursor: email.trim() ? 'pointer' : 'not-allowed' }}>
                Send invite
              </button>
            </div>
          </>
        }
      </div>
    </div>
  )
}

// ─── StatusBar ────────────────────────────────────────────────────────────────
function StatusBar() {
  return (
    <footer className="flex items-center px-4 gap-4 flex-shrink-0 text-xs border-t"
      style={{ height: 28, background: C.surface, borderColor: C.border, color: C.textSec }}>
      <span>Ready</span>
      <span style={{ color: C.border }}>│</span>
      <div className="flex items-center gap-2">
        <div className="flex -space-x-1.5">
          {COLLABORATORS.map(c => (
            <div key={c.id} className="relative">
              <Avatar collab={c} size={18} ring />
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ping-dot" style={{ background: C.success, opacity: 0.75 }} />
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full" style={{ background: C.success }} />
            </div>
          ))}
        </div>
        <span style={{ color: C.success }}>4 online</span>
      </div>
      <div className="flex-1" />
      <span>CPU 14%</span>
      <span>RAM 1.4 GB</span>
      <span>Latency 12 ms</span>
    </footer>
  )
}

// ─── Plugin chain seed data ───────────────────────────────────────────────────
const INITIAL_PLUGIN_CHAINS: Record<string, PluginSlot[]> = {
  t1: [
    { id: 'p0', type: 'compressor', enabled: true,  params: { threshold: -24, ratio: 4, attack: 3, release: 250 } },
  ],
  t4: [
    { id: 'p1', type: 'compressor', enabled: true,  params: { threshold: -18, ratio: 4, attack: 10, release: 100 } },
    { id: 'p2', type: 'reverb',     enabled: false, params: { wet: 20, size: 40 } },
    { id: 'p3', type: 'delay',      enabled: true,  params: { time: 250, feedback: 30, wet: 25 } },
  ],
  master: [
    { id: 'p4', type: 'maximizer',  enabled: true,  params: { ceiling: -0.3, gain: 3 } },
  ],
}

// ─── Presence seed data ───────────────────────────────────────────────────────
const DEMO_PRESENCE = [
  { userId: 'anna',   playheadBar: 6.5,  activeTrackId: 't2', color: '#1D9E75' },
  { userId: 'miguel', playheadBar: 14.0, activeTrackId: 't4', color: '#E94560' },
]

// ─── PluginBrowser popover ────────────────────────────────────────────────────
const PLUGIN_REGISTRY: { type: PluginType; label: string; category: string; defaultParams: Record<string, number> }[] = [
  { type: 'compressor', label: 'Compressor',    category: 'Dynamics',     defaultParams: { threshold: -18, ratio: 4, attack: 10, release: 100 } },
  { type: 'limiter',    label: 'Limiter',        category: 'Dynamics',     defaultParams: { threshold: -3, ceiling: 0 } },
  { type: 'eq',         label: 'Parametric EQ',  category: 'EQ',           defaultParams: { gain: 0 } },
  { type: 'reverb',     label: 'Reverb',          category: 'Reverb/Delay', defaultParams: { wet: 20, size: 40 } },
  { type: 'delay',      label: 'Delay',           category: 'Reverb/Delay', defaultParams: { time: 250, feedback: 30, wet: 25 } },
  { type: 'maximizer',  label: 'Maximizer',       category: 'Utility',      defaultParams: { ceiling: -0.3, gain: 3 } },
]

let _pluginSeq = 100
function mkPluginSlot(type: PluginType): PluginSlot {
  const def = PLUGIN_REGISTRY.find(p => p.type === type)!
  return { id: `p-${++_pluginSeq}`, type, enabled: true, params: { ...def.defaultParams } }
}

interface PluginBrowserProps {
  ownerColor: string
  onAdd: (slot: PluginSlot) => void
  onClose: () => void
}

const PluginBrowser = ({ ownerColor, onAdd, onClose }: PluginBrowserProps) => {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    function onMouseDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onMouseDown)
    return () => { window.removeEventListener('keydown', onKeyDown); document.removeEventListener('mousedown', onMouseDown) }
  }, [onClose])

  const filtered = query.trim()
    ? PLUGIN_REGISTRY.filter(p => p.label.toLowerCase().includes(query.toLowerCase()) || p.category.toLowerCase().includes(query.toLowerCase()))
    : PLUGIN_REGISTRY

  const categories = Array.from(new Set(filtered.map(p => p.category)))

  return (
    <div ref={panelRef} className="absolute rounded-xl shadow-2xl overflow-hidden flex flex-col"
      style={{
        bottom: 48, right: 0, width: 280, maxHeight: 400,
        background: C.elevated, border: `1px solid ${C.border}`,
        boxShadow: `0 24px 48px rgba(0,0,0,0.6), 0 0 0 1px ${C.border}`,
        zIndex: 60,
      }}>
      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-2 border-b flex-shrink-0" style={{ borderColor: C.border }}>
        <span style={{ color: C.textSec, fontSize: 14 }}>⌕</span>
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search plugins…"
          className="flex-1 bg-transparent text-xs outline-none"
          style={{ color: C.textPri }}
        />
        {query && (
          <button onClick={() => setQuery('')} style={{ color: C.textSec, fontSize: 12, background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        )}
      </div>
      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {categories.map(cat => (
          <div key={cat}>
            <div className="px-3 py-1.5" style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: C.textSec, textTransform: 'uppercase' }}>
              {cat}
            </div>
            {filtered.filter(p => p.category === cat).map(p => (
              <button
                key={p.type}
                className="w-full text-left px-3 py-2 flex items-center justify-between transition-all hover:brightness-125"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                onClick={() => { onAdd(mkPluginSlot(p.type)); onClose() }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.control }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <span style={{ fontSize: 12, color: C.textPri }}>{p.label}</span>
                <span style={{ fontSize: 9, color: ownerColor, fontWeight: 600, letterSpacing: '0.05em' }}>ADD</span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Screw SVG (hi-fi rack aesthetic) ─────────────────────────────────────────
const Screw = () => (
  <svg width="8" height="8" viewBox="0 0 8 8" style={{ flexShrink: 0 }}>
    <circle cx="4" cy="4" r="3.5" fill={C.metalDark} stroke={C.metalLight} strokeWidth="0.5" />
    {/* Flat-head cross slot */}
    <line x1="2" y1="4" x2="6" y2="4" stroke={C.metalLight} strokeWidth="0.8" strokeLinecap="round" />
    <line x1="4" y1="2" x2="4" y2="6" stroke={C.metalLight} strokeWidth="0.8" strokeLinecap="round" />
  </svg>
)

// ─── PluginChainPanel ─────────────────────────────────────────────────────────
interface PluginChainPanelProps {
  trackId: string | null
  trackName: string
  plugins: PluginSlot[]
  onTogglePlugin: (slotId: string) => void
  onAddPlugin: (slot: PluginSlot) => void
  onReorderPlugins: (newOrder: PluginSlot[]) => void
  ownerColor: string
  onClose: () => void
}

function PluginChainPanel({ trackId, trackName, plugins, onTogglePlugin, onAddPlugin, onReorderPlugins, ownerColor, onClose }: PluginChainPanelProps) {
  const isMaster = trackId === 'master'
  const displayName = isMaster ? 'MASTER BUS' : trackName
  const [showBrowser, setShowBrowser] = useState(false)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const dragSrcIdx = useRef<number | null>(null)

  function keyParams(slot: PluginSlot): [string, number][] {
    return Object.entries(slot.params).slice(0, 3)
  }

  function formatParam(key: string, val: number): string {
    if (key === 'threshold') return `${val} dB`
    if (key === 'ratio')     return `${val}:1`
    if (key === 'attack' || key === 'release' || key === 'time') return `${val} ms`
    if (key === 'wet' || key === 'feedback') return `${val}%`
    if (key === 'ceiling') return `${val} dB`
    if (key === 'gain')    return `+${val} dB`
    if (key === 'size')    return `${val}%`
    return String(val)
  }

  function movePlugin(fromIdx: number, toIdx: number) {
    const next = [...plugins]
    const [moved] = next.splice(fromIdx, 1)
    next.splice(toIdx, 0, moved)
    onReorderPlugins(next)
  }

  return (
    <div className="flex flex-col overflow-hidden" style={{ flex: 1 }}>
      {/* Wood cabinet top rail */}
      <div className="wood-panel w-full flex-shrink-0 flex items-center justify-between px-4"
        style={{ height: 32, borderBottom: `2px solid ${ownerColor}44` }}>
        <div className="flex items-center gap-2">
          <Screw />
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.textSec }}>GDAW</span>
          <span style={{ fontSize: 9, color: ownerColor, fontWeight: 700, letterSpacing: '0.08em' }}>
            {displayName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 9, color: C.textSec }}>{plugins.length} {plugins.length === 1 ? 'unit' : 'units'}</span>
          <Screw />
          <button
            aria-label="Close FX chain"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: C.textSec, cursor: 'pointer', fontSize: 14, lineHeight: 1 }}
          >✕</button>
        </div>
      </div>

      {/* Owner-color trim stripe */}
      <div style={{ height: 2, background: `linear-gradient(90deg, ${ownerColor}88, ${ownerColor}22)`, flexShrink: 0 }} />

      {/* Chain content */}
      <div className="flex-1 overflow-y-auto" style={{ background: C.bg, position: 'relative' }}>
        {plugins.length === 0 ? (
          // Empty state — signal flow SVG + CTA
          <div className="flex flex-col items-center justify-center gap-5 px-6 py-8" style={{ minHeight: 300 }}>
            <svg width="220" height="80" viewBox="0 0 220 80" overflow="visible" aria-hidden="true" style={{ flexShrink: 0 }}>
              <defs>
                <radialGradient id="ownerGlowEmpty" cx="50%" cy="50%" r="50%">
                  <stop offset="0%"   stopColor={ownerColor} stopOpacity="0.08" />
                  <stop offset="100%" stopColor={ownerColor} stopOpacity="0"    />
                </radialGradient>
              </defs>
              <ellipse cx="110" cy="40" rx="52" ry="30" fill="url(#ownerGlowEmpty)" />
              <line x1="25"  y1="40" x2="70"  y2="40" stroke={C.border} strokeWidth="1" />
              <line x1="150" y1="40" x2="195" y2="40" stroke={C.border} strokeWidth="1" />
              <rect x="70" y="18" width="80" height="44" rx="4"
                fill="none" stroke={ownerColor} strokeOpacity="0.22"
                strokeWidth="1.5" strokeDasharray="4 3" />
              <line x1="82" y1="34" x2="138" y2="34" stroke={C.border} strokeWidth="0.75" opacity="0.6" />
              <line x1="82" y1="46" x2="138" y2="46" stroke={C.border} strokeWidth="0.75" opacity="0.6" />
              <circle cx="20"  cy="40" r="5" fill={C.surface} stroke={C.border} strokeWidth="1.5" />
              <text x="20"  y="30" fontSize="8" fill={C.textSec} textAnchor="middle" fontFamily="monospace">IN</text>
              <circle cx="200" cy="40" r="5" fill={C.surface} stroke={C.border} strokeWidth="1.5" />
              <text x="200" y="30" fontSize="8" fill={C.textSec} textAnchor="middle" fontFamily="monospace">OUT</text>
            </svg>
            <p style={{ fontSize: 13, fontWeight: 500, color: C.textPri, letterSpacing: '0.01em', margin: 0 }}>
              Clean signal
            </p>
            <p style={{ fontSize: 10, color: C.textSec, margin: 0, textAlign: 'center' }}>
              Add compression, reverb, EQ, and more.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-0" style={{ padding: '8px 0' }}>
            {plugins.map((slot, idx) => (
              <div key={slot.id}>
                {/* Drop insertion line */}
                {dragOverIdx === idx && (
                  <div style={{ height: 2, background: C.accent, margin: '0 12px', borderRadius: 1 }} />
                )}
                {/* Rack unit card — hi-fi brushed metal faceplate */}
                <div
                  draggable
                  onDragStart={() => { dragSrcIdx.current = idx }}
                  onDragOver={e => { e.preventDefault(); setDragOverIdx(idx) }}
                  onDragLeave={() => setDragOverIdx(null)}
                  onDrop={e => {
                    e.preventDefault()
                    setDragOverIdx(null)
                    if (dragSrcIdx.current !== null && dragSrcIdx.current !== idx) {
                      movePlugin(dragSrcIdx.current, idx)
                    }
                    dragSrcIdx.current = null
                  }}
                  onDragEnd={() => { setDragOverIdx(null); dragSrcIdx.current = null }}
                  onKeyDown={e => {
                    const isMod = e.metaKey || e.ctrlKey
                    if (isMod && e.key === 'ArrowUp'   && idx > 0)                  { e.preventDefault(); movePlugin(idx, idx - 1) }
                    if (isMod && e.key === 'ArrowDown' && idx < plugins.length - 1) { e.preventDefault(); movePlugin(idx, idx + 1) }
                  }}
                  tabIndex={0}
                  className="flex items-stretch mx-3 my-1 rounded overflow-hidden select-none focus-visible:outline-none"
                  style={{
                    background: `linear-gradient(180deg, ${C.metalLight} 0%, ${C.metalMid} 40%, ${C.metalDark} 100%)`,
                    border: `1px solid ${C.metalLight}33`,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 2px 4px rgba(0,0,0,0.4)`,
                    opacity: slot.enabled ? 1 : 0.55,
                    cursor: 'grab',
                    outline: dragOverIdx === idx ? `1px solid ${C.accent}` : 'none',
                  }}
                >
                  {/* Left bracket with screws */}
                  <div className="flex flex-col items-center justify-between px-1 py-1 flex-shrink-0"
                    style={{ width: 18, background: `linear-gradient(180deg, ${C.metalDark} 0%, ${C.metalMid}88 100%)`, borderRight: `1px solid ${C.metalLight}22` }}>
                    <Screw />
                    {/* Drag grip dots */}
                    <div className="flex flex-col gap-0.5">
                      {[0,1,2].map(i => (
                        <div key={i} style={{ width: 3, height: 3, borderRadius: '50%', background: C.metalLight, opacity: 0.5 }} />
                      ))}
                    </div>
                    <Screw />
                  </div>

                  {/* Faceplate body */}
                  <div className="flex-1 flex items-center gap-3 px-3 py-2">
                    {/* Power LED */}
                    <button
                      title={slot.enabled ? 'Bypass' : 'Enable'}
                      onClick={e => { e.stopPropagation(); onTogglePlugin(slot.id) }}
                      style={{
                        width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                        background: `radial-gradient(circle at 38% 38%, ${slot.enabled ? ownerColor : C.metalDark}, ${slot.enabled ? ownerColor + '88' : C.metalDark})`,
                        boxShadow: slot.enabled ? `0 0 6px ${ownerColor}, 0 0 12px ${ownerColor}66` : `inset 0 1px 2px rgba(0,0,0,0.6)`,
                        border: `1px solid ${C.metalLight}44`,
                        cursor: 'pointer',
                        transition: 'box-shadow 0.15s, background 0.15s',
                      }}
                      aria-label={slot.enabled ? 'Bypass plugin' : 'Enable plugin'}
                      aria-pressed={slot.enabled}
                    />

                    {/* Plugin name + type */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wide truncate"
                        style={{ fontSize: 10, color: slot.enabled ? C.textPri : C.textSec, letterSpacing: '0.1em' }}>
                        {slot.type}
                      </p>
                    </div>

                    {/* LCD param readout */}
                    <div className="flex flex-col items-end gap-px rounded px-1.5 py-0.5 flex-shrink-0"
                      style={{ background: C.well, border: `1px solid ${C.border}`, minWidth: 72 }}>
                      {keyParams(slot).slice(0, 2).map(([key, val]) => (
                        <div key={key} className="flex items-center gap-1.5">
                          <span style={{ fontSize: 8, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{key}</span>
                          <span className="font-mono" style={{ fontSize: 9, color: C.vuAmber }}>{formatParam(key, val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right bracket with screws */}
                  <div className="flex flex-col items-center justify-between px-1 py-1 flex-shrink-0"
                    style={{ width: 18, background: `linear-gradient(180deg, ${C.metalDark} 0%, ${C.metalMid}88 100%)`, borderLeft: `1px solid ${C.metalLight}22` }}>
                    <Screw />
                    <Screw />
                  </div>
                </div>
              </div>
            ))}
            {/* Final drop zone */}
            {dragOverIdx === plugins.length && (
              <div style={{ height: 2, background: C.accent, margin: '0 12px', borderRadius: 1 }} />
            )}
          </div>
        )}

        {/* Add Unit slot — always visible at bottom of chain */}
        <div className="relative mx-3 mb-3 mt-1" style={{ position: 'relative' }}>
          <button
            className="w-full rounded flex items-center justify-center gap-2 transition-all"
            onClick={() => setShowBrowser(b => !b)}
            style={{
              height: 40, background: 'transparent', cursor: 'pointer',
              border: `1px dashed ${C.border}`,
              color: C.textSec, fontSize: 11, fontWeight: 600,
              letterSpacing: '0.06em',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement
              el.style.borderColor = ownerColor + '88'
              el.style.color = ownerColor
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement
              el.style.borderColor = C.border
              el.style.color = C.textSec
            }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
            ADD UNIT
          </button>
          {showBrowser && (
            <PluginBrowser
              ownerColor={ownerColor}
              onAdd={slot => { onAddPlugin(slot); setShowBrowser(false) }}
              onClose={() => setShowBrowser(false)}
            />
          )}
        </div>
      </div>

      {/* Wood cabinet bottom rail */}
      <div style={{ height: 2, background: `linear-gradient(90deg, ${ownerColor}22, ${ownerColor}88)`, flexShrink: 0 }} />
      <div className="wood-panel w-full flex-shrink-0 flex items-center justify-between px-4"
        style={{ height: 20, borderTop: `2px solid ${ownerColor}44` }}>
        <Screw />
        <span style={{ fontSize: 8, color: C.textSec, letterSpacing: '0.08em' }}>SIGNAL CHAIN · {plugins.length} UNIT{plugins.length !== 1 ? 'S' : ''}</span>
        <Screw />
      </div>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [tracks, setTracks]               = useState<Track[]>(INITIAL_TRACKS)
  const [pluginChains, setPluginChains]   = useState<Record<string, PluginSlot[]>>(INITIAL_PLUGIN_CHAINS)
  const [isRecording, setIsRecording]     = useState(false)
  const [playing, setPlaying]             = useState(false)
  const [bpm, setBpm]                     = useState(128)
  const [playheadBar, setPlayheadBar]     = useState(0)
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null)
  const [selectedClipId, setSelectedClipId]   = useState<string | null>(null)
  const [showInvite, setShowInvite]       = useState(false)
  const [tool, setTool]                   = useState<Tool>('select')
  const [audioCtxReady, setAudioCtxReady] = useState(false)
  const rafRef        = useRef<number | null>(null)
  const playStartRef  = useRef<number>(0)
  const barAtStartRef = useRef<number>(0)
  // Ref for keyboard handler to access selectedClipId without stale closure
  const selectedClipIdRef = useRef<string | null>(null)
  selectedClipIdRef.current = selectedClipId
  // Ref so Effect A can read pluginChains without taking a dep that restarts sources
  const pluginChainsRef = useRef<Record<string, PluginSlot[]>>(pluginChains)
  pluginChainsRef.current = pluginChains

  useEffect(() => {
    if (!playing) { if (rafRef.current) cancelAnimationFrame(rafRef.current); return }
    playStartRef.current  = performance.now()
    barAtStartRef.current = playheadBar
    const barsPerMs = bpm / 60 / 4 / 1000
    function tick() {
      const elapsed = performance.now() - playStartRef.current
      const next    = barAtStartRef.current + elapsed * barsPerMs
      if (next >= BARS) { setPlaying(false); setPlayheadBar(0); return }
      setPlayheadBar(next)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [playing, bpm]) // eslint-disable-line react-hooks/exhaustive-deps

  // Effect A — source lifecycle: only create/destroy sources when transport starts or stops.
  // Intentionally does NOT depend on `tracks` — mutations (mute, volume, pan) are handled
  // smoothly in Effect B without stopping sources and causing audible gaps.
  useEffect(() => {
    if (!playing) {
      stopAllSources()
      return
    }

    const ctx = getAudioCtx()
    setAudioCtxReady(true)

    stopAllSources()

    tracks.forEach(track => {
      const clip = track.clips.find(c => c.assetUrl !== null)
      if (!clip || !clip.assetUrl) return

      const buf = resolveBuffer(clip.assetUrl)
      if (!buf) return

      const source  = ctx.createBufferSource()
      source.buffer = buf
      source.loop   = true

      const gain    = ctx.createGain()
      gain.gain.value = track.volume / 100

      // Post-fader tap — AnalyserNode reads signal after the fader GainNode
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0

      const panner  = ctx.createStereoPanner()
      panner.pan.value = track.pan / 100

      // Wire plugin chain before fader: source → [plugins] → gain
      const trackPlugins = pluginChainsRef.current[track.id] ?? []
      rewirePluginChain(ctx, track.id, trackPlugins, source, gain)

      gain.connect(analyser)
      analyser.connect(panner)
      // Route through master gain instead of directly to destination
      if (_masterGain) {
        panner.connect(_masterGain)
      } else {
        panner.connect(ctx.destination)
      }
      source.start()

      _activeSources.set(track.id, { source, gain, analyser, panner })
    })

    return () => { stopAllSources() }
  }, [playing]) // eslint-disable-line react-hooks/exhaustive-deps

  // Effect B — live parameter updates: smoothly update gain/pan without restarting sources.
  // 10 ms ramp avoids zipper noise on rapid changes.
  useEffect(() => {
    if (!playing) return
    const anySoloed = tracks.some(t => t.soloed)
    tracks.forEach(track => {
      const active = _activeSources.get(track.id)
      if (!active) return
      const effectiveMute = track.muted || (anySoloed && !track.soloed)
      const now = getAudioCtx().currentTime
      active.gain.gain.setTargetAtTime(effectiveMute ? 0 : track.volume / 100, now, 0.01)
      active.panner.pan.setTargetAtTime(track.pan / 100, now, 0.01)
    })
  }, [playing, tracks])

  // Effect C — live plugin chain rewiring: runs when pluginChains changes while playing.
  // Reconciles nodes (create missing, remove stale) and rewires the chain without
  // restarting sources or touching the fader/analyser/panner nodes.
  useEffect(() => {
    if (!playing) return
    const ctx = getAudioCtx()
    for (const [trackId, plugins] of Object.entries(pluginChains)) {
      const active = _activeSources.get(trackId)
      if (!active) continue
      rewirePluginChain(ctx, trackId, plugins, active.source, active.gain)
    }
  }, [playing, pluginChains])

  // Global keyboard shortcuts — skip when focus is in a text input
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (e.code === 'Space') {
        e.preventDefault()
        setPlaying(p => !p)
        return
      }
      if (e.key === 'Escape') {
        setShowInvite(false)
        setSelectedTrackId(null)
        return
      }
      if (e.key === 'v' || e.key === 'V') { setTool('select'); return }
      if (e.key === 'c' || e.key === 'C') { setTool('cut'); return }

      // Shift+, / Shift+. — adjust active clip fade curve ±0.05
      if (e.shiftKey && e.key === '<') {
        setTracks(prev => prev.map(t => ({
          ...t, clips: t.clips.map(c => {
            if (c.id !== selectedClipIdRef.current) return c
            return { ...c,
              fadeInCurve:  clamp(c.fadeInCurve  - 0.05, 0.05, 0.95),
              fadeOutCurve: clamp(c.fadeOutCurve - 0.05, 0.05, 0.95),
            }
          })
        })))
        return
      }
      if (e.shiftKey && e.key === '>') {
        setTracks(prev => prev.map(t => ({
          ...t, clips: t.clips.map(c => {
            if (c.id !== selectedClipIdRef.current) return c
            return { ...c,
              fadeInCurve:  clamp(c.fadeInCurve  + 0.05, 0.05, 0.95),
              fadeOutCurve: clamp(c.fadeOutCurve + 0.05, 0.05, 0.95),
            }
          })
        })))
        return
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [setTracks])

  function handleSelectTrack(id: string) {
    setSelectedTrackId(prev => prev === id ? null : id)
  }

  const selectedTrack = tracks.find(t => t.id === selectedTrackId) ?? null
  const pluginChain   = selectedTrackId ? (pluginChains[selectedTrackId] ?? []) : []

  function togglePlugin(slotId: string) {
    if (!selectedTrackId) return
    setPluginChains(prev => ({
      ...prev,
      [selectedTrackId]: (prev[selectedTrackId] ?? []).map(s =>
        s.id !== slotId ? s : { ...s, enabled: !s.enabled }
      ),
    }))
  }

  function addPlugin(slot: PluginSlot) {
    if (!selectedTrackId) return
    setPluginChains(prev => ({
      ...prev,
      [selectedTrackId]: [...(prev[selectedTrackId] ?? []), slot],
    }))
  }

  function reorderPlugins(newOrder: PluginSlot[]) {
    if (!selectedTrackId) return
    setPluginChains(prev => ({ ...prev, [selectedTrackId]: newOrder }))
  }

  return (
    <div className="flex flex-col" style={{ minWidth: 1280, height: '100vh', background: C.bg, color: C.textPri, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <TransportBar
        isRecording={isRecording} setIsRecording={setIsRecording}
        playing={playing} setPlaying={setPlaying}
        bpm={bpm} setBpm={setBpm}
        playheadBar={playheadBar} setPlayheadBar={setPlayheadBar}
        showInvite={showInvite} setShowInvite={setShowInvite}
      />
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <ArrangeView
            tracks={tracks} setTracks={setTracks} isRecording={isRecording}
            playheadBar={playheadBar} setPlayheadBar={setPlayheadBar}
            selectedTrackId={selectedTrackId} onSelectTrack={handleSelectTrack}
            tool={tool} setTool={setTool}
            audioCtxReady={audioCtxReady}
            selectedClipId={selectedClipId} onSelectClip={setSelectedClipId}
          />
          <MixerPanel tracks={tracks} setTracks={setTracks} pluginChains={pluginChains} onSelectTrack={handleSelectTrack} selectedTrackId={selectedTrackId} />
        </div>
      </div>
      <StatusBar />

      {/* FX chain overlay backdrop — always in DOM so exit animation plays */}
      <div
        onClick={() => setSelectedTrackId(null)}
        style={{
          position: 'fixed',
          top: TRANSPORT_H,
          bottom: STATUS_BAR_H,
          left: 0,
          right: 0,
          background: 'rgba(0,0,0,0.45)',
          opacity: selectedTrackId !== null ? 1 : 0,
          pointerEvents: selectedTrackId !== null ? 'auto' : 'none',
          transition: 'opacity 180ms ease',
          zIndex: 44,
        }}
      />

      {/* FX chain overlay panel — always in DOM so exit animation plays */}
      <div
        style={{
          position: 'fixed',
          top: TRANSPORT_H,
          bottom: STATUS_BAR_H,
          right: 0,
          width: 720,
          transform: selectedTrackId !== null ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 220ms cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 45,
          display: 'flex',
          flexDirection: 'column',
          background: C.elevated,
          borderLeft: `1px solid ${C.border}`,
          overflow: 'hidden',
        }}
      >
        <PluginChainPanel
          trackId={selectedTrackId}
          trackName={selectedTrack?.name ?? ''}
          plugins={pluginChain}
          onTogglePlugin={togglePlugin}
          onAddPlugin={addPlugin}
          onReorderPlugins={reorderPlugins}
          ownerColor={selectedTrackId === 'master' ? C.accent : (tracks.find(t => t.id === selectedTrackId)?.owner.color ?? C.accent)}
          onClose={() => setSelectedTrackId(null)}
        />
      </div>

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
    </div>
  )
}
