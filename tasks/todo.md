# TODO
- [x] Add a typecheck test that runs `tsc --noEmit` to reproduce the current build error (verify: `npm test` fails with implicit any).
- [x] Fix the implicit `any` in `src/app/api/hr/files/upload/route.ts` (verify: `npm test` passes).
- [x] Run `npm run build` to confirm no other deployment errors remain (verify: build succeeds).
- [x] Fix the implicit `any` in `src/app/api/hr/reports/missing-docs/route.ts` (verify: `npm test` passes, `npm run build` passes).
- [x] Add explicit callback types in server components that iterate Prisma results (verify: `npm test` passes, `npm run build` passes).
- [x] Replace status map construction in server pages to avoid `{}` inference (verify: `npm test` passes, `npm run build` passes).

# Review
- Added `tests/typecheck.test.ts` to run `tsc --noEmit` during `npm test`.
- Local `tsc` and `next build` did not reproduce the Vercel implicit-any error; added an explicit type annotation to avoid inference issues.
- Verified with `npm test` and `npm run build`.
- Added an explicit type annotation in the missing-docs report to avoid implicit `any`.
- Re-verified with `npm test` and `npm run build`.
- Added explicit callback types in employee/HR server pages to prevent implicit any when Prisma types are unavailable.
- Re-verified with `npm test` and `npm run build`.
- Replaced `new Map(statuses.map(...))` with explicit `Map` + `forEach` to keep boolean types stable in server pages.
- Re-verified with `npm test` and `npm run build`.
