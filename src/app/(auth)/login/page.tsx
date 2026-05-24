import { LoginForm } from '@/components/auth/login-form'
import { AuthShell } from '@/components/auth/auth-shell'
import Link from 'next/link'
import { Suspense } from 'react'

export default function LoginPage() {
  return (
    <AuthShell
      title="Đăng nhập"
      subtitle="Tiếp tục hành trình học ML/CV của bạn."
      footer={
        <>
          Chưa có tài khoản?{' '}
          <Link href="/signup" className="font-medium text-foreground underline-offset-4 hover:underline">
            Đăng ký
          </Link>
        </>
      }
    >
      <Suspense fallback={<div className="h-72 animate-pulse rounded-md bg-muted/30" />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  )
}
