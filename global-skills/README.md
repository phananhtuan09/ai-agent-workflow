# Global Skills

These are machine-wide skills for agent coordination.
They are intentionally separate from the project-scoped canonical skills in `skills/` and are not installed by the default coding workflow kit.

The installer (`npx ai-workflow-init`) does **not** install these.
Hand this file to an agent and ask it to install them; it fetches the content straight from GitHub.

| Skill | Role |
| --- | --- |
| `herdr-guide` | Owns Herdr CLI mechanics. |

## Layout

`~/.claude/skills/` holds the real content and is the single source of truth.
Every other runtime gets a short pointer file that tells the agent to read the Claude copy.

```
~/.claude/skills/herdr-guide/SKILL.md     full content
~/.agents/skills/herdr-guide/SKILL.md     pointer stub
```

`~/.agents/skills/` is the documented user-scope path for Codex and is also read by OpenCode, so one stub location serves both.

## Install

### 1. Full content into the Claude scope

```bash
BASE=https://raw.githubusercontent.com/phananhtuan09/ai-agent-workflow/main/global-skills

mkdir -p "$HOME/.claude/skills/herdr-guide"
curl -fsSL "$BASE/herdr-guide/SKILL.md" -o "$HOME/.claude/skills/herdr-guide/SKILL.md"
```

### 2. Pointer stub into the agents scope

The stub keeps its own frontmatter, because `description` is what makes a runtime choose the skill.
Only the body is replaced by the pointer.

```bash
skill=herdr-guide
src="$HOME/.claude/skills/$skill/SKILL.md"
mkdir -p "$HOME/.agents/skills/$skill"
{
  awk 'NR==1&&/^---$/{print;inside=1;next} inside&&/^---$/{print;exit} inside{print}' "$src"
  printf '\n# %s\n\n' "$skill"
  printf 'This file is a pointer. The full skill lives in one place only:\n\n'
  printf '`~/.claude/skills/%s/SKILL.md`\n\n' "$skill"
  printf 'Read that file in full right now, then follow it exactly.\n'
  printf 'Do not act and do not answer before finishing the read.\n'
  printf 'If the file cannot be read, stop and tell the user; never guess its contents.\n'
} > "$HOME/.agents/skills/$skill/SKILL.md"
```

## Constraints

These were established by testing against real runtimes; violating them fails silently.

- **Every `SKILL.md` must be a plain regular file.**
- **Never use a symlink.** Codex skips a `SKILL.md` that is a symlink, so the skill simply never appears in its skill list, with no error.
- **Never use a hard link.** Editors that rewrite a file replace its inode, which detaches the link and lets the copies drift apart silently.
- **Do not create anything under `~/.codex/skills/`.** Codex reads `~/.agents/skills`; a second copy only adds a file that can go stale.

## Verify

```bash
head -2 ~/.claude/skills/herdr-guide/SKILL.md ~/.agents/skills/herdr-guide/SKILL.md
find ~/.claude/skills ~/.agents/skills -name SKILL.md -type l
```

The `find` must print nothing; any output means a symlink slipped in.

## Update

Re-run step 1 to refresh the content.
Step 2 is only needed when the skill's `description` changes.
