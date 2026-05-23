'use client'

/**
 * Read-only SVG overlay rendering bbox / polygon / point annotations.
 * Used inside an absolutely-positioned container that matches the rendered
 * image's display size. Coordinates are in the IMAGE'S native pixel space.
 */

export interface ViewerAnnotation {
  id: string
  shape_type: 'bbox' | 'polygon' | 'point'
  // bbox: [x, y, w, h]; polygon: [[x,y]...]; point: [x, y]
  coordinates: number[] | number[][]
  label: string
  color?: string | null
}

interface Props {
  annotations: ViewerAnnotation[]
  /** Native image dimensions (used for the SVG viewBox) */
  imageWidth: number
  imageHeight: number
}

const DEFAULT_COLORS = [
  '#ef4444', // red
  '#22c55e', // green
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#a855f7', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
]

function colorFor(ann: ViewerAnnotation, index: number): string {
  if (ann.color) return ann.color
  return DEFAULT_COLORS[index % DEFAULT_COLORS.length]!
}

export function AnnotationViewer({ annotations, imageWidth, imageHeight }: Props) {
  return (
    <svg
      viewBox={`0 0 ${imageWidth} ${imageHeight}`}
      preserveAspectRatio="none"
      className="absolute inset-0 size-full"
      role="img"
      aria-label="Annotations"
    >
      {annotations.map((ann, i) => {
        const color = colorFor(ann, i)
        if (ann.shape_type === 'bbox') {
          const [x = 0, y = 0, w = 0, h = 0] = ann.coordinates as number[]
          return (
            <g key={ann.id}>
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                fill="none"
                stroke={color}
                strokeWidth={Math.max(2, imageWidth / 400)}
              />
              <rect
                x={x}
                y={y}
                width={Math.min(w, ann.label.length * imageWidth * 0.018)}
                height={imageHeight * 0.04}
                fill={color}
              />
              <text
                x={x + 4}
                y={y + imageHeight * 0.03}
                fill="white"
                fontSize={imageHeight * 0.025}
                fontWeight={600}
              >
                {ann.label}
              </text>
            </g>
          )
        }
        if (ann.shape_type === 'polygon') {
          const points = (ann.coordinates as number[][])
            .map((p) => `${p[0]},${p[1]}`)
            .join(' ')
          const first = (ann.coordinates as number[][])[0]!
          return (
            <g key={ann.id}>
              <polygon
                points={points}
                fill={color}
                fillOpacity={0.2}
                stroke={color}
                strokeWidth={Math.max(2, imageWidth / 400)}
              />
              <text
                x={first[0]! + 4}
                y={first[1]! - 4}
                fill={color}
                fontSize={imageHeight * 0.025}
                fontWeight={600}
                stroke="white"
                strokeWidth={0.5}
              >
                {ann.label}
              </text>
            </g>
          )
        }
        // point
        const [px = 0, py = 0] = ann.coordinates as number[]
        return (
          <g key={ann.id}>
            <circle cx={px} cy={py} r={Math.max(4, imageWidth / 100)} fill={color} />
            <text
              x={px + 8}
              y={py + 4}
              fill={color}
              fontSize={imageHeight * 0.025}
              fontWeight={600}
              stroke="white"
              strokeWidth={0.5}
            >
              {ann.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
