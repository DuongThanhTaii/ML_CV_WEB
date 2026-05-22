'use client'

import { useEffect, useState } from 'react'
import { createBrowserSupabase } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type Submission = Database['public']['Tables']['submissions']['Row']
type GradingResult = Database['public']['Tables']['grading_results']['Row']

interface State {
  status: Submission['status'] | 'idle'
  result: GradingResult | null
  loading: boolean
}

export function useRealtimeSubmission(submissionId: string | null) {
  const [state, setState] = useState<State>({ status: 'idle', result: null, loading: !!submissionId })

  useEffect(() => {
    if (!submissionId) return
    const supabase = createBrowserSupabase()

    // Initial fetch
    ;(async () => {
      const { data: sub } = await supabase
        .from('submissions')
        .select('status')
        .eq('id', submissionId)
        .single()
      const { data: result } = await supabase
        .from('grading_results')
        .select('*')
        .eq('submission_id', submissionId)
        .maybeSingle()
      setState({ status: sub?.status ?? 'pending', result, loading: false })
    })()

    // Subscribe to status changes
    const subChannel = supabase
      .channel(`sub:${submissionId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'submissions', filter: `id=eq.${submissionId}` },
        (payload) => {
          setState((s) => ({ ...s, status: (payload.new as Submission).status }))
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'grading_results',
          filter: `submission_id=eq.${submissionId}`,
        },
        (payload) => {
          setState((s) => ({ ...s, result: payload.new as GradingResult, loading: false }))
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subChannel)
    }
  }, [submissionId])

  return state
}
