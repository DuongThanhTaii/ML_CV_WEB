import { createServerSupabase } from '@/lib/supabase/server'
import { aiGateway } from '@/lib/ai/gateway'
import { explainCodePrompt } from '@/lib/ai/prompts/explain'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'edge'

const schema = z.object({
  code: z.string().min(1).max(5000),
  level: z.enum(['beginner', 'intermediate']).optional(),
})

export async function POST(req: Request) {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json(parsed.error, { status: 400 })

  const stream = await aiGateway.streamChat({
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: explainCodePrompt(parsed.data.code, parsed.data.level) }],
    temperature: 0.3,
    maxTokens: 600,
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
