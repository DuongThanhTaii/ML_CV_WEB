'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { CheckCircle2, Copy, Mail, RefreshCw, Trash2, UserCheck, Loader2 } from 'lucide-react'

export interface AdminUser {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  email_confirmed_at: string | null
  provider: string
  profile: { id: string; role: string; full_name: string | null } | null
}

interface Props {
  initialUsers: AdminUser[]
  currentUserId: string
}

export function UsersTable({ initialUsers, currentUserId }: Props) {
  const [users, setUsers] = useState(initialUsers)
  const [filter, setFilter] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [link, setLink] = useState<{ id: string; url: string } | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const filtered = users.filter((u) =>
    [u.email, u.profile?.full_name ?? ''].some((s) =>
      s.toLowerCase().includes(filter.toLowerCase()),
    ),
  )

  async function callAction(
    url: string,
    method: 'POST' | 'DELETE' | 'PATCH',
    userId: string,
    body?: Record<string, unknown>,
  ): Promise<{ ok: boolean; data?: { link?: string; error?: string } }> {
    setBusy(`${userId}:${method}`)
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Lỗi', description: data.error ?? 'Request failed', variant: 'destructive' })
        return { ok: false, data }
      }
      return { ok: true, data }
    } finally {
      setBusy(null)
    }
  }

  async function handleVerify(id: string) {
    const { ok } = await callAction(`/api/admin/users/${id}/verify`, 'POST', id)
    if (ok) {
      toast({ title: 'Đã verify email', variant: 'success' })
      setUsers((us) => us.map((u) => (u.id === id ? { ...u, email_confirmed_at: new Date().toISOString() } : u)))
    }
  }

  async function handleResend(id: string) {
    const { ok, data } = await callAction(`/api/admin/users/${id}/resend`, 'POST', id)
    if (ok && data?.link) {
      setLink({ id, url: data.link })
      toast({ title: 'Đã tạo lại link verification', variant: 'success' })
    }
  }

  async function handleRole(id: string, role: 'student' | 'teacher' | 'admin') {
    const { ok } = await callAction(`/api/admin/users/${id}`, 'PATCH', id, { role })
    if (ok) {
      toast({ title: `Đã đổi role thành ${role}`, variant: 'success' })
      setUsers((us) =>
        us.map((u) => (u.id === id && u.profile ? { ...u, profile: { ...u.profile, role } } : u)),
      )
    }
  }

  async function handleDelete(id: string, email: string) {
    if (!confirm(`Xóa user ${email}? Không thể khôi phục.`)) return
    const { ok } = await callAction(`/api/admin/users/${id}`, 'DELETE', id)
    if (ok) {
      toast({ title: 'Đã xóa user' })
      setUsers((us) => us.filter((u) => u.id !== id))
      router.refresh()
    }
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Tìm theo email hoặc tên..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="max-w-sm"
      />

      {link && (
        <div className="space-y-2 rounded-md border bg-muted/30 p-3 text-sm">
          <div className="font-medium">Verification link cho {users.find((u) => u.id === link.id)?.email}:</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded bg-background px-2 py-1 text-xs">{link.url}</code>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(link.url)
                toast({ title: 'Đã copy', variant: 'success' })
              }}
            >
              <Copy className="size-3.5" /> Copy
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setLink(null)}>
              ✕
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Gửi link này cho user qua kênh khác nếu email không tới. Link hết hạn sau 24h.
          </p>
        </div>
      )}

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30 text-left">
            <tr>
              <th className="p-3">User</th>
              <th className="p-3">Status</th>
              <th className="p-3">Role</th>
              <th className="p-3">Provider</th>
              <th className="p-3">Tạo lúc</th>
              <th className="p-3">Login gần nhất</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => {
              const isSelf = u.id === currentUserId
              const verified = !!u.email_confirmed_at
              const busyKey = busy?.startsWith(`${u.id}:`) ? busy : null
              return (
                <tr key={u.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="p-3">
                    <div className="font-medium">{u.profile?.full_name || u.email}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </td>
                  <td className="p-3">
                    {verified ? (
                      <Badge variant="success">Verified</Badge>
                    ) : (
                      <Badge variant="warning">Chờ verify</Badge>
                    )}
                  </td>
                  <td className="p-3">
                    <select
                      value={u.profile?.role ?? 'student'}
                      onChange={(e) =>
                        handleRole(u.id, e.target.value as 'student' | 'teacher' | 'admin')
                      }
                      disabled={isSelf || !!busyKey}
                      className="rounded border bg-background px-2 py-1 text-xs disabled:opacity-50"
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{u.provider}</td>
                  <td className="p-3 text-xs text-muted-foreground">{formatDate(u.created_at)}</td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {u.last_sign_in_at ? formatDate(u.last_sign_in_at) : '—'}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      {!verified && (
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Force verify (bỏ qua email)"
                          disabled={!!busyKey}
                          onClick={() => handleVerify(u.id)}
                        >
                          {busyKey === `${u.id}:POST` ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <UserCheck className="size-3.5" />
                          )}
                        </Button>
                      )}
                      {!verified && (
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Generate verify link (copy thủ công)"
                          disabled={!!busyKey}
                          onClick={() => handleResend(u.id)}
                        >
                          <Mail className="size-3.5" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Xóa user"
                        disabled={isSelf || !!busyKey}
                        onClick={() => handleDelete(u.id, u.email)}
                      >
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  Không có user nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Button variant="outline" size="sm" onClick={() => router.refresh()}>
        <RefreshCw className="size-3.5" /> Refresh
      </Button>

      <div className="rounded-md border border-amber-500/30 bg-amber-50/30 p-3 text-xs text-muted-foreground dark:bg-amber-950/20">
        <CheckCircle2 className="mr-1 inline size-3.5 text-amber-600" />
        <strong>Force verify</strong> = bỏ qua bước email, đặt <code>email_confirmed_at</code> = now.
        Dùng khi SMTP fail. <strong>Generate verify link</strong> = tạo link mới, admin tự gửi cho user.
      </div>
    </div>
  )
}
