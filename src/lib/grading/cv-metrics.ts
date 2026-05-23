import type { BBox, Polygon } from './types'

/**
 * CV metrics: pure functions, no deps. All inputs assumed valid.
 */

/** Intersection-over-Union for two axis-aligned bounding boxes */
export function iouBBox(a: BBox, b: BBox): number {
  const [ax, ay, aw, ah] = a
  const [bx, by, bw, bh] = b
  const x1 = Math.max(ax, bx)
  const y1 = Math.max(ay, by)
  const x2 = Math.min(ax + aw, bx + bw)
  const y2 = Math.min(ay + ah, by + bh)
  const interW = Math.max(0, x2 - x1)
  const interH = Math.max(0, y2 - y1)
  const inter = interW * interH
  const union = aw * ah + bw * bh - inter
  return union > 0 ? inter / union : 0
}

/**
 * Greedy matching of predictions to ground truths at a fixed IoU threshold.
 * Returns mean IoU over matched pairs; unmatched count as 0 contribution.
 */
export function meanIoUBBoxes(
  preds: BBox[],
  gts: BBox[],
  iouThreshold = 0.5,
): { meanIoU: number; matched: number; totalPreds: number; totalGts: number } {
  if (preds.length === 0 && gts.length === 0) {
    return { meanIoU: 1, matched: 0, totalPreds: 0, totalGts: 0 }
  }
  const usedGt = new Set<number>()
  let sumIoU = 0
  let matched = 0
  for (const p of preds) {
    let bestIdx = -1
    let bestIoU = 0
    for (let i = 0; i < gts.length; i++) {
      if (usedGt.has(i)) continue
      const v = iouBBox(p, gts[i]!)
      if (v > bestIoU) {
        bestIoU = v
        bestIdx = i
      }
    }
    if (bestIdx >= 0 && bestIoU >= iouThreshold) {
      usedGt.add(bestIdx)
      sumIoU += bestIoU
      matched++
    }
  }
  const denom = Math.max(preds.length, gts.length)
  return {
    meanIoU: denom > 0 ? sumIoU / denom : 0,
    matched,
    totalPreds: preds.length,
    totalGts: gts.length,
  }
}

/** Polygon area via shoelace formula */
export function polygonArea(poly: Polygon): number {
  if (poly.length < 3) return 0
  let s = 0
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i]!
    const [x2, y2] = poly[(i + 1) % poly.length]!
    s += x1 * y2 - x2 * y1
  }
  return Math.abs(s) / 2
}

/**
 * Dice coefficient for two binary masks (flattened Uint8Array, same length).
 * 2|A∩B| / (|A| + |B|). 1 = perfect, 0 = no overlap.
 */
export function diceMask(a: Uint8Array, b: Uint8Array): number {
  if (a.length !== b.length) {
    throw new Error(`Mask shape mismatch: ${a.length} vs ${b.length}`)
  }
  let inter = 0
  let sumA = 0
  let sumB = 0
  for (let i = 0; i < a.length; i++) {
    const ai = a[i] ? 1 : 0
    const bi = b[i] ? 1 : 0
    inter += ai & bi
    sumA += ai
    sumB += bi
  }
  if (sumA === 0 && sumB === 0) return 1
  return (2 * inter) / (sumA + sumB)
}

/** Pixel-wise IoU for binary masks */
export function iouMask(a: Uint8Array, b: Uint8Array): number {
  if (a.length !== b.length) {
    throw new Error(`Mask shape mismatch: ${a.length} vs ${b.length}`)
  }
  let inter = 0
  let union = 0
  for (let i = 0; i < a.length; i++) {
    const ai = a[i] ? 1 : 0
    const bi = b[i] ? 1 : 0
    inter += ai & bi
    union += ai | bi
  }
  return union > 0 ? inter / union : 1
}

/**
 * Weighted F1 across multiple classes.
 * `preds` and `gts` are aligned label arrays of equal length.
 */
export function f1Weighted(preds: (string | number)[], gts: (string | number)[]): number {
  if (preds.length !== gts.length) {
    throw new Error(`Length mismatch: preds=${preds.length} gts=${gts.length}`)
  }
  const labels = new Set([...preds, ...gts])
  let weightedSum = 0
  const total = gts.length
  if (total === 0) return 0
  for (const label of labels) {
    let tp = 0
    let fp = 0
    let fn = 0
    let support = 0
    for (let i = 0; i < gts.length; i++) {
      const isGt = gts[i] === label
      const isPr = preds[i] === label
      if (isGt) support++
      if (isPr && isGt) tp++
      else if (isPr && !isGt) fp++
      else if (!isPr && isGt) fn++
    }
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0
    weightedSum += f1 * (support / total)
  }
  return weightedSum
}
