# Next Session Start Here

## 1) Environment sanity (first 5 minutes)
- Confirm deployment env is complete and consistent:
  - `STORAGE_DRIVER=s3`
  - `S3_BUCKET`
  - `S3_REGION` or `AWS_REGION`
  - `S3_ACCESS_KEY_ID` or `AWS_ACCESS_KEY_ID`
  - `S3_SECRET_ACCESS_KEY` or `AWS_SECRET_ACCESS_KEY`
  - optional `S3_ENDPOINT`, `S3_FORCE_PATH_STYLE`
- Redeploy after env updates.

## 2) Smoke tests after deploy
- Employee side:
  - Upload a new document from `/employee/documents`.
  - Verify upload success notice and latest date refresh.
- HR side:
  - Open `/hr/employees/[id]` and preview a document inline via `Buka dokumen`.
  - Verify `Buka di tab baru` and `Unduh` still work.
- Update request flow:
  - HR submits `Minta pembaruan` with note.
  - Employee sees the note in upload card/overview.
  - Employee re-upload clears `Perlu pembaruan` and note.

## 3) Known data caveat
- If specific old records still fail preview/download with storage not found:
  - those files likely came from ephemeral local storage era,
  - fix by re-uploading those documents to create valid S3 objects.

## 4) UX cleanup candidates (optional)
- Fine-tune spacing/line-height in HR employee detail `Dokumen Pribadi` rows after real-device pass.
- If needed, add a compact mode for the new HR document preview list on smaller laptop widths.

## 5) Suggested first engineering task next session
- Add a small diagnostics endpoint/admin panel that reports:
  - active storage driver,
  - resolved S3 bucket/region,
  - write/read probe status,
  - so future env drift is caught immediately.
