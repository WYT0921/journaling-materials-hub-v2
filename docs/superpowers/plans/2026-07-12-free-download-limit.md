# Free Download Limit Configuration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the free-download limit into Spring Boot configuration with a default of 50 and environment-variable override support.

**Architecture:** Define one canonical property in `application.yml` and inject it into `DownloadServiceImpl`. Keep the API contract unchanged and verify both default and overridden values through Spring tests.

**Tech Stack:** Spring Boot 3, Java, JUnit 5, Maven

## Global Constraints

- Property: `app.download.free-limit`
- Environment override: `FREE_DOWNLOAD_LIMIT`
- Default value: `50`
- Preserve existing download response fields and premium/duplicate-download behavior.

---

### Task 1: Configure and consume the free-download limit

**Files:**
- Modify: `backend/src/main/resources/application.yml`
- Modify: `backend/src/main/java/com/journaling/hub/service/impl/DownloadServiceImpl.java`
- Modify: `backend/src/test/java/com/journaling/hub/service/DownloadServiceTest.java`
- Modify: `backend/src/test/java/com/journaling/hub/controller/DownloadControllerTest.java`

**Interfaces:**
- Consumes: Spring property `app.download.free-limit`
- Produces: unchanged download response with configured `freeDownloadLimit`

- [ ] **Step 1: Update tests to expect the default limit of 50 and add an override-context test using `app.download.free-limit=6`.**
- [ ] **Step 2: Run the focused tests and verify they fail because production still uses 5.**
- [ ] **Step 3: Add `app.download.free-limit: ${FREE_DOWNLOAD_LIMIT:50}` and inject the property into `DownloadServiceImpl`; replace all constant references.**
- [ ] **Step 4: Run focused tests and verify they pass.**
- [ ] **Step 5: Run `mvn test` and verify the complete backend suite passes.**

### Task 2: Synchronize project tracking documents

**Files:**
- Modify: `docs/待完善问题.txt`
- Modify: `docs/开发进度表.txt`

**Interfaces:**
- Consumes: verified implementation result
- Produces: tracking entries documenting the configurable default of 50

- [ ] **Step 1: Record the completed configuration change in both tracking documents without changing unrelated statuses.**
- [ ] **Step 2: Review the final diff for scope, configuration naming, and accidental edits.**
