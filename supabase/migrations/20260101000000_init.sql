-- =====================================================================
-- ml-cv-learn · Initial schema
-- =====================================================================

create extension if not exists "pgcrypto";
create extension if not exists "vector";

-- Enums
create type user_role as enum ('student', 'teacher', 'admin');
create type submission_status as enum ('pending', 'running', 'graded', 'error', 'manual_review');
create type dataset_type as enum ('csv', 'image_folder', 'json', 'parquet');

-- =====================================================================
-- Profiles
-- =====================================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  avatar_url text,
  role user_role not null default 'student',
  bio text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- Courses
-- =====================================================================
create table courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  cover_image_url text,
  category text check (category in ('ml', 'cv', 'data', 'mixed')),
  difficulty smallint check (difficulty between 1 and 5),
  teacher_id uuid not null references profiles(id),
  is_published boolean default false,
  estimated_hours int,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_courses_teacher on courses(teacher_id);
create index idx_courses_published on courses(is_published) where is_published = true;

-- =====================================================================
-- Enrollments
-- =====================================================================
create table enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id),
  course_id uuid not null references courses(id),
  enrolled_at timestamptz default now(),
  completed_at timestamptz,
  progress_pct smallint default 0 check (progress_pct between 0 and 100),
  unique (student_id, course_id)
);
create index idx_enrollments_student on enrollments(student_id);
create index idx_enrollments_course on enrollments(course_id);

-- =====================================================================
-- Lessons
-- =====================================================================
create table lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  order_index int not null,
  title text not null,
  content_mdx text not null,
  starter_notebook_json jsonb,
  estimated_minutes int,
  is_free_preview boolean default false,
  created_at timestamptz default now(),
  unique (course_id, order_index)
);
create index idx_lessons_course on lessons(course_id, order_index);

-- =====================================================================
-- Assignments
-- =====================================================================
create table assignments (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references lessons(id),
  course_id uuid not null references courses(id),
  title text not null,
  description_mdx text,
  starter_code text not null,
  visible_tests text,
  hidden_tests_encrypted text,
  evaluation_type text check (evaluation_type in ('unittest', 'ml_metric', 'cv_output', 'mixed')),
  metric_config jsonb,
  max_score numeric(5,2) default 100,
  max_attempts int default 10,
  time_limit_seconds int default 30,
  due_at timestamptz,
  is_published boolean default false,
  created_at timestamptz default now()
);
create index idx_assignments_lesson on assignments(lesson_id);
create index idx_assignments_course on assignments(course_id);

-- Public view excluding hidden_tests_encrypted column
create view assignments_public as
  select id, lesson_id, course_id, title, description_mdx,
         starter_code, visible_tests, evaluation_type, metric_config,
         max_score, max_attempts, time_limit_seconds, due_at, is_published
  from assignments
  where is_published = true;

-- =====================================================================
-- Submissions
-- =====================================================================
create table submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references assignments(id),
  student_id uuid not null references profiles(id),
  code text not null,
  code_hash text generated always as (encode(sha256(code::bytea), 'hex')) stored,
  status submission_status default 'pending',
  attempt_number int not null,
  client_test_passed boolean,
  submitted_at timestamptz default now()
);
create index idx_submissions_student on submissions(student_id, submitted_at desc);
create index idx_submissions_assignment on submissions(assignment_id);
create index idx_submissions_hash on submissions(code_hash);
create index idx_submissions_status on submissions(status) where status in ('pending', 'running');

-- =====================================================================
-- Grading Results
-- =====================================================================
create table grading_results (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  score numeric(5,2) not null,
  max_score numeric(5,2) not null,
  passed_tests int default 0,
  total_tests int default 0,
  test_details jsonb,
  metric_value numeric,
  execution_time_ms int,
  memory_used_mb int,
  stdout text,
  stderr text,
  graded_at timestamptz default now(),
  graded_by text default 'auto'
);
create index idx_grading_submission on grading_results(submission_id);

-- =====================================================================
-- AI Feedback Logs
-- =====================================================================
create table ai_feedback (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references submissions(id) on delete cascade,
  feedback_type text check (feedback_type in ('explanation', 'hint', 'code_review', 'concept')),
  model_used text not null,
  prompt_hash text not null,
  response_text text not null,
  tokens_used int,
  rating smallint check (rating between 1 and 5),
  created_at timestamptz default now()
);

-- =====================================================================
-- AI Chat (Tutor)
-- =====================================================================
create table ai_chat_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id),
  context_lesson_id uuid references lessons(id),
  title text,
  created_at timestamptz default now()
);
create index idx_chat_sessions_student on ai_chat_sessions(student_id, created_at desc);

create table ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references ai_chat_sessions(id) on delete cascade,
  role text check (role in ('user', 'assistant', 'system')),
  content text not null,
  embedding vector(384),
  tokens int,
  created_at timestamptz default now()
);
create index idx_chat_messages_session on ai_chat_messages(session_id, created_at);
create index idx_chat_messages_embedding on ai_chat_messages
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- =====================================================================
-- Quizzes
-- =====================================================================
create table quizzes (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references lessons(id),
  question_type text check (question_type in ('mcq', 'code_complete', 'true_false')),
  question text not null,
  options jsonb,
  correct_answer text not null,
  explanation text,
  difficulty smallint
);

create table quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id),
  student_id uuid not null references profiles(id),
  answer text,
  is_correct boolean,
  attempted_at timestamptz default now()
);
create index idx_quiz_attempts_student on quiz_attempts(student_id);

-- =====================================================================
-- Datasets
-- =====================================================================
create table datasets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id),
  name text not null,
  description text,
  dataset_type dataset_type not null,
  storage_path text not null,
  size_bytes bigint,
  row_count int,
  preview jsonb,
  is_public boolean default false,
  license text,
  created_at timestamptz default now()
);
create index idx_datasets_owner on datasets(owner_id);
create index idx_datasets_public on datasets(is_public) where is_public = true;

-- =====================================================================
-- Notebooks
-- =====================================================================
create table notebooks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id),
  lesson_id uuid references lessons(id),
  title text,
  cells_json jsonb not null,
  last_run_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_notebooks_owner on notebooks(owner_id, updated_at desc);

-- =====================================================================
-- Experiments
-- =====================================================================
create table experiments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id),
  notebook_id uuid references notebooks(id),
  name text,
  model_type text,
  hyperparameters jsonb,
  metrics jsonb,
  artifacts_url text,
  run_at timestamptz default now()
);
create index idx_experiments_owner on experiments(owner_id, run_at desc);

-- =====================================================================
-- Updated_at triggers (DRY)
-- =====================================================================
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();
create trigger trg_courses_updated before update on courses
  for each row execute function set_updated_at();
create trigger trg_notebooks_updated before update on notebooks
  for each row execute function set_updated_at();
