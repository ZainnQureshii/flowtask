# Resume — Save Session Context

You are a session rotation orchestrator. Your ONLY job is to spawn a single agent that gathers the current work state and writes it to disk. Never read files or run commands in the main context.

## Instructions

### Node PATH

```
PATH="/Users/zain/.npm-global/n/versions/node/22.18.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
```

### State file destination

`/Users/zain/.claude/projects/-Users-zain-myFiles-claude-test/memory/current-work.md`

---

## Spawn one Sonnet agent to gather state and write the file

Spawn a single `general-purpose` agent with `model: "sonnet"`, `mode: "bypassPermissions"`, `max_turns: 20`.

Context to pass:

```
You are a session state recorder for the FlowTask project. Your job is to gather everything about the current work state and write a comprehensive state file to disk.

Use this PATH in ALL bash commands:
PATH="/Users/zain/.npm-global/n/versions/node/22.18.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

Project root: /Users/zain/myFiles/claude-test/flowtask/
State file to write: /Users/zain/.claude/projects/-Users-zain-myFiles-claude-test/memory/current-work.md

STEP 1 — Gather git state:
  cd /Users/zain/myFiles/claude-test/flowtask
  git status --short 2>&1
  git log --oneline -10 2>&1
  git diff --stat HEAD 2>&1

STEP 2 — Gather active teams and tasks:
  ls ~/.claude/teams/ 2>&1
  For each team directory found, read its config:
    cat ~/.claude/teams/<team-name>/config.json 2>&1
  ls ~/.claude/tasks/ 2>&1

STEP 3 — Gather tmux state:
  tmux list-panes -a -F "#{pane_id} #{pane_pid} #{pane_current_command} #{pane_title}" 2>&1

STEP 4 — Read the existing memory file for context:
  Read /Users/zain/.claude/projects/-Users-zain-myFiles-claude-test/memory/MEMORY.md

STEP 5 — Compose and write the state file.

Write the following to /Users/zain/.claude/projects/-Users-zain-myFiles-claude-test/memory/current-work.md
(overwrite if it exists):

---
# Current Work State
Generated: [current date and time]

## Completed This Session
[Based on recent git commits and what you know from context — list what was accomplished.
If no commits since last known state, write "No new commits — check git log above."]

## In Progress
[List anything that appears to be actively being worked on:
- Uncommitted changes (from git status)
- Active team names and their purpose (from ~/.claude/teams/)
- Any pending tasks visible in ~/.claude/tasks/]

## Active Teams & Agents
[List each team found in ~/.claude/teams/ with:
- Team name
- Members (from config.json)
- Status: likely still active or likely stale (stale = no recent file changes)]

## Active Tmux Panes
[List pane IDs and commands — helps identify which panes are agent sessions]

## What To Do Next
[Based on the git log, uncommitted changes, and any in-progress tasks,
list the most logical next steps in priority order.
Be specific — "Fix the recurring task bug in packages/backend/src/routes/tasks.ts line 142"
not "continue working on the project".]

## Key Files Modified This Session
[List file paths that appear in git status or recent git diff — absolute paths only]

## Last Known Test Results
[If test results are available from recent agent output or MEMORY.md, summarize here.
Otherwise write "Unknown — run /status to get current health."]

## How To Resume
1. Start a new Claude Code session in /Users/zain/myFiles/claude-test/flowtask/
2. Read this file: /Users/zain/.claude/projects/-Users-zain-myFiles-claude-test/memory/current-work.md
3. Continue from "What To Do Next" above.
---

After writing the file, report back with:
- Confirmation that the file was written successfully
- A 3-5 line summary of the most important "What To Do Next" items
```

---

## Collect Results and Tell the User

Wait for the agent to report back. Then:

1. Present the agent's summary of "What To Do Next" items.
2. Tell the user:

> Context saved to `memory/current-work.md`. You can now kill this session and start a new one. The new session will pick up from `/Users/zain/.claude/projects/-Users-zain-myFiles-claude-test/memory/current-work.md`.

---

## Important Rules

- NEVER read files or run commands in this main context — all work goes to the single agent.
- The agent MUST use `mode: "bypassPermissions"`.
- All bash commands in the agent MUST use the Node PATH above.
- Keep this context lean — only coordinate, never execute.
