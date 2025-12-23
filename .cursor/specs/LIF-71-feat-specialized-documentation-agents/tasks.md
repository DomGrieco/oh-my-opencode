# Task Breakdown: Specialized Documentation Agents

**Linear Issue**: [LIF-71](https://linear.app/lifelogger/issue/LIF-71)  
**Plan**: [plan.md](./plan.md)  
**Created**: 2025-12-21  
**Total Estimate**: ~4 hours

---

## Overview

| Phase | Description | Tasks | Estimate |
|-------|-------------|-------|----------|
| Phase 1 | Agent Creation | 4 | 2h |
| Phase 2 | call_omo_agent Integration | 1 | 15min |
| Phase 3 | Governance Hook Enhancement | 2 | 1h |
| Phase 4 | Testing & Verification | 2 | 30min |

---

## Phase 1: Agent Creation

**Goal**: Create historian and context-steward agents, update document-writer prompt  
**Independent Test**: All three agents exist in `src/agents/` and export correctly

### Task Table

| ID | Task | Status | Estimate | Dependencies | Notes |
|----|------|--------|----------|--------------|-------|
| T001 | Create `src/agents/historian.ts` | ✅ Done | 30min | - | Changelog specialist agent |
| T002 | Create `src/agents/context-steward.ts` | ✅ Done | 30min | - | Project memory specialist agent |
| T003 | Update `src/agents/document-writer.ts` prompt | ✅ Done | 30min | - | Refine for user-facing docs only |
| T004 | Update `src/agents/index.ts` exports and registry | ✅ Done | 30min | T001, T002 | Add to builtinAgents + AGENT_ROLE_REGISTRY |

### Task Details

#### T001: Create historian.ts

**Description**: Create changelog specialist agent with specialized prompt for impact analysis and semantic versioning.

**Completion Criteria**:
- [ ] Export `historianAgent: AgentConfig`
- [ ] Model: `google/gemini-2.0-flash-exp`
- [ ] Mode: `subagent`
- [ ] Tools: `{ background_task: false }`
- [ ] Prompt includes: changelog generation, impact analysis, semantic versioning, migration guides

**File**: `src/agents/historian.ts`

---

#### T002: Create context-steward.ts

**Description**: Create project memory specialist agent with specialized prompt for ADRs and technical documentation.

**Completion Criteria**:
- [ ] Export `contextStewardAgent: AgentConfig`
- [ ] Model: `google/gemini-2.0-flash-exp`
- [ ] Mode: `subagent`
- [ ] Tools: `{ background_task: false }`
- [ ] Prompt includes: ADRs, tech stack, architecture, glossary maintenance

**File**: `src/agents/context-steward.ts`

---

#### T003: Update document-writer.ts prompt

**Description**: Refine document-writer prompt to focus exclusively on user-facing documentation, removing changelog/memory responsibilities.

**Completion Criteria**:
- [ ] Prompt focuses on user-facing docs (`docs/`, `README*.md`)
- [ ] Removes changelog/memory responsibilities
- [ ] Maintains existing structure (mode, tools)
- [ ] Model updated to `google/gemini-2.0-flash-exp`

**File**: `src/agents/document-writer.ts`

---

#### T004: Update agents/index.ts

**Description**: Add new agents to exports and role registry.

**Completion Criteria**:
- [ ] Import `historianAgent` from `./historian`
- [ ] Import `contextStewardAgent` from `./context-steward`
- [ ] Add `historian` to `builtinAgents` object
- [ ] Add `context-steward` to `builtinAgents` object
- [ ] Add `historian: "specialist"` to `AGENT_ROLE_REGISTRY`
- [ ] Add `context-steward: "specialist"` to `AGENT_ROLE_REGISTRY`

**File**: `src/agents/index.ts`

---

## Phase 2: call_omo_agent Integration

**Goal**: Add new agents to ALLOWED_AGENTS for delegation  
**Independent Test**: `call_omo_agent` can delegate to historian and context-steward

### Task Table

| ID | Task | Status | Estimate | Dependencies | Notes |
|----|------|--------|----------|--------------|-------|
| T005 | Update `src/tools/call-omo-agent/constants.ts` | ✅ Done | 15min | T004 | Add to ALLOWED_AGENTS |

### Task Details

#### T005: Update call-omo-agent constants

**Description**: Add historian and context-steward to ALLOWED_AGENTS array.

**Completion Criteria**:
- [ ] Add `"historian"` to `ALLOWED_AGENTS` array
- [ ] Add `"context-steward"` to `ALLOWED_AGENTS` array
- [ ] Group with documentation specialists comment

**File**: `src/tools/call-omo-agent/constants.ts`

---

## Phase 3: Governance Hook Enhancement

**Goal**: Update governance hook with path categorization and keyword matching  
**Independent Test**: Writes to changelog paths route to historian, memory paths to context-steward

### Task Table

| ID | Task | Status | Estimate | Dependencies | Notes |
|----|------|--------|----------|--------------|-------|
| T006 | Update `types.ts` with path categorization | ✅ Done | 30min | - | Add types + GOVERNANCE_PATTERNS |
| T007 | Update `index.ts` with categorization logic | ✅ Done | 30min | T006 | Keyword matching + agent-specific errors |

### Task Details

#### T006: Update governance-docs-delegation types.ts

**Description**: Add path categorization types and GOVERNANCE_PATTERNS configuration.

**Completion Criteria**:
- [ ] Add `DocsCategory` type: `"documentation" | "changelog" | "memory"`
- [ ] Add `PathCategorization` interface
- [ ] Add `PathBasedCategory` interface (with `paths: string[]`)
- [ ] Add `KeywordBasedCategory` interface (with `keywords: string[]`)
- [ ] Add `DocsCategoryPatterns` interface
- [ ] Add `GOVERNANCE_PATTERNS` configuration object
- [ ] Update `ALLOWED_AGENTS` to include `["document-writer", "docs-publisher", "historian", "context-steward"]`

**File**: `src/hooks/governance-docs-delegation/types.ts`

---

#### T007: Update governance-docs-delegation index.ts

**Description**: Implement path categorization logic with keyword matching and agent-specific error messages.

**Completion Criteria**:
- [ ] Add `matchesKeyword()` function for case-insensitive keyword matching
- [ ] Add `categorizeDocsPath()` function that returns `PathCategorization | null`
- [ ] Update `isDocsPath()` to use categorization
- [ ] Update error message to include agent-specific rationale
- [ ] Error message suggests correct agent based on category
- [ ] Error message includes `run_in_background=true` suggestion

**File**: `src/hooks/governance-docs-delegation/index.ts`

---

## Phase 4: Testing & Verification

**Goal**: Verify all functionality works correctly  
**Independent Test**: Build passes, governance routes correctly

### Task Table

| ID | Task | Status | Estimate | Dependencies | Notes |
|----|------|--------|----------|--------------|-------|
| T008 | Run build verification | ✅ Done | 15min | T007 | typecheck + build |
| T009 | Manual testing of governance routing | ⏸️ Pending | 15min | T008 | Test all path patterns |

### Task Details

#### T008: Build verification

**Description**: Run typecheck and build to verify no errors.

**Completion Criteria**:
- [ ] `bun run typecheck` passes with no errors
- [ ] `bun run build` passes with no errors
- [ ] No type errors in new files

**Commands**:
```bash
bun run typecheck
bun run build
```

---

#### T009: Manual testing of governance routing

**Description**: Manually test governance hook routes to correct agent.

**Completion Criteria**:
- [ ] Write to `docs/api.md` → blocked with document-writer message
- [ ] Write to `CHANGELOG.md` → blocked with historian message
- [ ] Write to `my-changelog.md` → blocked with historian message (keyword)
- [ ] Write to `changelog-2024.md` → blocked with historian message (keyword)
- [ ] Write to `.cursor/memory/architecture.md` → blocked with context-steward message
- [ ] Delegation to historian → write succeeds
- [ ] Delegation to context-steward → write succeeds
- [ ] Exception paths (`.cursor/specs/`) → no blocking

---

## Execution Order

```
T001 ─┬─→ T004 ─→ T005 ─→ T006 ─→ T007 ─→ T008 ─→ T009
T002 ─┤
T003 ─┘
```

**Parallel Opportunities**:
- T001, T002, T003 can run in parallel (independent agent files)
- T006 can start before T005 completes (independent files)

---

## Checkpoint Validation

After each phase, verify:

| Phase | Checkpoint |
|-------|------------|
| Phase 1 | All three agents in `builtinAgents`, visible in `bun run typecheck` |
| Phase 2 | `call_omo_agent` lists historian and context-steward as options |
| Phase 3 | Governance hook blocks with agent-specific messages |
| Phase 4 | Full build passes, manual tests confirm routing |

---

## Notes

- **No test framework**: Manual testing via dogfooding only
- **Model**: All agents use `google/gemini-2.0-flash-exp` per spec
- **Keyword matching**: Changelog category uses case-insensitive `includes()` for "changelog"
- **Exception paths**: `.cursor/specs/` and `context/specs/` remain excepted
