'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createBrowserSupabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

interface Props {
  assignment: any
}

export function AssignmentEditor({ assignment }: Props) {
  const [title, setTitle] = useState(assignment.title)
  const [description, setDescription] = useState(assignment.description_mdx ?? '')
  const [starterCode, setStarterCode] = useState(assignment.starter_code ?? '')
  const [visibleTests, setVisibleTests] = useState(assignment.visible_tests ?? '')
  const [hiddenPlain, setHiddenPlain] = useState('')
  const [evaluationType, setEvaluationType] = useState<'unittest' | 'ml_metric' | 'cv_output' | 'mixed'>(
    assignment.evaluation_type ?? 'unittest',
  )
  const [maxScore, setMaxScore] = useState(Number(assignment.max_score) || 100)
  const [maxAttempts, setMaxAttempts] = useState(assignment.max_attempts ?? 10)
  const [timeLimit, setTimeLimit] = useState(assignment.time_limit_seconds ?? 30)
  const [isPublished, setIsPublished] = useState(assignment.is_published)
  const [requiresManualReview, setRequiresManualReview] = useState(
    assignment.requires_manual_review ?? false,
  )
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  async function handleSave() {
    setSaving(true)
    const supabase = createBrowserSupabase()

    // If teacher provided new hidden tests plaintext, encrypt server-side first.
    let hiddenEncrypted = assignment.hidden_tests_encrypted as string | null
    if (hiddenPlain.trim()) {
      const res = await fetch('/api/grading/encrypt-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plaintext: hiddenPlain }),
      })
      if (!res.ok) {
        setSaving(false)
        toast({ title: 'Lỗi mã hóa hidden tests', variant: 'destructive' })
        return
      }
      const { ciphertext } = await res.json()
      hiddenEncrypted = ciphertext
    }

    const { error } = await supabase
      .from('assignments')
      .update({
        title,
        description_mdx: description,
        starter_code: starterCode,
        visible_tests: visibleTests,
        hidden_tests_encrypted: hiddenEncrypted,
        evaluation_type: evaluationType,
        max_score: maxScore,
        max_attempts: maxAttempts,
        time_limit_seconds: timeLimit,
        is_published: isPublished,
        requires_manual_review: requiresManualReview,
      })
      .eq('id', assignment.id)

    setSaving(false)
    if (error) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Đã lưu', variant: 'success' })
      if (hiddenPlain.trim()) setHiddenPlain('')
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label>Tiêu đề</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label>Mô tả (Markdown)</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} />
      </div>

      <div className="space-y-1.5">
        <Label>Starter code (sinh viên thấy)</Label>
        <Textarea
          value={starterCode}
          onChange={(e) => setStarterCode(e.target.value)}
          rows={6}
          className="font-mono text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Visible tests (sinh viên chạy được)</Label>
        <Textarea
          value={visibleTests}
          onChange={(e) => setVisibleTests(e.target.value)}
          rows={6}
          className="font-mono text-sm"
          placeholder="def test_x():\n    assert ..."
        />
      </div>

      <div className="space-y-1.5">
        <Label>Hidden tests (chấm chính thức)</Label>
        <Textarea
          value={hiddenPlain}
          onChange={(e) => setHiddenPlain(e.target.value)}
          rows={6}
          className="font-mono text-sm"
          placeholder={
            assignment.hidden_tests_encrypted
              ? '🔒 Đã có hidden tests được mã hóa. Nhập ở đây để THAY THẾ.'
              : 'def test_hidden_1():\n    assert ...'
          }
        />
        <p className="text-xs text-muted-foreground">
          Nội dung này sẽ được mã hóa bằng AES-256-GCM ngay khi lưu. Khóa nằm trên server, không bao giờ
          gửi về client.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="space-y-1.5">
          <Label>Loại chấm</Label>
          <select
            value={evaluationType}
            onChange={(e) => setEvaluationType(e.target.value as 'unittest' | 'ml_metric' | 'cv_output' | 'mixed')}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="unittest">Unittest</option>
            <option value="ml_metric">ML metric</option>
            <option value="cv_output">CV output</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Điểm tối đa</Label>
          <Input type="number" value={maxScore} onChange={(e) => setMaxScore(Number(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <Label>Max attempts</Label>
          <Input type="number" value={maxAttempts} onChange={(e) => setMaxAttempts(Number(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <Label>Time limit (s)</Label>
          <Input type="number" value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))} />
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="size-4"
          />
          Publish (sinh viên thấy & nộp được)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={requiresManualReview}
            onChange={(e) => setRequiresManualReview(e.target.checked)}
            className="size-4"
          />
          Bắt buộc giáo viên review thủ công (điểm tự động chỉ là gợi ý)
        </label>
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving && <Loader2 className="size-4 animate-spin" />}
        Lưu thay đổi
      </Button>
    </div>
  )
}
