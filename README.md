# AI Workflow Installer (npx)

Initialize standardized AI workflow docs and command templates into ANY repository with ONE command.

## Quick Start

> Requires: [Node.js](https://nodejs.org/) (>= 14)

Run in the root of your target project:
```bash
npx ai-workflow-init
```
This will automatically fetch and place:
- `docs/ai` (planning, implementation, testing, project standards)
- `.cursor/commands` (AI agent commands)
- `AGENTS.md`

## Notes
- Works on Windows (PowerShell/CMD/Git Bash), macOS, and Linux.
- If the destination folders already exist, the installer will overwrite files as needed.
- After installation, commit the new files to your repository so your team can use them.

## What gets installed
- Documentation templates and guides under `docs/ai/`
- AI agent commands under `.cursor/commands/`
- `AGENTS.md` with rules and workflow overview

## Troubleshooting
- Ensure Node.js is installed and accessible in your PATH.
- If your network blocks npm registry calls, try again on a different network or with a VPN.
