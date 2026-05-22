export interface TestResult {
  name: string
  passed: boolean
  expected?: unknown
  got?: unknown
  error?: string
}

export interface GradingInput {
  studentCode: string
  tests: string
  evaluationType: 'unittest' | 'ml_metric' | 'cv_output' | 'mixed'
  metricConfig?: MetricConfig
}

export interface MetricConfig {
  metric: 'accuracy' | 'f1' | 'mse' | 'rmse' | 'r2' | 'ssim'
  threshold?: number
  scoring: {
    type: 'linear' | 'threshold' | 'binary'
    fullMarksAt: number
    zeroMarksAt: number
  }
}

export interface GradingOutput {
  score: number
  maxScore: number
  passedTests: number
  totalTests: number
  testDetails: TestResult[]
  metricValue?: number
  executionTimeMs: number
  stdout: string
  stderr: string
  error?: string
}
