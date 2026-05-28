/**
 * tests/unit/utils/audio.test.ts
 *
 * Tests for audio math utilities.
 *
 * NOTE: faderToDb, formatDb, and fadeGain are currently defined inside App.tsx
 * and not exported. The tests below document expected behavior and are marked
 * it.todo until those functions are extracted and exported from a utility module.
 *
 * TODO: Extract faderToDb, formatDb, fadeGain from src/App.tsx into
 *       src/utils/audio.ts and export them, then replace the todos below with
 *       real assertions.
 */

import { describe, it, expect } from 'vitest'

// ---------------------------------------------------------------------------
// faderToDb — DAW fader law: unity (0 dB) at 75% travel, +6 dB at 100%, -inf at 0%
// Piecewise: 0..75% maps log to -60..0 dB; 75..100% maps linearly to 0..+6 dB
// ---------------------------------------------------------------------------

// Inline implementation mirroring App.tsx for validation until function is exported.
function faderToDb(fader: number): number {
  if (fader <= 0) return -Infinity
  const f = fader / 100
  if (f <= 0.75) {
    return 60 * (Math.log10(f / 0.75) / Math.log10(1 / 0.75))
  }
  return ((f - 0.75) / 0.25) * 6
}

function formatDb(db: number): string {
  if (!isFinite(db)) return '-∞ dB'
  if (db < -90) return '-∞ dB'
  return `${db >= 0 ? '+' : ''}${db.toFixed(1)} dB`
}

function fadeGain(t: number, curve: number): number {
  return 2 * curve * t * (1 - t) + t * t
}

describe('faderToDb', () => {
  it('returns -Infinity at fader=0 (silence)', () => {
    expect(faderToDb(0)).toBe(-Infinity)
  })

  it('returns 0 dB at fader=75 (unity gain)', () => {
    expect(faderToDb(75)).toBeCloseTo(0, 5)
  })

  it('returns +6 dB at fader=100 (max gain)', () => {
    expect(faderToDb(100)).toBeCloseTo(6, 5)
  })

  it('returns negative dB below 75% travel', () => {
    const db = faderToDb(50)
    expect(db).toBeLessThan(0)
  })

  it('is monotonically increasing (louder fader = louder dB)', () => {
    const values = [0, 10, 25, 50, 75, 90, 100].map(faderToDb)
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1])
    }
  })

  it('returns ~-60 dB near fader=0 (log approach to silence)', () => {
    // At very small fader values we approach -inf through the log curve.
    // fader=1 should be well below -40 dB.
    expect(faderToDb(1)).toBeLessThan(-40)
  })

  it('interpolates linearly between 75% and 100% travel', () => {
    // Midpoint of the linear segment (87.5%) should be ~+3 dB.
    expect(faderToDb(87.5)).toBeCloseTo(3, 5)
  })
})

describe('formatDb', () => {
  it('formats -Infinity as -∞ dB', () => {
    expect(formatDb(-Infinity)).toBe('-∞ dB')
  })

  it('formats values below -90 as -∞ dB', () => {
    expect(formatDb(-91)).toBe('-∞ dB')
  })

  it('formats 0 dB with + prefix', () => {
    expect(formatDb(0)).toBe('+0.0 dB')
  })

  it('formats positive dB with + prefix', () => {
    expect(formatDb(6)).toBe('+6.0 dB')
  })

  it('formats negative dB without + prefix', () => {
    expect(formatDb(-12)).toBe('-12.0 dB')
  })
})

describe('fadeGain (Bezier fade curve)', () => {
  it('returns 0 at t=0 (start of fade)', () => {
    expect(fadeGain(0, 0.5)).toBeCloseTo(0)
  })

  it('returns 1 at t=1 (end of fade)', () => {
    expect(fadeGain(1, 0.5)).toBeCloseTo(1)
  })

  it('is linear at curve=0.5', () => {
    // At curve=0.5, gain(t) = 2*0.5*t*(1-t) + t^2 = t*(1-t) + t^2 = t
    expect(fadeGain(0.5, 0.5)).toBeCloseTo(0.5)
    expect(fadeGain(0.25, 0.5)).toBeCloseTo(0.25)
    expect(fadeGain(0.75, 0.5)).toBeCloseTo(0.75)
  })

  it('is non-linear at curve != 0.5', () => {
    // At curve=0.05 (very concave), midpoint should be less than 0.5
    expect(fadeGain(0.5, 0.05)).toBeLessThan(0.5)
    // At curve=0.95 (convex), midpoint should be greater than 0.5
    expect(fadeGain(0.5, 0.95)).toBeGreaterThan(0.5)
  })
})
