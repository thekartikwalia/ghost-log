/**
 * Seed script: add test applications with appliedDate 14+ days ago for testing the ghost feature.
 *
 * Prerequisites:
 * - AZURE_TABLE_STORAGE_CONNECTION_STRING set (e.g. in local.settings.json or env)
 * - USER_ID = your Google sub (get from extension: sign in, then chrome.storage.local.get("ghostlog_user_id"))
 *
 * Run from backend folder:
 *   USER_ID=<your-google-sub> npx ts-node src/scripts/seed-ghosted-apps.ts
 *   or after build:
 *   USER_ID=<your-google-sub> node dist/scripts/seed-ghosted-apps.js
 *
 * Loads local.settings.json into process.env when present (so you can omit env vars if set there).
 */

import * as fs from "fs";
import * as path from "path";
import { createApplicationWithDate } from "../services/tableStorage";

function loadLocalSettings(): void {
  const possiblePaths = [
    path.join(process.cwd(), "local.settings.json"),
    path.join(__dirname, "../../local.settings.json"),
  ];
  for (const p of possiblePaths) {
    try {
      const content = fs.readFileSync(p, "utf-8");
      const json = JSON.parse(content) as { Values?: Record<string, string> };
      if (json.Values) {
        for (const [k, v] of Object.entries(json.Values)) {
          if (v != null && process.env[k] == null) process.env[k] = String(v);
        }
      }
      return;
    } catch {
      continue;
    }
  }
}

const SEED_APPLICATIONS = [
  { company: "Acme Corp", role: "Senior Engineer", sourceUrl: "https://example.com/jobs/1" },
  { company: "TechStart Inc", role: "Frontend Developer", sourceUrl: "https://example.com/jobs/2" },
  { company: "BigCo Ltd", role: "Software Engineer", sourceUrl: "https://example.com/jobs/3" },
  { company: "StartupXYZ", role: "Full Stack Developer", sourceUrl: "https://example.com/jobs/4" },
  { company: "DesignCo", role: "Product Designer", sourceUrl: "https://example.com/jobs/5" },
];

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

async function main(): Promise<void> {
  loadLocalSettings();

  const userId = process.env.USER_ID || process.env.GHOSTLOG_SEED_USER_ID;
  if (!userId) {
    console.error("USER_ID (or GHOSTLOG_SEED_USER_ID) is required. Get it from the extension after sign-in:");
    console.error("  chrome.storage.local.get(['ghostlog_user_id'], (r) => console.log(r.ghostlog_user_id));");
    process.exit(1);
  }

  if (!process.env.AZURE_TABLE_STORAGE_CONNECTION_STRING) {
    console.error("AZURE_TABLE_STORAGE_CONNECTION_STRING is not set. Set it in local.settings.json or env.");
    process.exit(1);
  }

  const daysBack = [15, 16, 17, 18, 20]; // 14+ days so all count as ghosted
  console.log("Seeding", SEED_APPLICATIONS.length, "applications with status Applied and appliedDate 15–20 days ago...");

  for (let i = 0; i < SEED_APPLICATIONS.length; i++) {
    const app = SEED_APPLICATIONS[i];
    const appliedDate = daysAgoISO(daysBack[i % daysBack.length]);
    await createApplicationWithDate(
      userId,
      { ...app, status: "Applied" },
      appliedDate
    );
    console.log("  Created:", app.company, "–", app.role, "(" + (daysBack[i % daysBack.length]) + " days ago)");
  }

  console.log("Done. Open the GhostLog dashboard and use the Ghosted filter to see them.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
