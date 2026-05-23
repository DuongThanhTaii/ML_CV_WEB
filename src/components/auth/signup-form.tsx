'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from './password-input'
import { GoogleButton } from './google-button'
import { createBrowserSupabase } from '@/lib/supabase/client'
import { friendlyAuthError, signupSchema } from '@/lib/auth/schemas'
import { Loader2, CheckCircle2, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SignupForm({ className }: { className?: string }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const parsed = signupSchema.safeParse({ fullName, email, password, confirmPassword })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ')
      return
    }

    setLoading(true)
    const supabase = createBrowserSupabase()
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/callback?next=/dashboard`,
      },
    })
    setLoading(false)

    if (authError) {
      setError(friendlyAuthError(authError.message))
      return
    }

    // If email confirmation is disabled in Supabase, session is returned immediately.
    if (data.session) {
      window.location.href = '/dashboard'
      return
    }

    setSuccess(true)
  }

  if (success) {
    return (
      <div className={cn('space-y-4 rounded-md border bg-emerald-50/30 p-5 dark:bg-emerald-950/20', className)}>
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-emerald-600" />
          <div>
            <h3 className="font-semibold">Tạo tài khoản thành công!</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Chúng tôi đã gửi email xác thực tới <strong>{email}</strong>. Vui lòng kiểm tra hộp thư
              (cả mục Spam) và click vào link để kích hoạt tài khoản.
            </p>
          </div>
        </div>
        <div className="rounded bg-muted/50 p-3 text-xs text-muted-foreground">
          <Mail className="mr-1 inline size-3.5" />
          Không nhận được email sau 2 phút? Kiểm tra Spam, hoặc thử{' '}
          <Link href="/login" className="text-primary hover:underline">
            đăng nhập
          </Link>{' '}
          để nhận tùy chọn gửi lại.
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)} noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="full-name">Họ và tên</Label>
        <Input
          id="full-name"
          autoComplete="name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Nguyễn Văn A"
        />
      </div>

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

      <div className="space-y-1.5">
        <Label htmlFor="password">Mật khẩu</Label>
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
        <Label htmlFor="confirm-password">Xác nhận mật khẩu</Label>
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

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="size-4 animate-spin" />}
        Tạo tài khoản
      </Button>

      <div className="relative my-2 text-center text-xs text-muted-foreground">
        <span className="bg-card px-2">hoặc</span>
        <div className="absolute inset-x-0 top-1/2 -z-10 h-px bg-border" />
      </div>

      <GoogleButton />

      <p className="pt-2 text-center text-sm text-muted-foreground">
        Đã có tài khoản?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Đăng nhập
        </Link>
      </p>
    </form>
  )
}
