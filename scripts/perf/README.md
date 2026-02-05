# Performance Baseline Workflow

These scripts capture repeatable mobile Lighthouse reports and measure upload/download timing without changing the UI.

## Lighthouse (mobile)
1. Start the app locally.
2. Run:
```
node scripts/perf/lighthouse.mjs
```

Optional env:
- `PERF_BASE_URL` (default `http://localhost:3000`)
- `PERF_URLS` (comma list, default `/login,/hr,/employee`)
- `PERF_OUT_DIR` (default `perf-results`)

## Upload/Download Timing
This script uses your authenticated session cookie.

1. Copy the session cookie from your browser (for the same `PERF_BASE_URL`).
2. Run:
```
PERF_COOKIE="session=..." PERF_FILE="path\\to\\sample.pdf" node scripts/perf/upload-download.mjs
```

Optional env:
- `PERF_DOC_TYPE` (default `KTP`)
- `PERF_MIME` (default based on file extension)
- `PERF_DOWNLOAD_URL` (relative or absolute URL to measure download)
- `PERF_OUT_DIR` (default `perf-results`)

Notes:
- If `STORAGE_DRIVER=s3`, the script uses presigned upload + complete.
- If not, it falls back to the local upload endpoint.
