import Link from 'next/link'
import { Sparkles } from 'lucide-react'

interface Props {
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export function AuthShell({ title, subtitle, children, footer }: Props) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-grid-fade" aria-hidden />
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border/60 bg-card/60 p-8 shadow-elevated backdrop-blur-xl">
          <Link href="/" className="mb-7 inline-flex items-center gap-2.5">
            <span className="relative flex size-7 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-soft">
              <Sparkles className="size-3.5" />
            </span>
            <span className="font-semibold tracking-tight">ml-cv-learn</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          )}
          <div className="mt-7">{children}</div>
        </div>
        {footer && (
          <p className="mt-5 text-center text-xs text-muted-foreground">{footer}</p>
        )}
      </div>
    </main>
  )
}
