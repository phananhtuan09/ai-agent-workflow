---
name: wiki-guide
description: Explain the wiki workflow and help the user pick the right wiki skill for their current situation.
---

# Wiki Guide

Help the user understand the project wiki system and choose the correct wiki skill based on what they are trying to do right now.

## Inputs

- description of what the user is trying to do (optional — will ask if missing)

## Codex Tool Mapping

- Claude `AskUserQuestion` → ask when situation is unclear
- No file reads or edits needed — this skill is orientation only

## Workflow

### 1. Detect the User's Situation

Classify from the user's prompt:

| Stage | Keywords / signals |
|---|---|
| **First time** | "set up wiki", "create wiki", "init", "template", no `project-wiki/` exists |
| **Review queue** | "what needs review", "what to fill in", "list docs", "after init", "proposed docs", "human confirm" |
| **New doc** | "add feature", "add flow", "add ADR", "decision", "document feature", "new spec", "new flow", "we decided" |
| **Before a change** | "about to change", "refactor", "impact", "what will break", "blast radius" |
| **After a change** | "update docs", "reflect change", "sync wiki", "I just changed X" |
| **Retrieve spec** | "what does the wiki say", "find spec", "get spec", "what are the rules for", "how does X work" |
| **Code drift** | "docs wrong", "behavior changed", "mismatch", "reconcile", "out of date" |
| **Retiring** | "remove doc", "doc no longer valid", "deprecated feature", "archive" |
| **Unsure** | no clear signal |

If no signal is found, ask:

> What are you trying to do right now?
>
> - **A** — Set up the wiki for the first time
> - **B** — Find what docs need to be filled in / reviewed
> - **C** — Add a new doc (feature spec, flow, or ADR)
> - **D** — Check what a change will affect before coding
> - **E** — Update docs after finishing a change
> - **F** — Look up what the wiki says about a topic
> - **G** — Docs and code are out of sync
> - **H** — Retire a doc that is no longer relevant

### 2. Recommend the Right Skill

**First time** → `wiki-init`
Use once to copy the template into the project and stub out all baseline docs. Required: project name + template path.

**Review queue** → `wiki-review-queue`
Lists all docs with `status: proposed`, blank stub sections, or open questions — grouped by priority. Use right after `wiki-init`.

**New doc** → `wiki-add-doc`
Detects doc type (feature / flow / ADR) from prompt, picks correct folder and template, checks duplicates first.

**Before a change** → `wiki-impact-check`
Analyzes which business rules, flows, and docs a proposed change will affect before coding starts.

**After a change** → `wiki-update`
Updates existing docs to reflect new behavior. Preserves confirmed content, marks uncertain items clearly.

**Retrieve spec** → `wiki-find`
Extracts structured specs from canonical docs. Reads README → INDEX → GOVERNANCE → canonical docs. Separates Confirmed / Inferred / Unknown. Never guesses.

**Code drift** → `wiki-reconcile`
Compares implementation against wiki docs. Classifies each mismatch without silently rewriting confirmed truth.

**Retiring** → `wiki-retire-doc`
Marks doc as deprecated / superseded / archived. Updates INDEX and CHANGELOG. Avoids hard deletion.

## Output Requirements

Respond with:

1. **Situation identified** — one sentence.
2. **Skill to use** — exact skill name.
3. **Why** — one sentence.
4. **How to invoke** — concrete example using the user's context if known.

Keep total response under 15 lines.
