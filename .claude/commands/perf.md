# /perf — Performance Profiler

Bundle size analysis and test timing profiling for the FlowTask project. Reports chunk sizes, flags large bundles, and identifies the slowest test files.

## Steps

### 1. Create the team

Create a team called `perf-check`.

### 2. Spawn the profiler agent

Spawn one agent named `"profiler"` with:
- `model: "sonnet"`
- `mode: "bypassPermissions"`
- `max_turns: 15`

Set `PATH="/Users/zain/.npm-global/n/versions/node/22.18.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"` in all bash commands.

All commands run from `/Users/zain/myFiles/claude-test/flowtask/`.

---

#### Part 1: Bundle Size Analysis

Run the frontend build and capture output:

```bash
cd /Users/zain/myFiles/claude-test/flowtask
PATH="/Users/zain/.npm-global/n/versions/node/22.18.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
pnpm --filter frontend build 2>&1
```

Parse the Vite build output to extract all chunk entries. Look for lines matching the pattern:
```
dist/assets/<filename>  <size> kB │ gzip: <gzip-size> kB
```

- Collect all chunks (JS and CSS) with their raw sizes and gzip sizes
- Sort by raw size descending
- Flag any chunk with raw size **over 500 KB** as a `⚠️ WARNING`
- Compute total bundle size (sum of all JS + CSS chunks)

Build Report format:
```
### Bundle Report
Total size: X.XX MB (gzip: X.XX MB)

| Chunk | Size | Gzip | Status |
|-------|------|------|--------|
| index-abc123.js | 823 KB | 210 KB | ⚠️ LARGE |
| vendor-xyz.js   | 340 KB | 98 KB  | ✅ OK   |
| index.css       | 45 KB  | 12 KB  | ✅ OK   |
```

---

#### Part 2: Test Speed Profiling

Run backend tests with timing:

```bash
cd /Users/zain/myFiles/claude-test/flowtask
PATH="/Users/zain/.npm-global/n/versions/node/22.18.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
pnpm --filter backend run test 2>&1
```

Run frontend tests with timing:

```bash
PATH="/Users/zain/.npm-global/n/versions/node/22.18.0/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
pnpm --filter frontend run test 2>&1
```

Parse the output for per-file test durations. Look for lines like:
```
✓ src/__tests__/routes/tasks.test.ts (2341ms)
```

Extract duration in ms per test file. Identify the **5 slowest test files** across both backend and frontend combined.

Test Speed Report format:
```
### Test Speed Report

| Rank | File | Duration | Suite |
|------|------|----------|-------|
| 1 | src/__tests__/routes/tasks.test.ts | 2341ms | backend |
| 2 | src/__tests__/stores/taskStore.test.ts | 1203ms | frontend |
| ...  | ... | ... | ... |
```

---

#### Part 3: Recommendations

Based on the data, generate a **Recommendations** section:

- List any chunks over 500 KB and suggest code-splitting strategies (e.g. lazy loading views, separating vendor libs)
- Flag any test files taking over 2000ms and suggest possible causes (heavy setup, missing mocks, real I/O)
- Note if the total bundle size exceeds 2 MB

---

After gathering all data, send the full report to `team-lead` in a single markdown message with three sections: Bundle Report, Test Speed Report, Recommendations.

### 3. Report and clean up

Team lead displays the profiler's full report to the user.

Send `shutdown_request` to the profiler agent, then call `TeamDelete` to clean up the `perf-check` team.
