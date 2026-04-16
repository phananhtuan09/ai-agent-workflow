---
name: wiki-guide
description: Explain the wiki workflow and help the user pick the right wiki command for their current situation.
---

Help the user understand the project wiki system and choose the correct wiki command based on what they are trying to do right now.

## Workflow Alignment

- Ask one clarifying question if the user's situation is unclear.
- Never run other wiki commands automatically — only recommend which one to use.
- Keep the response short: situation → command → one-line reason.

---

## Step 1: Detect the User's Situation

Read the user's prompt and classify it into one of these stages:

| Stage | Keywords / signals |
|---|---|
| **First time** | "set up wiki", "create wiki", "init", "template", no `project-wiki/` exists |
| **Review queue** | "what needs review", "what to fill in", "list docs", "after init", "proposed docs", "human confirm" |
| **New doc** | "add feature", "add flow", "add ADR", "decision", "document feature", "new spec", "write feature doc", "new flow", "we decided" |
| **Retrieve spec** | "what does the wiki say", "find spec", "get spec", "what are the rules for", "how does X work", "show me the doc for" |
| **Before a change** | "about to change", "refactor", "impact", "what will break", "blast radius" |
| **After a change** | "update docs", "reflect change", "sync wiki", "I just changed X" |
| **Code drift** | "docs wrong", "behavior changed", "mismatch", "reconcile", "out of date" |
| **Retiring** | "remove doc", "doc no longer valid", "deprecated feature", "archive" |
| **Unsure** | User doesn't know where to start |

If no signal is found, proceed to Step 3 and ask.

---

## Step 2: Recommend the Right Command

Map the detected stage to the correct command:

**First time setting up the wiki**
→ `/wiki-init`
Use this once to copy the template into the project and stub out all baseline docs.
Required: project name + path to the cloned wiki template repo.

**Retrieving a spec or looking up what the wiki says about a topic**
→ `/wiki-find`
Use this to extract structured specs from canonical docs. Reads in prescribed order (README → INDEX → GOVERNANCE → canonical docs), separates Confirmed/Inferred/Unknown, never guesses missing logic, includes source trace.

**After init — finding what needs human review**
→ `/wiki-review-queue`
Use this right after `/wiki-init` (or any time) to get a prioritized list of docs with `status: proposed`, blank stub sections, or open questions. Tells you exactly where to start filling in content.

**Adding a new doc (feature spec, flow spec, ADR, or API spec)**
→ `/wiki-add-doc`
Use this when the topic has no canonical home yet. Detects doc type from prompt, picks the correct folder and template, checks for duplicates first.

**Before starting a change (impact analysis)**
→ `/wiki-impact-check`
Use this before coding to understand which business rules, flows, and docs the change will affect. Prevents undocumented drift.

**After a change — updating existing docs**
→ `/wiki-update`
Use this when the change is done and existing wiki docs need to reflect the new behavior. Preserves confirmed content; marks inferred/uncertain items clearly.

**Code and docs are out of sync — need to reconcile**
→ `/wiki-reconcile`
Use this when you suspect the implementation diverged from what the wiki says. Produces a classified mismatch list without silently rewriting confirmed truth.

**Retiring a doc that is no longer valid**
→ `/wiki-retire-doc`
Use this to mark a doc as deprecated, superseded, or archived. Updates INDEX and CHANGELOG. Avoids hard deletion.

---

## Step 3: If Situation is Unclear

Ask the user one question:

> What are you trying to do right now?
>
> - **A** — Set up the wiki for the first time
> - **B** — Find what docs need to be filled in / reviewed
> - **C** — Add a new doc (feature spec, flow, ADR, or API spec)
> - **D** — Check what a change will affect before coding
> - **E** — Update docs after finishing a change
> - **F** — Docs and code are out of sync
> - **G** — Retire a doc that is no longer relevant

Then map their answer to Step 2.

---

## Step 4: Output

Respond with:

1. **Situation identified** — one sentence describing what stage the user is in.
2. **Command to use** — the exact slash command.
3. **Why** — one sentence.
4. **How to invoke** — a concrete example invocation using the user's context if known.

Keep the total response under 15 lines.
