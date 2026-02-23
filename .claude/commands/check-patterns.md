# Check Patterns

This skill reviews recent work patterns and proposes new skills to automate them.

## Workflow

When invoked, this skill spawns a standalone agent to analyze your recent work and identify repeated workflows that could be automated as new skills.

## Agent Task

Run a Sonnet standalone agent with:
- `bypassPermissions: true`
- `max_turns: 15`
- `model: "sonnet"`

The agent should:

1. **Read the memory file** at `/Users/zain/.claude/projects/-Users-zain-myFiles-claude-test/memory/MEMORY.md` to understand recent project context and user preferences

2. **Read all existing skills** in `/Users/zain/myFiles/claude-test/flowtask/.claude/commands/` to see what's already automated (list filenames and note what each skill does)

3. **Review the current conversation** for:
   - Workflows or manual steps performed 2+ times
   - Repetitive debugging or setup commands
   - Common approval requests that could be streamlined
   - File operations that follow a consistent pattern
   - Commands run multiple times with similar intent

4. **Identify patterns** that could become new skills:
   - For each proposed skill, include:
     - **Name**: Short, descriptive trigger name (e.g., `verify-build`, `reset-state`)
     - **Trigger**: The `/command` format
     - **What it automates**: The repetitive workflow it replaces
     - **Estimated time savings**: Per invocation (e.g., "5 min", "2 min")
     - **Complexity**: Low / Medium / High (to prioritize)

5. **Report back** with a structured list of proposals, ranked by potential impact (highest time savings or frequency first)

6. **Keep the response lean**: Focus on the top 3-5 candidates, not an exhaustive list

## Orchestrator Action

After the agent reports proposals:

1. Present the skill proposals to the user
2. Ask which ones they'd like to create
3. For approved proposals, create the skill files in `/Users/zain/myFiles/claude-test/flowtask/.claude/commands/`

## Reminder

This skill should be run periodically (every few sessions) to keep the automation suite up to date. As your workflow evolves, new patterns will emerge that are worth automating.
