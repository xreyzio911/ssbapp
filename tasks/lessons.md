# Lessons
- Vercel typecheck can surface implicit any in route handlers (e.g., Prisma results). Add explicit inline types for iteration callbacks and keep the `tsc --noEmit` test to catch it early.
- Prisma result typing can be missing in server components during build; annotate map/filter/forEach callback params for Prisma results to avoid implicit-any errors.
- Avoid `new Map(array.map(() => [k, v]))` without tuple typing; use `Map<string, boolean>()` plus `set` to prevent `{}` inference.
- Vercel builds may not run `prisma generate` unless wired into `postinstall`; missing Prisma client types show up as "no exported member PrismaClient".
- Prisma config `env("DATABASE_URL")` throws during install if the env var isn’t set; use optional `process.env` or conditional datasource to allow `prisma generate` without a DB URL.
- When using Prisma driver adapters in the app, `prisma/seed.ts` must construct `PrismaClient` with the same adapter (or it will throw during init).
- For Supabase pooler + local seed, parse `DATABASE_URL` manually and pass explicit `ssl` options to `pg` Pool to avoid `sslmode` inference and TLS chain errors.
- Supabase pooler can present a TLS chain that pg rejects; set `ssl.rejectUnauthorized=false` on the runtime Pool when using pooler/sslmode.
- GET logout endpoints are vulnerable to Next.js prefetch; use POST + a form button to avoid automatic session clears.
