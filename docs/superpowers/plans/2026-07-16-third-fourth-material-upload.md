# Third and Fourth Material Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename fourth-period temporary image files and upload all third- and fourth-period materials through the production admin API without duplicates.

**Architecture:** Use a checked JSON manifest as the source of truth for local renames and upload metadata. A Node.js batch script validates the manifest, applies collision-safe renames, queries existing titles, uploads missing images, creates material records, writes a credential-free report, and verifies records and asset URLs.

**Tech Stack:** Node.js 20 built-ins (`fs`, `path`, `fetch`, `FormData`, `Blob`), existing Spring Boot admin REST API.

## Global Constraints

- Fourth-period hash and `Pasted-*` files use unique Chinese names in the `类型-视觉特征` format.
- Existing fourth-period `星星-白底`、`星星-透明底`、`花-白底`、`花-透明底` names remain unchanged.
- Third-period filenames remain unchanged unless the platform already has a conflicting unrelated title, in which case the upload title gets a period prefix.
- White-background, transparent-background, and full-sheet images use `materialType=bundle`; independent elements use `materialType=single`.
- The admin token is read only from `ADMIN_TOKEN` and is never written to files or reports.
- Local rename operations must never overwrite an existing path.

---

### Task 1: Build and validate the rename manifest

**Files:**
- Create: `scripts/fourth-material-renames.json`
- Create: `scripts/upload-period-materials.mjs`

**Interfaces:**
- Consumes: fourth-period source filenames and the approved naming rule.
- Produces: `validateManifest(manifest, root)` and a validated list of `{source, target, title, category, materialType, tags}` entries.

- [ ] **Step 1: Record all 26 temporary fourth-period filenames and their unique Chinese target names in the manifest.**
- [ ] **Step 2: Implement validation that rejects missing sources, duplicate targets, unsupported extensions, and occupied target paths.**
- [ ] **Step 3: Run dry-run validation.**

Run: `node scripts/upload-period-materials.mjs --dry-run --period fourth`

Expected: reports 30 images, 26 pending renames, zero collisions, and performs no writes.

### Task 2: Rename fourth-period files safely

**Files:**
- Modify: `E:\图片\手账素材\2026\第四期\*` (26 temporary image names only)
- Modify: `scripts/upload-period-materials.mjs`

**Interfaces:**
- Consumes: validated manifest from Task 1.
- Produces: 30 descriptively named fourth-period image files and a rename result list.

- [ ] **Step 1: Revalidate every source and target immediately before mutation.**
- [ ] **Step 2: Rename each file within the same directory using `fs.rename`, stopping before any overwrite.**
- [ ] **Step 3: Compare the resulting directory against all 30 manifest titles.**

Run: `node scripts/upload-period-materials.mjs --rename-only --period fourth`

Expected: 26 renamed, zero missing, zero collisions; the four existing named files are unchanged.

### Task 3: Upload third- and fourth-period materials

**Files:**
- Modify: `scripts/upload-period-materials.mjs`
- Create: `release/upload-period-materials-<timestamp>.json`

**Interfaces:**
- Consumes: `ADMIN_TOKEN`, both source directories, validated upload entries, and `/api/v2/admin/*` endpoints.
- Produces: platform material records and a credential-free JSON report.

- [ ] **Step 1: Query the complete admin material list and resolve exact-title duplicates before uploading.**
- [ ] **Step 2: Upload every missing image to `/api/v2/admin/upload`.**
- [ ] **Step 3: Create each missing material through `/api/v2/admin/materials` with period, category, type, and tags.**
- [ ] **Step 4: Retry isolated failures without re-uploading successful titles.**

Run: `node scripts/upload-period-materials.mjs --upload --period third,fourth` with `ADMIN_TOKEN` already set in the process environment.

Expected: `failed=0` and `uploaded + skipped = 36`.

### Task 4: Verify production records and assets

**Files:**
- Modify: `release/upload-period-materials-<timestamp>.json`

**Interfaces:**
- Consumes: platform material list and newly created image/thumbnail URLs.
- Produces: final verification counts without credentials.

- [ ] **Step 1: Requery the admin material list and match all 36 intended titles.**
- [ ] **Step 2: Verify category, `materialType`, status, image URL, and thumbnail URL for every matched record.**
- [ ] **Step 3: issue `HEAD` requests for each newly uploaded original and thumbnail URL.**
- [ ] **Step 4: Write final counts and any failures into the report.**

Run: `node scripts/upload-period-materials.mjs --verify --period third,fourth` with `ADMIN_TOKEN` already set in the process environment.

Expected: 36 matched records, zero invalid metadata, and all new asset checks return HTTP 2xx.
