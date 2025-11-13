#!/usr/bin/env node

const { execSync } = require("child_process");
const { existsSync, mkdirSync } = require("fs");
const readline = require("readline");

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

// Hỏi user chọn IDE
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askIDE() {
  return new Promise((resolve) => {
    console.log("\n🤖 Which AI tool(s) do you want to setup?");
    console.log("1. Cursor");
    console.log("2. GitHub Copilot");
    console.log("3. Both");

    rl.question("\nEnter your choice (1-3): ", (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  const choice = await askIDE();
  const installCursor = ["1", "3"].includes(choice);
  const installCopilot = ["2", "3"].includes(choice);

  if (!["1", "2", "3"].includes(choice)) {
    console.error("❌ Invalid choice. Please enter 1, 2, or 3.");
    process.exit(1);
  }

  // Kiểm tra và tạo folder nếu chưa có
  if (!existsSync("docs/ai")) {
    mkdirSync("docs/ai", { recursive: true });
  }

  step("🚚 Downloading workflow template (docs/ai)...");
  run(`npx degit ${REPO}/docs/ai docs/ai --force`);

  // Clone Cursor commands
  if (installCursor) {
    if (!existsSync(".cursor/commands")) {
      mkdirSync(".cursor/commands", { recursive: true });
    }
    step("🚚 Downloading Cursor agent commands (.cursor/commands)...");
    run(`npx degit ${REPO}/.cursor/commands .cursor/commands --force`);
  }

  // Clone GitHub Copilot commands (nếu có folder khác)
  if (installCopilot) {
    if (!existsSync(".copilot/commands")) {
      mkdirSync(".copilot/commands", { recursive: true });
    }
    step("🚚 Downloading GitHub Copilot agent commands (.copilot/commands)...");
    run(`npx degit ${REPO}/.copilot/commands .copilot/commands --force`);
  }

  step("🚚 Downloading AGENTS.md ...");
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
