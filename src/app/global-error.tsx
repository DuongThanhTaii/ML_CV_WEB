'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="vi">
      <body>
        <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
          <h1>Lỗi hệ thống</h1>
          <p>{error.message}</p>
          <button onClick={reset}>Thử lại</button>
        </div>
      </body>
    </html>
  )
}
