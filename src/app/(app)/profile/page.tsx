import { createServerSupabase } from '@/lib/supabase/server'
import { profileService } from '@/services/profile.service'
import { ProfileForm } from '@/components/profile/profile-form'
import { Badge } from '@/components/ui/badge'

export default async function ProfilePage() {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: profile } = await profileService.getById(supabase, user!.id)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Hồ sơ</h1>
        <p className="text-sm text-muted-foreground">Cập nhật thông tin cá nhân của bạn.</p>
      </header>

      <div className="rounded-lg border bg-card p-6">
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span>Vai trò:</span>
          <Badge variant="secondary">{profile?.role}</Badge>
        </div>
        <ProfileForm initialProfile={profile} />
      </div>
    </div>
  )
}
