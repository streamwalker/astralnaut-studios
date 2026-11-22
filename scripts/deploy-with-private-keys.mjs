import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const secrets = {};
for (const binding of ["GRIDIRON_LIBRARY_KEY_V13", "GRIDIRON_COMICS_KEY_V42"]) {
  const key = process.env[binding];
  if (!key || Buffer.from(key, "base64").length !== 32)
    throw new Error("Required private content key is missing or invalid; deployment stopped");
  secrets[binding] = key;
}

// Apply keys with the new code version. A separate `secret put` can fail when
// a preview version exists, or publish that preview before the release step.
const directory = mkdtempSync(join(tmpdir(), "astralnaut-deploy-"));
try {
  const file = join(directory, "secrets.json");
  writeFileSync(file, JSON.stringify(secrets), { mode: 0o600 });
  const result = spawnSync(
    process.execPath,
    ["node_modules/wrangler/bin/wrangler.js", "deploy", "--config",
      ".output/server/wrangler.json", "--secrets-file", file],
    { stdio: "inherit" },
  );
  if (result.error || result.status !== 0)
    throw new Error("Worker deployment failed; release not confirmed");
} finally {
  rmSync(directory, { recursive: true, force: true });
}
