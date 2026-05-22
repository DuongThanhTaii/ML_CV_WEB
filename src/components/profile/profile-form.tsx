'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createBrowserSupabase } from '@/lib/supabase/client'
import { profileService } from '@/services/profile.service'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

interface Props {
  initialProfile: any
}

export function ProfileForm({ initialProfile }: Props) {
  const [fullName, setFullName] = useState(initialProfile?.full_name ?? '')
  const [bio, setBio] = useState(initialProfile?.bio ?? '')
  const [avatarUrl, setAvatarUrl] = useState(initialProfile?.avatar_url ?? '')
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const supabase = createBrowserSupabase()
    try {
      const url = await profileService.uploadAvatar(supabase, initialProfile.id, file)
      setAvatarUrl(url)
      toast({ title: 'Cập nhật avatar', variant: 'success' })
    } catch (err: any) {
      toast({ title: 'Lỗi upload', description: err.message, variant: 'destructive' })
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createBrowserSupabase()
    const { error } = await profileService.update(supabase, initialProfile.id, {
      full_name: fullName,
      bio,
    })
    setSaving(false)
    if (error) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Đã lưu', variant: 'success' })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-4">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="size-16 rounded-full object-cover" />
        ) : (
          <div className="flex size-16 items-center justify-center rounded-full bg-muted text-xl font-semibold">
            {(fullName || initialProfile.email)?.[0]?.toUpperCase()}
          </div>
        )}
        <label className="cursor-pointer text-sm text-primary hover:underline">
          Đổi ảnh đại diện
          <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </label>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={initialProfile.email} disabled />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="full_name">Họ và tên</Label>
        <Input
          id="full_name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Nguyễn Văn A"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bio">Giới thiệu</Label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Sinh viên năm 3, đam mê ML/CV…"
          rows={4}
        />
      </div>

      <Button type="submit" disabled={saving}>
        {saving && <Loader2 className="size-4 animate-spin" />}
        Lưu thay đổi
      </Button>
    </form>
  )
}
