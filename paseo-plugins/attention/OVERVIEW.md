# Attention

Attention adds a short note under Claude's long answers that points out what you need to see.

When an agent finishes a turn with an answer of at least 600 characters, a Haiku 5.5 reviewer reads it and lists up to three items in the timeline:

- **Action**: a question, decision, or manual step waiting on you.
- **Risk**: destructive or irreversible changes, security or data-loss concerns, breaking changes, or shaky assumptions.
- **Todo**: failed or skipped checks, unfinished work, or blockers.

If nothing needs you, the note says so in one line.

## Setup

The daemon needs the Claude provider with access to `claude-haiku-5-5`.
Requires Paseo 0.10.2 or later.

## What it reads and sends

The final assistant text of each long turn (up to 40,000 characters) goes to a short-lived Haiku agent in the same working directory, through your own Claude account.
The reviewer agent is titled `attention-reviewer`, is told not to use tools, and is archived when done.
Short answers, failed or canceled turns, and subagent turns are skipped.
The note lives in the daemon's in-memory timeline, so it is lost when the daemon restarts.
