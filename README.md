# AI DevKit Workflow Quick Start

This repository contains standardized project documentation, workflow templates, and AI agent configuration for structured development in any codebase.

## How to Integrate into Any Project

You have two methods to quickly add the workflow docs & agent commands into ANY repo:

---

## 1. Using degit (**Recommended, cross-platform**)

> **Requires:** [Node.js](https://nodejs.org/) (includes npx & degit on Windows, Ubuntu, Mac)

**Step 1:** Install degit *(optional—can use npx degit directly)*
```bash
npm install -g degit
```

**Step 2:** Run (in your target repo root):
```bash
npx degit your-username/ai-devkit-workflow-template/docs/ai docs/ai
npx degit your-username/ai-devkit-workflow-template/.cursor/commands .cursor/commands
```
- This will copy all workflow docs and AI command templates to the current project.
- Compatible with Windows Powershell, CMD, GitBash, WSL, Ubuntu/macOS terminals.

---

## 2. Using npx script (when available)

> **Requires:** Node.js (>= v14). No other global install required.

When a published init package is available, just run:
```bash
npx @your-org/ai-devkit-workflow-init
```
- The script will automatically fetch the workflow files and set up your repo.

---

## 3. Manual method (fallback)

Clone this repo and copy files:
```bash
git clone https://github.com/your-username/ai-devkit-workflow-template.git ai-template-tmp
cp -r ai-template-tmp/docs/ai ./docs/
cp -r ai-template-tmp/.cursor/commands ./.cursor/
rm -rf ai-template-tmp
```

---
## Notes
- All commands work identically on Windows, Ubuntu, Mac if Node.js is installed.
- If you want to contribute updates to templates, fork this repo!

---
*See INTEGRATE.md in this repo for more advanced integration and troubleshooting.*
