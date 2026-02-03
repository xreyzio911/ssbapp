# SSB Employees & HR Portal — Status Summary

## Purpose (What the app is)
A production-ready but minimal HR + employee portal for Manpower to collect and distribute personal documents. There are two roles (HR and Employee). Employees upload required documents; HR can view/download them and send encrypted HR files (including agreements) to employees. Agreements support simple e-signature with a signature pad and signed PDF generation. All UI text is in Indonesian.

## Stack
- Next.js 16 (App Router) + TypeScript
- TailwindCSS + minimal UI components
- Prisma ORM + PostgreSQL (Supabase recommended)
- File storage via local filesystem adapter in dev (and S3-compatible supported in code)
- Email delivery via SMTP (Nodemailer)

## Core Features Implemented
- **Auth & Roles**
  - HR (single admin account seeded via env)
  - Employees invited by HR (email invite flow)
  - Session cookies + role checks on server
- **Employee Profile**
  - Fields: Nama Lengkap, NIK (optional), Email, No HP (optional), Alamat (optional), Tanggal Lahir (optional)
  - HR can edit employee profile
- **Employee Dashboard**
  - Document checklist tiles per category (KTP, KK, CV, IJAZAH, TRANSKRIP, PAKLARING, SERTIFIKAT, FOTO)
  - Upload/replace per category
  - Status: Belum diunggah / Sudah diunggah / Perlu pembaruan
  - HR-assigned files list + agreement status
- **HR Dashboard**
  - Employee list + search
  - Employee detail: profile summary, document history, HR file assignments + status
  - Batch upload HR files + assign to many employees
  - Batch upload agreement PDF + assign to many employees
  - CSV export for missing docs
  - Minimal audit log page
- **File Storage + Naming + Versioning**
  - Every upload creates a version entry
  - Standardized filenames: `EmployeeName-DOC_TYPE-YYYYMMDD-HHMM.ext` (Asia/Jakarta)
  - Stores original filename for audit
  - File type + size validation (max 15MB)
- **Encryption for HR-Uploaded Files**
  - HR files encrypted at rest (AES-GCM)
  - Per-employee password auto-generated and emailed
  - Password hash only (no plaintext storage)
  - Client-side decryption with WebCrypto
  - “Re-issue password” flow (HR can resend)
- **Agreement Signing**
  - HR uploads PDF agreement and assigns
  - Employee decrypts, reviews, then signs
  - Signature pad + signer name + timestamp
  - Signed PDF generated + stored
  - HR can download signed version and see status
- **Audit Log**
  - Upload, download, sign, password reissue events

## Data Model (Prisma)
- Users, Sessions, Invitations, PasswordResets
- EmployeeDocStatus + DocumentVersion
- HrFile + HrFileAssignment
- AuditLog
- Enums: UserRole, DocType, HrFileType, AssignmentStatus

## Important Implementation Notes
- **Prisma 7 driver adapter**: `@prisma/adapter-pg` with `pg` Pool is required.
- **Next 16 route handler signature**: dynamic routes use `context.params` as a `Promise` and are awaited.
- **Enum imports**: Using local `src/lib/enums.ts` for app enums to avoid build/type export issues from `@prisma/client` during Next build.
- **TypeScript fixes**: Added `@types/pg` and `@types/nodemailer` for clean builds.
- **WebCrypto/Blob typing**: Adjusted Uint8Array usage for PBKDF2 and Blob construction.
- **Prisma client generation**: runs on `postinstall` for Vercel builds.
- **Prisma config**: tolerates missing `DATABASE_URL` during install (conditional datasource).
- **DB SSL**: runtime Pool enables SSL when a pooler host or `sslmode=` is present in `DATABASE_URL`.

## Recent Fixes (Deployment blockers addressed)
- Next 16 route handler params signature fixes in all dynamic API routes.
- Removed stray `}` parse errors in HR components.
- Excluded `prisma/seed.ts` from Next typecheck (seed should run separately).
- Replaced Prisma enums with local `src/lib/enums.ts` in app code.
- Added missing TS types for pg + nodemailer.
- Build now passes locally: `npm run build` succeeded.
- Added `tests/typecheck.test.ts` to run `tsc --noEmit` in `npm test`.
- Added explicit callback typing where Prisma result inference caused implicit `any`.
- Fixed `Map` inference for `needsUpdate` to stay boolean.
- `/logout` now uses POST + 303 redirect (GET only redirects) to avoid prefetch logout and 405s.
- HR/Employee nav is now client-side tabs; content consolidated into tab panels for faster switching.
- Added loading skeletons for `/hr` and `/employee`.
- Legacy subroutes redirect to hash tabs (e.g., `/hr/batch-upload` -> `/hr#batch`).
- Seed now uses the Prisma driver adapter and parses `DATABASE_URL`; explicit pg SSL options included.

## How to Run Locally (Quick)
1) `npm install`
2) Create `.env` from `.env.example` and set:
   - `DATABASE_URL` (Supabase Postgres)
   - `HR_EMAIL`, `HR_PASSWORD`, `HR_NAME`
   - SMTP settings (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`)
3) `npm run db:generate`
4) `npm run db:migrate`
5) `npm run db:seed`
6) `npm run dev`

## Deploy (Vercel)
- Connect GitHub repo to Vercel
- Set all env vars in Vercel
- Build command: `npm run build`
- Run migrations manually on Supabase before first deploy
- Use a Supabase pooler URL for Vercel (IPv4); SSL is enabled automatically when `sslmode=` or a pooler host is detected.

## Known Requirements / Constraints
- UI text must remain in Indonesian
- HR has full access; employees can only access their own data
- Passwords for HR files must never be stored in plaintext

## Verification Checklist
- HR creates employee ? invite email arrives ? employee sets password and logs in
- Employee uploads KTP ? HR can view/download
- HR batch uploads agreement ? employee receives password email ? decrypts ? signs ? HR sees signed PDF

## Latest commits
- `e40b075` NextRequest fixes in dynamic routes
- `ac6126f` stray brace fix (ReissuePasswordButton)
- `43f494f` stray braces fix (HR employee components)
- `02bcf10` exclude seed from Next typecheck
- `f24f5c5` local enums for build stability
- `028b937` TS build errors + types fixes (current stable build)

---
If you need, I can export a separate SETUP.md or DEPLOY.md in the new chat.
