'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createBrowserSupabase } from '@/lib/supabase/client'
import { submissionService } from '@/services/submission.service'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface Props {
  submissionId: string
  currentScore: number
  maxScore: number
}

export function OverrideScoreForm({ submissionId, currentScore, maxScore }: Props) {
  const [score, setScore] = useState(currentScore)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  async function handle(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createBrowserSupabase()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    try {
      await submissionService.overrideScore(supabase, submissionId, score, user.id)
      toast({ title: 'Đã cập nhật điểm', variant: 'success' })
      router.refresh()
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handle} className="flex items-end gap-2 rounded-md border bg-muted/20 p-3">
      <div className="space-y-1.5">
        <Label htmlFor="override">Override điểm</Label>
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
      <Button type="submit" disabled={saving || score === currentScore}>
        {saving && <Loader2 className="size-4 animate-spin" />}
        Lưu
      </Button>
      <span className="ml-auto text-xs text-muted-foreground">/ {maxScore}</span>
    </form>
  )
}
