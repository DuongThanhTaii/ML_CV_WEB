'use client'

import { create } from 'zustand'

export interface ToastItem {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'success' | 'destructive'
  duration?: number
}

interface State {
  toasts: ToastItem[]
}
interface Actions {
  toast: (item: Omit<ToastItem, 'id'>) => string
  dismiss: (id: string) => void
}

export const useToastStore = create<State & Actions>((set) => ({
  toasts: [],
  toast: (item) => {
    const id = crypto.randomUUID()
    set((s) => ({ toasts: [...s.toasts, { id, duration: 4000, ...item }] }))
    return id
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

// IMPORTANT: pick each action with its own selector to keep the returned
// references stable. Returning `{...}` inline from a single selector creates
// a new object every render and can trigger infinite loops if consumers put
// `toast` in a useEffect dependency list.
export function useToast() {
  const toast = useToastStore((s) => s.toast)
  const dismiss = useToastStore((s) => s.dismiss)
  return { toast, dismiss }
}
