# Plans Index

## ID Ledger

| Field | Value |
|------|-------|
| Last Assigned ID | 003 |
| Next ID | 004 |

## Ledger Rules

- Plan IDs are global and immutable.
- IDs are never reused.
- Completed plans reserve their IDs forever.
- New plan IDs must be calculated from `INDEX.md`, active files, and completed files.
- Do not calculate next ID from `brain/plans/` alone.

## Overview

| Category | Count |
|----------|-------|
| Active plans | 3 |
| Completed | 0 |
| **Total** | **3** |

## Completed Plans

| ID | Title | Tier | Completed |
|----|-------|------|-----------|
| _none yet_ | | | |

## Archived

| Path | Note |
|------|------|
| [archive/2026-08-24-improve-workflow/](archive/2026-08-24-improve-workflow/) | Original admin plan from the `improve` workflow, formerly the root `plans/` folder. Superseded by plan 001; kept for its step-by-step detail. |

## Active Plans by Status

### Proposed

| ID | Title | Tier |
|----|-------|------|
| _none_ | | |

### Approved

| ID | Title | Tier |
|----|-------|------|
| _none_ | | |

### In progress

| ID | Title | Tier |
|----|-------|------|
| 001 | Build a MongoDB admin with Shopify-like workflows | dig-deep |
| 002 | Complete the public website and Shopify-like admin page inventory | dig-deep |
| 003 | Apply the website-draft editorial refresh | full-feature |

## Plan Structure

Each plan file contains:

```yaml
---
id: "XXX"
title: ...
tier: quick|prototype|full-feature|dig-deep|ultrathink
type: feature|refactor|debug|architecture|release|repo-maintenance|agent-workflow|unknown
status: proposed|approved|in-progress|done|superseded|cancelled
source: kenmark-plan
created: YYYY-MM-DD
approved: YYYY-MM-DD
completed: YYYY-MM-DD
files:
  - relevant-files
related_issues:
  - "042"
related_plans:
  - "003"
---

## Summary

## Goal

## Plan

## Acceptance criteria
```

## Plan Tiers

| Tier | When to use |
|------|-------------|
| quick | Small, clear scope; bugfix-sized work |
| prototype | Spike, POC, timeboxed experiment |
| full-feature | Normal feature or change |
| dig-deep | Architecture, migration, high-risk or unclear work |
| ultrathink | Production-critical, multi-system, long-term source of truth |

## Plan Types

| Type | Description |
|------|-------------|
| feature | New module, UI, API, workflow |
| refactor | Restructure, simplify, rename, migration |
| debug | Failing build, runtime issue, bug strategy |
| architecture | Stack decisions, boundaries, system design |
| release | Publish, deploy, version, changelog |
| repo-maintenance | Hygiene, docs, quality gates |
| agent-workflow | Skills, subagents, rules, automation |
| unknown | Unclear or mixed request |

## Workstreams

| Workstream | Plans |
|-----------|-------|
| Admin platform and commerce operations | 001 |
| Website, content, and admin page completion | 002 |
