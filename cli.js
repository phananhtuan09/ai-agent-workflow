#!/usr/bin/env node

const { execSync } = require("child_process");
const { existsSync, mkdirSync, rmSync, cpSync, readdirSync } = require("fs");
const readline = require("readline");
const path = require("path");

// Repo workflow gốc của bạn
const REPO = "phananhtuan09/ai-agent-workflow";
const RAW_BASE =
  "https://raw.githubusercontent.com/phananhtuan09/ai-agent-workflow/main";

// In ra helper log
function step(msg) {
  console.log("\x1b[36m%s\x1b[0m", msg); // cyan
}

function run(cmd) {
  try {
    execSync(cmd, { stdio: "inherit" });
  } catch (e) {
    console.error("❌ Failed:", cmd);
    process.exit(1);
  }
}

// Clone folder luôn ghi đè
function cloneFolderForce(source, dest) {
  mkdirSync(path.dirname(dest), { recursive: true });
  const tempDir = path.join(dest, ".temp-clone");

  // Xóa temp folder nếu tồn tại
  if (existsSync(tempDir)) {
    rmSync(tempDir, { recursive: true, force: true });
  }

  run(`npx degit ${source} ${tempDir} --force`);

  // Tạo dest folder nếu chưa có
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }

  // Copy tất cả files từ temp vào dest (ghi đè toàn bộ)
  const filesToCopy = execSync(`find ${tempDir} -type f`, { encoding: "utf8" })
    .trim()
    .split("\n")
    .filter(Boolean);

  for (const file of filesToCopy) {
    const relativePath = path.relative(tempDir, file);
    const destFile = path.join(dest, relativePath);

    // Tạo folder nếu cần
    mkdirSync(path.dirname(destFile), { recursive: true });

    // Copy file với ghi đè
    cpSync(file, destFile, { force: true });
  }

  // Xóa temp folder
  rmSync(tempDir, { recursive: true, force: true });
}

// Clone folder docs/ai một cách an toàn
function cloneDocsAI(source, dest) {
  mkdirSync(dest, { recursive: true });
  const tempDir = path.join(dest, ".temp-clone");

  // Xóa temp folder nếu tồn tại
  if (existsSync(tempDir)) {
    rmSync(tempDir, { recursive: true, force: true });
  }

  run(`npx degit ${source} ${tempDir} --force`);

  // Xử lý từng subfolder
  const subfolders = ["implementation", "planning", "testing"];

  // Xử lý folders: implementation, planning, testing
  for (const subfolder of subfolders) {
    const tempSubfolder = path.join(tempDir, subfolder);
    const destSubfolder = path.join(dest, subfolder);

    if (existsSync(tempSubfolder)) {
      mkdirSync(destSubfolder, { recursive: true });

      // Chỉ copy file template và README.md
      const filesToCopy = ["README.md", "feature-template.md"];

      for (const file of filesToCopy) {
        const srcFile = path.join(tempSubfolder, file);
        const destFile = path.join(destSubfolder, file);

        if (existsSync(srcFile)) {
          cpSync(srcFile, destFile, { force: true });
        }
      }
    }
  }

  // Xử lý folder: project
  const tempProject = path.join(tempDir, "project");
  const destProject = path.join(dest, "project");

  if (existsSync(tempProject)) {
    mkdirSync(destProject, { recursive: true });

    // 1. Chỉ tạo CODE_CONVENTIONS.md và PROJECT_STRUCTURE.md nếu chưa có
    const protectedFiles = [
      "CODE_CONVENTIONS.md",
      "PROJECT_STRUCTURE.md",
      "README.md",
    ];

    for (const file of protectedFiles) {
      const srcFile = path.join(tempProject, file);
      const destFile = path.join(destProject, file);

      if (existsSync(srcFile)) {
        // Nếu là CODE_CONVENTIONS.md hoặc PROJECT_STRUCTURE.md, chỉ tạo nếu chưa có
        if (
          (file === "CODE_CONVENTIONS.md" || file === "PROJECT_STRUCTURE.md") &&
          existsSync(destFile)
        ) {
          console.log(`⏭️  Skipping (already exists): docs/ai/project/${file}`);
          continue;
        }

        // Các file khác luôn ghi đè
        cpSync(srcFile, destFile, { force: true });
      }
    }

    // 2. Ghi đè folder template-convention
    const tempTemplateConvention = path.join(
      tempProject,
      "template-convention"
    );
    const destTemplateConvention = path.join(
      destProject,
      "template-convention"
    );

    if (existsSync(tempTemplateConvention)) {
      // Xóa folder cũ nếu tồn tại
      if (existsSync(destTemplateConvention)) {
        rmSync(destTemplateConvention, { recursive: true, force: true });
      }

      // Copy folder mới
      cpSync(tempTemplateConvention, destTemplateConvention, {
        recursive: true,
        force: true,
      });
    }
  }

  // Xóa temp folder
  rmSync(tempDir, { recursive: true, force: true });
}

// Hỏi user chọn IDE
function askIDE() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    console.log("\n🤖 Which AI tool(s) do you want to setup?");
    console.log("1. Cursor");
    console.log("2. GitHub Copilot");
    console.log("3. Claude Code");
    console.log("4. All");

    rl.question("\nEnter your choice (1-4): ", (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  const choice = await askIDE();
  const installCursor = ["1", "4"].includes(choice);
  const installCopilot = ["2", "4"].includes(choice);
  const installClaudeCode = ["3", "4"].includes(choice);

  if (!["1", "2", "3", "4"].includes(choice)) {
    console.error("❌ Invalid choice. Please enter 1, 2, 3, or 4.");
    process.exit(1);
  }

  // Clone docs/ai một cách an toàn, bảo vệ các file quan trọng
  step("🚚 Downloading workflow template (docs/ai)...");
  cloneDocsAI(`${REPO}/docs/ai`, "docs/ai");

  // Clone Cursor commands (luôn ghi đè)
  if (installCursor) {
    if (!existsSync(".cursor/commands")) {
      mkdirSync(".cursor/commands", { recursive: true });
    }
    step("🚚 Downloading Cursor agent commands (.cursor/commands)...");
    run(`npx degit ${REPO}/.cursor/commands .cursor/commands --force`);
  }

  // Clone GitHub Copilot prompts (luôn ghi đè)
  if (installCopilot) {
    if (!existsSync(".github/prompts")) {
      mkdirSync(".github/prompts", { recursive: true });
    }
    step("🚚 Downloading GitHub Copilot prompts (.github/prompts)...");
    run(`npx degit ${REPO}/.github/prompts .github/prompts --force`);
  }

  // Clone Claude Code commands (luôn ghi đè)
  if (installClaudeCode) {
    if (!existsSync(".claude/commands")) {
      mkdirSync(".claude/commands", { recursive: true });
    }
    step("🚚 Downloading Claude Code commands (.claude/commands)...");
    run(`npx degit ${REPO}/.claude/commands .claude/commands --force`);
  }

  // Clone Cursor prompts (luôn ghi đè)
  if (installCursor) {
    if (!existsSync(".cursor/prompts")) {
      mkdirSync(".cursor/prompts", { recursive: true });
    }
    step("🚚 Downloading Cursor prompts (.cursor/prompts)...");
    run(`npx degit ${REPO}/.cursor/prompts .cursor/prompts --force`);
  }

  // Download AGENTS.md (luôn ghi đè)
  step("🚚 Downloading AGENTS.md...");
  try {
    run(`curl -fsSL ${RAW_BASE}/AGENTS.md -o AGENTS.md`);
  } catch (_) {
    // Fallback cho môi trường không có curl
    run(`wget -qO AGENTS.md ${RAW_BASE}/AGENTS.md`);
  }

  step(
    "✅ All AI workflow docs and selected command templates have been copied!"
  );
  console.log(
    "\n🌱 You can now use your AI workflow! Edit docs/ai/ and AGENTS.md as needed.\n"
  );
}

main();
