# Product Requirements Document — ml-cv-learn

**Version**: 0.1 (Draft)
**Owner**: Dương Thành Tài
**Last updated**: 2026-05-22

---

## 1. Problem statement

Sinh viên Việt Nam học ML/CV gặp ba rào cản chính:

1. **Cài đặt môi trường**: Anaconda + GPU drivers fail rates cao trên máy yếu.
2. **Thiếu feedback**: Không có cách kiểm tra code đúng/sai ngay lập tức.
3. **Thiếu hỗ trợ 24/7**: Không có giảng viên/TA giải đáp thắc mắc theo ngữ cảnh code cụ thể.

Đồng thời, giáo viên dạy lớp 80+ sinh viên không có công cụ chấm tự động, mất 2-3 ngày chấm tay mỗi assignment.

## 2. Solution

Web platform browser-first, AI-assisted, dùng:
- **Pyodide** chạy Python ngay trong tab (zero setup).
- **AI tutor** trả lời câu hỏi theo ngữ cảnh code và bài học.
- **Auto-grader** chấm hidden tests + ML metrics rồi sinh AI feedback.

## 3. Success metrics

| Phase | Metric | Target |
|---|---|---|
| Week 1 | Sign-ups | 50 |
| Week 1 | Code cells executed | 200 |
| Month 1 | MAU | 500 |
| Month 1 | Retention W2 | 30% |
| Month 1 | AI tutor questions | 1000+ |
| Month 3 | Teachers using platform | 10 |
| Month 3 | Submissions auto-graded | 5000+ |

## 4. User personas

### Minh — Sinh viên năm 3 CNTT
- 21t, laptop 8GB RAM, không có GPU
- Cần: học thực hành ML có chấm điểm
- Win: Nộp bài → 30s sau có feedback

### Cô Lan — Giảng viên ML
- Dạy 80 sinh viên/lớp, không có TA
- Cần: tạo assignment nhanh, chấm tự động, phát hiện cheating
- Win: setup khóa học 1 giờ, monitor analytics

### Khoa — Học sinh THPT giỏi Toán
- 17t, tự học CV, muốn thi Olympic Tin
- Cần: AI giải thích kiến thức theo ngữ cảnh
- Win: hỏi 24/7, nhận giải thích cá nhân hóa

## 5. User stories (top 15)

```
US-01  Là sinh viên, tôi muốn đăng nhập bằng email magic link để không cần nhớ mật khẩu.
US-02  Là sinh viên, tôi muốn duyệt khóa học công khai để chọn khóa phù hợp.
US-03  Là sinh viên, tôi muốn enroll vào khóa học để theo dõi tiến độ.
US-04  Là sinh viên, tôi muốn xem lesson kèm notebook nhúng để vừa đọc vừa chạy code.
US-05  Là sinh viên, tôi muốn chạy Python ngay trong trình duyệt để tránh cài đặt.
US-06  Là sinh viên, tôi muốn nộp bài và nhận điểm tự động trong <60s.
US-07  Là sinh viên, tôi muốn hỏi AI bằng tiếng Việt về code lỗi để được gợi ý sửa.
US-08  Là sinh viên, tôi muốn xem lịch sử nộp bài + điểm để biết tiến bộ.
US-09  Là sinh viên, tôi muốn lưu notebook để tiếp tục làm sau.
US-10  Là sinh viên, tôi muốn upload dataset CSV để thực hành phân tích.
US-11  Là giáo viên, tôi muốn tạo khóa học và lessons bằng Markdown/MDX.
US-12  Là giáo viên, tôi muốn cấu hình hidden tests + ML metric threshold.
US-13  Là giáo viên, tôi muốn xem dashboard điểm + phát hiện cheating.
US-14  Là giáo viên, tôi muốn override điểm AI khi cần.
US-15  Là giáo viên, tôi muốn export điểm ra CSV.
```

## 6. Functional requirements (MVP)

### Auth & user
- Email magic link + Google OAuth via Supabase Auth
- Role: student | teacher | admin
- Auto-create profile on signup

### Course system
- CRUD course, lesson, assignment cho teacher
- Read-only browse + enroll cho student
- Progress tracking per-enrollment

### Notebook
- Multi-cell (code + markdown)
- Pyodide execution với numpy, pandas, matplotlib, sklearn, scikit-image
- Outputs: text, image (matplotlib PNG), DataFrame HTML, error trace
- Auto-save to DB

### Grading
- Tier 1 (client): visible tests via Pyodide
- Tier 2 (server): hidden tests (AES-encrypted) via Edge Function + Python worker
- Metric scoring (accuracy, f1, mse, r2)
- Persistence + realtime notifications

### AI tutor
- Stream chat (Groq Llama 3.3 70B)
- Context: current lesson + code + last error
- Hint escalation (3 levels)
- Vietnamese-first responses

## 7. Non-functional requirements

| Category | Requirement |
|---|---|
| Performance | TTI < 3s, Pyodide ready < 8s (first visit) |
| Availability | 99% (free tier acceptable) |
| Security | RLS on every table; hidden tests never sent to client |
| Cost | $0/month at < 1000 MAU |
| Browsers | Chrome 100+, Firefox 100+, Safari 16+, Edge 100+ |
| Accessibility | WCAG AA |
| i18n | Vietnamese first, English fallback for UI strings |

## 8. Out of scope (v1)

- Real GPU training (PyTorch/TF training)
- Mobile native apps
- Video lessons hosting
- Real-time collaborative editing
- Payment / paid courses
- AI-generated full assignments
- Adaptive learning paths

## 9. Constraints

- Solo developer, parallel with university coursework
- 0$ infrastructure budget (Vercel + Supabase + Groq free tiers)
- Vietnamese language priority

## 10. Risks & mitigations

See `docs/architecture/01-overview.md` § Risks.
