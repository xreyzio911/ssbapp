import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";

test("typecheck passes", () => {
  const tscPath = path.join(
    process.cwd(),
    "node_modules",
    "typescript",
    "bin",
    "tsc"
  );
  const result = spawnSync(process.execPath, [tscPath, "--noEmit", "--pretty", "false"], {
    encoding: "utf-8",
  });

  const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
  assert.equal(result.status, 0, output || "tsc failed");
});
