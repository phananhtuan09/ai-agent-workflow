#!/usr/bin/env node

const { execSync } = require("child_process");
const { existsSync, mkdirSync, rmSync, cpSync, writeFileSync } = require("fs");
const readline = require("readline");
const path = require("path");

// Repo workflow gốc của bạn
const REPO = "phananhtuan09/ai-agent-workflow";
const RAW_BASE =
  "https://raw.githubusercontent.com/phananhtuan09/ai-agent-workflow/main";

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  bgBlue: "\x1b[44m",
  white: "\x1b[37m",
};

// In ra helper log
function step(msg) {
  console.log(`${colors.cyan}${msg}${colors.reset}`);
}

function success(msg) {
  console.log(`${colors.green}✅ ${msg}${colors.reset}`);
}

function skip(msg) {
  console.log(`${colors.yellow}⏭️  ${msg}${colors.reset}`);
}

function error(msg) {
  console.log(`${colors.red}❌ ${msg}${colors.reset}`);
}

function run(cmd) {
  try {
    execSync(cmd, { stdio: "inherit" });
  } catch (e) {
    error(`Failed: ${cmd}`);
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
  const subfolders = ["planning", "testing", "requirements"];

  // Xử lý folders: planning, testing, requirements
  for (const subfolder of subfolders) {
    const tempSubfolder = path.join(tempDir, subfolder);
    const destSubfolder = path.join(dest, subfolder);

    if (existsSync(tempSubfolder)) {
      mkdirSync(destSubfolder, { recursive: true });

      // Chỉ copy file template và README.md
      const filesToCopy = ["README.md", "unit-template.md", "req-template.md", "integration-template.md", "feature-template.md"];

      for (const file of filesToCopy) {
        const srcFile = path.join(tempSubfolder, file);
        const destFile = path.join(destSubfolder, file);

        if (existsSync(srcFile)) {
          cpSync(srcFile, destFile, { force: true });
        }
      }

      // Tạo folder archive nếu là requirements hoặc planning
      if (subfolder === "requirements" || subfolder === "planning") {
        const archiveDir = path.join(destSubfolder, "archive");
        if (!existsSync(archiveDir)) {
          mkdirSync(archiveDir, { recursive: true });
          console.log(`📁 Created archive folder: docs/ai/${subfolder}/archive`);
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
          skip(`Skipping (already exists): docs/ai/project/${file}`);
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

// Available AI tools configuration
const AI_TOOLS = [
  {
    id: "cursor",
    name: "Cursor",
    description: "AI-powered code editor",
    folders: [".cursor/commands", ".cursor/prompts"],
  },
  {
    id: "copilot",
    name: "GitHub Copilot",
    description: "AI pair programmer",
    folders: [".github/prompts"],
  },
  {
    id: "claude",
    name: "Claude Code",
    description: "Anthropic's AI coding assistant",
    folders: [".claude/commands", ".claude/skills", ".claude/themes"],
  },
  {
    id: "opencode",
    name: "OpenCode",
    description: "Terminal-based AI coding agent",
    folders: [".opencode/command", ".opencode/skill", ".opencode/agent"],
  },
];

// Interactive multi-select using arrow keys
async function multiSelect(options, title) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Enable raw mode for keypress detection
  if (process.stdin.isTTY) {
    readline.emitKeypressEvents(process.stdin, rl);
    process.stdin.setRawMode(true);
  }

  return new Promise((resolve) => {
    let cursor = 0;
    const selected = new Set();
    
    const render = () => {
      // Clear previous output
      process.stdout.write("\x1b[2J\x1b[H");
      
      // Header
      console.log(`\n${colors.bgBlue}${colors.white}${colors.bold} ${title} ${colors.reset}\n`);
      console.log(`${colors.dim}Use ↑↓ to navigate, Space to select, Enter to confirm, A to select all${colors.reset}\n`);
      
      options.forEach((option, index) => {
        const isSelected = selected.has(index);
        const isCursor = index === cursor;
        
        const checkbox = isSelected 
          ? `${colors.green}[✓]${colors.reset}` 
          : `${colors.dim}[ ]${colors.reset}`;
        
        const pointer = isCursor ? `${colors.cyan}❯${colors.reset}` : " ";
        const name = isCursor 
          ? `${colors.bold}${option.name}${colors.reset}` 
          : option.name;
        const desc = `${colors.dim}${option.description}${colors.reset}`;
        
        console.log(`  ${pointer} ${checkbox} ${name} - ${desc}`);
      });
      
      console.log(`\n${colors.dim}Selected: ${selected.size} tool(s)${colors.reset}`);
    };

    render();

    process.stdin.on("keypress", (str, key) => {
      if (key.name === "up") {
        cursor = cursor > 0 ? cursor - 1 : options.length - 1;
        render();
      } else if (key.name === "down") {
        cursor = cursor < options.length - 1 ? cursor + 1 : 0;
        render();
      } else if (key.name === "space") {
        if (selected.has(cursor)) {
          selected.delete(cursor);
        } else {
          selected.add(cursor);
        }
        render();
      } else if (key.name === "a") {
        // Toggle select all
        if (selected.size === options.length) {
          selected.clear();
        } else {
          options.forEach((_, i) => selected.add(i));
        }
        render();
      } else if (key.name === "return") {
        if (process.stdin.isTTY) {
          process.stdin.setRawMode(false);
        }
        rl.close();
        
        const selectedOptions = Array.from(selected).map(i => options[i]);
        resolve(selectedOptions);
      } else if (key.ctrl && key.name === "c") {
        if (process.stdin.isTTY) {
          process.stdin.setRawMode(false);
        }
        rl.close();
        process.exit(0);
      }
    });
  });
}

// Fallback simple menu for non-TTY environments
async function simpleSelect() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    console.log("\n🤖 Which AI tool(s) do you want to setup?");
    console.log("─".repeat(50));
    AI_TOOLS.forEach((tool, i) => {
      console.log(`  ${i + 1}. ${tool.name} - ${colors.dim}${tool.description}${colors.reset}`);
    });
    console.log(`  ${AI_TOOLS.length + 1}. All tools`);
    console.log("─".repeat(50));
    console.log(`${colors.dim}Enter numbers separated by comma (e.g., 1,3) or 'all'${colors.reset}`);

    rl.question("\nYour choice: ", (answer) => {
      rl.close();
      
      const input = answer.trim().toLowerCase();
      
      if (input === "all" || input === String(AI_TOOLS.length + 1)) {
        resolve(AI_TOOLS);
        return;
      }
      
      const indices = input.split(",").map(s => parseInt(s.trim()) - 1);
      const selectedTools = indices
        .filter(i => i >= 0 && i < AI_TOOLS.length)
        .map(i => AI_TOOLS[i]);
      
      if (selectedTools.length === 0) {
        error("No valid tools selected. Please try again.");
        process.exit(1);
      }
      
      resolve(selectedTools);
    });
  });
}

// Install Cursor
function installCursor() {
  step("🚚 Downloading Cursor commands (.cursor/commands)...");
  if (!existsSync(".cursor/commands")) {
    mkdirSync(".cursor/commands", { recursive: true });
  }
  run(`npx degit ${REPO}/.cursor/commands .cursor/commands --force`);

  step("🚚 Downloading Cursor prompts (.cursor/prompts)...");
  if (!existsSync(".cursor/prompts")) {
    mkdirSync(".cursor/prompts", { recursive: true });
  }
  run(`npx degit ${REPO}/.cursor/prompts .cursor/prompts --force`);
}

// Install GitHub Copilot
function installCopilot() {
  step("🚚 Downloading GitHub Copilot prompts (.github/prompts)...");
  if (!existsSync(".github/prompts")) {
    mkdirSync(".github/prompts", { recursive: true });
  }
  run(`npx degit ${REPO}/.github/prompts .github/prompts --force`);
}

// Install Claude Code
function installClaudeCode() {
  step("🚚 Downloading Claude Code commands (.claude/commands)...");
  if (!existsSync(".claude/commands")) {
    mkdirSync(".claude/commands", { recursive: true });
  }
  run(`npx degit ${REPO}/.claude/commands .claude/commands --force`);

  // Download CLAUDE.md (context memory) - only if not exists
  step("🚚 Downloading Claude Code context memory (.claude/CLAUDE.md)...");
  const claudeMdPath = ".claude/CLAUDE.md";
  if (existsSync(claudeMdPath)) {
    skip(`Skipping (already exists): ${claudeMdPath}`);
  } else {
    try {
      run(`curl -fsSL ${RAW_BASE}/.claude/CLAUDE.md -o ${claudeMdPath}`);
    } catch (_) {
      run(`wget -qO ${claudeMdPath} ${RAW_BASE}/.claude/CLAUDE.md`);
    }
  }

  // Download hooks.json (always overwrite to get latest)
  step("🚚 Downloading Claude Code hooks (.claude/hooks.json)...");
  try {
    run(`curl -fsSL ${RAW_BASE}/.claude/hooks.json -o .claude/hooks.json`);
  } catch (_) {
    run(`wget -qO .claude/hooks.json ${RAW_BASE}/.claude/hooks.json`);
  }

  // Download skills folder (always overwrite to get latest)
  step("🚚 Downloading Claude Code skills (.claude/skills)...");
  if (!existsSync(".claude/skills")) {
    mkdirSync(".claude/skills", { recursive: true });
  }
  run(`npx degit ${REPO}/.claude/skills .claude/skills --force`);

  // Download themes folder (always overwrite to get latest)
  step("🚚 Downloading Claude Code themes (.claude/themes)...");
  if (!existsSync(".claude/themes")) {
    mkdirSync(".claude/themes", { recursive: true });
  }
  run(`npx degit ${REPO}/.claude/themes .claude/themes --force`);
}

// Install OpenCode
function installOpenCode() {
  step("🚚 Downloading OpenCode commands (.opencode/command)...");
  if (!existsSync(".opencode/command")) {
    mkdirSync(".opencode/command", { recursive: true });
  }
  
  // Check if source exists, if not create from Claude commands
  try {
    run(`npx degit ${REPO}/.opencode/command .opencode/command --force`);
  } catch (e) {
    console.log(`${colors.yellow}⚠️  OpenCode commands not found in repo, will be synced from Claude Code${colors.reset}`);
  }

  step("🚚 Downloading OpenCode skills (.opencode/skill)...");
  if (!existsSync(".opencode/skill")) {
    mkdirSync(".opencode/skill", { recursive: true });
  }
  
  // Check if source exists, if not create from Claude skills
  try {
    run(`npx degit ${REPO}/.opencode/skill .opencode/skill --force`);
  } catch (e) {
    console.log(`${colors.yellow}⚠️  OpenCode skills not found in repo, will be synced from Claude Code${colors.reset}`);
  }

  step("🚚 Downloading OpenCode agents (.opencode/agent)...");
  if (!existsSync(".opencode/agent")) {
    mkdirSync(".opencode/agent", { recursive: true });
  }
  
  // Check if source exists
  try {
    run(`npx degit ${REPO}/.opencode/agent .opencode/agent --force`);
  } catch (e) {
    console.log(`${colors.yellow}⚠️  OpenCode agents not found in repo, using built-in agents${colors.reset}`);
  }

  // Create opencode.json if not exists
  step("🚚 Setting up OpenCode config (opencode.json)...");
  const opencodeConfigPath = "opencode.json";
  if (existsSync(opencodeConfigPath)) {
    skip(`Skipping (already exists): ${opencodeConfigPath}`);
  } else {
    const opencodeConfig = {
      "$schema": "https://opencode.ai/config.json",
      "instructions": [
        "AGENTS.md",
        "docs/ai/project/CODE_CONVENTIONS.md",
        "docs/ai/project/PROJECT_STRUCTURE.md"
      ]
    };
    writeFileSync(opencodeConfigPath, JSON.stringify(opencodeConfig, null, 2));
    success(`Created: ${opencodeConfigPath}`);
  }
}

async function main() {
  console.log(`
${colors.cyan}╔═══════════════════════════════════════════════════════════╗
║                                                             ║
║   ${colors.bold}🤖 AI Workflow Installer${colors.reset}${colors.cyan}                               ║
║                                                             ║
║   Setup AI coding workflows for your project                ║
║                                                             ║
╚═══════════════════════════════════════════════════════════╝${colors.reset}
`);

  let selectedTools;
  
  // Use interactive multi-select if TTY, otherwise fallback to simple menu
  if (process.stdin.isTTY) {
    selectedTools = await multiSelect(AI_TOOLS, "🤖 Select AI Tools to Install");
    
    if (selectedTools.length === 0) {
      error("No tools selected. Exiting.");
      process.exit(1);
    }
  } else {
    selectedTools = await simpleSelect();
  }

  // Clear screen and show selection
  if (process.stdin.isTTY) {
    process.stdout.write("\x1b[2J\x1b[H");
  }
  
  console.log(`\n${colors.green}Selected tools:${colors.reset}`);
  selectedTools.forEach(tool => {
    console.log(`  ${colors.cyan}✓${colors.reset} ${tool.name}`);
  });
  console.log();

  // Clone docs/ai một cách an toàn, bảo vệ các file quan trọng
  step("🚚 Downloading workflow template (docs/ai)...");
  cloneDocsAI(`${REPO}/docs/ai`, "docs/ai");

  // Create docs/dev folder for dev documentation output
  step("📁 Creating docs/dev folder...");
  if (!existsSync("docs/dev")) {
    mkdirSync("docs/dev", { recursive: true });
    success("Created: docs/dev");
  } else {
    skip("Skipping (already exists): docs/dev");
  }

  // Install selected tools
  const toolIds = selectedTools.map(t => t.id);
  
  if (toolIds.includes("cursor")) {
    installCursor();
  }
  
  if (toolIds.includes("copilot")) {
    installCopilot();
  }
  
  if (toolIds.includes("claude")) {
    installClaudeCode();
  }
  
  if (toolIds.includes("opencode")) {
    installOpenCode();
  }

  // Download AGENTS.md (luôn ghi đè)
  step("🚚 Downloading AGENTS.md...");
  try {
    run(`curl -fsSL ${RAW_BASE}/AGENTS.md -o AGENTS.md`);
  } catch (_) {
    // Fallback cho môi trường không có curl
    run(`wget -qO AGENTS.md ${RAW_BASE}/AGENTS.md`);
  }

  // Final summary
  console.log(`
${colors.green}╔═══════════════════════════════════════════════════════════╗
║                                                             ║
║   ${colors.bold}✅ Installation Complete!${colors.reset}${colors.green}                              ║
║                                                             ║
╚═══════════════════════════════════════════════════════════╝${colors.reset}

${colors.cyan}Installed tools:${colors.reset}
${selectedTools.map(t => `  ✓ ${t.name}`).join("\n")}

${colors.cyan}Files created:${colors.reset}
  ✓ docs/ai/ - AI workflow documentation
  ✓ AGENTS.md - Base instructions for all AI tools
${selectedTools.map(t => t.folders.map(f => `  ✓ ${f}/`).join("\n")).join("\n")}

${colors.yellow}Next steps:${colors.reset}
  1. Review and customize AGENTS.md for your project
  2. Run your AI tool's commands (e.g., /create-plan)
  3. Check docs/ai/project/ for coding conventions

${colors.dim}Run 'npx ai-workflow-init' again to add more tools${colors.reset}
`);
}

main().catch(e => {
  error(e.message);
  process.exit(1);
});
