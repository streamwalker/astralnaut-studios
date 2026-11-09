import { spawnSync } from "node:child_process";
for (const binding of ["GRIDIRON_LIBRARY_KEY_V5", "GRIDIRON_COMICS_KEY_V7"]) {
  const key = process.env[binding];
  if (!key || Buffer.from(key, "base64").length !== 32)
    throw new Error("Required private content key is missing");
  const result = spawnSync(
    "node",
    [
      "node_modules/wrangler/bin/wrangler.js",
      "secret",
      "put",
      binding,
      "--config",
      ".output/server/wrangler.json",
    ],
    { input: key + "\n", encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] },
  );
  if (result.status !== 0)
    throw new Error("Private content key provisioning failed; deployment stopped");
}
console.log("Private library and comic keys configured.");
