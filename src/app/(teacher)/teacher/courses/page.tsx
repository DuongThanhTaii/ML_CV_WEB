import { createServerSupabase } from '@/lib/supabase/server'
import { courseService } from '@/services/course.service'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Wand2 } from 'lucide-react'

export default async function TeacherCoursesPage() {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: courses } = await courseService.listByTeacher(supabase, user!.id)

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Khóa học của tôi</h1>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/teacher/courses/builder">
              <Wand2 className="size-4" /> Tạo nhanh từ PDF
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/teacher/courses/new">
              <Plus className="size-4" /> Tạo thủ công
            </Link>
          </Button>
        </div>
      </header>

      {courses?.length ? (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30 text-left">
              <tr>
                <th className="p-3">Tên khóa học</th>
                <th className="p-3">Danh mục</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="p-3 font-medium">{c.title}</td>
                  <td className="p-3 uppercase">{c.category}</td>
                  <td className="p-3">
                    {c.is_published ? (
                      <Badge variant="success">Đã publish</Badge>
                    ) : (
                      <Badge variant="outline">Bản nháp</Badge>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/teacher/courses/${c.id}/edit`}>Chỉnh sửa</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">Bạn chưa tạo khóa học nào.</p>
          <div className="mt-4 flex justify-center gap-2">
            <Button asChild>
              <Link href="/teacher/courses/builder">
                <Wand2 className="size-4" /> Tạo nhanh từ PDF
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/teacher/courses/new">Tạo thủ công</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
