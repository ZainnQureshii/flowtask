# /db-inspect — SQLite Database Inspector

Quick read-only inspection of the FlowTask SQLite database. Optionally pass a table name or a SELECT query as an argument.

**Usage:**
- `/db-inspect` — show all tables with row counts
- `/db-inspect tasks` — show schema + first 10 rows of the `tasks` table
- `/db-inspect "SELECT * FROM tasks WHERE priority = 'high'"` — run a custom SELECT query

## Steps

### 1. Create the team

Create a team called `db-inspect`.

### 2. Spawn the inspector agent

Spawn one agent named `"inspector"` with:
- `model: "haiku"`
- `mode: "bypassPermissions"`
- `max_turns: 10`

Set `PATH="/Users/zain/.npm-global/n/versions/node/22.18.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"` in all bash commands.

DB path: `packages/backend/data/flowtask.db` (relative to `/Users/zain/myFiles/claude-test/flowtask/`).

**Behavior based on argument:**

#### No argument — show all tables with row counts

```bash
cd /Users/zain/myFiles/claude-test/flowtask
PATH="/Users/zain/.npm-global/n/versions/node/22.18.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
sqlite3 packages/backend/data/flowtask.db ".tables"
```

Then for each table returned, get its row count individually:

```bash
sqlite3 packages/backend/data/flowtask.db "SELECT COUNT(*) FROM tasks;"
sqlite3 packages/backend/data/flowtask.db "SELECT COUNT(*) FROM tags;"
# (repeat for each table)
```

Format the result as a markdown table:

| Table | Row Count |
|-------|-----------|
| tasks | 42 |
| tags  | 7  |
| ...   | ...  |

#### Argument is a table name — show schema + first 10 rows

```bash
sqlite3 packages/backend/data/flowtask.db ".schema <tablename>"
sqlite3 packages/backend/data/flowtask.db "SELECT * FROM <tablename> LIMIT 10;"
```

Format rows as a markdown table using the column names from the schema.

#### Argument is a SELECT query — run it

Verify the query starts with `SELECT` (case-insensitive). If it does not start with SELECT, reject it with:

> **Error: Only SELECT queries are allowed. No INSERT, UPDATE, DELETE, DROP, ALTER, or other write operations.**

If it is a valid SELECT, run it:

```bash
sqlite3 -column -header packages/backend/data/flowtask.db "<query>"
```

Format the output as a markdown table.

**Security rule:** NEVER run any query containing `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `CREATE`, `PRAGMA` (write-mode), or `ATTACH`. Read-only only.

After running the inspection, send results to `team-lead` as a formatted markdown message.

### 3. Report and clean up

Team lead displays the inspector's results to the user.

Send `shutdown_request` to the inspector agent, then call `TeamDelete` to clean up the `db-inspect` team.
