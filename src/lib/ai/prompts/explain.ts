export const EXPLAIN_PROMPT_VERSION = '1.0.0'

export function explainCodePrompt(code: string, level: 'beginner' | 'intermediate' = 'beginner') {
  return `Explain this Python ML code to a ${level} Vietnamese student.

\`\`\`python
${code.slice(0, 2000)}
\`\`\`

Format (in Vietnamese):

## Tóm tắt một câu
<one sentence>

## Phân tích từng dòng
Only explain non-trivial lines. Use bullet list.

## Khái niệm chính
Name and 2-sentence explanation.

## Điểm dễ mắc lỗi
One common pitfall with this pattern.

Use $inline$ LaTeX for math. Total length < 300 words.`
}
