import React, { useState, useRef, useCallback } from 'react'
import './App.css'

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────────────────────────────────────
const BG        = '#0A0A0F'
const SURFACE   = '#111118'
const ELEVATED  = '#1A1A24'
const BORDER    = '#1E1E2A'
const BORDER2   = '#2A2A3A'
const TEXT_PRI  = '#F0F0F5'
const TEXT_SEC  = '#888899'
const TEXT_DIM  = '#3A3A52'
const ACCENT    = '#6B5CE7'
const DANGER    = '#E94560'
const SUCCESS   = '#1DB954'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface Owner { id: string; name: string; color: string; initials: string }
interface Clip  { id: string; bar: number; bars: number; label: string }
interface Track {
  id: string
  name: string
  type: 'AUDIO' | 'MIDI' | 'BUS'
  owner: Owner
  input: string
  armed: boolean
  muted: boolean
  soloed: boolean
  volume: number   // 0–127
  pan: number      // -64..63, 0 = center
  sendA: number    // 0–100  (Reverb)
  sendB: number    // 0–100  (Delay)
  clips: Clip[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Layout constants
// ─────────────────────────────────────────────────────────────────────────────
const TRANSPORT_H = 52
const RULER_H     = 26
const TRACK_H     = 58
const BAR_W       = 80
const SIDEBAR_W   = 228
const TOTAL_BARS  = 20

// ─────────────────────────────────────────────────────────────────────────────
// Seed data
// ─────────────────────────────────────────────────────────────────────────────
const OWNERS: Owner[] = [
  { id: 'ls', name: 'Luke S.',   color: '#6B5CE7', initials: 'LS' },
  { id: 'ak', name: 'Anna K.',   color: '#1DB954', initials: 'AK' },
  { id: 'mr', name: 'Miguel R.', color: '#E94560', initials: 'MR' },
  { id: 'pn', name: 'Priya N.',  color: '#F5A623', initials: 'PN' },
]

const INIT_TRACKS: Track[] = [
  {
    id: 't1', name: 'Kick + Snare', type: 'AUDIO', owner: OWNERS[0], input: 'AUX 1–2',
    armed: false, muted: false, soloed: false, volume: 102, pan: 0, sendA: 8, sendB: 4,
    clips: [
      { id: 'c1', bar: 1,  bars: 4, label: 'Drums A' },
      { id: 'c2', bar: 5,  bars: 4, label: 'Drums A' },
      { id: 'c3', bar: 11, bars: 2, label: 'Fill'    },
      { id: 'c4', bar: 13, bars: 4, label: 'Drums B' },
    ],
  },
  {
    id: 't2', name: 'Bass Line', type: 'MIDI', owner: OWNERS[1], input: 'MIDI CH 1',
    armed: true, muted: false, soloed: false, volume: 90, pan: -18, sendA: 0, sendB: 22,
    clips: [
      { id: 'c5', bar: 1,  bars: 8, label: 'Bass A' },
      { id: 'c6', bar: 11, bars: 6, label: 'Bass B' },
    ],
  },
  {
    id: 't3', name: 'Lead Synth', type: 'MIDI', owner: OWNERS[2], input: 'MIDI CH 2',
    armed: false, muted: false, soloed: false, volume: 78, pan: 24, sendA: 44, sendB: 28,
    clips: [
      { id: 'c7', bar: 5,  bars: 4, label: 'Lead A' },
      { id: 'c8', bar: 9,  bars: 4, label: 'Lead A' },
      { id: 'c9', bar: 13, bars: 4, label: 'Lead B' },
    ],
  },
  {
    id: 't4', name: 'Atmosphere', type: 'AUDIO', owner: OWNERS[3], input: 'AUX 3–4',
    armed: false, muted: true, soloed: false, volume: 60, pan: 0, sendA: 78, sendB: 10,
    clips: [
      { id: 'c10', bar: 1, bars: 16, label: 'Pad Chord' },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic pseudo-random (xorshift)
// ─────────────────────────────────────────────────────────────────────────────
function hashStr(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = Math.imul(31, h) ^ s.charCodeAt(i)
  return h >>> 0
}
function makeRng(seed: string) {
  let s = hashStr(seed) || 1
  return () => {
    s ^= s << 13; s ^= s >> 7; s ^= s << 17
    return (s >>> 0) / 0xffffffff
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Waveform (audio clips)
// ─────────────────────────────────────────────────────────────────────────────
function AudioWave({ clipId, bars, color }: { clipId: string; bars: number; color: string }) {
  const rand = makeRng(clipId)
  const cols = bars * 18
  const H = 36

  // Build amplitude array with transient peaks
  const amps: number[] = []
  for (let i = 0; i < cols; i++) {
    const r = rand()
    amps.push(r > 0.88 ? 0.55 + rand() * 0.45 : rand() * 0.55)
  }

  return (
    <svg
      viewBox={`0 0 ${cols * 3} ${H}`}
      width="100%" height="100%"
      preserveAspectRatio="none"
      style={{ display: 'block', position: 'absolute', inset: 0 }}
    >
      {amps.map((amp, i) => {
        const h = amp * H * 0.9
        const y = (H - h) / 2
        return <rect key={i} x={i * 3} y={y} width={2} height={h} fill={color} opacity={0.55} />
      })}
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MIDI note pattern (midi clips)
// ─────────────────────────────────────────────────────────────────────────────
function MidiPattern({ clipId, bars, color }: { clipId: string; bars: number; color: string }) {
  const rand = makeRng(clipId)
  const H = 36
  const W = bars * BAR_W  // logical width units
  const notes: { x: number; y: number; w: number }[] = []

  let cursor = 0
  const totalBeats = bars * 4
  while (cursor < totalBeats - 0.5) {
    const dur   = 0.25 + rand() * (rand() > 0.7 ? 2 : 0.75)
    const pitch = 0.15 + rand() * 0.7       // inverted: low pitch = high y
    notes.push({
      x: (cursor / totalBeats) * W,
      y: pitch * (H - 4),
      w: Math.min((dur / totalBeats) * W - 2, W - (cursor / totalBeats) * W),
    })
    cursor += dur + rand() * 0.25
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%" height="100%"
      preserveAspectRatio="none"
      style={{ display: 'block', position: 'absolute', inset: 0 }}
    >
      {notes.map((n, i) => (
        <rect key={i} x={n.x} y={n.y} width={Math.max(n.w, 2)} height={3} rx={1}
          fill={color} opacity={0.75} />
      ))}
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Clip block
// ─────────────────────────────────────────────────────────────────────────────
function ClipBlock({ clip, track }: { clip: Clip; track: Track }) {
  const c = track.owner.color
  return (
    <div
      title={clip.label}
      style={{
        position: 'absolute',
        left: (clip.bar - 1) * BAR_W + 1,
        top: 5,
        bottom: 5,
        width: clip.bars * BAR_W - 2,
        borderRadius: 3,
        background: c + '1C',
        borderLeft: `2px solid ${c}`,
        borderTop: `1px solid ${c}44`,
        overflow: 'hidden',
        cursor: 'grab',
        userSelect: 'none',
      }}
    >
      {track.type === 'AUDIO'
        ? <AudioWave clipId={clip.id} bars={clip.bars} color={c} />
        : <MidiPattern clipId={clip.id} bars={clip.bars} color={c} />
      }
      <span style={{
        position: 'absolute',
        top: 3,
        left: 5,
        fontSize: 9,
        fontWeight: 700,
        color: c,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        textShadow: `0 1px 4px ${BG}`,
        pointerEvents: 'none',
      }}>
        {clip.label}
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Pan knob — drag to adjust
// ─────────────────────────────────────────────────────────────────────────────
function PanKnob({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const dragRef = useRef<{ startY: number; startVal: number } | null>(null)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragRef.current = { startY: e.clientY, startVal: value }
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return
      const delta = Math.round((dragRef.current.startY - ev.clientY) * 1.2)
      onChange(Math.max(-64, Math.min(63, dragRef.current.startVal + delta)))
    }
    const onUp = () => {
      dragRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [value, onChange])

  const onDblClick = () => onChange(0)

  // Map value (-64..63) → angle (-135..135 from 12 o'clock)
  const angle  = (value / 64) * 135
  const rad    = ((angle - 90) * Math.PI) / 180
  const cx = 14, cy = 14, r = 9
  const dx = cx + r * Math.cos(rad)
  const dy = cy + r * Math.sin(rad)

  // Arc: draw from 225° to (225 + progress*270)° where progress=0..1
  const norm = (value + 64) / 127          // 0..1
  const sweep = norm * 270                  // degrees
  const startRad = (225 - 90) * Math.PI / 180
  const endRad   = (225 + sweep - 90) * Math.PI / 180
  const arcX1 = cx + r * Math.cos(startRad)
  const arcY1 = cy + r * Math.sin(startRad)
  const arcX2 = cx + r * Math.cos(endRad)
  const arcY2 = cy + r * Math.sin(endRad)
  const largeArc = sweep > 180 ? 1 : 0

  const panLabel = value === 0 ? 'C' : value > 0 ? `R${value}` : `L${-value}`

  return (
    <div
      onMouseDown={onMouseDown}
      onDoubleClick={onDblClick}
      title={`Pan: ${panLabel}  (double-click to center)`}
      style={{ cursor: 'ns-resize', userSelect: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}
    >
      <svg width="28" height="28" viewBox="0 0 28 28">
        {/* Track ring */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={BORDER2} strokeWidth={2.5}
          strokeDasharray={`${Math.PI * r * 1.5} ${Math.PI * r * 0.5}`}
          strokeDashoffset={-Math.PI * r * 0.25}
          strokeLinecap="round"
        />
        {/* Value arc */}
        {sweep > 2 && (
          <path
            d={`M ${arcX1} ${arcY1} A ${r} ${r} 0 ${largeArc} 1 ${arcX2} ${arcY2}`}
            fill="none"
            stroke={value === 0 ? TEXT_DIM : (value < 0 ? '#60A5FA' : '#F87171')}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        )}
        {/* Indicator dot */}
        <circle cx={dx} cy={dy} r={2.5} fill={TEXT_PRI} />
      </svg>
      <span style={{ fontSize: 8, color: TEXT_SEC, letterSpacing: '0.02em' }}>{panLabel}</span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Level meter (static — segments)
// ─────────────────────────────────────────────────────────────────────────────
function LevelMeter({ volume }: { volume: number }) {
  const SEGS = 14
  const active = Math.round((volume / 127) * SEGS)
  return (
    <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: 1.5, width: 5 }}>
      {Array.from({ length: SEGS }).map((_, i) => {
        const lit = i < active
        const col = i >= SEGS - 2 ? DANGER : i >= SEGS - 5 ? '#F5A623' : SUCCESS
        return (
          <div key={i} style={{
            height: 3, borderRadius: 1,
            background: lit ? col : BORDER2,
            opacity: lit ? 1 : 0.25,
          }} />
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Mixer channel strip
// ─────────────────────────────────────────────────────────────────────────────
function MixerStrip({
  track,
  onVolume,
  onPan,
  onSendA,
  onSendB,
}: {
  track: Track
  onVolume: (id: string, v: number) => void
  onPan: (id: string, v: number) => void
  onSendA: (id: string, v: number) => void
  onSendB: (id: string, v: number) => void
}) {
  const c = track.owner.color
  const isMuted = track.muted

  return (
    <div style={{
      width: 62,
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '10px 5px 8px',
      borderRight: `1px solid ${BORDER}`,
      background: isMuted ? '#0D0D14' : SURFACE,
      gap: 6,
      opacity: isMuted ? 0.45 : 1,
      transition: 'opacity 0.15s',
    }}>
      {/* Track name */}
      <span style={{
        fontSize: 8.5,
        fontWeight: 700,
        color: c,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        textAlign: 'center',
        width: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {track.name}
      </span>

      {/* Owner avatar */}
      <div style={{
        width: 20, height: 20, borderRadius: '50%',
        background: c + '28', border: `1.5px solid ${c}66`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 8, fontWeight: 800, color: c, flexShrink: 0,
      }}>
        {track.owner.initials}
      </div>

      {/* Sends */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {[
          { label: 'REV', val: track.sendA, cb: (v: number) => onSendA(track.id, v) },
          { label: 'DLY', val: track.sendB, cb: (v: number) => onSendB(track.id, v) },
        ].map(({ label, val, cb }) => (
          <div key={label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ fontSize: 7.5, color: TEXT_DIM, letterSpacing: '0.04em' }}>{label}</span>
              <span style={{ fontSize: 7.5, color: TEXT_DIM, fontVariantNumeric: 'tabular-nums' }}>{val}</span>
            </div>
            <input
              type="range" min={0} max={100} value={val}
              onChange={e => cb(Number(e.target.value))}
              className="send"
              style={{ accentColor: ACCENT } as React.CSSProperties}
            />
          </div>
        ))}
      </div>

      {/* Pan knob */}
      <PanKnob value={track.pan} onChange={v => onPan(track.id, v)} />

      {/* Fader + meter */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, flex: 1, minHeight: 80 }}>
        <input
          type="range"
          min={0} max={127}
          value={track.volume}
          onChange={e => onVolume(track.id, Number(e.target.value))}
          className="fader"
          style={{ height: 88, accentColor: c } as React.CSSProperties}
        />
        <LevelMeter volume={track.volume} />
      </div>

      {/* dB readout */}
      <span style={{
        fontSize: 8.5, color: TEXT_SEC, fontVariantNumeric: 'tabular-nums',
        letterSpacing: '-0.01em',
      }}>
        {track.volume === 0 ? '−∞' : track.volume === 127 ? '+6' : `${Math.round(20 * Math.log10(track.volume / 100))}dB`}
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Master strip
// ─────────────────────────────────────────────────────────────────────────────
function MasterStrip() {
  const [vol, setVol] = useState(115)
  return (
    <div style={{
      width: 62, flexShrink: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '10px 5px 8px', gap: 6,
      background: ELEVATED,
      borderLeft: `1px solid ${ACCENT}33`,
    }}>
      <span style={{ fontSize: 8.5, fontWeight: 700, color: ACCENT, letterSpacing: '0.1em' }}>MASTER</span>
      <div style={{ width: 20, height: 20, borderRadius: '50%', background: ACCENT + '28', border: `1.5px solid ${ACCENT}66`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9 }}>
        ∑
      </div>
      <div style={{ width: '100%', height: 44 }} /> {/* sends spacer */}
      {/* Dummy centered knob */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <svg width="28" height="28" viewBox="0 0 28 28">
          <circle cx={14} cy={14} r={9} fill="none" stroke={BORDER2} strokeWidth={2.5}
            strokeDasharray={`${Math.PI * 9 * 1.5} ${Math.PI * 9 * 0.5}`}
            strokeDashoffset={-Math.PI * 9 * 0.25} strokeLinecap="round" />
          <circle cx={14} cy={5.5} r={2.5} fill={TEXT_PRI} />
        </svg>
        <span style={{ fontSize: 8, color: TEXT_SEC }}>C</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, flex: 1, minHeight: 80 }}>
        <input
          type="range" min={0} max={127} value={vol}
          onChange={e => setVol(Number(e.target.value))}
          className="fader"
          style={{ height: 88, accentColor: ACCENT } as React.CSSProperties}
        />
        <div style={{ display: 'flex', gap: 1 }}>
          <LevelMeter volume={vol} />
          <LevelMeter volume={Math.max(0, vol - 4)} />
        </div>
      </div>
      <span style={{ fontSize: 8.5, color: TEXT_SEC, fontVariantNumeric: 'tabular-nums' }}>
        {vol === 0 ? '−∞' : `${Math.round(20 * Math.log10(vol / 100))}dB`}
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Track list sidebar — single row
// ─────────────────────────────────────────────────────────────────────────────
function TrackRow({
  track,
  onToggle,
  onInput,
}: {
  track: Track
  onToggle: (id: string, f: 'armed' | 'muted' | 'soloed') => void
  onInput: (id: string, v: string) => void
}) {
  const c = track.owner.color
  return (
    <div style={{
      height: TRACK_H,
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      padding: '0 10px 0 0',
      borderBottom: `1px solid ${BORDER}`,
      borderLeft: `3px solid ${track.muted ? TEXT_DIM : c}`,
      background: track.muted ? '#0D0D14' : SURFACE,
      flexShrink: 0,
      transition: 'background 0.15s',
    }}>
      {/* Owner avatar */}
      <div
        title={`${track.owner.name} — owner`}
        style={{
          width: 28, height: 28, borderRadius: '50%',
          background: c + '22', border: `1.5px solid ${c}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, fontWeight: 800, color: c,
          flexShrink: 0, marginLeft: 8, cursor: 'default',
        }}
      >
        {track.owner.initials}
      </div>

      {/* Name + type badge + input selector */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3,
        }}>
          <span style={{
            fontSize: 11.5, fontWeight: 600, lineHeight: 1,
            color: track.muted ? TEXT_DIM : TEXT_PRI,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            maxWidth: 90,
          }}>
            {track.name}
          </span>
          <span style={{
            fontSize: 8, fontWeight: 700, letterSpacing: '0.06em',
            color: track.type === 'AUDIO' ? '#60A5FA' : track.type === 'MIDI' ? '#A78BFA' : TEXT_SEC,
            background: ELEVATED, borderRadius: 2, padding: '1px 4px',
            flexShrink: 0,
          }}>
            {track.type}
          </span>
        </div>
        <select
          className="daw-select"
          value={track.input}
          onChange={e => onInput(track.id, e.target.value)}
          style={{
            fontSize: 9, color: TEXT_DIM, background: BG,
            border: `1px solid ${BORDER}`, borderRadius: 3,
            padding: '2px 16px 2px 5px', width: '100%', maxWidth: 120,
          }}
        >
          {['AUX 1–2', 'AUX 3–4', 'MIDI CH 1', 'MIDI CH 2', 'MIDI CH 3', 'MIC 1', 'MIC 2'].map(o => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>

      {/* ARM / MUTE / SOLO */}
      <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
        <TrackBtn
          label="R"
          active={track.armed}
          activeColor={DANGER}
          title="Record arm"
          className={track.armed ? 'record-pulse' : ''}
          onClick={() => onToggle(track.id, 'armed')}
        />
        <TrackBtn
          label="M"
          active={track.muted}
          activeColor="#F5A623"
          title="Mute"
          onClick={() => onToggle(track.id, 'muted')}
        />
        <TrackBtn
          label="S"
          active={track.soloed}
          activeColor="#F5A623"
          title="Solo"
          onClick={() => onToggle(track.id, 'soloed')}
        />
      </div>
    </div>
  )
}

function TrackBtn({
  label, active, activeColor, title, onClick, className = '',
}: {
  label: string; active: boolean; activeColor: string
  title: string; onClick: () => void; className?: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={className}
      style={{
        width: 22, height: 22, borderRadius: 3, border: 'none',
        background: active ? activeColor : ELEVATED,
        color: active ? (activeColor === '#F5A623' ? '#000' : '#fff') : TEXT_DIM,
        fontSize: 9, fontWeight: 800, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.1s',
      }}
    >
      {label}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Transport bar
// ─────────────────────────────────────────────────────────────────────────────
function Transport({
  playing, recording, bpm,
  onPlay, onStop, onRecord, onBpmChange,
}: {
  playing: boolean; recording: boolean; bpm: number
  onPlay: () => void; onStop: () => void
  onRecord: () => void; onBpmChange: (v: number) => void
}) {
  return (
    <div style={{
      height: TRANSPORT_H, flexShrink: 0,
      background: SURFACE, borderBottom: `1px solid ${BORDER}`,
      display: 'flex', alignItems: 'center',
      padding: '0 16px', gap: 14,
    }}>
      {/* Logo + session name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginRight: 4 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: `linear-gradient(135deg, ${ACCENT} 0%, #9B59B6 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15, flexShrink: 0,
        }}>🎚</div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: TEXT_PRI, lineHeight: 1.2 }}>Session 01</div>
          <div style={{ fontSize: 9, color: TEXT_SEC, marginTop: 1 }}>
            <span style={{ color: SUCCESS }}>●</span> {OWNERS.length} online
          </div>
        </div>
      </div>

      <Divider />

      {/* Transport controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        {/* Rewind */}
        <TBtn onClick={onStop} active={false} bg={ELEVATED} title="Back to start">
          <svg width="11" height="11" viewBox="0 0 11 11">
            <rect x="0.5" y="0.5" width="2" height="10" fill={TEXT_SEC} rx="0.5" />
            <path d="M3.5 5.5 L10.5 1 L10.5 10 Z" fill={TEXT_SEC} />
          </svg>
        </TBtn>
        {/* Play / Pause */}
        <TBtn onClick={onPlay} active={playing} bg={playing ? ACCENT : ELEVATED} title={playing ? 'Pause' : 'Play'}
          className={playing ? 'playing-glow' : ''}>
          {playing
            ? <svg width="11" height="11" viewBox="0 0 11 11">
                <rect x="1" y="1" width="3.5" height="9" fill="#fff" rx="0.5" />
                <rect x="6.5" y="1" width="3.5" height="9" fill="#fff" rx="0.5" />
              </svg>
            : <svg width="11" height="11" viewBox="0 0 11 11">
                <path d="M1.5 1 L10 5.5 L1.5 10 Z" fill={TEXT_PRI} />
              </svg>
          }
        </TBtn>
        {/* Record */}
        <TBtn onClick={onRecord} active={recording} bg={recording ? DANGER : ELEVATED} title="Record"
          className={recording ? 'record-pulse' : ''}>
          <div style={{
            width: 9, height: 9, borderRadius: '50%',
            background: recording ? '#fff' : DANGER,
          }} />
        </TBtn>
      </div>

      {/* Position + BPM + time sig */}
      <div style={{ display: 'flex', gap: 6 }}>
        <DigDisplay label="BAR" value="1.1.1" color={SUCCESS} />
        <DigDisplay label="TIME" value="0:00.000" color={TEXT_SEC} />
        <div style={digWrap}>
          <span style={{ fontSize: 8.5, color: TEXT_DIM, letterSpacing: '0.06em' }}>BPM</span>
          <input
            type="number"
            value={bpm}
            min={30} max={300}
            onChange={e => onBpmChange(Number(e.target.value))}
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              color: SUCCESS, fontSize: 15, fontWeight: 700, width: 46,
              fontVariantNumeric: 'tabular-nums', cursor: 'ns-resize',
              letterSpacing: '-0.02em',
            }}
          />
        </div>
        <DigDisplay label="SIG" value="4 / 4" color={TEXT_PRI} />
      </div>

      <div style={{ flex: 1 }} />

      {/* Loop region indicator */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: BG, borderRadius: 4, padding: '5px 10px',
        border: `1px solid ${BORDER}`,
      }}>
        <div style={{ width: 8, height: 8, borderRadius: 1, background: ACCENT + '66', border: `1px solid ${ACCENT}` }} />
        <span style={{ fontSize: 9.5, color: TEXT_SEC }}>Loop  </span>
        <span style={{ fontSize: 9.5, color: TEXT_PRI, fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>5 – 13</span>
      </div>

      <Divider />

      {/* Collaborator avatars */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex' }}>
          {OWNERS.map((o, i) => (
            <div key={o.id} title={`${o.name} — online`} style={{
              width: 26, height: 26, borderRadius: '50%',
              background: o.color, border: `2.5px solid ${SURFACE}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, fontWeight: 800, color: '#fff',
              marginLeft: i > 0 ? -10 : 0,
              position: 'relative', zIndex: OWNERS.length - i,
              cursor: 'default',
            }}>
              {o.initials[0]}
            </div>
          ))}
        </div>
        <button style={{
          background: ACCENT + '1A', border: `1px solid ${ACCENT}44`,
          borderRadius: 20, padding: '4px 12px', cursor: 'pointer',
          color: ACCENT, fontSize: 10, fontWeight: 600,
        }}>
          + Invite
        </button>
      </div>
    </div>
  )
}

function TBtn({
  children, onClick, bg, title, className = '',
}: {
  children: React.ReactNode; onClick: () => void
  active?: boolean; bg: string; title: string; className?: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={className}
      style={{
        width: 34, height: 30, borderRadius: 5, border: 'none',
        background: bg, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.1s',
      }}
    >
      {children}
    </button>
  )
}

const digWrap: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  background: BG, borderRadius: 5, padding: '4px 10px', gap: 1, minWidth: 70,
  border: `1px solid ${BORDER}`,
}

function DigDisplay({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={digWrap}>
      <span style={{ fontSize: 8.5, color: TEXT_DIM, letterSpacing: '0.06em' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>
        {value}
      </span>
    </div>
  )
}

function Divider() {
  return <div style={{ width: 1, height: 28, background: BORDER2, flexShrink: 0 }} />
}

// ─────────────────────────────────────────────────────────────────────────────
// Arranger timeline (center panel)
// ─────────────────────────────────────────────────────────────────────────────
function Arranger({
  tracks,
  playing,
  playheadBar,
}: {
  tracks: Track[]
  playing: boolean
  playheadBar: number
}) {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      borderRight: `1px solid ${BORDER}`,
    }}>
      {/* Scrollable area */}
      <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', position: 'relative' }}>
        <div style={{ minWidth: TOTAL_BARS * BAR_W, position: 'relative' }}>

          {/* ── Ruler ── */}
          <div style={{
            height: RULER_H,
            display: 'flex',
            background: ELEVATED,
            borderBottom: `1px solid ${BORDER2}`,
            position: 'sticky',
            top: 0,
            zIndex: 10,
            userSelect: 'none',
          }}>
            {Array.from({ length: TOTAL_BARS }).map((_, b) => (
              <div key={b} style={{
                width: BAR_W, flexShrink: 0, height: '100%',
                borderRight: `1px solid ${b % 4 === 3 ? BORDER2 : BORDER}`,
                position: 'relative',
                display: 'flex', alignItems: 'center',
              }}>
                {/* Bar number */}
                <span style={{
                  position: 'absolute', left: 5,
                  fontSize: b % 4 === 0 ? 10.5 : 9,
                  fontWeight: b % 4 === 0 ? 700 : 400,
                  color: b % 4 === 0 ? TEXT_PRI : TEXT_DIM,
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.02em',
                }}>
                  {b + 1}
                </span>
                {/* Beat ticks */}
                {[1, 2, 3].map(beat => (
                  <div key={beat} style={{
                    position: 'absolute',
                    left: beat * (BAR_W / 4),
                    bottom: 0,
                    width: 1,
                    height: beat === 2 ? '45%' : '30%',
                    background: BORDER2,
                  }} />
                ))}
              </div>
            ))}

            {/* Playhead triangle on ruler */}
            <div style={{
              position: 'absolute',
              left: (playheadBar - 1) * BAR_W,
              top: 0, bottom: 0, width: 0,
              pointerEvents: 'none', zIndex: 20,
            }}>
              <div style={{
                position: 'absolute', top: 0, left: -6,
                width: 12, height: 12,
                background: DANGER,
                clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
              }} />
            </div>
          </div>

          {/* ── Track rows ── */}
          <div className={playing ? 'playing' : ''} style={{ position: 'relative' }}>
            {tracks.map((track, ti) => (
              <div key={track.id} style={{
                height: TRACK_H,
                borderBottom: `1px solid ${BORDER}`,
                background: ti % 2 === 0 ? BG : '#0C0C12',
                position: 'relative',
                opacity: track.muted ? 0.35 : 1,
                transition: 'opacity 0.15s',
              }}>
                {/* Grid lines */}
                {Array.from({ length: TOTAL_BARS }).map((_, b) => (
                  <React.Fragment key={b}>
                    <div style={{
                      position: 'absolute',
                      left: b * BAR_W + (BAR_W / 4),
                      top: 0, bottom: 0, width: 1,
                      background: b % 4 === 3 ? BORDER : 'transparent',
                    }} />
                    <div style={{
                      position: 'absolute',
                      left: (b + 1) * BAR_W,
                      top: 0, bottom: 0, width: 1,
                      background: b % 4 === 3 ? BORDER2 : BORDER,
                    }} />
                  </React.Fragment>
                ))}

                {/* Clips */}
                {track.clips.map(clip => (
                  <ClipBlock key={clip.id} clip={clip} track={track} />
                ))}
              </div>
            ))}

            {/* Playhead line through tracks */}
            <div
              className="playhead"
              style={{
                position: 'absolute',
                left: (playheadBar - 1) * BAR_W,
                top: 0, bottom: 0, width: 1,
                background: DANGER,
                opacity: 0.85,
                zIndex: 5,
                pointerEvents: 'none',
              }}
            />

            {/* Loop region highlight */}
            <div style={{
              position: 'absolute',
              left: 4 * BAR_W,
              top: 0, bottom: 0,
              width: 8 * BAR_W,
              background: ACCENT + '08',
              borderLeft: `1px solid ${ACCENT}44`,
              borderRight: `1px solid ${ACCENT}44`,
              pointerEvents: 'none',
              zIndex: 3,
            }} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Mixer panel (right)
// ─────────────────────────────────────────────────────────────────────────────
function MixerPanel({
  tracks,
  onVolume, onPan, onSendA, onSendB,
}: {
  tracks: Track[]
  onVolume: (id: string, v: number) => void
  onPan: (id: string, v: number) => void
  onSendA: (id: string, v: number) => void
  onSendB: (id: string, v: number) => void
}) {
  return (
    <div style={{
      flexShrink: 0, display: 'flex', flexDirection: 'column',
      background: SURFACE, borderLeft: `1px solid ${BORDER}`,
    }}>
      {/* Header */}
      <div style={{
        height: RULER_H, background: ELEVATED, borderBottom: `1px solid ${BORDER2}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <span style={{ fontSize: 8.5, fontWeight: 700, color: TEXT_SEC, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          Mini Mixer
        </span>
      </div>
      {/* Strips */}
      <div style={{ display: 'flex', flex: 1 }}>
        {tracks.map(t => (
          <MixerStrip key={t.id} track={t} onVolume={onVolume} onPan={onPan}
            onSendA={onSendA} onSendB={onSendB} />
        ))}
        <MasterStrip />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Status bar
// ─────────────────────────────────────────────────────────────────────────────
function StatusBar({ playing, recording, bpm }: { playing: boolean; recording: boolean; bpm: number }) {
  return (
    <div style={{
      height: 22, flexShrink: 0,
      background: '#08080C', borderTop: `1px solid ${BORDER}`,
      display: 'flex', alignItems: 'center', padding: '0 14px',
      gap: 14,
    }}>
      <span style={{ fontSize: 9, color: playing ? SUCCESS : TEXT_DIM, fontWeight: 600 }}>
        {playing ? '▶ Playing' : recording ? '⏺ Recording' : '■ Stopped'}
      </span>
      <span style={{ color: BORDER2 }}>│</span>
      <span style={{ fontSize: 9, color: TEXT_DIM }}>{bpm} BPM · 4/4 · 48kHz · 24-bit</span>
      <div style={{ flex: 1 }} />
      <span style={{ fontSize: 9, color: TEXT_DIM }}>CPU 14%</span>
      <span style={{ fontSize: 9, color: TEXT_DIM }}>RAM 1.4 GB</span>
      <span style={{ fontSize: 9, color: TEXT_DIM }}>Disk ✓</span>
      <span style={{ color: BORDER2 }}>│</span>
      <span style={{ fontSize: 9, color: SUCCESS, fontWeight: 600 }}>● 4 online</span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [tracks, setTracks] = useState<Track[]>(INIT_TRACKS)
  const [playing,   setPlaying]   = useState(false)
  const [recording, setRecording] = useState(false)
  const [bpm,       setBpm]       = useState(128)
  const [playheadBar] = useState(1)

  const toggleField = useCallback((id: string, f: 'armed' | 'muted' | 'soloed') => {
    setTracks(ts => ts.map(t => t.id === id ? { ...t, [f]: !t[f] } : t))
  }, [])
  const setVolume = useCallback((id: string, v: number) =>
    setTracks(ts => ts.map(t => t.id === id ? { ...t, volume: v } : t)), [])
  const setPan = useCallback((id: string, v: number) =>
    setTracks(ts => ts.map(t => t.id === id ? { ...t, pan: v } : t)), [])
  const setSendA = useCallback((id: string, v: number) =>
    setTracks(ts => ts.map(t => t.id === id ? { ...t, sendA: v } : t)), [])
  const setSendB = useCallback((id: string, v: number) =>
    setTracks(ts => ts.map(t => t.id === id ? { ...t, sendB: v } : t)), [])
  const setInput = useCallback((id: string, v: string) =>
    setTracks(ts => ts.map(t => t.id === id ? { ...t, input: v } : t)), [])

  const handlePlay   = () => { setPlaying(p => !p); if (recording) setRecording(false) }
  const handleStop   = () => { setPlaying(false); setRecording(false) }
  const handleRecord = () => { setRecording(r => !r); if (!playing) setPlaying(true) }

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      background: BG, color: TEXT_PRI, overflow: 'hidden',
      fontFamily: "'Inter', 'SF Pro Display', -apple-system, system-ui, sans-serif",
    }}>
      <Transport
        playing={playing} recording={recording} bpm={bpm}
        onPlay={handlePlay} onStop={handleStop}
        onRecord={handleRecord} onBpmChange={setBpm}
      />

      {/* Main workspace */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left: Track list */}
        <div style={{
          width: SIDEBAR_W, flexShrink: 0,
          display: 'flex', flexDirection: 'column',
          background: SURFACE, borderRight: `1px solid ${BORDER}`,
        }}>
          {/* Sidebar header — aligns with ruler */}
          <div style={{
            height: RULER_H, flexShrink: 0,
            background: ELEVATED, borderBottom: `1px solid ${BORDER2}`,
            display: 'flex', alignItems: 'center',
            padding: '0 10px', gap: 6,
          }}>
            <span style={{ fontSize: 8.5, fontWeight: 700, color: TEXT_SEC, letterSpacing: '0.14em', textTransform: 'uppercase', flex: 1 }}>
              Tracks
            </span>
            <span style={{
              fontSize: 8, color: TEXT_DIM, background: BG,
              borderRadius: 10, padding: '1px 7px',
              border: `1px solid ${BORDER}`,
            }}>
              {tracks.length}
            </span>
          </div>
          {/* Track rows */}
          {tracks.map(t => (
            <TrackRow key={t.id} track={t} onToggle={toggleField} onInput={setInput} />
          ))}
        </div>

        {/* Center: Arranger */}
        <Arranger tracks={tracks} playing={playing} playheadBar={playheadBar} />

        {/* Right: Mini mixer */}
        <MixerPanel
          tracks={tracks}
          onVolume={setVolume} onPan={setPan}
          onSendA={setSendA} onSendB={setSendB}
        />
      </div>

      <StatusBar playing={playing} recording={recording} bpm={bpm} />
    </div>
  )
}
