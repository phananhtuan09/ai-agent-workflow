---
name: idea-scout
description: Propose evidence-based feature ideas for a project when the human has no specific idea yet, grounded in the project's intent, its GitHub issues, and similar products the human chooses, ending with a ranked shortlist of up to 5 ideas, in the same language the user wrote in. Use only when the user asks for feature ideas or what to build next for a project. Do not use to refine, debate, or spec an idea the user already has, or to scan the codebase for gaps.
---

# Idea Scout

Find what is worth building next in a project, grounded in evidence instead of generic suggestions.
Ideas may be end-user features, technical improvements, or developer experience.

## Status: experimental

- **Hypothesis**: ideas grounded in project intent, the issue backlog, and human-chosen similar products are kept more often than ideas an agent proposes unprompted.
- **Success criteria**: across real runs, the human keeps at least one of the final ideas (pursues it, files it, or asks to develop it) in most runs, and rarely rejects an idea as a duplicate, an already-rejected idea, or a contradiction of a stated non-goal.
- It is not proven until real runs meet these criteria; uninstalling it restores asking the agent for ideas directly.

## Language

Write every response, including headings, in the language the user used when invoking this skill.
If the user writes in Vietnamese, the output is Vietnamese; never default to English.
Keep issue numbers, links, product names, code, and quoted text exactly as given.

## Scope

- Read-only. Never create, edit, or close files, issues, pull requests, proposals, or idea backlog files; GitHub issues are the memory.
- Do not scan the codebase for TODOs, gaps, or missing states, and do not do competitive analysis or market positioning.
- Do not assume any repository-specific docs layout; read only the intent sources that exist.
- Stand alone. If the human wants to develop a chosen idea further, they decide how.

## Flow

### 1. Quick scan, then wait

Keep this step cheap.
Read the project's intent sources that exist, such as `README`, `AGENTS.md` or `CLAUDE.md`, and product docs, to learn who the users are, the goals, and the non-goals.
Then summarize the GitHub issue landscape (see step 2).
Offer 3 to 5 candidate topics, one line each with the evidence behind it, and stop.
The human picks one or proposes their own; do no similar-product research before that.

### 2. GitHub issues

When the project has a reachable GitHub repository, through the `gh` CLI or a GitHub MCP tool:

- **Backlog mining**: surface open issues that stayed unaddressed, ranked by engagement (reactions, comments) and age. Apply an age cutoff only if the human gives one.
- **Duplicate check**: compare every new idea against existing issues; a match links to that issue instead of proposing it again.
- **Rejected memory**: issues closed as `not planned` are rejected ideas. Do not re-propose them unless you cite new evidence.

If GitHub is unavailable (no remote, no access, or no CLI or MCP), say so in one line and continue with the remaining sources.

### 3. Similar products (human-gated)

For the chosen topic, propose 3 to 5 similar products or open-source projects, one line each, and wait.
Research only the ones the human chooses or names.
For each, find the features or patterns it does well, what its users praise or request (for example in its issues or discussions), and how that would translate to this project.
The goal is learning to adapt, not comparison.

### 4. Generate and filter

Every idea cites its source: an issue number or a product link.
Keep worthwhile open issues as candidates with their issue links, and merge a matching new idea into that issue instead of proposing it again.
Drop ideas that repeat rejected ones without new evidence or contradict stated non-goals.

## Output format

Return a ranked top 3 to 5 ideas, or fewer when fewer pass the evidence and filter rules; if none qualify, say why instead of adding unsupported ideas.
For each idea:

- **Problem**: the user problem it addresses.
- **Idea**: what to build.
- **Source**: the issue number or product link it comes from.
- **Smallest version**: the smallest version worth trying.
- **Main risk**: the most likely way it fails or does not pay off.
- **Impact / confidence / effort**: a qualitative judgment for each (for example high, medium, low) with a short reason. Never invent numeric scores.

End with the considered-but-dropped ideas, one line each with the reason.
