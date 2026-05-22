'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { GraduationCap, BookOpen, BarChart3, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/teacher', label: 'Tổng quan', icon: BarChart3 },
  { href: '/teacher/courses', label: 'Khóa học', icon: BookOpen },
  { href: '/teacher/analytics', label: 'Analytics', icon: BarChart3 },
]

export function TeacherSidebar() {
  const pathname = usePathname()
  return (
    <aside className="hidden w-56 shrink-0 border-r bg-card md:flex md:flex-col">
      <div className="flex h-14 items-center gap-2 border-b px-4 font-semibold">
        <GraduationCap className="size-5 text-primary" />
        <span>Teacher</span>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/teacher' && pathname.startsWith(href))
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
      <div className="border-t p-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
        >
          <ArrowLeft className="size-4" /> Về Student
        </Link>
      </div>
    </aside>
  )
}
