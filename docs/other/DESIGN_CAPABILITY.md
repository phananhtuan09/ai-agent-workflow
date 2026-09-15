---
title: Design Capability Setup and Use
description: Installing and operating the Impeccable design engine alongside the repository-driven protocol
---

# Design Capability Setup and Use

The design capability pairs the repository-driven protocol with [Impeccable](https://github.com/pbakaus/impeccable), an external design engine.
The engine is not vendored into this repository and is not installed by `ai-workflow-init`.

Everything below was verified against Impeccable skill `4.3.1` / engine `0.1.5` on Linux.

## Two layers

The split matters because the two halves have different lifetimes and different owners.

| Layer | What it is | Installed by | Scope |
| --- | --- | --- | --- |
| Engine | The `impeccable` skill, its references, and its detector binary | `npx impeccable install` | Once per machine |
| Context | `docs/PRODUCT.md` and `docs/DESIGN.md` | `npx ai-workflow-init --kit design` | Once per project |

The engine is user-scope, so a single install serves every project on the machine.
Upstream owns its updates, so this repository never forks or vendors its content.

## Setup

### Once per machine

```bash
npx impeccable install --scope=global --no-hooks
```

This writes `~/.claude/skills/impeccable` and `~/.agents/skills/impeccable` (Codex).
The detector binary ships inside the skill folder, so nothing is downloaded at run time.

`--no-hooks` is required, not cosmetic.
With hooks enabled the detector runs after every UI file edit, which contradicts the proof rule in `WORKFLOW.md`.
With hooks off the engine emits `MANUAL_DETECTOR_REQUIRED` instead, telling the agent to run the detector once when the work is finished.

Verify the engine answers:

```bash
~/.claude/skills/impeccable/scripts/impeccable engine-probe
```

It must print `impeccable-engine <version>`.
Silence or an error means the launcher could not reach a binary.

### Once per project

```bash
npx ai-workflow-init --kit design --tool claude
```

This seeds `docs/PRODUCT.md` and `docs/DESIGN.md` as unfilled records, then reload the harness.

Reinstalling never overwrites a filled record; the installer reports `Skipping active-safe durable artifact`.

## Order matters

Install the kit **before** running `/impeccable init` in a project.

When no `PRODUCT.md` exists anywhere, `init` creates it at the repository root rather than under `docs/`.
Context resolution checks the repository root first, then `.agents/context/`, then `docs/`.
A root file therefore outranks the seeded one permanently, and the precedence rules in `WORKFLOW.md` stop applying.

If that already happened, move the content into `docs/PRODUCT.md` and delete the root file.

## Daily use

| When | Command | Writes |
| --- | --- | --- |
| Right after installing the kit | `/impeccable init` | Fills `docs/PRODUCT.md` in place |
| Once there is shipped UI to read | `/impeccable document` | Fills `docs/DESIGN.md` from real code |
| Ordinary design work | `/impeccable audit\|critique\|polish <target>` | Nothing |
| Finishing changed web UI | `impeccable detect --json <targets>` | Nothing |

Run `/impeccable` with no argument to see the engine's own command menu.

Prefer single bounded commands over the full `craft` or new-work flow.
A bounded command matches the bounded-change work shape; the full flow reintroduces the execution chain the protocol removed.

## Authority

`docs/product/` and `docs/decisions/` outrank `docs/PRODUCT.md` and `docs/DESIGN.md` whenever they disagree.
`docs/PRODUCT.md` is a derived summary in the engine's fixed schema and is never durable product authority.
The full rules are in `WORKFLOW.md` under the capability-owned namespaces section.

Never create `PRODUCT.md` or `DESIGN.md` at the repository root or under `.agents/context/`.
Both locations silently take precedence over `docs/`.

Do not let the engine's `doctor` command repair drift as a side effect of a design task.
Report what it finds and act only when a human asks.

## Verifying a project is wired correctly

```bash
~/.claude/skills/impeccable/scripts/impeccable context
```

A correctly wired project reports:

```text
"productPath": "docs/PRODUCT.md",
"designPath": "docs/DESIGN.md",
```

It must not report `PRODUCT_INIT_REQUIRED`.
That directive means no record was found, which is what pushes the agent toward the `init` path that writes to the repository root.

## Troubleshooting

**`/impeccable` does nothing.**
The engine is a per-machine prerequisite and is not carried by a clone.
Run the machine install, then reload the harness.

**A `## Platform` warning appears every session.**
The section takes one bare value: `web`, `ios`, `android`, or `adaptive`.
Anything else, including a comment, is read as the value itself.
Leaving it empty resolves to `web`.

**OpenCode did not receive the skill.**
Observed with `--providers=claude,codex,opencode`; only the Claude and Codex targets were written.
Install OpenCode separately if it is needed.

## Removing it

```bash
rm -rf ~/.claude/skills/impeccable ~/.agents/skills/impeccable ~/.impeccable
```

With hooks never installed, nothing in the project depends on the engine.
`docs/PRODUCT.md` and `docs/DESIGN.md` remain readable as ordinary documentation.
