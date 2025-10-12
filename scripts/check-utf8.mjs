#!/usr/bin/env node

import { readFileSync, readdirSync, statSync } from "node:fs";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const patterns = [
  { regex: /\uFFFD/, label: "replacement character (�)" },
  { regex: /Ã[A-Za-z0-9]/, label: 'sequence starting with "Ã"' },
  { regex: /Â[A-Za-z0-9]/, label: 'sequence starting with "Â"' },
  { regex: /&Atilde;|&Acirc;/, label: "HTML entity mojibake" },
];

const ignoreDirs = new Set([".git", "node_modules", "dist", "build", ".vercel"]);

const walk = (dir) => {
  const entries = readdirSync(dir);
  const files = [];
  for (const entry of entries) {
    const fullPath = resolve(dir, entry);
    const rel = relative(repoRoot, fullPath);
    if (ignoreDirs.has(entry)) continue;
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      files.push(...walk(fullPath));
    } else if (stats.isFile()) {
      files.push(rel);
    }
  }
  return files;
};

const textExtensions = new Set([
  ".js",
  ".cjs",
  ".mjs",
  ".ts",
  ".tsx",
  ".jsx",
  ".json",
  ".md",
  ".html",
  ".css",
  ".scss",
  ".sass",
  ".less",
  ".txt",
  ".env",
  ".env.example",
  ".yml",
  ".yaml",
  ".svg",
  ".tsv",
  ".csv",
  ".lock",
]);

const gitList = walk(repoRoot).filter((file) => {
  const normalized = file.replace(/\\/g, "/");
  if (normalized === "scripts/check-utf8.mjs") return false;
  const lower = normalized.toLowerCase();
  if (lower.endsWith(".lockb")) return false;
  for (const ext of textExtensions) {
    if (lower.endsWith(ext)) return true;
  }
  return false;
});

let issuesFound = 0;

for (const file of gitList) {
  const content = readFileSync(resolve(repoRoot, file), "utf8");
  for (const { regex, label } of patterns) {
    if (regex.test(content)) {
      issuesFound += 1;
      console.error(
        `[utf8-check] Potential mojibake "${label}" found in ${relative(
          repoRoot,
          resolve(repoRoot, file),
        )}`,
      );
      break;
    }
  }
}

if (issuesFound > 0) {
  console.error(
    `[utf8-check] Found ${issuesFound} file${issuesFound === 1 ? "" : "s"} with mojibake patterns. Fix them before committing.`,
  );
  process.exit(1);
}

console.log("[utf8-check] No mojibake patterns detected.");
