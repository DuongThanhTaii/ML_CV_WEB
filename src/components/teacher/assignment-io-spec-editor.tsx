'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createBrowserSupabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Plus, Trash2 } from 'lucide-react'

export interface IoField {
  name: string
  type: string
  shape: string
  dtype?: string
}

export interface IoSpec {
  function_name: string
  inputs: IoField[]
  outputs: IoField[]
  algorithm_hint?: string
  algorithm_required?: boolean
}

const EMPTY_SPEC: IoSpec = {
  function_name: 'predict',
  inputs: [{ name: 'X', type: 'DataFrame', shape: '(n, m)' }],
  outputs: [{ name: 'y_pred', type: 'ndarray', shape: '(n,)', dtype: 'int' }],
  algorithm_hint: '',
  algorithm_required: false,
}

interface Props {
  assignmentId: string
  initial: IoSpec | null
}

export function AssignmentIoSpecEditor({ assignmentId, initial }: Props) {
  const [spec, setSpec] = useState<IoSpec>(initial ?? EMPTY_SPEC)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  async function handleSave() {
    setSaving(true)
    const supabase = createBrowserSupabase()
    const { error } = await supabase
      .from('assignments')
      .update({ io_spec: spec })
      .eq('id', assignmentId)
    setSaving(false)
    if (error) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Đã lưu I/O spec', variant: 'success' })
    }
  }

  function updateField(kind: 'inputs' | 'outputs', i: number, patch: Partial<IoField>) {
    setSpec((s) => ({
      ...s,
      [kind]: s[kind].map((f, j) => (j === i ? { ...f, ...patch } : f)),
    }))
  }

  function addField(kind: 'inputs' | 'outputs') {
    setSpec((s) => ({
      ...s,
      [kind]: [...s[kind], { name: '', type: 'ndarray', shape: '' }],
    }))
  }

  function removeField(kind: 'inputs' | 'outputs', i: number) {
    setSpec((s) => ({ ...s, [kind]: s[kind].filter((_, j) => j !== i) }))
  }

  return (
    <div className="space-y-4 rounded-md border p-4">
      <div>
        <Label className="text-sm font-semibold">I/O Specification</Label>
        <p className="text-xs text-muted-foreground">
          Định nghĩa rõ hàm học sinh phải viết, đầu vào/ra để hệ thống chấm tự động khớp shape.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>Tên hàm</Label>
        <Input
          value={spec.function_name}
          onChange={(e) => setSpec((s) => ({ ...s, function_name: e.target.value }))}
          placeholder="predict"
          className="font-mono"
        />
      </div>

      <FieldGroup
        title="Inputs"
        fields={spec.inputs}
        onUpdate={(i, patch) => updateField('inputs', i, patch)}
        onAdd={() => addField('inputs')}
        onRemove={(i) => removeField('inputs', i)}
      />

      <FieldGroup
        title="Outputs"
        fields={spec.outputs}
        onUpdate={(i, patch) => updateField('outputs', i, patch)}
        onAdd={() => addField('outputs')}
        onRemove={(i) => removeField('outputs', i)}
      />

      <div className="space-y-1.5">
        <Label>Gợi ý thuật toán (tùy chọn)</Label>
        <Textarea
          value={spec.algorithm_hint ?? ''}
          onChange={(e) => setSpec((s) => ({ ...s, algorithm_hint: e.target.value }))}
          rows={2}
          placeholder="VD: dùng sklearn.ensemble.RandomForestClassifier với n_estimators=100"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={spec.algorithm_required ?? false}
          onChange={(e) =>
            setSpec((s) => ({ ...s, algorithm_required: e.target.checked }))
          }
          className="size-4"
        />
        <span>Yêu cầu dùng đúng thuật toán (chỉ là gợi ý hiển thị; không enforce kỹ thuật)</span>
      </label>

      <Button onClick={handleSave} disabled={saving}>
        {saving && <Loader2 className="size-4 animate-spin" />}
        Lưu I/O spec
      </Button>
    </div>
  )
}

function FieldGroup({
  title,
  fields,
  onUpdate,
  onAdd,
  onRemove,
}: {
  title: string
  fields: IoField[]
  onUpdate: (i: number, patch: Partial<IoField>) => void
  onAdd: () => void
  onRemove: (i: number) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold uppercase">{title}</Label>
        <Button variant="outline" size="sm" onClick={onAdd}>
          <Plus className="size-3" /> Thêm
        </Button>
      </div>
      {fields.length === 0 && (
        <p className="text-xs text-muted-foreground">Chưa có field nào.</p>
      )}
      <div className="space-y-2">
        {fields.map((f, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_1fr_80px_auto] gap-1.5 items-center">
            <Input
              value={f.name}
              onChange={(e) => onUpdate(i, { name: e.target.value })}
              placeholder="name"
              className="font-mono text-sm"
            />
            <Input
              value={f.type}
              onChange={(e) => onUpdate(i, { type: e.target.value })}
              placeholder="DataFrame | ndarray | Image | …"
              className="font-mono text-sm"
            />
            <Input
              value={f.shape}
              onChange={(e) => onUpdate(i, { shape: e.target.value })}
              placeholder="(n, 4)"
              className="font-mono text-sm"
            />
            <Input
              value={f.dtype ?? ''}
              onChange={(e) => onUpdate(i, { dtype: e.target.value })}
              placeholder="dtype"
              className="font-mono text-sm"
            />
            <Button variant="ghost" size="icon" onClick={() => onRemove(i)}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
