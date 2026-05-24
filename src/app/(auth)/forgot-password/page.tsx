import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'
import { AuthShell } from '@/components/auth/auth-shell'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Quên mật khẩu"
      subtitle="Nhập email để nhận link đặt lại mật khẩu."
      footer={
        <Link href="/login" className="hover:text-foreground hover:underline">
          ← Quay lại đăng nhập
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  )
}
