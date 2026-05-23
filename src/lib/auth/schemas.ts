import { z } from 'zod'

export const emailSchema = z
  .string()
  .min(1, 'Vui lòng nhập email')
  .email('Email không hợp lệ')
  .max(254)

export const passwordSchema = z
  .string()
  .min(8, 'Mật khẩu tối thiểu 8 ký tự')
  .max(128, 'Mật khẩu tối đa 128 ký tự')

export const fullNameSchema = z
  .string()
  .min(2, 'Họ tên tối thiểu 2 ký tự')
  .max(100, 'Họ tên tối đa 100 ký tự')
  .trim()

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
})

export const signupSchema = z
  .object({
    fullName: fullNameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

/**
 * Map common Supabase auth error messages to friendly Vietnamese.
 */
export function friendlyAuthError(msg: string): string {
  const lower = msg.toLowerCase()
  if (lower.includes('invalid login credentials')) return 'Email hoặc mật khẩu không đúng'
  if (lower.includes('email not confirmed')) return 'Vui lòng xác thực email trước khi đăng nhập'
  if (lower.includes('user already registered')) return 'Email này đã được sử dụng'
  if (lower.includes('password should be at least')) return 'Mật khẩu quá ngắn (tối thiểu 8 ký tự)'
  if (lower.includes('rate limit') || lower.includes('too many'))
    return 'Bạn thử quá nhiều lần, vui lòng đợi vài phút'
  if (lower.includes('token has expired') || lower.includes('expired'))
    return 'Link đã hết hạn, vui lòng yêu cầu lại'
  if (lower.includes('user not found')) return 'Không tìm thấy tài khoản với email này'
  return msg
}
