import { CourseForm } from '@/components/teacher/course-form'

export default function NewCoursePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Tạo khóa học mới</h1>
        <p className="text-sm text-muted-foreground">Điền thông tin cơ bản, lessons sẽ thêm sau.</p>
      </header>
      <CourseForm />
    </div>
  )
}
