'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PasswordInput } from './password-input'
import { createBrowserSupabase } from '@/lib/supabase/client'
import { friendlyAuthError, resetPasswordSchema } from '@/lib/auth/schemas'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ResetPasswordForm({ className }: { className?: string }) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [hasSession, setHasSession] = useState<boolean | null>(null)

  // Verify user arrived from a valid reset email (Supabase auto-creates a recovery session)
  useEffect(() => {
    const supabase = createBrowserSupabase()
    supabase.auth.getSession().then(({ data }) => setHasSession(!!data.session))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const parsed = resetPasswordSchema.safeParse({ password, confirmPassword })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ')
      return
    }

    setLoading(true)
    const supabase = createBrowserSupabase()
    const { error: authError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (authError) {
      setError(friendlyAuthError(authError.message))
      return
    }

    setDone(true)
    setTimeout(() => {
      router.push('/dashboard')
      router.refresh()
    }, 2000)
  }

  if (hasSession === false) {
    return (
      <div className={cn('rounded-md border border-destructive/30 bg-destructive/5 p-5', className)}>
        <h3 className="font-semibold text-destructive">Link không hợp lệ hoặc đã hết hạn</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Vui lòng yêu cầu link đặt lại mật khẩu mới.
        </p>
        <Link
          href="/forgot-password"
          className="mt-3 inline-block text-sm text-primary hover:underline"
        >
          → Yêu cầu link mới
        </Link>
      </div>
    )
  }

  if (done) {
    return (
      <div className={cn('rounded-md border bg-emerald-50/30 p-5 dark:bg-emerald-950/20', className)}>
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-emerald-600" />
          <div>
            <h3 className="font-semibold">Đã đổi mật khẩu</h3>
            <p className="mt-1 text-sm text-muted-foreground">Đang chuyển về trang chính…</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)} noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="password">Mật khẩu mới</Label>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="≥ 8 ký tự"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirm-password">Xác nhận mật khẩu mới</Label>
        <PasswordInput
          id="confirm-password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Nhập lại mật khẩu"
        />
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading || hasSession === null}>
        {loading && <Loader2 className="size-4 animate-spin" />}
        Đặt mật khẩu mới
      </Button>
    </form>
  )
}
