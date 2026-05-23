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
  metric: 'accuracy' | 'f1' | 'f1_weighted' | 'mse' | 'rmse' | 'r2' | 'ssim' | 'iou' | 'dice'
  threshold?: number
  scoring: {
    type: 'linear' | 'threshold' | 'binary'
    fullMarksAt: number
    zeroMarksAt: number
  }
}

/** Axis-aligned bounding box: [x, y, w, h] in pixel coords */
export type BBox = [number, number, number, number]
export type Polygon = Array<[number, number]>

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
