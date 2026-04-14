import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const websiteRoot = path.resolve(currentDir, "..");
const sourceRoot = path.resolve(websiteRoot, "..", ".agents", "skills");
const targetRoot = path.resolve(websiteRoot, "content", "skills");

async function main() {
  await mkdir(targetRoot, { recursive: true });

  const entries = await readdir(sourceRoot, { withFileTypes: true });
  const copied = [];
  const skipped = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const sourceFile = path.join(sourceRoot, entry.name, "SKILL.md");
    const targetFile = path.join(targetRoot, `${entry.name}.md`);

    if (!existsSync(sourceFile)) {
      skipped.push(entry.name);
      continue;
    }

    const content = await readFile(sourceFile, "utf8");
    await writeFile(targetFile, content, "utf8");
    copied.push(entry.name);
  }

  console.log(
    `[sync:skills] copied ${copied.length} files into website/content/skills`,
  );

  if (skipped.length > 0) {
    console.warn(
      `[sync:skills] skipped folders without SKILL.md: ${skipped.join(", ")}`,
    );
  }
}

main().catch((error) => {
  console.error("[sync:skills] failed to sync skills");
  console.error(error);
  process.exit(1);
});
