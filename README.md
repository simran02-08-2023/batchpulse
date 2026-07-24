# BatchPulse

> A tuition/coaching center management platform for teachers — track batches, students, attendance, study materials, and test performance in one place.

**Live demo:** https://batchpulse-ax8u.vercel.app

## Demo login

```
Email: demo@demo.com
Password: demo1234
```

*(Replace with your actual demo credentials before sharing, or note that reviewers can sign up directly.)*

## Features

- **Secure authentication** — email/password signup and login via Supabase Auth, with a code-based password reset flow (no broken email links)
- **Batch management** — create, edit, search, and delete class batches with subject, grade, and schedule
- **Student enrollment** — add new students or search and enroll existing students across multiple batches
- **Attendance tracking** — mark present/absent per session, edit any past date, and view full attendance history with daily summaries
- **Needs-attention insights** — automatically flags students below 75% attendance over the last 14 days, with a drill-down list
- **Study materials** — upload notes organized by chapter, with secure time-limited download links (private Supabase Storage, not publicly accessible)
- **Test scheduling & marks** — schedule tests, enter marks per student, and see average/highest/lowest at a glance
- **Real-time dashboard** — today's attendance, active student count, batch count, and attention alerts, all computed from live data
- **Responsive UI** — usable on both desktop and mobile

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript (strict mode) |
| UI | React, Tailwind CSS |
| Database | PostgreSQL (via Supabase) |
| Auth | Supabase Auth |
| File storage | Supabase Storage (private, signed URLs) |
| Email | Resend (custom SMTP) |
| Charts/Icons | Recharts, Lucide |
| Hosting | Vercel |

## Architecture

**Core data model:**
- `profiles` — teacher accounts, linked to Supabase Auth users
- `batches` — a class/section owned by a teacher
- `students` — student records (reusable across batches)
- `enrollments` — join table linking students to batches (a student can be in multiple batches)
- `attendance_records` — one row per student per session date, linked via `enrollment_id`
- `materials` — study notes/files per batch, grouped by chapter, stored in private Supabase Storage
- `tests` / `test_results` — scheduled tests per batch and marks per student

**Security:**
- Row Level Security (RLS) enforced on every table — teachers can only read/write their own batches and related data
- Storage bucket policies scope file access to the owning teacher's batches
- All mutations run through server actions with ownership checks, not just client-side assumptions

## Setup

```bash
git clone <your-repo-url>
cd batchpulse
npm install
```

Create a `.env.local` file with:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Run the development server:

```bash
npm run dev
```

Open http://localhost:3000.

## Environment variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public API key |
| `NEXT_PUBLIC_SITE_URL` | Base URL used for auth redirects (e.g. production domain) |

## Roadmap

- [ ] Student login portal (view own attendance, marks, materials, and schedule)
- [ ] Homework assignment and submission tracking
- [ ] Parent-facing notifications
- [ ] Verified email domain for production-grade password reset delivery

## License

MIT
