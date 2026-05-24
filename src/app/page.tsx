import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  ArrowRight,
  Bot,
  Code2,
  GraduationCap,
  Github,
  Sparkles,
  Zap,
  ShieldCheck,
} from 'lucide-react'

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-grid-fade" aria-hidden />

      <header className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="relative flex size-7 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-soft">
            <Sparkles className="size-3.5" />
          </span>
          <span className="font-semibold tracking-tight">UE Learn</span>
        </Link>
        <nav className="flex items-center gap-1.5 text-sm">
          <Link
            href="/courses"
            className="hidden rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground sm:inline-flex"
          >
            Khóa học
          </Link>
          <Link
            href="/playground"
            className="hidden rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground sm:inline-flex"
          >
            Playground
          </Link>
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/login">Đăng nhập</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">
              Bắt đầu
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </nav>
      </header>

      <section className="container py-20 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-3 py-1 text-xs font-medium backdrop-blur">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
            </span>
            <span className="text-muted-foreground">AI tutor · Auto-grading · 0 cài đặt</span>
          </div>
          <h1 className="text-balance text-5xl font-bold tracking-tight md:text-7xl">
            Học{' '}
            <span className="bg-gradient-to-br from-primary via-primary to-primary/60 bg-clip-text text-transparent">
              Machine Learning
            </span>{' '}
            ngay trong trình duyệt.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
            Viết Python, chạy ngay, được AI giải thích và tự động chấm điểm — không cần cài
            Anaconda, không cần GPU. Phù hợp cho sinh viên Việt Nam mới bắt đầu.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="shadow-glow">
              <Link href="/playground">
                Thử playground
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/courses">Xem khóa học</Link>
            </Button>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-primary/80" /> Miễn phí cho sinh viên
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Zap className="size-3.5 text-primary/80" /> Pyodide chạy WebAssembly
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Github className="size-3.5 text-primary/80" /> Open source
            </span>
          </div>
        </div>

        <div className="mx-auto mt-24 grid max-w-5xl gap-4 md:grid-cols-3">
          <Feature
            icon={<Code2 className="size-5" />}
            title="Python ngay trong tab"
            desc="Pyodide chạy numpy, pandas, sklearn, scikit-image trực tiếp trong trình duyệt. Không backend, không chờ."
          />
          <Feature
            icon={<Bot className="size-5" />}
            title="AI tutor 24/7"
            desc="Hỏi bất cứ lúc nào: tại sao MSE cao? Sao overfit? AI giải thích theo ngữ cảnh code của bạn."
          />
          <Feature
            icon={<GraduationCap className="size-5" />}
            title="Auto-grade + Feedback"
            desc="Nộp bài, nhận điểm và phân tích sau 30 giây. Giáo viên có dashboard chấm điểm hàng loạt."
          />
        </div>
      </section>

      <footer className="container border-t border-border/60 py-10 text-center text-xs text-muted-foreground">
        Made with care for VN students · 0$ infrastructure · Open source soon.
      </footer>
    </main>
  )
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border/60 bg-card/40 p-6 backdrop-blur transition-all hover:border-primary/40 hover:shadow-elevated">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="mb-4 inline-flex size-10 items-center justify-center rounded-lg border border-border/60 bg-gradient-to-br from-primary/15 to-primary/0 text-primary">
        {icon}
      </div>
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  )
}
