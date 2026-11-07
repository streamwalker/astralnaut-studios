// Run only for a new version. Plaintext source stays in the private creative workspace.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, join } from "node:path";
import { randomBytes, createCipheriv, createDecipheriv, createHash } from "node:crypto";
import { gzipSync, gunzipSync } from "node:zlib";
import { spawnSync } from "node:child_process";
if (!process.argv[2]) throw new Error("Pass the private comic-reader directory");
const source = resolve(process.argv[2]),
  binding = "GRIDIRON_COMICS_KEY_V2";
const secrets = spawnSync(
  "gh",
  ["secret", "list", "--repo", "streamwalker/astralnaut-studios", "--json", "name"],
  { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
);
if (secrets.status !== 0) throw new Error("Cannot verify deployment secret names");
if (JSON.parse(secrets.stdout).some((s) => s.name === binding))
  throw new Error(
    "Version already exists; introduce a new version rather than rotating a live key.",
  );
const sourceData = JSON.parse(await readFile(join(source, "library.json"), "utf8"));
const catalog = {
  revision: sourceData.revision,
  counts: sourceData.counts,
  pages: sourceData.pages.map((p) => ({
    id: p.id,
    season: p.season,
    episode: p.episode,
    page: p.page,
    title: p.title,
    edition: p.edition,
    current: p.current,
    note: p.note,
    url: `/api/admin/gridiron-zero/comics/${p.id}`,
  })),
};
const key = randomBytes(32),
  entries = [];
function encrypt(name, plain) {
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", key, iv);
  const bytes = Buffer.concat([
    iv,
    cipher.update(gzipSync(plain)),
    cipher.final(),
    cipher.getAuthTag(),
  ]);
  const check = createDecipheriv("aes-256-gcm", key, iv);
  check.setAuthTag(bytes.subarray(-16));
  if (
    !gunzipSync(Buffer.concat([check.update(bytes.subarray(12, -16)), check.final()])).equals(plain)
  )
    throw new Error("Round-trip failed");
  entries.push({ name, bytes, sha256: createHash("sha256").update(bytes).digest("hex") });
}
encrypt("catalog.enc", Buffer.from(JSON.stringify(catalog)));
for (const p of sourceData.pages) {
  if (!/^[a-f0-9]{18}$/.test(p.id)) throw new Error("Unexpected page identity");
  const bytes = await readFile(join(source, "embedded-assets", `${p.id}-${p.modified}.jpg`));
  if (bytes[0] !== 255 || bytes[1] !== 216) throw new Error("Expected JPEG viewing asset");
  encrypt(p.id + ".enc", bytes);
}
const result = spawnSync(
  "gh",
  ["secret", "set", binding, "--repo", "streamwalker/astralnaut-studios"],
  { input: key.toString("base64"), encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] },
);
if (result.status !== 0) throw new Error("Secret provisioning failed; payload not written");
const output = "private-content/gridiron-zero/comics-v2";
await mkdir(output, { recursive: true });
for (const e of entries) await writeFile(join(output, e.name), e.bytes);
await writeFile(
  join(output, "manifest.json"),
  JSON.stringify(
    {
      version: 2,
      keyBinding: binding,
      counts: sourceData.counts,
      files: entries.map(({ name, bytes, sha256 }) => ({ name, bytes: bytes.length, sha256 })),
    },
    null,
    2,
  ) + "\n",
);
key.fill(0);
console.log(
  JSON.stringify({
    encryptedFiles: entries.length,
    pages: catalog.pages.length,
    roundTripVerified: true,
    deploymentSecretConfigured: true,
  }),
);
