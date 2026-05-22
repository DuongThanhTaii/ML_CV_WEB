'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { usePyodide } from '@/hooks/use-pyodide'
import { runVisibleTests } from '@/lib/grading/client-runner'
import { useToast } from '@/hooks/use-toast'
import { TestResultList } from './test-result-list'
import { GradingResultView } from './grading-result'
import { Loader2, Play, Send } from 'lucide-react'
import type { TestResult } from '@/lib/grading/types'
import { useRealtimeSubmission } from '@/hooks/use-realtime-submission'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse bg-muted" />,
})

interface Props {
  assignment: any
}

export function AssignmentPanel({ assignment }: Props) {
  const [code, setCode] = useState<string>(assignment.starter_code ?? '')
  const [tests, setTests] = useState<TestResult[]>([])
  const [running, setRunning] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submissionId, setSubmissionId] = useState<string | null>(null)
  const { status: pyStatus, init } = usePyodide()
  const { toast } = useToast()
  const realtime = useRealtimeSubmission(submissionId)

  const visibleTests: string = assignment.visible_tests ?? ''
  const allPassed = tests.length > 0 && tests.every((t) => t.passed)

  async function handleRunTests() {
    if (pyStatus === 'idle' || pyStatus === 'terminated') await init()
    setRunning(true)
    try {
      const { tests: results } = await runVisibleTests(code, visibleTests)
      setTests(results)
    } catch (e: any) {
      toast({ title: 'Lỗi chạy test', description: e.message ?? String(e), variant: 'destructive' })
    } finally {
      setRunning(false)
    }
  }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const res = await fetch('/api/grading/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: assignment.id,
          code,
          clientTestPassed: allPassed,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const { submissionId } = await res.json()
      setSubmissionId(submissionId)
      toast({ title: 'Đã nộp bài', description: 'Đang chấm, vui lòng đợi…' })
    } catch (e: any) {
      toast({ title: 'Lỗi nộp bài', description: e.message ?? String(e), variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-lg border bg-card">
      <header className="border-b p-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">{assignment.title}</h3>
          <Badge variant="outline">{assignment.evaluation_type}</Badge>
          <Badge variant="secondary">{assignment.max_score} điểm</Badge>
        </div>
        {assignment.description_mdx && (
          <div className="prose prose-sm mt-2 max-w-none text-muted-foreground dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{assignment.description_mdx}</ReactMarkdown>
          </div>
        )}
      </header>

      <div className="border-b">
        <MonacoEditor
          height="320px"
          defaultLanguage="python"
          value={code}
          onChange={(v) => setCode(v ?? '')}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: 'JetBrains Mono, monospace',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 12, bottom: 12 },
          }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 p-4">
        <Button onClick={handleRunTests} disabled={running || submitting} variant="outline">
          {running ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
          Chạy test xem trước
        </Button>
        <Button onClick={handleSubmit} disabled={submitting || !!submissionId}>
          {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          Nộp bài
        </Button>
        {tests.length > 0 && (
          <span className="text-xs text-muted-foreground">
            ({tests.filter((t) => t.passed).length}/{tests.length} pass — chưa tính vào điểm)
          </span>
        )}
      </div>

      {tests.length > 0 && (
        <div className="border-t p-4">
          <h4 className="mb-2 text-sm font-medium">Test xem trước (visible)</h4>
          <TestResultList tests={tests} />
        </div>
      )}

      {submissionId && (
        <div className="border-t p-4">
          <h4 className="mb-2 text-sm font-medium">Kết quả chính thức</h4>
          <GradingResultView status={realtime.status} result={realtime.result} />
        </div>
      )}
    </div>
  )
}
