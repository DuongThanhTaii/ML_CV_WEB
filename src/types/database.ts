/**
 * DB types. Auto-regenerate with `pnpm db:types` once Supabase is linked.
 * Hand-written here so dev can begin before first generation.
 */
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

type Profile = {
  id: string
  email: string
  role: 'student' | 'teacher' | 'admin'
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  created_at: string
  updated_at: string
}

type Course = {
  id: string
  slug: string
  title: string
  description: string | null
  category: 'ml' | 'cv' | 'data' | 'mixed' | null
  difficulty: number
  teacher_id: string
  is_published: boolean
  estimated_hours: number | null
  created_at: string
  updated_at: string
  cover_image_url: string | null
}

type Enrollment = {
  id: string
  student_id: string
  course_id: string
  enrolled_at: string
  completed_at: string | null
  progress_pct: number
}

type Lesson = {
  id: string
  course_id: string
  order_index: number
  title: string
  content_mdx: string
  starter_notebook_json: Json | null
  estimated_minutes: number | null
  is_free_preview: boolean
  created_at: string
}

type Assignment = {
  id: string
  lesson_id: string | null
  course_id: string
  title: string
  description_mdx: string | null
  starter_code: string
  visible_tests: string | null
  hidden_tests_encrypted: string | null
  evaluation_type: 'unittest' | 'ml_metric' | 'cv_output' | 'mixed'
  metric_config: Json | null
  max_score: number
  max_attempts: number
  time_limit_seconds: number
  due_at: string | null
  is_published: boolean
  created_at: string
}

type Submission = {
  id: string
  assignment_id: string
  student_id: string
  code: string
  code_hash: string
  status: 'pending' | 'running' | 'graded' | 'error' | 'manual_review'
  attempt_number: number
  client_test_passed: boolean | null
  submitted_at: string
}

type GradingResult = {
  id: string
  submission_id: string
  score: number
  max_score: number
  passed_tests: number
  total_tests: number
  test_details: Json
  metric_value: number | null
  execution_time_ms: number | null
  memory_used_mb: number | null
  stdout: string | null
  stderr: string | null
  graded_at: string
  graded_by: string
}

type AIFeedback = {
  id: string
  submission_id: string | null
  feedback_type: 'explanation' | 'hint' | 'code_review' | 'concept'
  model_used: string
  prompt_hash: string
  response_text: string
  tokens_used: number | null
  rating: number | null
  created_at: string
}

type AIChatSession = {
  id: string
  student_id: string
  context_lesson_id: string | null
  title: string | null
  created_at: string
}

type AIChatMessage = {
  id: string
  session_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  tokens: number | null
  created_at: string
}

type Dataset = {
  id: string
  owner_id: string
  name: string
  description: string | null
  dataset_type: 'csv' | 'image_folder' | 'json' | 'parquet'
  storage_path: string
  size_bytes: number | null
  row_count: number | null
  preview: Json | null
  is_public: boolean
  license: string | null
  created_at: string
}

type Notebook = {
  id: string
  owner_id: string
  lesson_id: string | null
  title: string | null
  cells_json: Json
  last_run_at: string | null
  created_at: string
  updated_at: string
}

type Experiment = {
  id: string
  owner_id: string
  notebook_id: string | null
  name: string | null
  model_type: string | null
  hyperparameters: Json | null
  metrics: Json | null
  artifacts_url: string | null
  run_at: string
}

type AssignmentsPublicView = Omit<Assignment, 'hidden_tests_encrypted' | 'created_at'>

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile> & { id: string; email: string }; Update: Partial<Profile> }
      courses: { Row: Course; Insert: Partial<Course> & { slug: string; title: string; teacher_id: string }; Update: Partial<Course> }
      enrollments: { Row: Enrollment; Insert: { student_id: string; course_id: string }; Update: Partial<Enrollment> }
      lessons: { Row: Lesson; Insert: Partial<Lesson> & { course_id: string; order_index: number; title: string; content_mdx: string }; Update: Partial<Lesson> }
      assignments: { Row: Assignment; Insert: Partial<Assignment> & { course_id: string; title: string; starter_code: string }; Update: Partial<Assignment> }
      submissions: { Row: Submission; Insert: { assignment_id: string; student_id: string; code: string; client_test_passed?: boolean; attempt_number: number; status?: 'pending' }; Update: Partial<Submission> }
      grading_results: { Row: GradingResult; Insert: Partial<GradingResult> & { submission_id: string; score: number; max_score: number }; Update: Partial<GradingResult> }
      ai_feedback: { Row: AIFeedback; Insert: Partial<AIFeedback> & { feedback_type: AIFeedback['feedback_type']; model_used: string; prompt_hash: string; response_text: string }; Update: Partial<AIFeedback> }
      ai_chat_sessions: { Row: AIChatSession; Insert: { student_id: string; context_lesson_id?: string | null; title?: string | null }; Update: Partial<AIChatSession> }
      ai_chat_messages: { Row: AIChatMessage; Insert: { session_id: string; role: AIChatMessage['role']; content: string; tokens?: number | null }; Update: Partial<AIChatMessage> }
      datasets: { Row: Dataset; Insert: Partial<Dataset> & { owner_id: string; name: string; dataset_type: Dataset['dataset_type']; storage_path: string }; Update: Partial<Dataset> }
      notebooks: { Row: Notebook; Insert: Partial<Notebook> & { owner_id: string; cells_json: Json }; Update: Partial<Notebook> }
      experiments: { Row: Experiment; Insert: Partial<Experiment> & { owner_id: string }; Update: Partial<Experiment> }
    }
    Views: {
      assignments_public: { Row: AssignmentsPublicView; Insert: never; Update: never }
    }
    Functions: Record<string, never>
    Enums: {
      user_role: 'student' | 'teacher' | 'admin'
      submission_status: 'pending' | 'running' | 'graded' | 'error' | 'manual_review'
      dataset_type: 'csv' | 'image_folder' | 'json' | 'parquet'
    }
    CompositeTypes: Record<string, never>
  }
}
