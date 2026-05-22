import type { MetricConfig, TestResult } from './types'

/**
 * Pure scoring functions. No side effects. 100% testable.
 */

export function scoreUnittest(tests: TestResult[], maxScore = 100): number {
  if (tests.length === 0) return 0
  const passed = tests.filter((t) => t.passed).length
  return (passed / tests.length) * maxScore
}

export function scoreMetric(value: number, config: MetricConfig, maxScore = 100): number {
  const { scoring } = config
  const { fullMarksAt, zeroMarksAt } = scoring

  // Higher-is-better (accuracy/f1/r2/ssim) when fullMarksAt > zeroMarksAt
  // Lower-is-better (mse/rmse) when fullMarksAt < zeroMarksAt
  const higherBetter = fullMarksAt > zeroMarksAt

  if (scoring.type === 'binary') {
    return value >= (config.threshold ?? fullMarksAt) ? maxScore : 0
  }

  if (scoring.type === 'threshold') {
    if (higherBetter) return value >= fullMarksAt ? maxScore : 0
    return value <= fullMarksAt ? maxScore : 0
  }

  // linear interpolation
  if (higherBetter) {
    if (value >= fullMarksAt) return maxScore
    if (value <= zeroMarksAt) return 0
    return ((value - zeroMarksAt) / (fullMarksAt - zeroMarksAt)) * maxScore
  } else {
    if (value <= fullMarksAt) return maxScore
    if (value >= zeroMarksAt) return 0
    return ((zeroMarksAt - value) / (zeroMarksAt - fullMarksAt)) * maxScore
  }
}

export function scoreMixed({
  unittest,
  metric,
  weights = { unittest: 0.4, metric: 0.6 },
}: {
  unittest: { tests: TestResult[] }
  metric: { value: number; config: MetricConfig }
  weights?: { unittest: number; metric: number }
}): number {
  const u = scoreUnittest(unittest.tests)
  const m = scoreMetric(metric.value, metric.config)
  return u * weights.unittest + m * weights.metric
}

export function roundScore(s: number, decimals = 2): number {
  const f = 10 ** decimals
  return Math.round(s * f) / f
}
