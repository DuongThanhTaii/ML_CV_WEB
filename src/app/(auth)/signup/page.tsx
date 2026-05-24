import { SignupForm } from '@/components/auth/signup-form'
import { AuthShell } from '@/components/auth/auth-shell'
import Link from 'next/link'

export default function SignupPage() {
  return (
    <AuthShell
      title="Tạo tài khoản"
      subtitle="Bắt đầu học ML/CV ngay trên trình duyệt."
      footer={
        <>
          Đã có tài khoản?{' '}
          <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
            Đăng nhập
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthShell>
  )
}
