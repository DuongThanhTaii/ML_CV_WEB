import { createServerSupabase } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { extractPdfText } from '@/lib/pdf/extract-text'
import { analyzePdfWithGemini } from '@/lib/ai/pdf-analyzer'

// Allow longer execution (default 10s on Hobby; bump to 60s for AI calls)
export const maxDuration = 60
export const runtime = 'nodejs'

const MAX_PDF_BYTES = 4 * 1024 * 1024 // 4MB — Vercel Hobby body limit safety

/**
 * POST /api/ai/analyze-pdf
 * FormData: { file: <pdf>, title?: string }
 * Returns: { mdx_summary, quiz[], assignment, meta: { pageCount, charCount, truncated } }
 *
 * Server-side text extraction (no canvas) + Gemini structured JSON output.
 */
export async function POST(req: Request) {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'teacher' && profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Chỉ teacher mới dùng được AI builder' }, { status: 403 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Server thiếu GEMINI_API_KEY — vào Vercel → Settings → Env vars để thêm' },
      { status: 500 },
    )
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Body phải là multipart/form-data' }, { status: 400 })
  }

  const file = form.get('file')
  const title = (form.get('title') as string | null)?.trim() || 'Bài học'

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Thiếu file PDF' }, { status: 400 })
  }
  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'File phải là PDF' }, { status: 400 })
  }
  if (file.size > MAX_PDF_BYTES) {
    return NextResponse.json(
      {
        error: `PDF quá lớn (${(file.size / 1024 / 1024).toFixed(1)}MB). Giới hạn AI: ${MAX_PDF_BYTES / 1024 / 1024}MB. PDF lớn hơn vẫn upload được nhưng cần soạn nội dung tay.`,
      },
      { status: 413 },
    )
  }

  // Extract text
  let extracted
  try {
    const buf = await file.arrayBuffer()
    extracted = await extractPdfText(buf)
  } catch (e) {
    return NextResponse.json(
      { error: `Không trích được text từ PDF: ${e instanceof Error ? e.message : 'unknown'}` },
      { status: 500 },
    )
  }
  if (extracted.charCount < 100) {
    return NextResponse.json(
      { error: 'PDF có quá ít text (có thể là ảnh scan). AI không phân tích được.' },
      { status: 422 },
    )
  }

  // Call Gemini
  try {
    const result = await analyzePdfWithGemini(extracted.text, title, apiKey)
    return NextResponse.json({
      ...result,
      meta: {
        pageCount: extracted.pageCount,
        charCount: extracted.charCount,
        truncated: extracted.truncated,
      },
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'AI không trả về kết quả hợp lệ' },
      { status: 500 },
    )
  }
}
