import { createServerSupabase } from '@/lib/supabase/server'
import { aiGateway } from '@/lib/ai/gateway'
import { tutorSystemPrompt, buildTutorContext } from '@/lib/ai/prompts/tutor'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'edge'

const bodySchema = z.object({
  message: z.string().min(1).max(2000),
  sessionId: z.string().uuid().nullable(),
  context: z
    .object({
      lessonId: z.string().uuid().optional(),
      code: z.string().max(4000).optional(),
      error: z.string().max(2000).optional(),
    })
    .optional(),
})

export async function POST(req: Request) {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const parsed = bodySchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json(parsed.error, { status: 400 })

  const { message, context } = parsed.data
  const systemPrompt = tutorSystemPrompt()
  const userPrompt = await buildTutorContext({ supabase, userId: user.id, message, context })

  const stream = await aiGateway.streamChat({
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.4,
    maxTokens: 800,
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
