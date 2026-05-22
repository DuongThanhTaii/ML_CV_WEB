/**
 * AI Gateway — single abstraction over multiple LLM providers.
 * Use this in route handlers / edge functions. Never call providers directly.
 */

export type Provider = 'groq' | 'gemini'
export type ChatRole = 'system' | 'user' | 'assistant'

export interface ChatMessage {
  role: ChatRole
  content: string
}

export interface ChatOptions {
  provider: Provider
  model: string
  messages: ChatMessage[]
  temperature?: number
  maxTokens?: number
}

class Gateway {
  async streamChat(opts: ChatOptions): Promise<ReadableStream> {
    if (opts.provider === 'groq') return streamGroq(opts)
    if (opts.provider === 'gemini') return streamGemini(opts)
    throw new Error(`Unknown provider: ${opts.provider}`)
  }

  async completeJSON<T>(opts: ChatOptions): Promise<T> {
    const text = await this.complete(opts)
    return JSON.parse(text) as T
  }

  async complete(opts: ChatOptions): Promise<string> {
    if (opts.provider === 'groq') return completeGroq(opts)
    throw new Error(`Non-streaming not implemented for ${opts.provider}`)
  }
}

async function streamGroq(opts: ChatOptions): Promise<ReadableStream> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.4,
      max_tokens: opts.maxTokens ?? 1024,
      stream: true,
    }),
  })
  if (!res.ok || !res.body) throw new Error(`Groq error: ${res.status}`)
  return res.body
}

async function completeGroq(opts: ChatOptions): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.4,
      max_tokens: opts.maxTokens ?? 1024,
    }),
  })
  if (!res.ok) throw new Error(`Groq error: ${res.status}`)
  const data = await res.json()
  return data.choices[0].message.content
}

async function streamGemini(opts: ChatOptions): Promise<ReadableStream> {
  // Convert OpenAI-style messages to Gemini format
  const contents = opts.messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))
  const systemInstruction = opts.messages.find((m) => m.role === 'system')?.content

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${opts.model}:streamGenerateContent?alt=sse&key=${process.env.GEMINI_API_KEY}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      ...(systemInstruction && { systemInstruction: { parts: [{ text: systemInstruction }] } }),
      generationConfig: {
        temperature: opts.temperature ?? 0.4,
        maxOutputTokens: opts.maxTokens ?? 1024,
      },
    }),
  })
  if (!res.ok || !res.body) throw new Error(`Gemini error: ${res.status}`)
  return res.body
}

export const aiGateway = new Gateway()
