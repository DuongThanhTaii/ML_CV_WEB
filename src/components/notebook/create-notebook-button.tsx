'use client'

import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2, Plus } from 'lucide-react'
import { createBrowserSupabase } from '@/lib/supabase/client'
import { notebookService } from '@/services/notebook.service'
import { useToast } from '@/hooks/use-toast'

export function CreateNotebookButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  async function handleCreate() {
    setLoading(true)
    const supabase = createBrowserSupabase()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await notebookService.create(supabase, {
      owner_id: user.id,
      title: 'Untitled notebook',
      cells_json: [
        { id: crypto.randomUUID(), type: 'code', source: '', outputs: [] },
      ],
    })
    setLoading(false)
    if (error || !data) {
      toast({ title: 'Lỗi', description: error?.message, variant: 'destructive' })
      return
    }
    router.push(`/notebook/${data.id}`)
  }

  return (
    <Button onClick={handleCreate} disabled={loading}>
      {loading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
      Tạo notebook
    </Button>
  )
}
