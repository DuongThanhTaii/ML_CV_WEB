'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  variant?: 'icon' | 'segmented'
  className?: string
}

/**
 * Theme switcher. Two variants:
 *   - icon       Single button cycling light → dark → system → light…
 *   - segmented  Three-button picker (light | system | dark)
 */
export function ThemeToggle({ variant = 'icon', className }: Props) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  // Avoid SSR/CSR mismatch by rendering a placeholder until mounted
  if (!mounted) {
    return (
      <div className={cn(variant === 'icon' ? 'size-9' : 'h-9 w-[108px]', className)} aria-hidden />
    )
  }

  if (variant === 'segmented') {
    return (
      <div
        className={cn(
          'inline-flex items-center rounded-md border bg-card p-0.5',
          className,
        )}
      >
        {(['light', 'system', 'dark'] as const).map((mode) => {
          const Icon = mode === 'light' ? Sun : mode === 'dark' ? Moon : Monitor
          const active = theme === mode
          return (
            <button
              key={mode}
              type="button"
              onClick={() => setTheme(mode)}
              aria-pressed={active}
              aria-label={mode}
              className={cn(
                'flex size-7 items-center justify-center rounded transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="size-4" />
            </button>
          )
        })}
      </div>
    )
  }

  // icon variant: click cycles theme
  const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
  const labelByTheme = {
    light: 'Đang dùng chế độ sáng',
    dark: 'Đang dùng chế độ tối',
    system: 'Theo hệ thống',
  } as const
  const currentLabel = labelByTheme[(theme ?? 'system') as keyof typeof labelByTheme]

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      title={currentLabel}
      aria-label={currentLabel}
      className={cn(
        'inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
        className,
      )}
    >
      {theme === 'system' ? (
        <Monitor className="size-4" />
      ) : resolvedTheme === 'dark' ? (
        <Moon className="size-4" />
      ) : (
        <Sun className="size-4" />
      )}
    </button>
  )
}
