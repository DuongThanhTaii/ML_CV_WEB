'use client'

import { useState } from 'react'
import { createBrowserSupabase } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export function ResendVerification({ email }: { email: string }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleResend() {
    if (!email) {
      setError('Vui lòng nhập email phía trên trước')
      setStatus('error')
      return
    }
    setStatus('sending')
    setError(null)
    const supabase = createBrowserSupabase()
    const { error: authError } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/callback?next=/dashboard` },
    })
    if (authError) {
      setError(authError.message)
      setStatus('error')
    } else {
      setStatus('sent')
    }
  }

  if (status === 'sent') {
    return <span className="text-xs text-emerald-600">✓ Đã gửi lại email xác thực</span>
  }

  return (
    <button
      type="button"
      onClick={handleResend}
      disabled={status === 'sending'}
      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline disabled:opacity-50"
    >
      {status === 'sending' && <Loader2 className="size-3 animate-spin" />}
      Gửi lại email xác thực
      {error && <span className="ml-2 text-destructive">— {error}</span>}
    </button>
  )
}
