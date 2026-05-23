'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createBrowserSupabase } from '@/lib/supabase/client'
import { submissionService } from '@/services/submission.service'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { Loader2, RotateCcw } from 'lucide-react'

interface Props {
  submissionId: string
  autoScore: number
  maxScore: number
  initialOverride: number | null
  initialComment: string | null
}

export function OverrideScoreForm({
  submissionId,
  autoScore,
  maxScore,
  initialOverride,
  initialComment,
}: Props) {
  const [useOverride, setUseOverride] = useState(initialOverride !== null)
  const [score, setScore] = useState(initialOverride ?? autoScore)
  const [comment, setComment] = useState(initialComment ?? '')
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createBrowserSupabase()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      return
    }
    try {
      await submissionService.overrideScore(supabase, submissionId, user.id, {
        overrideScore: useOverride ? score : null,
        comment: comment.trim() || null,
      })
      toast({ title: 'Đã lưu review', variant: 'success' })
      router.refresh()
    } catch (err) {
      toast({
        title: 'Lỗi',
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-3 rounded-md border bg-muted/20 p-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={useOverride}
            onChange={(e) => setUseOverride(e.target.checked)}
            className="size-4"
          />
          Override điểm tự động
        </label>
        {useOverride && (
          <div className="space-y-1">
            <Label htmlFor="override" className="text-xs">
              Điểm cuối
            </Label>
            <Input
              id="override"
              type="number"
              step="0.5"
              min={0}
              max={maxScore}
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              className="w-32"
            />
          </div>
        )}
        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          {useOverride && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setScore(autoScore)
                setUseOverride(false)
              }}
            >
              <RotateCcw className="size-3" /> Khôi phục điểm tự động
            </Button>
          )}
          <span>
            Tự động: {autoScore.toFixed(1)} / {maxScore}
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="comment" className="text-xs">
          Comment cho học sinh (tùy chọn)
        </Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="VD: code đúng nhưng chưa tối ưu vectorization; có thể dùng np.dot thay vì loop…"
        />
      </div>

      <Button type="submit" disabled={saving}>
        {saving && <Loader2 className="size-4 animate-spin" />}
        Lưu review
      </Button>
    </form>
  )
}
