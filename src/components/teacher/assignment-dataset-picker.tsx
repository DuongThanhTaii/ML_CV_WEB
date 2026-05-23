'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { createBrowserSupabase } from '@/lib/supabase/client'
import { datasetService } from '@/services/dataset.service'
import { assignmentDatasetService, type DatasetRole } from '@/services/assignment-dataset.service'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Plus, X } from 'lucide-react'

interface AttachedDataset {
  role: DatasetRole
  datasets: {
    id: string
    name: string
    dataset_type: string
  } | null
}

interface OwnDataset {
  id: string
  name: string
  dataset_type: string
}

interface Props {
  assignmentId: string
  teacherId: string
  initialAttached: AttachedDataset[]
}

const ROLE_OPTIONS: { value: DatasetRole; label: string }[] = [
  { value: 'train', label: 'Train (cho học sinh dùng)' },
  { value: 'test', label: 'Test (chấm điểm)' },
  { value: 'validation', label: 'Validation' },
  { value: 'reference', label: 'Reference (chỉ tham khảo)' },
]

export function AssignmentDatasetPicker({ assignmentId, teacherId, initialAttached }: Props) {
  const [attached, setAttached] = useState(initialAttached)
  const [own, setOwn] = useState<OwnDataset[]>([])
  const [pickedId, setPickedId] = useState('')
  const [pickedRole, setPickedRole] = useState<DatasetRole>('train')
  const [busy, setBusy] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const supabase = createBrowserSupabase()
    datasetService.listMine(supabase, teacherId).then(({ data }) => {
      setOwn(
        (data ?? []).map((d) => ({
          id: d.id,
          name: d.name,
          dataset_type: d.dataset_type,
        })),
      )
    })
  }, [teacherId])

  async function handleAttach() {
    if (!pickedId) return
    if (
      attached.some(
        (a) => a.datasets?.id === pickedId && a.role === pickedRole,
      )
    ) {
      toast({ title: 'Dataset+role đã được gắn', variant: 'destructive' })
      return
    }
    setBusy(true)
    const supabase = createBrowserSupabase()
    const { error } = await assignmentDatasetService.attach(
      supabase,
      assignmentId,
      pickedId,
      pickedRole,
    )
    setBusy(false)
    if (error) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' })
      return
    }
    const d = own.find((o) => o.id === pickedId)!
    setAttached((prev) => [...prev, { role: pickedRole, datasets: d }])
    setPickedId('')
    router.refresh()
  }

  async function handleDetach(datasetId: string, role: DatasetRole) {
    const supabase = createBrowserSupabase()
    await assignmentDatasetService.detach(supabase, assignmentId, datasetId, role)
    setAttached((prev) => prev.filter((a) => !(a.datasets?.id === datasetId && a.role === role)))
    router.refresh()
  }

  return (
    <div className="space-y-3 rounded-md border p-4">
      <div>
        <Label className="text-sm font-semibold">Datasets gắn vào bài tập</Label>
        <p className="text-xs text-muted-foreground">
          Học sinh có thể download/preview dataset role <strong>train</strong>.
          Role <strong>test</strong> dùng để chấm điểm — chỉ teacher thấy nội dung đầy đủ.
        </p>
      </div>

      {attached.length > 0 && (
        <ul className="space-y-1">
          {attached.map((a, i) =>
            a.datasets ? (
              <li
                key={`${a.datasets.id}-${a.role}-${i}`}
                className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-2">
                  <span className="rounded bg-background px-1.5 py-0.5 text-xs font-medium">
                    {a.role}
                  </span>
                  <span className="font-medium">{a.datasets.name}</span>
                  <span className="text-xs text-muted-foreground">({a.datasets.dataset_type})</span>
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDetach(a.datasets!.id, a.role)}
                >
                  <X className="size-4" />
                </Button>
              </li>
            ) : null,
          )}
        </ul>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <div className="flex-1 space-y-1.5">
          <Label className="text-xs">Chọn dataset</Label>
          <select
            value={pickedId}
            onChange={(e) => setPickedId(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">— Chọn —</option>
            {own.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.dataset_type})
              </option>
            ))}
          </select>
        </div>
        <div className="w-48 space-y-1.5">
          <Label className="text-xs">Role</Label>
          <select
            value={pickedRole}
            onChange={(e) => setPickedRole(e.target.value as DatasetRole)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <Button onClick={handleAttach} disabled={busy || !pickedId}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Gắn
        </Button>
      </div>
    </div>
  )
}
