'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Brain, BookOpen, FlaskConical, Bot, Database, Layout, NotebookPen, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/dashboard', label: 'Trang chủ', icon: Layout },
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
    <aside className="hidden w-56 shrink-0 border-r bg-card md:flex md:flex-col">
      <div className="flex h-14 items-center gap-2 border-b px-4 font-semibold">
        <Brain className="size-5 text-primary" />
        <span>ml-cv-learn</span>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
