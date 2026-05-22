'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createBrowserSupabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

export function LoginForm({ className }: { className?: string }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    const supabase = createBrowserSupabase()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/callback` },
    })
    if (error) {
      setError(error.message)
      setStatus('error')
    } else {
      setStatus('sent')
    }
  }

  async function handleGoogle() {
    const supabase = createBrowserSupabase()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/callback` },
    })
  }

  if (status === 'sent') {
    return (
      <div className={cn('rounded-md border bg-muted/30 p-4 text-sm', className)}>
        ✉️ Đã gửi magic link tới <span className="font-medium">{email}</span>. Kiểm tra email
        (kể cả Spam) và bấm vào liên kết để đăng nhập.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-3', className)}>
      <Input
        type="email"
        placeholder="ban@example.com"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button type="submit" className="w-full" disabled={status === 'sending'}>
        {status === 'sending' && <Loader2 className="size-4 animate-spin" />}
        Gửi magic link
      </Button>
      <div className="relative my-2 text-center text-xs text-muted-foreground">
        <span className="bg-card px-2">hoặc</span>
        <div className="absolute inset-x-0 top-1/2 -z-10 h-px bg-border" />
      </div>
      <Button type="button" variant="outline" className="w-full" onClick={handleGoogle}>
        Tiếp tục với Google
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  )
}
