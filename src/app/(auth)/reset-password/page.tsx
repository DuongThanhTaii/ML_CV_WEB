import { ResetPasswordForm } from '@/components/auth/reset-password-form'
import { AuthShell } from '@/components/auth/auth-shell'

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Đặt lại mật khẩu"
      subtitle="Nhập mật khẩu mới cho tài khoản của bạn."
    >
      <ResetPasswordForm />
    </AuthShell>
  )
}
