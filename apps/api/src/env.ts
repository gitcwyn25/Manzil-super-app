import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Loads environment variables from the monorepo root `.env` (and a local
 * `apps/api/.env` if present) without adding a dotenv dependency.
 * Values already present in process.env always win.
 */
export function loadEnv() {
  const candidates = [
    resolve(__dirname, "../../../.env"), // repo root when running from dist/
    resolve(__dirname, "../../.env"), // repo root when running via ts paths
    resolve(process.cwd(), "../../.env"),
    resolve(process.cwd(), ".env")
  ];

  for (const file of candidates) {
    if (!existsSync(file)) continue;

    const content = readFileSync(file, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      const key = match[1];
      let value = match[2];
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}
