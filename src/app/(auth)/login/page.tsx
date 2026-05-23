import { LoginForm } from '@/components/auth/login-form'
import { Brain } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-sm">
        <Link href="/" className="mb-6 flex items-center gap-2 font-semibold">
          <Brain className="size-6 text-primary" />
          <span>ml-cv-learn</span>
        </Link>
        <h1 className="text-2xl font-bold">Đăng nhập</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tiếp tục hành trình học ML/CV của bạn.</p>
        <Suspense fallback={<div className="mt-6 h-72 animate-pulse rounded-md bg-muted/30" />}>
          <LoginForm className="mt-6" />
        </Suspense>
      </div>
    </main>
  )
}
