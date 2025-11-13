# AI Workflow Installer (npx)

Initialize standardized AI workflow docs and command templates into ANY repository with ONE command.

## Quick Start

> Requires: [Node.js](https://nodejs.org/) (>= 14)

Run in the root of your target project:

```bash
npx ai-workflow-init
```

The installer will prompt you to select which AI tool(s) to configure:

- **1. Cursor** → installs `.cursor/commands` and `.cursor/prompts`
- **2. GitHub Copilot** → installs `.github/prompts`
- **3. Both** → installs both command sets and prompts

All installations include:

- `docs/ai` (planning, implementation, testing, project standards)
- `AGENTS.md` with rules and workflow overview

## Smart Installation Features

- **Protected Files**: Core documentation files (`CODE_CONVENTIONS.md`, `PROJECT_STRUCTURE.md`) are never overwritten if they already exist
- **Selective Updates**: Only `template-feature.md` and `README.md` files are updated in each documentation subfolder
- **Safe Cloning**: Uses temporary directories to ensure no data loss

## Notes

- Works on Windows (PowerShell/CMD/Git Bash), macOS, and Linux.
- After installation, commit the new files to your repository so your team can use them.

## What gets installed

- **Always installed**:
  - Documentation templates and guides under `docs/ai/`
  - `AGENTS.md` with rules and workflow overview
- **Based on your choice**:
  - `.cursor/commands/` and `.cursor/prompts/` (if Cursor is selected)
  - `.github/prompts/` (if GitHub Copilot is selected)

## Troubleshooting

- Ensure Node.js is installed and accessible in your PATH.
- If your network blocks npm registry calls, try again on a different network or with a VPN.
- Ensure you have write permissions in your project directory.
