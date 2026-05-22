'use client'

import { Button } from '@/components/ui/button'
import { createBrowserSupabase } from '@/lib/supabase/client'
import { datasetService } from '@/services/dataset.service'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

export function DatasetActions({ datasetId, storagePath }: { datasetId: string; storagePath: string }) {
  const { toast } = useToast()
  const router = useRouter()

  async function handleDelete() {
    if (!confirm('Xóa dataset này? Không thể khôi phục.')) return
    const supabase = createBrowserSupabase()
    const { error } = await datasetService.remove(supabase, datasetId, storagePath)
    if (error) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: 'Đã xóa' })
    router.push('/datasets')
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleDelete}>
      <Trash2 className="size-4" /> Xóa
    </Button>
  )
}
