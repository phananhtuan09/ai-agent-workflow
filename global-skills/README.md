# Global Skills

Machine-wide skills, installed once per machine instead of once per repository.

The installer (`npx ai-workflow-init`) does **not** install these.
Hand this file to an agent and ask it to install them; it fetches the content straight from GitHub.

| Skill | Role |
| --- | --- |
| `foreman-agent` | Owns a repository's task and issue backlog in `.foreman/`, assigns work to worker agents through Herdr, reports only what needs a human decision. |
| `herdr-guide` | Owns Herdr CLI mechanics. `foreman-agent` loads it, so the two must be installed together. |

These are user-scope on purpose.
The skill is machine-wide; its state (`.foreman/`) stays inside each repository, so `foreman-agent` works in repositories that never ran the installer.

## Layout

`~/.claude/skills/` holds the real content and is the single source of truth.
Every other runtime gets a short pointer file that tells the agent to read the Claude copy.

```
~/.claude/skills/foreman-agent/SKILL.md                     full content
~/.claude/skills/foreman-agent/references/assigning.md      loaded on demand
~/.claude/skills/foreman-agent/references/trace-pinning.md  loaded on demand
~/.claude/skills/herdr-guide/SKILL.md                       full content
~/.agents/skills/foreman-agent/SKILL.md                     pointer stub
~/.agents/skills/herdr-guide/SKILL.md                       pointer stub
```

`foreman-agent` keeps rarely-needed procedure in `references/` and loads a file only when the matching operation happens.
The stub sends every other runtime to the Claude copy, so `SKILL.md` always names references by their full path rather than a relative one.

`~/.agents/skills/` is the documented user-scope path for Codex and is also read by OpenCode, so one stub location serves both.

## Install

Run every command below.
Both skills are required; installing only one leaves `foreman-agent` pointing at a skill that does not exist.

### 1. Full content into the Claude scope

```bash
BASE=https://raw.githubusercontent.com/phananhtuan09/ai-agent-workflow/main/global-skills

for skill in foreman-agent herdr-guide; do
  mkdir -p "$HOME/.claude/skills/$skill"
  curl -fsSL "$BASE/$skill/SKILL.md" -o "$HOME/.claude/skills/$skill/SKILL.md"
done

mkdir -p "$HOME/.claude/skills/foreman-agent/references"
for ref in assigning trace-pinning; do
  curl -fsSL "$BASE/foreman-agent/references/$ref.md" \
    -o "$HOME/.claude/skills/foreman-agent/references/$ref.md"
done
```

`foreman-agent` stops and reports when `assigning.md` is missing, so a partial install is visible rather than silent.

### 2. Pointer stubs into the agents scope

Each stub keeps its own frontmatter, because `description` is what makes a runtime choose the skill.
Only the body is replaced by the pointer.

```bash
for skill in foreman-agent herdr-guide; do
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
done
```

The `awk` copies the frontmatter block verbatim from the Claude copy, so `description` never has to be retyped.

If the shell above is awkward, write each stub by hand instead.
A stub is the source skill's frontmatter block followed by this body:

```markdown
This file is a pointer. The full skill lives in one place only:

`~/.claude/skills/<skill-name>/SKILL.md`

Read that file in full right now, then follow it exactly.
Do not act and do not answer before finishing the read.
If the file cannot be read, stop and tell the user; never guess its contents.
```

## Constraints

These were established by testing against real runtimes; violating them fails silently.

- **Every `SKILL.md` must be a plain regular file.**
- **Never use a symlink.** Codex skips a `SKILL.md` that is a symlink, so the skill simply never appears in its skill list, with no error.
- **Never use a hard link.** It looks correct at first, but editors that rewrite a file replace its inode, which detaches the link. The copies then drift apart with no warning, which is worse than an obvious failure.
- **Install both skills or neither.**
- **Do not create `~/.codex/skills/foreman-agent`.** Codex reads `~/.agents/skills`; a second copy under `~/.codex/skills` only adds a file that can go stale.

## Verify

```bash
head -2 ~/.claude/skills/foreman-agent/SKILL.md
head -2 ~/.agents/skills/foreman-agent/SKILL.md
ls ~/.claude/skills/foreman-agent/references/
find ~/.claude/skills ~/.agents/skills -name SKILL.md -type l
```

The `ls` must list `assigning.md` and `trace-pinning.md`.

The `find` must print nothing; any output means a symlink slipped in.

Then confirm each runtime actually sees the skill:

- Claude Code: `/foreman-agent`
- Codex: `codex exec "Do you have a skill named foreman-agent?"`
- OpenCode: ask the same question in a session

## Update

Re-run step 1 to refresh the content, including every file under `references/`.
Step 2 is only needed when a skill's `description` changes, since that line is the one thing a stub duplicates.

A new reference file means adding its name to the `for ref in …` list, so re-running step 1 keeps picking it up.
