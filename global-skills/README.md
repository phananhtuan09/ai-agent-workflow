# Global Skills

Machine-wide skills, installed once per machine instead of once per repository.

The installer (`npx ai-workflow-init`) does **not** install these.
Hand this file to an agent and ask it to install them; it fetches the content straight from GitHub.

| Skill | Role |
| --- | --- |
| `foreman-agent` | Owns a repository's task and issue backlog in `.foreman/`, assigns work to worker agents through Herdr, reports only what needs a human decision. |
| `herdr-guide` | Owns Herdr CLI mechanics. `foreman-agent` loads it, so the two must be installed together. |
| `registrar-agent` | Owns a repository's durable business rules in `docs/ai/domain/` and architecture rules in `docs/ai/architecture/`, answers questions about system logic with cited rule ids, and reports drift between rules and code. Standalone; loads no other skill. |

These are user-scope on purpose.
Each skill is machine-wide while its state stays inside the repository it is run in — `.foreman/` for the Foreman, `docs/ai/` plus `.registrar/` for the Registrar — so both work in repositories that never ran the installer.

`foreman-agent` owns work in flight; `registrar-agent` owns durable intent.
They share no files and never write to each other's state.

## Layout

`~/.claude/skills/` holds the real content and is the single source of truth.
Every other runtime gets a short pointer file that tells the agent to read the Claude copy.

```
~/.claude/skills/foreman-agent/SKILL.md                     full content
~/.claude/skills/foreman-agent/references/assigning.md      loaded on demand
~/.claude/skills/foreman-agent/references/trace-pinning.md  loaded on demand
~/.claude/skills/herdr-guide/SKILL.md                       full content
~/.claude/skills/registrar-agent/SKILL.md                   full content
~/.claude/skills/registrar-agent/references/*.md            four files, loaded on demand
~/.agents/skills/foreman-agent/SKILL.md                     pointer stub
~/.agents/skills/herdr-guide/SKILL.md                       pointer stub
~/.agents/skills/registrar-agent/SKILL.md                   pointer stub
```

`foreman-agent` and `registrar-agent` keep rarely-needed procedure in `references/` and load a file only when the matching operation happens.
The stub sends every other runtime to the Claude copy, so `SKILL.md` always names references by their full path rather than a relative one.

`~/.agents/skills/` is the documented user-scope path for Codex and is also read by OpenCode, so one stub location serves both.

## Install

Run every command below.
`foreman-agent` and `herdr-guide` must be installed together; installing only one leaves `foreman-agent` pointing at a skill that does not exist.
`registrar-agent` has no such pairing, but the commands below install all three at once.

### 1. Full content into the Claude scope

```bash
BASE=https://raw.githubusercontent.com/phananhtuan09/ai-agent-workflow/main/global-skills

for skill in foreman-agent herdr-guide registrar-agent; do
  mkdir -p "$HOME/.claude/skills/$skill"
  curl -fsSL "$BASE/$skill/SKILL.md" -o "$HOME/.claude/skills/$skill/SKILL.md"
done

mkdir -p "$HOME/.claude/skills/foreman-agent/references"
for ref in assigning trace-pinning; do
  curl -fsSL "$BASE/foreman-agent/references/$ref.md" \
    -o "$HOME/.claude/skills/foreman-agent/references/$ref.md"
done

mkdir -p "$HOME/.claude/skills/registrar-agent/references"
for ref in registering-br registering-arch absorbing auditing; do
  curl -fsSL "$BASE/registrar-agent/references/$ref.md" \
    -o "$HOME/.claude/skills/registrar-agent/references/$ref.md"
done
```

Both agents stop and report when a reference they need is missing, so a partial install is visible rather than silent.

### 2. Pointer stubs into the agents scope

Each stub keeps its own frontmatter, because `description` is what makes a runtime choose the skill.
Only the body is replaced by the pointer.

```bash
for skill in foreman-agent herdr-guide registrar-agent; do
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
- **Install `foreman-agent` and `herdr-guide` together or neither.**
- **Do not create anything under `~/.codex/skills/`.** Codex reads `~/.agents/skills`; a second copy under `~/.codex/skills` only adds a file that can go stale.

## Verify

```bash
for skill in foreman-agent herdr-guide registrar-agent; do
  head -2 ~/.claude/skills/$skill/SKILL.md
  head -2 ~/.agents/skills/$skill/SKILL.md
done
ls ~/.claude/skills/foreman-agent/references/
ls ~/.claude/skills/registrar-agent/references/
find ~/.claude/skills ~/.agents/skills -name SKILL.md -type l
```

The first `ls` must list `assigning.md` and `trace-pinning.md`.

The second must list `absorbing.md`, `auditing.md`, `registering-arch.md`, and `registering-br.md`.

The `find` must print nothing; any output means a symlink slipped in.

Then confirm each runtime actually sees the skills:

- Claude Code: `/foreman-agent` and `/registrar-agent`
- Codex: `codex exec "Do you have skills named foreman-agent and registrar-agent?"`
- OpenCode: ask the same question in a session

## Update

Re-run step 1 to refresh the content, including every file under `references/`.
Step 2 is only needed when a skill's `description` changes, since that line is the one thing a stub duplicates.

A new reference file means adding its name to the `for ref in …` list, so re-running step 1 keeps picking it up.
