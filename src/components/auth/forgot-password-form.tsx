'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createBrowserSupabase } from '@/lib/supabase/client'
import { friendlyAuthError, forgotPasswordSchema } from '@/lib/auth/schemas'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ForgotPasswordForm({ className }: { className?: string }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const parsed = forgotPasswordSchema.safeParse({ email })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Email không hợp lệ')
      return
    }

    setLoading(true)
    const supabase = createBrowserSupabase()
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)

    if (authError) {
      setError(friendlyAuthError(authError.message))
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <div className={cn('rounded-md border bg-emerald-50/30 p-5 dark:bg-emerald-950/20', className)}>
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-emerald-600" />
          <div>
            <h3 className="font-semibold">Đã gửi email</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Nếu <strong>{email}</strong> tồn tại trong hệ thống, bạn sẽ nhận được link đặt lại mật
              khẩu trong vài phút. Kiểm tra cả mục Spam.
            </p>
            <Link href="/login" className="mt-3 inline-block text-sm text-primary hover:underline">
              ← Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)} noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ban@example.com"
        />
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="size-4 animate-spin" />}
        Gửi link đặt lại mật khẩu
      </Button>

      <p className="pt-2 text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-primary hover:underline">
          ← Quay lại đăng nhập
        </Link>
      </p>
    </form>
  )
}
