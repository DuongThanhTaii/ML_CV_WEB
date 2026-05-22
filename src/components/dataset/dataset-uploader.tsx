'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Upload } from 'lucide-react'
import { createBrowserSupabase } from '@/lib/supabase/client'
import { datasetService } from '@/services/dataset.service'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

export function DatasetUploader() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const router = useRouter()

  function inferType(filename: string): 'csv' | 'image_folder' | 'json' | 'parquet' {
    const ext = filename.split('.').pop()?.toLowerCase()
    if (ext === 'csv') return 'csv'
    if (ext === 'json') return 'json'
    if (ext === 'parquet') return 'parquet'
    return 'image_folder'
  }

  async function handleUpload() {
    if (!file || !name) {
      toast({ title: 'Thiếu tên hoặc file', variant: 'destructive' })
      return
    }
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: 'File quá lớn (>50MB)', variant: 'destructive' })
      return
    }

    setLoading(true)
    const supabase = createBrowserSupabase()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }
    try {
      await datasetService.upload(supabase, user.id, file, {
        name,
        description,
        datasetType: inferType(file.name),
      })
      toast({ title: 'Upload thành công', variant: 'success' })
      setOpen(false)
      setName('')
      setDescription('')
      setFile(null)
      router.refresh()
    } catch (err: any) {
      toast({ title: 'Lỗi upload', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="size-4" /> Upload dataset
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload dataset</DialogTitle>
          <DialogDescription>CSV, JSON, parquet hoặc folder ảnh nén zip. Tối đa 50MB.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="name">Tên dataset</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Titanic data" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="desc">Mô tả</Label>
            <Input
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tabular data về hành khách Titanic"
            />
          </div>
          <div className="space-y-1.5">
            <Label>File</Label>
            <Input ref={fileRef} type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Hủy
          </Button>
          <Button onClick={handleUpload} disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
