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

function step(message) {
  console.log(`${colors.cyan}${message}${colors.reset}`);
}

function success(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function skip(message) {
  console.log(`${colors.yellow}⏭️  ${message}${colors.reset}`);
}

function warn(message) {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

function error(message) {
  console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

function printBanner() {
  console.log(`
${colors.cyan}╔═══════════════════════════════════════════════════════════╗
║                                                             ║
║   ${colors.bold}🤖 AI Workflow Installer${colors.reset}${colors.cyan}                               ║
║                                                             ║
║   Setup AI coding workflows for your project                ║
║                                                             ║
╚═══════════════════════════════════════════════════════════╝${colors.reset}
`);
}

function printSelectedTools(selectedTools) {
  console.log(`\n${colors.green}Selected tools:${colors.reset}`);
  selectedTools.forEach((tool) => {
    console.log(`  ${colors.cyan}✓${colors.reset} ${tool.name}`);
  });
  console.log();
}

function printSummary(selectedTools) {
  const installedPaths = new Set(["docs/ai", "AGENTS.md"]);

  selectedTools.forEach((tool) => {
    tool.folders.forEach((folder) => installedPaths.add(folder));
  });

  console.log(`
${colors.green}╔═══════════════════════════════════════════════════════════╗
║                                                             ║
║   ${colors.bold}✅ Installation Complete!${colors.reset}${colors.green}                              ║
║                                                             ║
╚═══════════════════════════════════════════════════════════╝${colors.reset}

${colors.cyan}Installed tools:${colors.reset}
${selectedTools.map((tool) => `  ✓ ${tool.name}`).join("\n")}

${colors.cyan}Files created:${colors.reset}
${Array.from(installedPaths).map((item) => `  ✓ ${item}`).join("\n")}

${colors.yellow}Next steps:${colors.reset}
  1. Review and customize AGENTS.md for your project
  2. For Codex and Antigravity, keep shared skills in .agents/skills
  3. Check docs/ai/project/ for coding conventions

${colors.dim}Run the installer again to add more tools${colors.reset}
`);
}

module.exports = {
  colors,
  error,
  printBanner,
  printSelectedTools,
  printSummary,
  skip,
  step,
  success,
  warn,
};
