import { createServerSupabase } from '@/lib/supabase/server'
import { createServiceSupabase } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import { UsersTable, type AdminUser } from '@/components/admin/users-table'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/teacher/admin/users')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single<{ role: string }>()

  if (profile?.role !== 'admin') redirect('/teacher')

  const service = createServiceSupabase()
  const { data, error } = await service.auth.admin.listUsers({ page: 1, perPage: 200 })

  const ids = data?.users.map((u) => u.id) ?? []
  const { data: profiles } = await service
    .from('profiles')
    .select('id, role, full_name')
    .in('id', ids)
  const profileMap = new Map((profiles ?? []).map((p: { id: string }) => [p.id, p]))

  const users: AdminUser[] =
    data?.users.map((u) => ({
      id: u.id,
      email: u.email ?? '',
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
      email_confirmed_at: u.email_confirmed_at ?? null,
      provider: (u.app_metadata?.provider as string) ?? 'email',
      profile: (profileMap.get(u.id) ?? null) as AdminUser['profile'],
    })) ?? []

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Quản lý người dùng</h1>
        <p className="text-sm text-muted-foreground">
          {users.length} người dùng · admin-only view
        </p>
      </header>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error.message}
        </div>
      )}

      <UsersTable initialUsers={users} currentUserId={user.id} />
    </div>
  )
}
