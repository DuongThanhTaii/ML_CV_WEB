import { ThemeToggle } from '@/components/theme-toggle'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <div className="fixed bottom-4 right-4 z-10">
        <ThemeToggle />
      </div>
    </>
  )
}
