import { Notebook } from '@/components/notebook/notebook'

const STARTER_CELLS = [
  {
    id: 'cell-1',
    type: 'markdown' as const,
    source:
      '# 🧪 Playground\n\nĐây là notebook trống. Hãy thử chạy ô bên dưới — Pyodide sẽ tải lần đầu (~5-8s) rồi cache vĩnh viễn.',
    outputs: [],
  },
  {
    id: 'cell-2',
    type: 'code' as const,
    source:
      'import numpy as np\nimport matplotlib.pyplot as plt\n\nx = np.linspace(0, 2 * np.pi, 200)\nplt.plot(x, np.sin(x))\nplt.title("Hello Pyodide!")\nplt.show()',
    outputs: [],
  },
]

export default function PlaygroundPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <Notebook initialCells={STARTER_CELLS} />
    </div>
  )
}
