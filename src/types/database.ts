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
  module_id: string | null
  order_index: number
  title: string
  content_mdx: string
  starter_notebook_json: Json | null
  estimated_minutes: number | null
  is_free_preview: boolean
  pass_threshold: number
  pdf_storage_path: string | null
  pdf_size_bytes: number | null
  video_youtube_id: string | null
  video_duration_seconds: number | null
  video_title: string | null
  video_required: boolean
  created_at: string
}

type Module = {
  id: string
  course_id: string
  order_index: number
  title: string
  description: string | null
  created_at: string
}

type Quiz = {
  id: string
  lesson_id: string | null
  question_type: 'mcq' | 'code_complete' | 'true_false'
  question: string
  options: Json | null
  correct_answer: string
  explanation: string | null
  difficulty: number | null
  order_index: number
  points: number
}

type QuizAttempt = {
  id: string
  quiz_id: string
  student_id: string
  answer: string | null
  is_correct: boolean | null
  attempted_at: string
}

type LessonProgress = {
  id: string
  student_id: string
  lesson_id: string
  best_quiz_score: number | null
  quiz_attempts_count: number
  passed: boolean
  first_viewed_at: string
  passed_at: string | null
  updated_at: string
  video_watched_pct: number
  video_watched_seconds: number
  video_unique_seconds_bitmap: string | null
}

export type LessonWithProgress = {
  id: string
  module_id: string | null
  order_index: number
  title: string
  estimated_minutes: number | null
  is_free_preview: boolean
  pass_threshold: number
  has_quiz: boolean
  has_video: boolean
  has_pdf: boolean
  video_required: boolean
  has_gating_assignment: boolean
  best_quiz_score: number | null
  video_watched_pct: number
  assignments_passed: boolean
  passed: boolean
  locked: boolean
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
  io_spec: Json | null
  requires_manual_review: boolean
  gates_progression: boolean
  pass_threshold_pct: number
  max_score: number
  max_attempts: number
  time_limit_seconds: number
  due_at: string | null
  is_published: boolean
  created_at: string
}

type AssignmentDataset = {
  assignment_id: string
  dataset_id: string
  role: 'train' | 'test' | 'validation' | 'reference'
  created_at: string
}

type ImageAnnotation = {
  id: string
  dataset_id: string
  image_path: string
  shape_type: 'bbox' | 'polygon' | 'point'
  coordinates: Json
  label: string
  color: string | null
  created_by: string | null
  is_ground_truth: boolean
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
  teacher_override_score: number | null
  teacher_comment: string | null
  reviewed_by: string | null
  reviewed_at: string | null
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
// Same as Assignment minus hidden_tests + created_at (both stripped at the view level)
type QuizzesPublicView = Omit<Quiz, 'correct_answer' | 'explanation'>

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
      modules: { Row: Module; Insert: Partial<Module> & { course_id: string; order_index: number; title: string }; Update: Partial<Module> }
      quizzes: { Row: Quiz; Insert: Partial<Quiz> & { question_type: Quiz['question_type']; question: string; correct_answer: string }; Update: Partial<Quiz> }
      quiz_attempts: { Row: QuizAttempt; Insert: { quiz_id: string; student_id: string; answer?: string | null; is_correct?: boolean | null }; Update: Partial<QuizAttempt> }
      lesson_progress: { Row: LessonProgress; Insert: Partial<LessonProgress> & { student_id: string; lesson_id: string }; Update: Partial<LessonProgress> }
      assignment_datasets: { Row: AssignmentDataset; Insert: { assignment_id: string; dataset_id: string; role: AssignmentDataset['role'] }; Update: Partial<AssignmentDataset> }
      image_annotations: { Row: ImageAnnotation; Insert: Partial<ImageAnnotation> & { dataset_id: string; image_path: string; shape_type: ImageAnnotation['shape_type']; coordinates: Json; label: string }; Update: Partial<ImageAnnotation> }
    }
    Views: {
      assignments_public: { Row: AssignmentsPublicView; Insert: never; Update: never }
      quizzes_public: { Row: QuizzesPublicView; Insert: never; Update: never }
    }
    Functions: {
      can_access_lesson: { Args: { target_lesson_id: string }; Returns: boolean }
      list_lessons_with_progress: { Args: { target_course_id: string }; Returns: LessonWithProgress[] }
      best_assignment_pct: { Args: { p_student_id: string; p_assignment_id: string }; Returns: number }
      lesson_assignments_passed: { Args: { p_student_id: string; p_lesson_id: string }; Returns: boolean }
    }
    Enums: {
      user_role: 'student' | 'teacher' | 'admin'
      submission_status: 'pending' | 'running' | 'graded' | 'error' | 'manual_review'
      dataset_type: 'csv' | 'image_folder' | 'json' | 'parquet'
    }
    CompositeTypes: Record<string, never>
  }
}
