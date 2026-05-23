/**
 * Server-side PDF text extraction using pdfjs-dist legacy build.
 * No canvas dep needed — text content only.
 */

// pdfjs-dist legacy build works in Node (no DOM required for text extraction)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PdfTextItem = { str?: string }

export interface ExtractedPdf {
  text: string
  pageCount: number
  charCount: number
  truncated: boolean
}

/**
 * Extract text from a PDF buffer. Caps result at maxChars to keep LLM prompts cheap.
 */
export async function extractPdfText(
  buffer: ArrayBuffer | Uint8Array,
  options: { maxChars?: number; maxPages?: number } = {},
): Promise<ExtractedPdf> {
  const { maxChars = 60_000, maxPages = 100 } = options

  // Lazy import — pdfjs legacy build is large
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')

  const data = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer
  const loadingTask = pdfjs.getDocument({
    data,
    disableFontFace: true,
    useSystemFonts: false,
  })

  const pdf = await loadingTask.promise
  const totalPages = Math.min(pdf.numPages, maxPages)

  const parts: string[] = []
  let totalChars = 0
  let truncated = pdf.numPages > maxPages

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((it) => (it as PdfTextItem).str ?? '')
      .filter(Boolean)
      .join(' ')
    parts.push(`--- Page ${i} ---\n${pageText}`)
    totalChars += pageText.length
    if (totalChars >= maxChars) {
      truncated = true
      break
    }
  }

  const text = parts.join('\n\n').slice(0, maxChars)
  return {
    text,
    pageCount: pdf.numPages,
    charCount: text.length,
    truncated,
  }
}
