# 🧠 ml-cv-learn

> Học Machine Learning & Computer Vision tương tác — ngay trong trình duyệt.

Web platform giúp sinh viên Việt Nam học ML/CV với:

- 🧪 **Python ngay trong tab** (Pyodide WebAssembly)
- 🤖 **AI tutor 24/7** (Groq Llama 3.3 70B, miễn phí)
- ✅ **Auto-grading** với hidden tests + ML metrics
- 📊 **Visualization** matplotlib, plotly, sklearn ngay trong notebook
- 💰 **Zero-cost deployment** (Vercel + Supabase free tier)

## 🚀 Deploy production (làm 1 lần, ~30 phút)

### 1. Tạo Supabase project
1. Vào https://supabase.com → New project (free tier)
2. Chọn region **Southeast Asia (Singapore)** để latency thấp nhất
3. Lưu password DB
4. Đợi project provision xong (~2 phút)
5. Vào **Settings → API**, lấy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` (secret) → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Apply DB migrations
Cài Supabase CLI: https://supabase.com/docs/guides/local-development/cli/getting-started

```bash
pnpm supabase login
pnpm supabase link --project-ref <your-ref>   # Lấy ref từ URL project
pnpm supabase db push
```

Nếu CLI khó cài, có cách backup: copy nội dung từng file trong `supabase/migrations/*.sql` rồi paste vào **SQL Editor** trên dashboard Supabase, chạy theo thứ tự tên file.

### 3. Tạo Groq API key
1. Vào https://console.groq.com → API Keys → Create API Key
2. Free tier: 14,400 req/day, đủ cho ~200 active learner/ngày
3. Lưu key → `GROQ_API_KEY`

### 4. Tạo encryption key cho grading
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```
Lưu output → `GRADING_ENCRYPTION_KEY`

### 5. Deploy Vercel
1. Vào https://vercel.com → Import Git Repository
2. Chọn repo `ML_CV_WEB`
3. Framework: Next.js (auto-detect)
4. **Environment Variables**, paste tất cả:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   GROQ_API_KEY=gsk_...
   GRADING_ENCRYPTION_KEY=<base64-32-bytes>
   ```
5. Deploy

### 6. Cấu hình auth callback URL
Trên Supabase dashboard:
- **Authentication → URL Configuration**
- Set `Site URL` = your Vercel URL (vd: `https://ml-cv-web.vercel.app`)
- Add to `Redirect URLs`: `https://ml-cv-web.vercel.app/callback`

### 7. Promote bản thân thành teacher
Sau khi sign up lần đầu, mở Supabase SQL Editor:
```sql
update profiles set role = 'teacher' where email = 'duongthanhtai1308@gmail.com';
```

### 8. (Tùy chọn) Triển khai Python grading worker
Server-side grading cần một Python worker chạy bên ngoài. Xem `supabase/functions/python-worker/README.md` để deploy lên Fly.io free tier. Cho đến khi setup, các submission sẽ rơi vào trạng thái `manual_review`.

---

## 🛠️ Development local

```bash
pnpm install
cp .env.example .env.local
# Điền các env vars (xem step 1-4 trên)

pnpm dev          # Truy cập http://localhost:3000
pnpm typecheck    # Kiểm tra type
pnpm build        # Build sản xuất
pnpm test         # Unit tests (Vitest)
```

## 🏗️ Tech stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind, shadcn/ui |
| State | React Query, Zustand |
| Editor | Monaco Editor |
| Python | Pyodide (WASM) trong Web Worker |
| Backend | Supabase (Postgres + Auth + Storage + Edge Functions + Realtime) |
| AI | Groq (chat), Gemini (long context) |
| Grading | AES-256-GCM hidden tests + Edge Function + Fly.io Python worker |
| Deploy | Vercel + Supabase (cả 2 free tier) |

## 📁 Structure

```
.
├── src/
│   ├── app/               Next.js routes (App Router)
│   ├── components/        UI theo domain (notebook/, lesson/, teacher/, ai/, …)
│   ├── lib/               pyodide, grading, ai, supabase
│   ├── services/          DB query wrappers
│   ├── hooks/             React hooks
│   ├── stores/            Zustand
│   ├── types/             TypeScript types
│   └── styles/            Global CSS
├── supabase/
│   ├── migrations/        Schema + RLS
│   ├── functions/         Edge Functions (Deno)
│   └── seed.sql           Demo data
├── docs/                  PRD, architecture, ADRs, runbook
├── scripts/               CLI tools (encrypt-tests)
└── tests/                 Unit + e2e
```

## 📚 Documentation

- 📋 [PRD](docs/PRD.md)
- 🏗️ [Architecture overview](docs/architecture/01-overview.md)
- 🐍 [Pyodide pipeline](docs/architecture/04-pyodide.md)
- ✅ [Grading engine](docs/architecture/05-grading.md)
- 🤖 [AI subsystem](docs/architecture/06-ai.md)
- 📝 [Coding standards](docs/CODING_STANDARDS.md)
- 🚀 [Deploy runbook](docs/runbook/deploy.md)
- 📐 ADRs: [001 Pyodide](docs/adr/001-pyodide-over-server-execution.md) · [002 Supabase-only](docs/adr/002-supabase-only-no-neon.md) · [003 AI for feedback only](docs/adr/003-ai-as-feedback-only-not-grading.md)

## 🐛 Known limitations

- Pyodide bundle ~10MB tải lần đầu (cached vĩnh viễn sau đó)
- Không train được CNN/PyTorch trong browser → dùng scikit-image + ONNX Runtime Web cho CV inference
- Server-side hidden test grading cần external Python worker (Fly.io free hoặc tương đương)
- Supabase free tier pause sau 7 ngày inactive → có GitHub Action `ping-supabase.yml` chạy mỗi 6 ngày

## 📜 License

TBD. Hướng tới MIT khi đủ ổn định.
