import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { Brain, Code2, GraduationCap, Sparkles } from 'lucide-react'

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <header className="container flex items-center justify-between py-6">
        <div className="flex items-center gap-2 font-semibold">
          <Brain className="size-6 text-primary" />
          <span>ml-cv-learn</span>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/courses" className="text-muted-foreground hover:text-foreground">
            Courses
          </Link>
          <Link href="/playground" className="text-muted-foreground hover:text-foreground">
            Playground
          </Link>
          <ThemeToggle />
          <Button asChild size="sm">
            <Link href="/login">Đăng nhập</Link>
          </Button>
        </nav>
      </header>

      <section className="container py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-sm">
            <Sparkles className="size-3.5 text-primary" />
            <span>AI tutor · Auto-grading · 0 cài đặt</span>
          </div>
          <h1 className="text-balance text-5xl font-bold tracking-tight md:text-6xl">
            Học <span className="text-primary">Machine Learning</span> trong trình duyệt.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
            Viết Python, chạy ngay, được AI giải thích và tự động chấm điểm — không cần cài Anaconda,
            không cần GPU. Phù hợp cho sinh viên Việt Nam mới bắt đầu.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/playground">Thử ngay</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/courses">Xem khóa học</Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-20 grid max-w-5xl gap-6 md:grid-cols-3">
          <Feature
            icon={<Code2 className="size-5" />}
            title="Python ngay trong tab"
            desc="Pyodide chạy numpy, pandas, sklearn, scikit-image trực tiếp trong trình duyệt. Không backend, không chờ."
          />
          <Feature
            icon={<Sparkles className="size-5" />}
            title="AI tutor 24/7"
            desc="Hỏi bất cứ lúc nào: tại sao MSE cao? sao overfit? AI giải thích theo ngữ cảnh code của bạn."
          />
          <Feature
            icon={<GraduationCap className="size-5" />}
            title="Auto-grade + Feedback"
            desc="Nộp bài, nhận điểm và phân tích sau 30 giây. Giáo viên có dashboard chấm điểm hàng loạt."
          />
        </div>
      </section>

      <footer className="container py-12 text-center text-sm text-muted-foreground">
        Made with care for VN students · 0$ infrastructure · Open source soon.
      </footer>
    </main>
  )
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="mb-3 inline-flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
    </div>
  )
}
