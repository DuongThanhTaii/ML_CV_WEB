import { createServerSupabase } from '@/lib/supabase/server'
import { createServiceSupabase } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { encryptTests } from '@/lib/grading/encryption'

const quizQuestionSchema = z.object({
  question: z.string().min(1).max(2000),
  options: z.array(z.string().min(1).max(500)).length(4),
  correct_answer: z.string().min(1).max(500),
  explanation: z.string().max(2000).optional().default(''),
})

const lessonSchema = z.object({
  title: z.string().min(1).max(200),
  /** Optional MDX body (else placeholder "Đọc PDF ...") */
  mdxContent: z.string().max(20_000).optional(),
  /** true if this lesson has a PDF the client will upload after this call returns */
  hasPdf: z.boolean(),
  /** Optional quiz questions (MCQ) */
  quizzes: z.array(quizQuestionSchema).max(20).optional(),
  /** Optional coding assignment definition */
  coding: z
    .object({
      hiddenTestsPlain: z.string().min(1).max(50_000),
      passThresholdPct: z.number().int().min(0).max(100).default(50),
      starterCode: z.string().max(20_000).optional(),
      visibleTests: z.string().max(20_000).optional(),
      description: z.string().max(5_000).optional(),
    })
    .nullable()
    .optional(),
})

const bodySchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/, 'Slug must be kebab-case'),
  description: z.string().max(2000).optional(),
  category: z.enum(['ml', 'cv', 'data', 'mixed']),
  difficulty: z.number().int().min(1).max(5),
  estimatedHours: z.number().int().min(1).max(500).optional(),
  moduleTitle: z.string().min(1).max(200).default('Bài giảng'),
  lessons: z.array(lessonSchema).min(1).max(50),
})

/**
 * POST /api/courses/builder
 *
 * Atomically creates: course → module → N lessons → (optional) gating assignments.
 * Returns the IDs so the client can finalize PDF uploads to lesson-pdfs bucket.
 */
export async function POST(req: Request) {
  const userClient = await createServerSupabase()
  const {
    data: { user },
  } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await userClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'teacher' && profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden — chỉ teacher mới tạo course' }, { status: 403 })
  }

  const parsed = bodySchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const body = parsed.data

  const svc = createServiceSupabase()

  // Pre-check slug uniqueness so we surface a friendly error
  const { data: existing } = await svc
    .from('courses')
    .select('id')
    .eq('slug', body.slug)
    .maybeSingle()
  if (existing) {
    return NextResponse.json(
      { error: `Slug "${body.slug}" đã được dùng. Đổi tên khác.` },
      { status: 409 },
    )
  }

  // Encryption key check before doing any writes
  const encKey = process.env.GRADING_ENCRYPTION_KEY
  const needEncryption = body.lessons.some((l) => l.coding)
  if (needEncryption && !encKey) {
    return NextResponse.json(
      { error: 'Server thiếu GRADING_ENCRYPTION_KEY — không thể mã hóa hidden tests.' },
      { status: 500 },
    )
  }

  // 1) Create the course
  const { data: course, error: courseErr } = await svc
    .from('courses')
    .insert({
      slug: body.slug,
      title: body.title,
      description: body.description ?? null,
      category: body.category,
      difficulty: body.difficulty,
      teacher_id: user.id,
      estimated_hours: body.estimatedHours ?? null,
      is_published: false,
    })
    .select('id, slug')
    .single()
  if (courseErr || !course) {
    return NextResponse.json({ error: courseErr?.message ?? 'Course insert failed' }, { status: 500 })
  }

  // 2) Create one module (default container)
  const { data: moduleRow, error: moduleErr } = await svc
    .from('modules')
    .insert({
      course_id: course.id,
      order_index: 1,
      title: body.moduleTitle,
    })
    .select('id')
    .single()
  if (moduleErr || !moduleRow) {
    return NextResponse.json({ error: moduleErr?.message ?? 'Module insert failed' }, { status: 500 })
  }

  // 3) Create lessons + assignments
  const createdLessons: Array<{
    index: number
    id: string
    title: string
    hasPdf: boolean
    assignmentId: string | null
  }> = []

  for (let i = 0; i < body.lessons.length; i++) {
    const l = body.lessons[i]!
    const defaultMdx =
      '# ' +
      l.title +
      '\n\nĐọc file PDF kèm theo, sau đó hoàn thành bài coding ở tab **Bài tập** để mở khóa bài tiếp theo.'
    const { data: lesson, error: lessonErr } = await svc
      .from('lessons')
      .insert({
        course_id: course.id,
        module_id: moduleRow.id,
        order_index: i,
        title: l.title,
        content_mdx: l.mdxContent?.trim() || defaultMdx,
        estimated_minutes: 20,
        pass_threshold: 70,
      })
      .select('id')
      .single()
    if (lessonErr || !lesson) {
      // Best-effort rollback: delete the course (cascade clears module/lessons)
      await svc.from('courses').delete().eq('id', course.id)
      return NextResponse.json(
        { error: `Lesson ${i + 1} insert failed: ${lessonErr?.message}` },
        { status: 500 },
      )
    }

    // Insert quiz questions if AI-generated or teacher-provided
    if (l.quizzes && l.quizzes.length > 0) {
      const quizRows = l.quizzes.map((q, idx) => ({
        lesson_id: lesson.id,
        question_type: 'mcq' as const,
        question: q.question,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation || null,
        order_index: idx,
        points: 1,
      }))
      const { error: quizErr } = await svc.from('quizzes').insert(quizRows)
      if (quizErr) {
        await svc.from('courses').delete().eq('id', course.id)
        return NextResponse.json(
          { error: `Quiz for lesson ${i + 1} failed: ${quizErr.message}` },
          { status: 500 },
        )
      }
    }

    let assignmentId: string | null = null
    if (l.coding) {
      const encrypted = await encryptTests(l.coding.hiddenTestsPlain, encKey!)
      const { data: a, error: aErr } = await svc
        .from('assignments')
        .insert({
          lesson_id: lesson.id,
          course_id: course.id,
          title: `${l.title} — Coding`,
          description_mdx:
            l.coding.description ??
            'Viết hàm theo yêu cầu. Code đạt ≥' +
              l.coding.passThresholdPct +
              '% sẽ mở khóa bài kế tiếp.',
          starter_code: l.coding.starterCode ?? '# Viết code của bạn ở đây\n',
          visible_tests: l.coding.visibleTests ?? null,
          hidden_tests_encrypted: encrypted,
          evaluation_type: 'unittest',
          max_score: 100,
          gates_progression: true,
          pass_threshold_pct: l.coding.passThresholdPct,
          is_published: true,
          requires_manual_review: false,
        })
        .select('id')
        .single()
      if (aErr || !a) {
        await svc.from('courses').delete().eq('id', course.id)
        return NextResponse.json(
          { error: `Assignment for lesson ${i + 1} failed: ${aErr?.message}` },
          { status: 500 },
        )
      }
      assignmentId = a.id
    }

    createdLessons.push({
      index: i,
      id: lesson.id,
      title: l.title,
      hasPdf: l.hasPdf,
      assignmentId,
    })
  }

  return NextResponse.json({
    courseId: course.id,
    courseSlug: course.slug,
    moduleId: moduleRow.id,
    lessons: createdLessons,
  })
}
