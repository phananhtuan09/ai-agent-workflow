# Section Mockup: Claude + Obsidian Use Cases

This file isolates the Claude + Obsidian section so it can be expanded independently.

## Purpose

- show a modern, concrete environment where this workflow becomes especially useful
- connect the workflow to a hot real-world setup people are already interested in

## Core Message

Obsidian is a strong companion for AI-agent workflows because the artifacts are plain markdown files stored locally.
That means notes, plans, wiki pages, and reports can become durable workflow outputs instead of disappearing inside chat history.

## UI Direction

Structure this section as:

- short Obsidian intro block
- 2 use-case cards:
  - `Daily Planning`
  - `Project Wiki`

Each card should include:

- why people use it
- the commands involved
- a small workflow graph

## Landing Page Render Copy

### Section Title

`Claude + Obsidian: A Very Practical Combination`

### Section Intro

`Obsidian is especially compatible with AI-agent workflows because the working artifacts are plain markdown files on your machine. That makes it easy for an agent to generate, update, and reuse notes, plans, wiki pages, and reports.`

## Short Intro To Obsidian

### Suggested Explanation

`Obsidian is a markdown-based note-taking app that stores files locally. Instead of putting your notes inside a hosted database, it works directly with folders and markdown files on your machine.`

## Why Obsidian Is Hot Right Now

### Talking Points

- free for personal use
- files are stored locally, not locked inside a server app
- markdown is easy for both humans and AI agents to read and write
- flexible folder structure makes it useful for planning, knowledge systems, and documentation
- AI output can become durable `.md` files instead of disappearing inside chats

## Hot Use Case 1: Daily Planning System

### Use Case Summary

- user writes rough task notes
- AI agent turns them into a structured daily plan
- AI agent can also summarize work inputs and generate reviews and reports

### Example Commands

- [`.claude/commands/daily.md`](/Users/mac/Desktop/source-codes/ai-agent-workflow/.claude/commands/daily.md)
- [`.claude/commands/daily-review.md`](/Users/mac/Desktop/source-codes/ai-agent-workflow/.claude/commands/daily-review.md)
- [`.claude/commands/weekly.md`](/Users/mac/Desktop/source-codes/ai-agent-workflow/.claude/commands/weekly.md)
- [`.claude/commands/weekly-report.md`](/Users/mac/Desktop/source-codes/ai-agent-workflow/.claude/commands/weekly-report.md)

### Suggested Explanation

`One strong Obsidian workflow is personal planning. The user keeps rough notes and task inputs in markdown, then Claude helps turn them into daily plans, end-of-day reviews, weekly plans, and weekly reports. This is a good example of AI turning unstructured notes into durable planning artifacts.`

## Hot Use Case 2: Project Wiki System

### Use Case Summary

- use Obsidian markdown folders as a project wiki
- let AI agents maintain and evolve the wiki over time

### Example Commands

- [`.claude/commands/wiki-add-feature.md`](/Users/mac/Desktop/source-codes/ai-agent-workflow/.claude/commands/wiki-add-feature.md)
- [`.claude/commands/wiki-impact-check.md`](/Users/mac/Desktop/source-codes/ai-agent-workflow/.claude/commands/wiki-impact-check.md)
- [`.claude/commands/wiki-reconcile.md`](/Users/mac/Desktop/source-codes/ai-agent-workflow/.claude/commands/wiki-reconcile.md)
- [`.claude/commands/wiki-retire-doc.md`](/Users/mac/Desktop/source-codes/ai-agent-workflow/.claude/commands/wiki-retire-doc.md)
- [`.claude/commands/wiki-update.md`](/Users/mac/Desktop/source-codes/ai-agent-workflow/.claude/commands/wiki-update.md)

### Suggested Explanation

`Another hot use case is building a project wiki in Obsidian. Instead of scattering context across chats and random docs, the workflow keeps feature knowledge, impacts, updates, and retired docs in a markdown-based knowledge system that AI can actively maintain.`

### Suggested Graph

```text
Project change
  -> impact check
  -> add or update wiki doc
  -> reconcile implementation vs wiki
  -> retire old docs when needed
  -> project wiki stays usable over time
```

## Expansion Notes

- This section may later add more use cases such as research notebooks or personal CRM
- The project wiki card likely deserves a deeper follow-up file if it becomes a major section
