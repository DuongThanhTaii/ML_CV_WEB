import { encryptTests } from '@/lib/grading/encryption'
import { createServerSupabase } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({ plaintext: z.string().min(1).max(50_000) })

export async function POST(req: Request) {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'teacher' && profile?.role !== 'admin') {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json(parsed.error, { status: 400 })

  const key = process.env.GRADING_ENCRYPTION_KEY
  if (!key) return new NextResponse('Server misconfigured', { status: 500 })

  const ciphertext = await encryptTests(parsed.data.plaintext, key)
  return NextResponse.json({ ciphertext })
}
