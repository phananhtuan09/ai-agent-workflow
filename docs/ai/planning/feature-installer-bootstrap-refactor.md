# Plan: Installer Bootstrap Refactor

Note: All content in this document must be written in English.

---
epic_plan: null
requirement: null
---

## 1. Codebase Context

### Similar Features
- `cli.js` - Existing interactive installer, tool selection flow, and file overwrite rules that must be preserved.

### Key Files to Reference
- `cli.js` - Current source of truth for installer behavior.
- `README.md` - Public installation instructions and CLI examples.
- `package.json` - CLI entrypoint and publishable file list.

---

## 3. Goal & Acceptance Criteria

### Goal
- Replace the npm/degit-based transport with a GitHub bootstrap flow while keeping the current one-command interactive installer behavior and overwrite rules.
- Refactor the CLI into small CommonJS modules so the main entrypoint stays short and easier to maintain.

### Acceptance Criteria (Given/When/Then)
- Given a repository with Node.js available
- When the user runs the bootstrap installer
- Then the workflow CLI starts with the same interactive tool selection flow as before

- Given the user selects one or more AI tools
- When installation runs
- Then the installer copies workflow assets from the downloaded repository snapshot and preserves the current overwrite and protected-file logic

- Given the user runs `node cli.js --tool <tool>` from a local checkout
- When installation runs
- Then the CLI installs from local source files without requiring `npm`, `npx`, or `degit`

- Given the codebase after refactor
- When a maintainer reads the entrypoint
- Then `cli.js` is thin and the installer logic is split into focused modules

## 4. Risks & Assumptions

### Risks
- Bootstrap scripts can drift from CLI expectations if archive layout assumptions are wrong.
- Claude statusline setup touches the user home directory and must keep current preservation behavior.
- Refactoring a large installer can accidentally change overwrite semantics for templates or protected files.

### Assumptions
- The bootstrap flow can require Node.js and standard archive tools available on the target platform.
- Current overwrite behavior is the compatibility target, even if some parts are verbose or uneven.
- Existing npm-based usage can remain as an optional fallback, but the new primary path must not depend on npmjs.

## 5. Definition of Done
- [x] Build passes for touched JavaScript entrypoints
- [x] Refactored installer preserves tool selection and file sync behavior
- [x] Documentation updated for the bootstrap installer flow
- [x] Planning doc checkboxes reflect completed implementation work

---

## 6. Implementation Plan

### Phase 1: Split CLI and replace transport

- [x] [ADDED] `lib/config.js`, `lib/logger.js`, `lib/selection.js`, `lib/fs-utils.js` - Extract shared configuration, terminal rendering, argument parsing, and copy helpers from the monolithic CLI.
  - Pseudo-code:
    ```js
    export repo metadata and AI tool definitions
    export banner/log helpers with shared ANSI colors
    export CLI flag parsing and interactive selection helpers
    export recursive copy helpers that do not rely on fs.cpSync or degit
    ```

- [x] [ADDED] `lib/install.js`, `lib/main.js` - Move installer orchestration and local-source sync logic into reusable modules.
  - Pseudo-code:
    ```js
    resolve sourceRoot from current repository checkout
    copy docs/ai with special handling for protected files and replaced template folders
    install each selected tool by copying matching source folders into process.cwd()
    install Claude statusline from local source and preserve user settings.json keys
    ```

- [x] [MODIFIED] `cli.js` - Reduce the root entrypoint to a thin wrapper around the refactored modules.
  - Pseudo-code:
    ```js
    require main()
    catch top-level errors
    print user-facing error
    exit non-zero
    ```

- [x] [MODIFIED] `package.json`, `package-lock.json` - Remove the degit runtime dependency and include refactored runtime files in the published package layout.
  - Pseudo-code:
    ```json
    remove degit dependency
    add lib/ and installer scripts to published files
    keep bin entrypoint unchanged for npm fallback usage
    ```

### Phase 2: Add bootstrap installer and update docs

- [x] [ADDED] `install.sh`, `install.ps1` - Provide one-command bootstrap scripts that download a GitHub archive, extract it to a temp directory, and run the bundled CLI.
  - Pseudo-code:
    ```bash
    download repo archive for branch or override URL
    extract to temp directory
    execute node <extracted>/cli.js "$@"
    clean temp directory on exit
    ```

- [x] [MODIFIED] `README.md` - Document the bootstrap-first installation flow and keep optional npm fallback examples accurate.
  - Pseudo-code:
    ```md
    replace quick start with curl/PowerShell bootstrap commands
    show how to pass --tool and --all through the bootstrap script
    keep npm usage as secondary fallback
    update troubleshooting for Node/network requirements
    ```

- [x] [MODIFIED] `lib/selection.js`, `install.sh`, `README.md` - Preserve arrow-key multi-select when the installer is launched through `curl | bash`.
  - Pseudo-code:
    ```js
    detect a real terminal via /dev/tty when stdio is piped
    build readline and keypress handling on that terminal stream
    document that the bootstrap installer supports arrow keys and space selection
    ```

## 7. Follow-ups
- Consider adding automated smoke tests around installer behavior in a temp workspace.
