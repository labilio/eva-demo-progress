# Eva Modular Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the current `830514a` standalone Demo into an equivalent multi-file development and Vercel deployment foundation without importing leadership-package UI content or regressing the current Eva experience.

**Architecture:** Mechanically extract the current standalone into an ordered manifest, a temporary legacy runtime, feature-scoped prototype modules, and a small HTML loader. Verify equivalence before promoting the modular output. Keep AionUI only as a temporary compatibility runtime; later plans replace domains with Eva-owned React modules.

**Tech Stack:** Node.js ESM scripts, static HTML/CSS/JS, Git worktree, Vercel static deployment, existing runtime contract scripts.

**Spec:** `docs/superpowers/specs/2026-09-04-eva-modular-collaboration-design.md`

## Global Constraints

- `830514a` is the initial content baseline; leadership package revision `100c7cb` must never overwrite current UI, data, or behavior.
- AionUI is not an Eva product, design, or implementation reference; it is only a temporary migration compatibility dependency.
- Customer GDS for AI 2.0 governs only the covered personal-Eva task lifecycle.
- Team IM continues to use the shared Octo-Web-derived IM kernel.
- Eva shell uses existing wrappers or Semi UI; icons remain Lucide.
- Existing uncommitted `.gitignore` and `docs/` changes in the primary checkout must be preserved.
- No manual Vercel deployment; GitHub `main` remains the production deployment trigger.
- Every destructive-looking move resolves and prints source and destination paths before execution; no file is permanently deleted during directory cleanup.

---

### Task 1: Create an isolated migration workspace and baseline inventory

**Files:**
- Create: `.worktrees/eva-modular-foundation/` through Git worktree tooling
- Create: `migration/baseline.json`
- Create: `scripts/contracts/verify-baseline.mjs`

**Interfaces:**
- Consumes: repository HEAD and the two current standalone entry files.
- Produces: `migration/baseline.json` with `sourceRevision`, canonical LF-normalized SHA-256, canonical byte size, and required semantic markers; `verify-baseline.mjs` exits non-zero on drift.

- [ ] **Step 1: Record the primary checkout without modifying it**

Run:

```powershell
git status --short
git rev-parse HEAD
git hash-object index.html
git hash-object 'prototypes/eva demo 0904 -v1.html'
```

Expected: HEAD is `830514a43343613c06e0e04893949e15faa20b11`; both HTML hashes match; existing `.gitignore` and `docs/` changes remain visible.

- [ ] **Step 2: Create the isolated worktree**

Use `superpowers:using-git-worktrees` and create branch `codex/eva-modular-foundation` from current HEAD. The worktree must be outside the tracked project tree or inside an ignored `.worktrees/` directory.

- [ ] **Step 3: Write a failing baseline contract**

Create `scripts/contracts/verify-baseline.mjs` that reads `migration/baseline.json`, hashes both source entries with `node:crypto`, verifies equal bytes, and checks these markers in decoded HTML:

```js
const markers = [
  '整理今天的工作重点',
  'EVA + OCTO',
  'evaMessageMode',
  'EvaIMConversation',
  '最近更新：',
];
```

Before `migration/baseline.json` exists, run:

```powershell
node scripts/contracts/verify-baseline.mjs
```

Expected: FAIL with `migration/baseline.json 不存在`.

- [ ] **Step 4: Generate the baseline manifest**

Create `migration/baseline.json` with exact values calculated from the current worktree, not copied from this document:

```json
{
  "sourceRevision": "830514a43343613c06e0e04893949e15faa20b11",
  "entries": ["index.html", "prototypes/eva demo 0904 -v1.html"],
  "canonicalSha256": "7da8a98c593e34d1ce70b395efecc5ca52b4ac9215ea60fb7b587800ee71517f",
  "canonicalBytes": 22454723,
  "requiredMarkers": ["整理今天的工作重点", "EVA + OCTO", "evaMessageMode", "EvaIMConversation", "最近更新："]
}
```

- [ ] **Step 5: Run the baseline contract**

Run:

```powershell
node scripts/contracts/verify-baseline.mjs
git diff --check
```

Expected: both commands exit 0.

- [ ] **Step 6: Commit the isolated baseline contract**

```powershell
git add migration/baseline.json scripts/contracts/verify-baseline.mjs
git commit -m "test: lock Eva modular migration baseline"
```

### Task 2: Add a current-version standalone splitter

**Files:**
- Create: `package.json`
- Create: `tools/split-standalone.mjs`
- Create: `tools/check-manifest.mjs`
- Create: `tests/split-standalone.test.mjs`
- Create: `build/.gitkeep`

**Interfaces:**
- Consumes: `prototypes/eva demo 0904 -v1.html` and `migration/baseline.json`.
- Produces: `build/modular/index.html`, `build/modular/prototype-manifest.json`, `build/modular/vendor/*`, and ordered `build/modular/prototype/*`.

- [ ] **Step 1: Write splitter tests before implementation**

Use `node:test` with a small fixture containing normal scripts, styles, `#eva-app-module-source`, and an `application/json` block. Assert that:

```js
assert.equal(manifest.sourceRevision, baseline.sourceRevision);
assert.equal(manifest.blocks[0].order, 0);
assert.equal(manifest.blocks.find((b) => b.name === 'eva-app-module-source').role, 'vendor');
assert.match(outputHtml, /vendor\/eva-legacy-runtime\.js/);
assert.match(outputHtml, /prototype\/000-/);
```

Run:

```powershell
node --test tests/split-standalone.test.mjs
```

Expected: FAIL because `tools/split-standalone.mjs` does not exist.

- [ ] **Step 2: Implement the splitter from the leadership method**

Adapt the leadership script so it always:

- reads the current source entry;
- writes only under an explicit output directory;
- extracts the large runtime as `vendor/eva-legacy-runtime.js` and large CSS as `vendor/eva-legacy.css`;
- externalizes the remaining executable script/style blocks in original order;
- keeps inert `application/json` blocks inert;
- writes the current Git revision and source SHA-256 into the manifest;
- throws if the runtime loader rewrite anchor is missing;
- never reads UI content from the leadership output directory.

Export `splitStandalone({ sourcePath, outputRoot, sourceRevision })` for tests and retain a CLI entry.

- [ ] **Step 3: Add package commands**

Create:

```json
{
  "name": "eva-mode-exploration",
  "private": true,
  "type": "module",
  "scripts": {
    "split": "node tools/split-standalone.mjs \"prototypes/eva demo 0904 -v1.html\" build/modular",
    "check:baseline": "node scripts/contracts/verify-baseline.mjs",
    "check:manifest": "node tools/check-manifest.mjs build/modular/prototype-manifest.json",
    "test": "node --test tests/*.test.mjs"
  }
}
```

- [ ] **Step 4: Run splitter tests**

Run:

```powershell
npm test
```

Expected: PASS.

- [ ] **Step 5: Commit the splitter**

```powershell
git add package.json tools tests build/.gitkeep
git commit -m "build: split current Eva standalone into ordered modules"
```

### Task 3: Generate and verify the current modular runtime

**Files:**
- Generate: `build/modular/**`
- Create: `scripts/contracts/verify-modular-output.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: outputs from Task 2 and baseline from Task 1.
- Produces: a deterministic modular runtime whose manifest proves it was generated from the current source.

- [ ] **Step 1: Write a failing output contract**

The verifier must assert:

```js
manifest.sourceRevision === baseline.sourceRevision;
manifest.sourceCanonicalSha256 === baseline.canonicalSha256;
manifest.blocks.every((block, index) => block.order === index);
```

It must also verify that every manifest file exists, no output file contains a leadership source revision, and the small `index.html` contains the same required markers either directly or through files listed in the manifest.

Run before generation:

```powershell
node scripts/contracts/verify-modular-output.mjs
```

Expected: FAIL because generated output is missing.

- [ ] **Step 2: Generate from the current source**

```powershell
npm run check:baseline
npm run split
```

Expected: `build/modular/index.html` is below 20 KB and the manifest revision is `830514a...`.

- [ ] **Step 3: Run all static contracts**

```powershell
npm run check:manifest
node scripts/contracts/verify-modular-output.mjs
node scripts/verify-project-contract.mjs
node scripts/verify-sidebar-selection-contract.mjs
node scripts/verify-im-shell-contract.mjs
node scripts/verify-message-routing-contract.mjs
```

Expected: all exit 0.

- [ ] **Step 4: Add deterministic regeneration check**

Generate twice into two temporary directories and compare sorted manifest records plus SHA-256 for every output. Ignore only `generatedAt`, or remove nondeterministic time from the manifest entirely.

- [ ] **Step 5: Commit generated foundation and verifier**

```powershell
git add build/modular scripts/contracts/verify-modular-output.mjs package.json
git commit -m "refactor: externalize current Eva runtime without UI rollback"
```

### Task 4: Promote the modular runtime as the only active entry

**Files:**
- Replace: `index.html`
- Create: `vendor/eva-legacy-runtime.js`
- Create: `vendor/eva-legacy.css`
- Create: `prototype/**`
- Create: `prototype-manifest.json`
- Delete from active tree: `prototypes/eva demo 0904 -v1.html`
- Modify: `.vercelignore`
- Modify: `.gitignore`
- Modify: `vercel.json`
- Modify: `README.md`
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes: verified `build/modular/**`.
- Produces: the root site served and deployed directly from the modular files.

- [ ] **Step 1: Copy verified output into active paths**

Use filesystem copy operations only after resolving every source under `build/modular` and every destination under the isolated worktree. Do not compose cross-shell deletion commands. Replace root `index.html` last.

- [ ] **Step 2: Retire the parallel standalone entry**

Remove `prototypes/eva demo 0904 -v1.html` from the active branch only after Task 3 passes. Recovery remains available from the baseline commit and migration branch history.

- [ ] **Step 3: Update project rules**

Replace the single-file synchronization contract in `AGENTS.md` and `README.md` with:

- root `index.html` is the only runtime entry;
- `prototype-manifest.json` defines ordered legacy compatibility modules;
- current development edits target feature files, not `vendor/eva-legacy-runtime.js`;
- AionUI is a temporary compatibility dependency with no Eva product authority;
- GitHub `main` triggers Vercel automatically.

- [ ] **Step 4: Update deployment inclusion**

Set `.vercelignore` to include `index.html`, `prototype/`, `vendor/`, `assets/`, `prototype-manifest.json`, and `vercel.json`, while excluding tests, docs, migration data, build staging, and local environment files.

- [ ] **Step 5: Run source and deployment contracts**

```powershell
npm test
npm run check:baseline
node scripts/contracts/verify-modular-output.mjs --root .
node scripts/verify-project-contract.mjs
git diff --check
```

Expected: all exit 0; no tracked active standalone remains.

- [ ] **Step 6: Commit active-entry promotion**

```powershell
git add index.html prototype vendor assets prototype-manifest.json .vercelignore .gitignore vercel.json README.md AGENTS.md package.json scripts
git add -u prototypes
git commit -m "refactor: make modular Eva runtime the only active entry"
```

### Task 5: Organize the local `D:\Geely` workspace without deleting source material

**Files:**
- Create: `D:\Geely\archive\process\2026-09-04\README.md`
- Move: `D:\Geely\.codex_thread_extract.txt` to `D:\Geely\archive\process\2026-09-04\.codex_thread_extract.txt`
- Modify: `D:\Geely\README.md`
- Modify: `D:\Geely\projects\README.md`

**Interfaces:**
- Consumes: the read-only inventory of `D:\Geely`, project Git roots, and reference search results.
- Produces: a documented `baseline / projects / archive` workspace with no loose process artifact at root.

- [ ] **Step 1: Verify exact move paths**

Use `Resolve-Path` for the source and `GetFullPath` for the destination. Assert the source begins with `D:\Geely\` and destination begins with `D:\Geely\archive\process\2026-09-04\`.

- [ ] **Step 2: Confirm the process artifact has no project references**

```powershell
rg -n '\.codex_thread_extract|codex_thread_extract' D:\Geely
```

Expected: no source reference outside the file itself.

- [ ] **Step 3: Move, do not delete**

Create the destination directory and use `Move-Item -LiteralPath` after checking the resolved paths. Record the original path, new path, SHA-256, size, and reason in the archive README.

- [ ] **Step 4: Update workspace documentation**

Document:

- `baseline/` is protected and read-only;
- `projects/eva-mode-exploration/` is the current Git and Vercel project;
- `projects/eva-onboarding/` is independent;
- `archive/` stores non-current process material;
- received ZIP files stay at their original receipt paths and are not treated as current source.

- [ ] **Step 5: Verify workspace boundaries**

Confirm the only Git root under `D:\Geely` is still `projects/eva-mode-exploration`, baseline hashes have not changed, and no referenced file was moved.

### Task 6: Browser and Vercel-ready verification checkpoint

**Files:**
- Create: `artifacts/verification/modular-foundation.json`

**Interfaces:**
- Consumes: promoted modular entry from Task 4.
- Produces: evidence for local rendering and key navigation before Supabase or GDS implementation begins.

- [ ] **Step 1: Start a local static server**

Add and run an explicit Node static-server command that serves the repository root and returns correct JavaScript/CSS MIME types. Record its port and process ID.

- [ ] **Step 2: Verify the initial page and console**

Open `/#/collab`, assert the system topbar, sidebar, current content, and recent-update text are visible; capture console errors and fail on uncaught runtime exceptions.

- [ ] **Step 3: Verify the minimum critical path**

Click `消息 → 关注`, `消息 → 最近`, `我的AI`, `个人 → Eva同学`, `通讯录`, and `数字员工`. Assert each route changes, only one primary navigation row is selected, and the expected content is visible.

- [ ] **Step 4: Verify shared IM behavior**

For one text message in each team IM entry, verify hover controls and the custom context menu appear and the native browser menu is suppressed. Verify the shared composer remains visible.

- [ ] **Step 5: Save evidence and commit checkpoint**

Write route, visible heading, selected navigation ID, console-error count, and timestamp to `artifacts/verification/modular-foundation.json`.

```powershell
git add artifacts/verification/modular-foundation.json
git commit -m "test: verify modular Eva foundation in browser"
```

### Task 7: Prepare the next two subsystem plans

**Files:**
- Create: `docs/superpowers/plans/2026-09-04-eva-comments-supabase.md`
- Create: `docs/superpowers/plans/2026-09-04-eva-gds-aionui-exit.md`

**Interfaces:**
- Consumes: the stable modular foundation and its verification evidence.
- Produces: independently executable plans for shared Comments and progressive Eva-owned component replacement.

- [ ] **Step 1: Inspect current Supabase and Vercel state**

Use the installed Supabase and Vercel skills. Read current project linkage, environment-variable names, deployment project, and official current security guidance without printing secret values.

- [ ] **Step 2: Write the Comments plan**

The plan must define exact migrations, RLS policies, anonymous identity flow, mandatory `author_name`, Comments UI files, failure isolation, persistence tests, Vercel environment variables, and Comment → Run safety boundary.

- [ ] **Step 3: Write the GDS/AionUI-exit plan**

The plan must inventory AionUI-owned runtime regions, define the replacement order, map the six GDS states, preserve the Octo IM boundary, and require removal of each migrated domain's old CSS/DOM/bundle patch in the same task.

- [ ] **Step 4: Run plan self-review**

Check both plans against the architecture spec for complete coverage, no placeholders, consistent interfaces, and independent rollback points.

## Phase 1 Completion Gate

Phase 1 is complete only when Tasks 1-6 are committed on the isolated branch, the primary checkout's pre-existing uncommitted files remain unchanged, the local modular entry passes its browser checkpoint, and the old standalone is recoverable from Git history but absent from the active runtime tree. Do not push or merge to `main` until this evidence exists.
