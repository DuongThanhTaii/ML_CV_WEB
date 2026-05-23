/**
 * Analyze extracted PDF text with Gemini and return structured lesson suggestions:
 * MDX summary + quiz draft + coding assignment draft.
 *
 * Uses `responseSchema` to force valid JSON output (no parsing hacks).
 */

export interface QuizSuggestion {
  question: string
  options: string[]            // exactly 4 for MCQ
  correct_answer: string       // must be one of options
  explanation: string
}

export interface AssignmentSuggestion {
  description: string          // markdown — what the student should implement
  starter_code: string         // python starter (often a function stub)
  hidden_tests: string         // pytest-style: def test_xxx(): assert ...
}

export interface AnalyzeResult {
  mdx_summary: string          // short MDX content for lesson body (headings + bullets + key formulas)
  quiz: QuizSuggestion[]       // 5 MCQs
  assignment: AssignmentSuggestion
}

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    mdx_summary: { type: 'STRING' },
    quiz: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          question: { type: 'STRING' },
          options: { type: 'ARRAY', items: { type: 'STRING' }, minItems: 4, maxItems: 4 },
          correct_answer: { type: 'STRING' },
          explanation: { type: 'STRING' },
        },
        required: ['question', 'options', 'correct_answer', 'explanation'],
      },
      minItems: 3,
      maxItems: 8,
    },
    assignment: {
      type: 'OBJECT',
      properties: {
        description: { type: 'STRING' },
        starter_code: { type: 'STRING' },
        hidden_tests: { type: 'STRING' },
      },
      required: ['description', 'starter_code', 'hidden_tests'],
    },
  },
  required: ['mdx_summary', 'quiz', 'assignment'],
}

const SYSTEM_PROMPT = `Bạn là trợ lý soạn giáo trình cho khóa học Machine Learning / Computer Vision dạy bằng tiếng Việt cho sinh viên đại học Việt Nam.

Đầu vào: text trích từ 1 slide PDF bài giảng (có thể có nhiễu, mất layout).
Đầu ra: JSON đúng schema, gồm 3 phần:

1. mdx_summary — Markdown ngắn gọn (300-600 từ) gồm:
   - Heading lớn cho chủ đề
   - 2-4 mục con với heading nhỏ
   - Công thức quan trọng (LaTeX-in-markdown: $...$ hoặc $$...$$)
   - 1-2 code example Python ngắn (dùng code fence \`\`\`python)
   - Bullet list các điểm cần nhớ
   Văn phong tự nhiên, dễ hiểu, KHÔNG copy nguyên si từ PDF.

2. quiz — 5 câu MCQ (multiple-choice) kiểm tra concept của bài:
   - Mỗi câu có ĐÚNG 4 lựa chọn
   - correct_answer phải khớp chính xác (case-sensitive) 1 trong 4 options
   - explanation ngắn (1-2 câu) tại sao đáp án đúng
   - Mức độ: 2 câu dễ (nhận biết), 2 câu trung (hiểu), 1 câu vận dụng

3. assignment — 1 bài coding Python:
   - description: markdown ngắn mô tả yêu cầu (1 hàm cần viết, input/output)
   - starter_code: function stub đầy đủ docstring, có TODO comment, sẵn sàng paste vào notebook
   - hidden_tests: 3-5 test cases dạng pytest (def test_xxx(): assert ...). Phải import được hàm từ starter_code (cùng tên hàm). Tests CHẠY ĐƯỢC ngay khi paste vào pytest.

Quy ước:
- Tên hàm trong starter_code và hidden_tests PHẢI khớp.
- Hidden tests chỉ assert kết quả, không in stdout.
- Tránh dùng thư viện ngoài stdlib + numpy/pandas/scikit-learn (đã có sẵn trong Pyodide).`

export async function analyzePdfWithGemini(
  pdfText: string,
  lessonTitleHint: string,
  apiKey: string,
): Promise<AnalyzeResult> {
  const userPrompt = `Tiêu đề bài: ${lessonTitleHint}\n\nNội dung PDF:\n\n${pdfText}`

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`

  const body = {
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
    },
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`Gemini API error ${res.status}: ${errText.slice(0, 300)}`)
  }

  const json = await res.json()
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini trả về rỗng — thử lại hoặc PDF quá ngắn')

  let parsed: AnalyzeResult
  try {
    parsed = JSON.parse(text) as AnalyzeResult
  } catch {
    throw new Error('Gemini trả về JSON không hợp lệ. Thử lại.')
  }

  // Light sanity check
  if (!parsed.mdx_summary || !Array.isArray(parsed.quiz) || !parsed.assignment) {
    throw new Error('Gemini thiếu trường bắt buộc')
  }
  // Drop any quiz where correct_answer is not in options
  parsed.quiz = parsed.quiz.filter((q) =>
    Array.isArray(q.options) && q.options.length === 4 && q.options.includes(q.correct_answer),
  )

  return parsed
}
