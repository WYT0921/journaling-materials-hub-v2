# Free Collage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a one-session WeChat mini-program collage editor using Canvas 2D, the existing single-material library, editable image layers, and high-resolution album export.

**Architecture:** Keep the serializable Scene Graph and history in a dedicated Pinia store, while Canvas nodes and image objects remain page-local. A shared renderer draws both the interactive screen Canvas and a WeChat offscreen Canvas; existing material and download APIs remain the authority for catalog access and original-image entitlement.

**Tech Stack:** uni-app Vue 3, Pinia, WeChat Mini Program Canvas 2D, Node built-in test runner.

**Execution Status (2026-07-20):** Tasks 1-4 implemented; 15 pure-logic tests, mp-weixin build, and H5 build pass. Task 5 code audit and tracking update completed; iOS/Android real-device validation remains external.

## Global Constraints

- Do not introduce Fabric.js, Konva.js, or another image-editor framework.
- Do not add cloud saves, drafts, works lists, cross-device sync, uploads, text editing, or AI layout.
- Clear editor state when the collage page unloads.
- Preserve existing material, authentication, quota, and download behavior.
- Do not modify or stage the local credential-bearing `.env.example` or release artifacts.

---

### Task 1: Scene Graph and history

**Files:**
- Create: `frontend/src/utils/collage/scene-graph.js`
- Create: `frontend/src/stores/collage.js`
- Create: `frontend/tests/collage-scene-graph.test.mjs`

**Interfaces:**
- `createCanvasConfig(paperSize, orientation)` returns logical and export sizes.
- `createImageLayer(material, imageInfo, canvas)` creates a centered image layer.
- `cloneScene(scene)` returns a serializable deep copy.
- `useCollageStore()` owns canvas, layers, selection, commands, history, dirty state, and reset.

- [ ] Write Node tests for canvas presets, centered image fitting, clone independence, layer cap, history, undo, redo, and reset.
- [ ] Run `node --test frontend/tests/collage-scene-graph.test.mjs` and confirm failure because the modules do not exist.
- [ ] Implement the pure Scene Graph helpers and Pinia store actions.
- [ ] Re-run the Node tests and confirm they pass.

### Task 2: Basic editor and material loading

**Files:**
- Modify: `frontend/src/pages.json`
- Modify: `frontend/src/pages/detail/detail.vue`
- Create: `frontend/src/pages/collage/index.vue`
- Create: `frontend/src/components/collage/CanvasSizeSheet.vue`
- Create: `frontend/src/components/collage/MaterialPicker.vue`
- Create: `frontend/src/utils/collage/image-loader.js`
- Create: `frontend/src/utils/collage/renderer.js`

**Interfaces:**
- `loadMaterialImage(material)` uses `downloadMaterial`, `uni.downloadFile`, and `uni.getImageInfo` and returns local path and intrinsic size.
- `drawScene(ctx, scene, imageResolver, viewport, options)` draws background, ordered image layers, and optional selection controls.

- [ ] Register the page and add a single-material detail CTA carrying only `materialId`.
- [ ] Implement size/orientation selection and a local-paginated single-material picker.
- [ ] Initialize the Canvas 2D node, authorize/download the entry material, add it to the Scene Graph, and draw it.
- [ ] Reset the store and local image cache on page unload.
- [ ] Run the Scene Graph tests and `npm run build:mp-weixin`.

### Task 3: Geometry, gestures, layers, undo, and redo

**Files:**
- Create: `frontend/src/utils/collage/geometry.js`
- Create: `frontend/tests/collage-geometry.test.mjs`
- Modify: `frontend/src/pages/collage/index.vue`
- Create: `frontend/src/components/collage/EditorToolbar.vue`
- Create: `frontend/src/components/collage/LayerPanel.vue`
- Modify: `frontend/src/stores/collage.js`

**Interfaces:**
- `screenToLogical(point, viewport)` converts touch coordinates.
- `hitTestLayer(point, layer)` checks a rotated rectangular image.
- `distance(a, b)` and `angle(a, b)` drive two-touch transforms.

- [ ] Write failing geometry tests for coordinate conversion, rotated hit tests, distance, and angle.
- [ ] Implement geometry helpers and verify tests pass.
- [ ] Add topmost selection, one-touch drag, two-touch scale/rotation, and one history entry per completed gesture.
- [ ] Add delete, duplicate, move up/down, bring front/send back, undo, and redo controls.
- [ ] Verify pure tests and the mini-program build.

### Task 4: High-resolution export and album save

**Files:**
- Create: `frontend/src/utils/collage/exporter.js`
- Modify: `frontend/src/pages/collage/index.vue`
- Modify: `frontend/src/utils/collage/renderer.js`

**Interfaces:**
- `exportCollage(scene, imageResolver, dpi)` creates a WeChat offscreen Canvas and returns a temporary JPEG path.
- `saveCollageToAlbum(filePath)` handles authorization, settings recovery, and album save.

- [ ] Add export dimension tests to the Scene Graph test suite and verify the new assertions fail before implementation.
- [ ] Implement 300 DPI offscreen rendering with an explicit 200 DPI retry path after memory/export failure.
- [ ] Add loading locks, missing-image checks, permission recovery, and success/failure feedback.
- [ ] Verify pure tests and the mini-program build.

### Task 5: Completion audit and project tracking

**Files:**
- Modify: `docs/待完善问题.txt`
- Modify: `docs/开发进度表.txt`

- [ ] Review every requirement against the actual page, store, helpers, and build output.
- [ ] Run `cd frontend && npm run test:collage`.
- [ ] Run `npm run build:mp-weixin` and `npm run build:h5`.
- [ ] Record verified implementation status and any remaining real-device-only checks in both tracking documents.
- [ ] Inspect `git diff --check` and `git status --short`, preserving unrelated user files.
