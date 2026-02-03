# TODO
- [x] Add a typecheck test that runs `tsc --noEmit` to reproduce the current build error (verify: `npm test` fails with implicit any).
- [x] Fix the implicit `any` in `src/app/api/hr/files/upload/route.ts` (verify: `npm test` passes).
- [x] Run `npm run build` to confirm no other deployment errors remain (verify: build succeeds).

# Review
- Added `tests/typecheck.test.ts` to run `tsc --noEmit` during `npm test`.
- Local `tsc` and `next build` did not reproduce the Vercel implicit-any error; added an explicit type annotation to avoid inference issues.
- Verified with `npm test` and `npm run build`.
