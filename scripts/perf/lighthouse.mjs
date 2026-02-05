import fs from "fs/promises";
import path from "path";
import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";

const baseUrl = (process.env.PERF_BASE_URL || "http://localhost:3000").replace(
  /\/$/,
  ""
);
const urls = (process.env.PERF_URLS || "/login,/hr,/employee")
  .split(",")
  .map((entry) => entry.trim())
  .filter(Boolean)
  .map((entry) => (entry.startsWith("http") ? entry : `${baseUrl}${entry}`));

const outDir = process.env.PERF_OUT_DIR || "perf-results";
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

await fs.mkdir(outDir, { recursive: true });

const chrome = await launch({
  chromeFlags: ["--headless", "--no-sandbox", "--disable-gpu"],
});

const options = {
  logLevel: "info",
  onlyCategories: ["performance"],
  output: ["html", "json"],
  port: chrome.port,
  formFactor: "mobile",
  throttlingMethod: "simulate",
  screenEmulation: {
    mobile: true,
    width: 360,
    height: 640,
    deviceScaleFactor: 2,
    disabled: false,
  },
};

const summaries = [];

try {
  for (const url of urls) {
    const result = await lighthouse(url, options);
    const lhr = result.lhr;
    const report = result.report;
    const [htmlReport, jsonReport] = Array.isArray(report)
      ? report
      : [report, JSON.stringify(lhr, null, 2)];

    const safeName = url
      .replace(/^https?:\/\//, "")
      .replace(/[^a-zA-Z0-9._-]/g, "_");
    const baseName = `${timestamp}-${safeName}`;
    await fs.writeFile(path.join(outDir, `${baseName}.html`), htmlReport);
    await fs.writeFile(path.join(outDir, `${baseName}.json`), jsonReport);

    const lcp = lhr.audits["largest-contentful-paint"]?.numericValue ?? null;
    const tti = lhr.audits["interactive"]?.numericValue ?? null;
    const cls = lhr.audits["cumulative-layout-shift"]?.numericValue ?? null;
    const fcp = lhr.audits["first-contentful-paint"]?.numericValue ?? null;

    summaries.push({
      url,
      performanceScore: lhr.categories.performance.score,
      lcpMs: lcp,
      ttiMs: tti,
      cls,
      fcpMs: fcp,
    });
  }
} finally {
  await chrome.kill();
}

const summaryPath = path.join(outDir, `${timestamp}-summary.json`);
await fs.writeFile(summaryPath, JSON.stringify({ summaries }, null, 2));

console.log("Lighthouse mobile summary:");
summaries.forEach((item) => {
  const score = Math.round((item.performanceScore ?? 0) * 100);
  console.log(
    `${item.url} -> score ${score}, LCP ${item.lcpMs}ms, TTI ${item.ttiMs}ms, CLS ${item.cls}, FCP ${item.fcpMs}ms`
  );
});
