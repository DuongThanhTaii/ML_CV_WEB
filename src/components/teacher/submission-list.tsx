'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { Download } from 'lucide-react'

interface Submission {
  id: string
  status: string
  attempt_number: number
  submitted_at: string
  code_hash: string
  profiles: { full_name: string | null; email: string }
  grading_results: Array<{ score: number; max_score: number; passed_tests: number; total_tests: number }>
}

interface Props {
  submissions: Submission[]
  assignmentId: string
}

export function SubmissionList({ submissions, assignmentId }: Props) {
  function exportCsv() {
    const rows = [
      ['Student', 'Email', 'Attempt', 'Status', 'Score', 'Submitted'],
      ...submissions.map((s) => [
        s.profiles.full_name ?? '',
        s.profiles.email,
        String(s.attempt_number),
        s.status,
        s.grading_results[0] ? `${s.grading_results[0].score}/${s.grading_results[0].max_score}` : '',
        s.submitted_at,
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `submissions-${assignmentId}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Detect duplicates by code_hash
  const counts = new Map<string, number>()
  submissions.forEach((s) => counts.set(s.code_hash, (counts.get(s.code_hash) ?? 0) + 1))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{submissions.length} submissions</span>
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <Download className="size-4" /> Export CSV
        </Button>
      </div>

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30 text-left">
            <tr>
              <th className="p-3">Sinh viên</th>
              <th className="p-3">Lần</th>
              <th className="p-3">Trạng thái</th>
              <th className="p-3">Điểm</th>
              <th className="p-3">Nộp lúc</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((s) => {
              const g = s.grading_results[0]
              const dup = (counts.get(s.code_hash) ?? 0) > 1
              return (
                <tr key={s.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="p-3">
                    <div className="font-medium">{s.profiles.full_name || s.profiles.email}</div>
                    <div className="text-xs text-muted-foreground">{s.profiles.email}</div>
                  </td>
                  <td className="p-3">#{s.attempt_number}</td>
                  <td className="p-3">
                    {s.status === 'graded' && <Badge variant="success">Đã chấm</Badge>}
                    {s.status === 'pending' && <Badge variant="warning">Chờ</Badge>}
                    {s.status === 'running' && <Badge variant="warning">Đang chạy</Badge>}
                    {s.status === 'error' && <Badge variant="destructive">Lỗi</Badge>}
                    {s.status === 'manual_review' && <Badge>Cần review</Badge>}
                    {dup && (
                      <Badge variant="destructive" className="ml-1">
                        Trùng code
                      </Badge>
                    )}
                  </td>
                  <td className="p-3">{g ? `${Number(g.score).toFixed(1)}/${Number(g.max_score).toFixed(0)}` : '—'}</td>
                  <td className="p-3 text-xs text-muted-foreground">{formatDate(s.submitted_at)}</td>
                  <td className="p-3 text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/teacher/submissions/${s.id}`}>Xem</Link>
                    </Button>
                  </td>
                </tr>
              )
            })}
            {submissions.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  Chưa có submission nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
