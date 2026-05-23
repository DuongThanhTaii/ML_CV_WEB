'use client'

import { createBrowserSupabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function Topbar({ email }: { email: string }) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createBrowserSupabase()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="flex h-14 items-center justify-end gap-2 border-b bg-card px-6">
      <span className="mr-2 text-sm text-muted-foreground">{email}</span>
      <ThemeToggle />
      <Button variant="ghost" size="icon" onClick={handleLogout} title="Đăng xuất">
        <LogOut className="size-4" />
      </Button>
    </header>
  )
}
