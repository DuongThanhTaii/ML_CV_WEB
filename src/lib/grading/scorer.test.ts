import { describe, expect, it } from 'vitest'
import { scoreUnittest, scoreMetric, scoreMixed, roundScore } from './scorer'

describe('scoreUnittest', () => {
  it('returns 0 when no tests', () => {
    expect(scoreUnittest([])).toBe(0)
  })

  it('returns full marks when all pass', () => {
    expect(
      scoreUnittest([
        { name: 'a', passed: true },
        { name: 'b', passed: true },
      ]),
    ).toBe(100)
  })

  it('returns proportional marks', () => {
    expect(
      scoreUnittest([
        { name: 'a', passed: true },
        { name: 'b', passed: false },
        { name: 'c', passed: true },
        { name: 'd', passed: false },
      ]),
    ).toBe(50)
  })
})

describe('scoreMetric (higher is better)', () => {
  const config = {
    metric: 'accuracy' as const,
    scoring: { type: 'linear' as const, fullMarksAt: 0.95, zeroMarksAt: 0.5 },
  }

  it('full marks when at or above fullMarksAt', () => {
    expect(scoreMetric(0.95, config)).toBe(100)
    expect(scoreMetric(0.99, config)).toBe(100)
  })

  it('zero when at or below zeroMarksAt', () => {
    expect(scoreMetric(0.5, config)).toBe(0)
    expect(scoreMetric(0.3, config)).toBe(0)
  })

  it('linear interpolation in between', () => {
    // Midpoint
    const mid = scoreMetric(0.725, config)
    expect(mid).toBeCloseTo(50, 0)
  })
})

describe('scoreMetric (lower is better)', () => {
  const config = {
    metric: 'mse' as const,
    scoring: { type: 'linear' as const, fullMarksAt: 0.1, zeroMarksAt: 1.0 },
  }

  it('full marks at low values', () => {
    expect(scoreMetric(0.05, config)).toBe(100)
  })

  it('zero at high values', () => {
    expect(scoreMetric(1.5, config)).toBe(0)
  })

  it('inverse linear interp', () => {
    expect(scoreMetric(0.55, config)).toBeCloseTo(50, 0)
  })
})

describe('scoreMetric (binary)', () => {
  const config = {
    metric: 'accuracy' as const,
    threshold: 0.85,
    scoring: { type: 'binary' as const, fullMarksAt: 0.85, zeroMarksAt: 0 },
  }

  it('returns full above threshold', () => {
    expect(scoreMetric(0.86, config)).toBe(100)
  })

  it('returns zero below', () => {
    expect(scoreMetric(0.84, config)).toBe(0)
  })
})

describe('scoreMixed', () => {
  it('weighted combination', () => {
    const score = scoreMixed({
      unittest: {
        tests: [
          { name: 'a', passed: true },
          { name: 'b', passed: false },
        ],
      }, // = 50
      metric: {
        value: 0.95,
        config: {
          metric: 'accuracy' as const,
          scoring: { type: 'linear' as const, fullMarksAt: 0.95, zeroMarksAt: 0.5 },
        },
      }, // = 100
    })
    // 50*0.4 + 100*0.6 = 80
    expect(score).toBe(80)
  })
})

describe('roundScore', () => {
  it('rounds to 2 decimals by default', () => {
    expect(roundScore(85.456)).toBe(85.46)
    expect(roundScore(85.454)).toBe(85.45)
  })
})
