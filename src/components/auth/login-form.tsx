'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from './password-input'
import { GoogleButton } from './google-button'
import { ResendVerification } from './resend-verification'
import { createBrowserSupabase } from '@/lib/supabase/client'
import { friendlyAuthError, loginSchema } from '@/lib/auth/schemas'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function LoginForm({ className }: { className?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/dashboard'
  const urlError = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(
    urlError === 'auth_callback_failed'
      ? 'Đăng nhập thất bại, vui lòng thử lại'
      : urlError
        ? decodeURIComponent(urlError)
        : null,
  )
  const [needsVerify, setNeedsVerify] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setNeedsVerify(false)

    const parsed = loginSchema.safeParse({ email, password })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ')
      return
    }

    setLoading(true)
    const supabase = createBrowserSupabase()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (authError) {
      const friendly = friendlyAuthError(authError.message)
      setError(friendly)
      if (friendly.includes('xác thực email')) setNeedsVerify(true)
      return
    }

    router.push(next)
    router.refresh()
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

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <Label htmlFor="password">Mật khẩu</Label>
          <Link
            href="/forgot-password"
            className="text-xs text-muted-foreground hover:text-primary hover:underline"
          >
            Quên mật khẩu?
          </Link>
        </div>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
          {needsVerify && (
            <div className="mt-2">
              <ResendVerification email={email} />
            </div>
          )}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="size-4 animate-spin" />}
        Đăng nhập
      </Button>

      <div className="relative my-2 text-center text-xs text-muted-foreground">
        <span className="bg-card px-2">hoặc</span>
        <div className="absolute inset-x-0 top-1/2 -z-10 h-px bg-border" />
      </div>

      <GoogleButton nextPath={next} />

      <p className="pt-2 text-center text-sm text-muted-foreground">
        Chưa có tài khoản?{' '}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Đăng ký
        </Link>
      </p>
    </form>
  )
}
