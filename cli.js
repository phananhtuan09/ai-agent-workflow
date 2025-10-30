#!/usr/bin/env node

const { execSync } = require('child_process');
const { existsSync, mkdirSync } = require('fs');

// Repo workflow gốc của bạn
const REPO = 'phananhtuan09/ai-agent-workflow';
const RAW_BASE = 'https://raw.githubusercontent.com/phananhtuan09/ai-agent-workflow/main';

// In ra helper log
function step(msg) {
  console.log('\x1b[36m%s\x1b[0m', msg); // cyan
}

function run(cmd) {
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (e) {
    console.error('❌ Failed:', cmd);
    process.exit(1);
  }
}

// Kiểm tra và tạo folder nếu chưa có
if (!existsSync('docs/ai')) {
  mkdirSync('docs/ai', { recursive: true });
}
if (!existsSync('.cursor/commands')) {
  mkdirSync('.cursor/commands', { recursive: true });
}

step('🚚 Downloading workflow template (docs/ai)...');
run(`npx degit ${REPO}/docs/ai docs/ai --force`);

step('🚚 Downloading agent commands (.cursor/commands)...');
run(`npx degit ${REPO}/.cursor/commands .cursor/commands --force`);

step('🚚 Downloading AGENTS.md ...');
// degit không hỗ trợ tải 1 file đơn lẻ -> dùng raw github
try {
  run(`curl -fsSL ${RAW_BASE}/AGENTS.md -o AGENTS.md`);
} catch (_) {
  // Fallback cho môi trường không có curl
  run(`wget -qO AGENTS.md ${RAW_BASE}/AGENTS.md`);
}

step('✅ All AI workflow docs, command templates, and AGENTS.md have been copied!');
console.log('\n🌱 You can now use your AI workflow! Edit docs/ai/ and AGENTS.md as needed.\n');