# Cleanup Agents

You are a cleanup orchestrator. Your ONLY job is to spawn a single lightweight agent that does all the cleanup work. Never run commands or read files in the main context.

## Instructions

### Node PATH

```
PATH="/Users/zain/.npm-global/n/versions/node/22.18.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
```

---

## Spawn one Haiku agent to do all cleanup

Spawn a single `general-purpose` agent with `model: "haiku"`, `mode: "bypassPermissions"`, `max_turns: 15`.

Do NOT use a team for this — we're cleaning up teams, so a standalone agent is correct.

Context to pass:

```
You are a cleanup agent. Run the following steps and report what you did.

Use this PATH in ALL bash commands:
PATH="/Users/zain/.npm-global/n/versions/node/22.18.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

STEP 1 — List all tmux panes:
  tmux list-panes -a -F "#{pane_id} #{pane_pid} #{pane_current_command}" 2>&1

  From the output, identify panes where pane_current_command is "zsh" or "bash" with no active process
  (i.e., idle shell panes that are not %0 or %1 — those are the main session and must be preserved).

  For each dead/idle pane (not %0 or %1), kill it:
    tmux kill-pane -t <pane_id>

  Record: how many panes were found, how many were killed.

STEP 2 — List stale team directories:
  ls ~/.claude/teams/ 2>&1

  For each directory found, record its name and approximate age if determinable
  (use: ls -lt ~/.claude/teams/ to get modification times).

  Do NOT delete team directories — just report them. The user may want to clean those up manually
  or they may belong to active sessions.

STEP 3 — Check for stale task directories:
  ls ~/.claude/tasks/ 2>&1

  Report any directories found.

STEP 4 — Format and return a cleanup report:

Cleanup Report — [current date]
=================================

TMUX PANES
  Total panes found: N
  Main session panes preserved: %0, %1 (or whichever were skipped)
  Dead panes killed: N (list pane IDs)
  Errors: [any errors from kill commands, or "None"]

TEAM DIRECTORIES (~/.claude/teams/)
  Found: [list directory names, or "None"]
  Action: Not deleted — review manually if stale.

TASK DIRECTORIES (~/.claude/tasks/)
  Found: [list directory names, or "None"]
  Action: Not deleted — review manually if stale.

SUMMARY
  [Brief one-line summary of what was cleaned up]
```

---

## Collect and Present Results

Wait for the agent to report back, then present the formatted cleanup report directly to the user exactly as the agent produced it.

---

## Important Rules

- NEVER run commands or read files in this main context — all work goes to the single agent.
- The agent MUST use `mode: "bypassPermissions"`.
- All bash commands in the agent MUST use the Node PATH above.
- Use a standalone Task agent, NOT a team — this skill cleans up teams, so creating one would be counterproductive.
- Keep this context lean — only coordinate, never execute.
