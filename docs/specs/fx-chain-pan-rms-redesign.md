# Design Spec: FX Chain View, Interactive PanKnob, Always-Visible R/M/S Buttons

**Status:** Ready for implementation
**Author:** Designer
**Date:** 2026-05-10
**Touches:** TrackHeader, PanKnob, MiniBtn, MixerStrip, MixerPanel, PluginChainPanel, App root state

---

## Decision 1 — FX Badge Click Opens Full FX Chain Panel

### Design decision: extend the existing PluginChainPanel — do not replace it

The `PluginChainPanel` at the right side of the mixer already renders plugin slots with enable toggle, type, and params. It is already conditionally rendered when `selectedTrackId !== null` (App root line 2261). The FX badge click is a trigger to set `selectedTrackId` — the panel opens as a result. No new component needed.

### Current state
- `MixerStrip` renders `<span>FX:{n}</span>` — not interactive (approx. line 1702)
- `PluginChainPanel` conditionally rendered at App root line 2261 when `selectedTrackId !== null`
- `MixerStrip` has no `onSelectTrack` prop — it cannot set `selectedTrackId`

### What to build

#### 1a. FX badge becomes a `<button>` in MixerStrip

Replace the static `<span>` with:

```tsx
<button
  aria-label={`Open FX chain for ${track.name}`}
  onClick={e => { e.stopPropagation(); onSelectTrack(track.id) }}
  className="rounded px-1 py-px font-mono transition-all hover:brightness-150 focus-visible:outline-none active:scale-95"
  style={{
    fontSize: 8,
    background: selectedTrackId === track.id ? C.accent : C.control,
    color: selectedTrackId === track.id ? '#fff' : C.textSec,
    cursor: 'pointer',
    border: 'none',
    boxShadow: selectedTrackId === track.id ? `0 0 0 1px ${C.accent}` : 'none',
  }}
>
  FX:{pluginCount}
</button>
```

**States:**
- Default: `background: C.control`, `color: C.textSec`
- Hover: `filter: brightness(1.5)`
- Focus-visible: `box-shadow: 0 0 0 1px C.accent`
- Active (panel open for this track): `background: C.accent`, `color: #fff`
- Disabled (Viewer): `opacity: 0.3`, `pointer-events: none`

#### 1b. MixerStripProps additions

```ts
interface MixerStripProps {
  // ...existing props...
  onSelectTrack: (trackId: string) => void   // NEW
  selectedTrackId: string | null             // NEW — drives active state on badge
}
```

#### 1c. Master strip FX badge — same pattern

The master strip FX badge (approx. line 1819) becomes:

```tsx
<button
  aria-label="Open FX chain for Master"
  onClick={() => onSelectTrack('master')}
  className="rounded px-1 py-px font-mono transition-all hover:brightness-150 active:scale-95"
  style={{
    fontSize: 8,
    background: selectedTrackId === 'master' ? C.accent : C.control,
    color: selectedTrackId === 'master' ? '#fff' : C.textSec,
    cursor: 'pointer',
    border: 'none',
  }}
>
  FX:—
</button>
```

`MixerPanel` must receive `onSelectTrack` and `selectedTrackId` as props from App root.

#### 1d. PluginChainPanel — owner color tints the panel header left border

Add a left border to the panel header div:

```tsx
style={{
  borderColor: C.border,
  borderLeft: `3px solid ${ownerColor}`,
}}
```

`ownerColor` derivation: `tracks.find(t => t.id === selectedTrackId)?.owner.color ?? C.accent`. For `'master'`, use `C.accent`. Pass as `ownerColor: string` prop to `PluginChainPanel`.

#### 1e. Toggle behavior — click selected track closes panel

```ts
function handleSelectTrack(id: string) {
  setSelectedTrackId(prev => prev === id ? null : id)
}
```

Replace `setSelectedTrackId` at all call sites with `handleSelectTrack`.

#### 1f. Escape closes the panel

Extend the App root Escape handler:

```ts
if (e.key === 'Escape') {
  setShowInvite(false)
  setSelectedTrackId(null)   // ADD
  return
}
```

### Implement this first (Decision 1)
Add `onSelectTrack` prop to `MixerStrip` and wire it to `handleSelectTrack` in App. Everything else follows.

---

## Decision 2 — Interactive PanKnob in TrackHeader

### Design decision: horizontal drag, same model as Knob component

`PanKnob` uses the same `useRef` + `window.addEventListener` drag pattern as `Knob` (approx. lines 566–581), switched from vertical axis to horizontal axis (`clientX` instead of `clientY`). Double-click resets to center. State is shared — `track.pan` is the single source of truth read by both `TrackHeader` and `MixerStrip`.

### What to build

#### 2a. PanKnob — add drag interaction

```ts
function PanKnob({ pan, onChange }: { pan: number; onChange?: (v: number) => void }) {
  const dragRef = useRef<{ startX: number; startPan: number } | null>(null)
  const [hovered, setHovered] = useState(false)

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
  // ...
}
```

Outer `<div>` attrs when `onChange` is provided:
- `onMouseDown={onMouseDown}`
- `onDoubleClick={onDoubleClick}`
- `style={{ cursor: 'ew-resize' }}`
- `role="slider"`, `aria-label="Pan"`, `aria-valuenow={pan}`, `aria-valuemin={-100}`, `aria-valuemax={100}`, `tabIndex={0}`
- `onKeyDown`: ArrowLeft → `onChange(clamp(pan - 1, -100, 100))`, ArrowRight → `onChange(clamp(pan + 1, -100, 100))`, Home → `onChange(0)`
- `onMouseEnter={() => setHovered(true)}`, `onMouseLeave={() => setHovered(false)}`

When `onChange` is not provided (display-only), suppress all interaction attrs.

**Hover label:** when `hovered && pan === 0`, show `C` in `C.textPri` instead of `C.textSec` to signal interactivity.

#### 2b. TrackHeaderProps — add onPanChange

```ts
interface TrackHeaderProps {
  // ...existing props...
  onPanChange?: (trackId: string, value: number) => void   // NEW
}
```

Wire to PanKnob:

```tsx
<PanKnob
  pan={track.pan}
  onChange={onPanChange ? (v) => onPanChange(track.id, v) : undefined}
/>
```

#### 2c. App root handler

```ts
onPanChange={(trackId, v) =>
  setTracks(prev => prev.map(tr => tr.id !== trackId ? tr : { ...tr, pan: v }))
}
```

Both `TrackHeader` and `MixerStrip` write to the same `track.pan` field — no duplication.

### Implement this first (Decision 2)
Add `onChange` and drag logic to `PanKnob`. Prop threading is mechanical once the knob works.

---

## Decision 3 — R/M/S Buttons Always Visible in TrackHeader

### Design decision: dedicated compact bottom row, no height increase

R, M, S move from hover-reveal to a permanent compact row. Track height stays at `TRACK_H = 64px`. Height budget: name+type row (~24px) + gap (4px) + RMS+Pan row (32px) = 60px. Fits with 2px margin.

### Layout redesign (replaces approx. lines 822–860)

```tsx
{/* Left accent bar + avatar — unchanged */}
<div className="flex-shrink-0 rounded-full" style={{ width: 4, height: 40, background: track.owner.color }} />
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
    <MiniBtn active={track.armed}  activeColor={C.danger} label="R" title="Record arm" disabled={IS_VIEWER || lockingCollab !== null} onClick={onToggleArm}  pulse={track.armed} />
    <MiniBtn active={track.muted}  activeColor={C.danger} label="M" title="Mute"        disabled={IS_VIEWER}                            onClick={onToggleMute} />
    <MiniBtn active={track.soloed} activeColor={C.accent} label="S" title="Solo"        disabled={IS_VIEWER}                            onClick={onToggleSolo} />
  </div>
  <PanKnob pan={track.pan} onChange={onPanChange ? (v) => onPanChange(track.id, v) : undefined} />
</div>
```

**Key change:** Remove `opacity-0 group-hover:opacity-100` from line 830. That single removal makes the buttons always visible. All other changes are refinements.

### Active state tokens

| Button | Inactive bg | Inactive label | Active bg | Active label | Notes |
|--------|-------------|----------------|-----------|--------------|-------|
| R (arm) | `C.control` | `C.textSec` | `C.danger` (`#E94560`) | `#fff` | Pulse ring when armed |
| M (mute) | `C.control` | `C.textSec` | `C.warn` (`#F5A623`) | `#fff` | Track name + clips fade to `opacity-50` |
| S (solo) | `C.control` | `C.textSec` | `C.success` (`#1D9E75`) | `#fff` | — |

### R button pulse ring — extend MiniBtn

Add `pulse?: boolean` to `MiniBtn`. When `pulse && active`:

```ts
boxShadow: `0 0 0 2px ${activeColor}44, 0 0 8px ${activeColor}33`
```

The `record-pulse` CSS animation class is already in the codebase (lines 820, 1888). Add `className={`... ${pulse && active ? 'record-pulse' : ''}`}` to the button.

### Muted track visual treatment

- Track name: `opacity: track.muted ? 0.5 : 1` on the `<p>` element (not on the button row)
- Clips in ArrangeView: factor mute into clip opacity:
  ```ts
  opacity: isGhost ? 0.35 : isDragging ? 0.85 : track.muted ? 0.5 : 1
  ```
- M button itself: always full opacity — it must remain usable when the track is muted

### Implement this first (Decision 3)
Remove `opacity-0 group-hover:opacity-100` from line 830. One-line change, zero risk. Everything else follows.

---

## Cross-cutting: Token reference

| Token | Hex | Role in this spec |
|-------|-----|-------------------|
| `C.control` | `#2A2A38` | Inactive button bg, FX badge default |
| `C.accent` | `#6B5CE7` | Solo active, FX badge selected, focus rings |
| `C.danger` | `#E94560` | Mute active, Record arm active + pulse |
| `C.textPri` | `#F0F0F5` | Active button labels, track name |
| `C.textSec` | `#888899` | Inactive button labels |
| `C.border` | `#1E1E28` | Panel borders |
| `C.elevated` | `#1A1A24` | PluginChainPanel background |

No hardcoded hex values permitted in new or modified components.

---

## Accessibility checklist

- All MiniBtn: `aria-label` + `aria-pressed` — already implemented, preserved
- PanKnob interactive: `role="slider"`, `aria-label="Pan"`, `aria-valuenow/min/max`, ArrowLeft/Right/Home keys
- FX badge button: `aria-label="Open FX chain for {track.name}"`
- Focus-visible rings on all new interactive elements: 1px `C.accent`

---

## Implementation order across all three decisions

1. Remove `opacity-0 group-hover:opacity-100` from TrackHeader R/M/S row (line 830) — one-line, zero risk
2. Add `onSelectTrack` prop to `MixerStrip`, wire `handleSelectTrack` in App
3. Add `onChange` drag logic to `PanKnob`
4. Thread `onPanChange` through `TrackHeaderProps`
5. Add `pulse` prop to `MiniBtn`, apply R button ring
6. Add `ownerColor` prop to `PluginChainPanel`, render left border

---

## Empty Plugin Chain Panel — No Plugins State

**Added:** 2026-05-10
**Scope:** Conditional branch inside `PluginChainPanel`, rendered when `plugins.length === 0`
**Panel dimensions:** 280px wide, height fills remaining panel body below header

---

### Design intent

This is not a utility empty state. It is the first surface a musician sees before they build their signal chain. The goal is to communicate two things simultaneously: "this track is clean — no processing on the signal yet" and "here is exactly where you add your first plugin." It should feel like opening a pristine rack slot. Calm, professional, inviting.

The existing stub ("No plugins on this track" + ghost "Add Plugin +" button) is replaced entirely.

---

### Visual anatomy (top to bottom, vertically centered in panel body)

```
┌─────────────────────────────┐  ← panel header (3px ownerColor left border per Decision 1d)
│  FX Chain / TRACK NAME      │
└─────────────────────────────┘
│                             │
│  [signal-flow SVG anchor]   │  ← 220×80px SVG, centered
│                             │
│      "Clean signal"         │  ← 13px, C.textPri, weight 500
│                             │
│   [ Add Plugin       + ]    │  ← full-width minus 24px gutter, C.accent bg
│                             │
│  Add compression, reverb,   │  ← 10px, C.textSec, centered
│  EQ, and more.              │
└─────────────────────────────┘
```

---

### 1. Signal-flow SVG visual anchor

**Concept:** IN node — dashed empty slot — OUT node, connected by horizontal lines. Universal audio signal routing language. The empty dashed rectangle communicates "placeholder — insert plugin here" with no labels needed. Echoes Logic Pro X's empty insert slot convention.

**Owner color treatment:** Empty slot is stroked with `ownerColor` at 22% opacity. A radial gradient bleed at 8% opacity sits behind the slot. Quiet tint — anchors ownership without commanding the surface.

**SVG spec (220×80, `viewBox="0 0 220 80"`, `aria-hidden="true"`):**

```tsx
<svg width="220" height="80" viewBox="0 0 220 80" overflow="visible" aria-hidden="true" style={{ flexShrink: 0 }}>
  <defs>
    <radialGradient id="ownerGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stopColor={ownerColor} stopOpacity="0.08" />
      <stop offset="100%" stopColor={ownerColor} stopOpacity="0"    />
    </radialGradient>
  </defs>

  {/* Owner glow behind slot */}
  <ellipse cx="110" cy="40" rx="52" ry="30" fill="url(#ownerGlow)" />

  {/* Connector lines */}
  <line x1="25"  y1="40" x2="70"  y2="40" stroke={C.border} strokeWidth="1" />
  <line x1="150" y1="40" x2="195" y2="40" stroke={C.border} strokeWidth="1" />

  {/* Empty slot */}
  <rect x="70" y="18" width="80" height="44" rx="4"
    fill="none" stroke={ownerColor} strokeOpacity="0.22"
    strokeWidth="1.5" strokeDasharray="4 3" />

  {/* Interior parameter-row hints */}
  <line x1="82" y1="34" x2="138" y2="34" stroke={C.border} strokeWidth="0.75" opacity="0.6" />
  <line x1="82" y1="46" x2="138" y2="46" stroke={C.border} strokeWidth="0.75" opacity="0.6" />

  {/* IN node */}
  <circle cx="20"  cy="40" r="5" fill={C.surface} stroke={C.border} strokeWidth="1.5" />
  <text x="20"  y="30" fontSize="8" fill={C.textSec} textAnchor="middle" fontFamily="monospace">IN</text>

  {/* OUT node */}
  <circle cx="200" cy="40" r="5" fill={C.surface} stroke={C.border} strokeWidth="1.5" />
  <text x="200" y="30" fontSize="8" fill={C.textSec} textAnchor="middle" fontFamily="monospace">OUT</text>
</svg>
```

---

### 2. Headline

**Text:** `Clean signal`

Audio engineering language — states the current state of the chain honestly. Not "No plugins yet" (implies user error). Not a heading or instruction — a label.

**Style:** `fontSize: 13`, `fontWeight: 500`, `color: C.textPri`, `letterSpacing: '0.01em'`, centered.

---

### 3. "Add Plugin +" CTA button

**Layout:** Full panel width minus 24px gutter each side (232px effective). `height: 36px`, `borderRadius: 6px`.

**Typography:** `fontSize: 12`, `fontWeight: 600`, label `"Add Plugin"` + separate `<span>` for `"+"` at `fontSize: 15`, `fontWeight: 300`, `marginLeft: 6`, `verticalAlign: -1`. The size contrast between label and `+` signals additive intent deliberately — this is a typographic affordance.

**States (all transitions `150ms ease` via `className="transition-all"`):**

| State | Background | Box shadow | Transform |
|-------|-----------|------------|-----------|
| Default | `C.accent` | none | none |
| Hover | `brightness(1.15)` | `0 0 12px ${C.accent}66` | none |
| Focus-visible | `brightness(1.15)` | `0 0 0 2px C.accent, 0 0 12px ${C.accent}66` | none |
| Active/press | `brightness(1.0)` | none | `scale(0.97)` |

Note: `${C.accent}66` is hex alpha — `0x66` ≈ 40% opacity. Do not hardcode the hex.

**ARIA:** `aria-label="Add plugin to FX chain"` (the `+` is decorative text, not meaningful to screen readers).

**STUB:** `onClick` is `console.log('plugin browser: TODO')` until PM specs the plugin browser interaction. Do not block implementation on this.

**Complete JSX:**

```tsx
<button
  aria-label="Add plugin to FX chain"
  onClick={() => { console.log('plugin browser: TODO') }}
  className="flex items-center justify-center transition-all focus-visible:outline-none"
  style={{ width: '100%', height: 36, background: C.accent, color: '#ffffff',
           fontSize: 12, fontWeight: 600, border: 'none', borderRadius: 6,
           cursor: 'pointer', letterSpacing: '0.01em' }}
  onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.15)'; e.currentTarget.style.boxShadow = `0 0 12px ${C.accent}66` }}
  onMouseLeave={e => { e.currentTarget.style.filter = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = '' }}
  onMouseDown={e  => { e.currentTarget.style.filter = 'brightness(1.0)'; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = 'scale(0.97)' }}
  onMouseUp={e    => { e.currentTarget.style.filter = 'brightness(1.15)'; e.currentTarget.style.boxShadow = `0 0 12px ${C.accent}66`; e.currentTarget.style.transform = '' }}
  onFocus={e      => { e.currentTarget.style.filter = 'brightness(1.15)'; e.currentTarget.style.boxShadow = `0 0 0 2px ${C.accent}, 0 0 12px ${C.accent}66` }}
  onBlur={e       => { e.currentTarget.style.filter = ''; e.currentTarget.style.boxShadow = '' }}
>
  Add Plugin
  <span style={{ fontSize: 15, fontWeight: 300, lineHeight: 1, marginLeft: 6, verticalAlign: -1 }}>+</span>
</button>
```

---

### 4. Subtext

**Text:** `Add compression, reverb, EQ, and more.`

**Style:** `fontSize: 10`, `color: C.textSec`, `textAlign: 'center'`, `marginTop: -8` (pulls closer to button — gap-5 between button and subtext is too wide without this correction).

---

### 5. Full empty state JSX — replaces lines 2070–2111

The `plugins.length === 0` branch and the separate footer "Add Plugin +" stub are replaced as follows. The non-empty `plugins.map(...)` branch is unchanged. The footer button div (`{plugins.length > 0 && ...}`) remains for when plugins are present.

```tsx
{plugins.length === 0 ? (
  <div className="flex flex-col flex-1 items-center justify-center gap-5 px-6 py-8">
    {/* SVG anchor — see §1 above */}
    {/* Headline */}
    <p style={{ fontSize: 13, fontWeight: 500, color: C.textPri, letterSpacing: '0.01em', margin: 0 }}>
      Clean signal
    </p>
    {/* CTA — see §3 above */}
    {/* Subtext */}
    <p style={{ fontSize: 10, color: C.textSec, margin: 0, marginTop: -8, textAlign: 'center' }}>
      Add compression, reverb, EQ, and more.
    </p>
  </div>
) : (
  <div className="flex flex-col gap-2 p-3 flex-1 overflow-y-auto">
    {plugins.map(slot => ( /* existing card markup unchanged */ ))}
  </div>
)}
```

---

### 6. Updated PluginChainPanelProps

```ts
interface PluginChainPanelProps {
  trackId:         string | null
  trackName:       string
  plugins:         PluginSlot[]
  onTogglePlugin:  (slotId: string) => void
  ownerColor:      string   // per Decision 1d — used in header left border + empty state SVG
}
```

---

### 7. Accessibility

- SVG anchor: `aria-hidden="true"` — decorative, screen readers skip it
- CTA: native `<button>`, `aria-label="Add plugin to FX chain"`, keyboard-activated (Enter/Space)
- Focus ring: 2px `C.accent` outline + ambient glow — meets WCAG 2.2 Focus Appearance
- Contrast: headline `C.textPri` on `C.elevated` = 13.8:1 (AAA). Subtext `C.textSec` on `C.elevated` = 4.6:1 (AA). CTA `#fff` on `C.accent` = 4.7:1 (AA).

---

### 8. Implement this first (empty state)

Add `ownerColor` prop to `PluginChainPanel` (Decision 1d). Then replace the `plugins.length === 0` branch at lines 2070–2075 with the empty state JSX. Stub the CTA `onClick` with a `console.log`. The footer "Add Plugin +" button (lines 2106–2111) should only render when `plugins.length > 0`.
