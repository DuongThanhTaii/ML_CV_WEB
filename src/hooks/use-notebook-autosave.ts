'use client'

import { useEffect, useRef, useState } from 'react'
import { createBrowserSupabase } from '@/lib/supabase/client'
import { notebookService } from '@/services/notebook.service'
import type { NotebookCell } from '@/types/notebook'

export type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error'

export function useNotebookAutosave(notebookId: string | null, cells: NotebookCell[], opts: { debounceMs?: number } = {}) {
  const [status, setStatus] = useState<SaveStatus>('idle')
  const lastSavedRef = useRef<string>('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const debounceMs = opts.debounceMs ?? 1500

  useEffect(() => {
    if (!notebookId) return
    const serialized = JSON.stringify(cells)
    if (serialized === lastSavedRef.current) return
    if (lastSavedRef.current === '' && cells.length === 0) {
      lastSavedRef.current = serialized
      return
    }
    setStatus('dirty')

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setStatus('saving')
      try {
        const supabase = createBrowserSupabase()
        const { error } = await notebookService.save(supabase, notebookId, cells)
        if (error) throw error
        lastSavedRef.current = serialized
        setStatus('saved')
      } catch (e) {
        console.error('autosave failed', e)
        setStatus('error')
      }
    }, debounceMs)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [cells, notebookId, debounceMs])

  return status
}
