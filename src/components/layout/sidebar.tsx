'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BookOpen,
  Bot,
  Database,
  FlaskConical,
  LayoutDashboard,
  NotebookPen,
  Sparkles,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/dashboard', label: 'Trang chủ', icon: LayoutDashboard },
  { href: '/courses', label: 'Khóa học', icon: BookOpen },
  { href: '/notebook', label: 'Notebook', icon: NotebookPen },
  { href: '/playground', label: 'Playground', icon: FlaskConical },
  { href: '/ai-tutor', label: 'AI Tutor', icon: Bot },
  { href: '/datasets', label: 'Dữ liệu', icon: Database },
  { href: '/profile', label: 'Hồ sơ', icon: User },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="hidden w-60 shrink-0 border-r border-border/60 bg-card/40 md:flex md:flex-col">
      <div className="flex h-14 items-center gap-2.5 border-b border-border/60 px-5">
        <div className="relative flex size-7 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-soft">
          <Sparkles className="size-3.5" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight">ml-cv-learn</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Học ML trong browser
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 p-3">
        <div className="px-2 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
          Workspace
        </div>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'group relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-all',
                active
                  ? 'bg-accent text-foreground shadow-soft'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
              )}
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary"
                />
              )}
              <Icon
                className={cn(
                  'size-4 transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                )}
              />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border/60 p-3">
        <div className="rounded-md border border-border/60 bg-background/40 p-3 text-xs">
          <div className="font-medium text-foreground">Python in browser</div>
          <p className="mt-1 leading-relaxed text-muted-foreground">
            Pyodide chạy local — không cần backend.
          </p>
        </div>
      </div>
    </aside>
  )
}
