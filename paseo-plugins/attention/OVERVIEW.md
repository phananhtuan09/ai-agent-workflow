# Attention

Attention adds a short note under an agent's answer that points out what you need to see.

Type `/attention` in an agent's composer after it finishes a turn, and a Haiku 5.5 reviewer reads the latest answer and lists up to three items in the timeline:

- **Action**: a question, decision, or manual step waiting on you.
- **Risk**: destructive or irreversible changes, security or data-loss concerns, breaking changes, or shaky assumptions.
- **Todo**: failed or skipped checks, unfinished work, or blockers.

If nothing needs you, the note says so in one line.

## Setup

The daemon needs the Claude provider with access to `claude-haiku-5-5`.
Requires Paseo 0.10.2 or later.

## What it reads and sends

Only when you run `/attention`, the latest answer (up to 40,000 characters) goes to a short-lived Haiku agent in the same working directory, through your own Claude account.
The reviewer agent is titled `attention-reviewer`, is told not to use tools, and is archived when done.
Running it again on the same answer replaces the earlier note.
The note lives in the daemon's in-memory timeline, so it is lost when the daemon restarts.
