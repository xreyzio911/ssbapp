# Lessons
- Vercel typecheck can surface implicit any in route handlers (e.g., Prisma results). Add explicit inline types for iteration callbacks and keep the `tsc --noEmit` test to catch it early.
- Prisma result typing can be missing in server components during build; annotate map/filter/forEach callback params for Prisma results to avoid implicit-any errors.
