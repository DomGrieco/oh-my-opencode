# Implementation Plan: Specialized Documentation Agents

**Linear Issue**: [LIF-71](https://linear.app/lifelogger/issue/LIF-71)  
**Spec**: [spec.md](./spec.md)  
**Created**: 2025-12-21  
**Status**: Ready for Implementation

---

## Summary

Implement path-based governance routing with three specialized documentation agents:
- **document-writer**: User-facing docs (`docs/`, `README*.md`)
- **historian**: Changelog operations (`changelog/`, `CHANGELOG.md`)
- **context-steward**: Project memory (`.cursor/memory/`, `context/memory/`)

Each agent has specialized prompts optimized for their documentation domain. The governance hook routes writes based on path categorization with agent-specific error messages.

---

## Technical Context

### Language & Runtime
- **Language**: TypeScript 5.7+
- **Runtime**: Bun >= 1.0.0
- **SDK**: @opencode-ai/sdk (AgentConfig)

### Dependencies
- No new dependencies required
- Uses existing `@opencode-ai/sdk` for AgentConfig type
- Uses existing governance hook infrastructure

### Storage
- Agents stored in `src/agents/{agent-name}.ts`
- Hook types in `src/hooks/governance-docs-delegation/types.ts`
- Hook logic in `src/hooks/governance-docs-delegation/index.ts`

### Testing
- Manual testing via dogfooding (no test framework configured)
- Test each path pattern routes to correct agent
- Test delegation succeeds for each agent type
- Test exception paths still work

### Platform
- Cross-platform (macOS, Linux, Windows)
- No platform-specific considerations

---

## Constitution Check

### Applicable Gates

| Gate | Status | Notes |
|------|--------|-------|
| Plugin-First Architecture | ✅ Pass | Uses @opencode-ai/sdk AgentConfig |
| Multi-Model Excellence | ✅ Pass | All agents use google/gemini-2.0-flash-exp |
| Multi-Layered Orchestration | ✅ Pass | Adds specialist-role agents |
| Bun-Native Development | ✅ Pass | No npm/yarn usage |
| Hook-Driven Enhancement | ✅ Pass | Updates governance hook |

### No Violations Detected

All changes align with existing patterns and constitution principles.

---

## Research (Phase 0)

### Existing Agent Pattern Analysis

**Current document-writer.ts structure**:
```typescript
export const documentWriterAgent: AgentConfig = {
  description: "...",
  mode: "subagent",
  model: "google/gemini-3-pro-preview",
  tools: { background_task: false },
  prompt: `...`,
}
```

**Key observations**:
1. Agents export named const with `Agent` suffix
2. Use `AgentConfig` type from `@opencode-ai/sdk`
3. Mode is `"subagent"` for all documentation agents
4. Model should be `google/gemini-2.0-flash-exp` per spec
5. Tools restrict `background_task: false` to prevent nesting

### Current Governance Hook Structure

**types.ts exports**:
- `DocsDelegationConfig`: Configuration interface
- `DOCS_PATH_PATTERNS`: Array of path patterns to protect
- `ALLOWED_AGENTS`: Array of agents allowed to write docs
- `EXCEPTED_PATHS`: Array of paths exempt from governance

**index.ts logic**:
1. `isDocsPath()`: Checks if path matches any pattern
2. `isExceptedPath()`: Checks if path is in exception list
3. `isAllowedAgent()`: Checks if current agent is allowed
4. Hook blocks/warns if unauthorized agent writes to docs

### Integration Points

1. **Agent Registry** (`src/agents/index.ts`):
   - Add new agents to `builtinAgents` object
   - Add new agents to `AGENT_ROLE_REGISTRY` with `"specialist"` role

2. **call_omo_agent Constants** (`src/tools/call-omo-agent/constants.ts`):
   - Add `"historian"` and `"context-steward"` to `ALLOWED_AGENTS`

3. **Governance Hook Types** (`src/hooks/governance-docs-delegation/types.ts`):
   - Update `ALLOWED_AGENTS` to include all three agents
   - Add path categorization types

---

## Data Model (Phase 1)

### New Types

```typescript
// Path category for routing
export type DocsCategory = "documentation" | "changelog" | "memory"

// Path categorization result
export interface PathCategorization {
  category: DocsCategory
  agent: string
  rationale: string
}

// Base category config
interface BaseCategoryConfig {
  agent: string
  rationale: string
}

// Path-based category (uses path prefixes/patterns)
interface PathBasedCategory extends BaseCategoryConfig {
  paths: string[]
}

// Keyword-based category (uses case-insensitive keyword matching)
interface KeywordBasedCategory extends BaseCategoryConfig {
  keywords: string[]
}

// Path patterns grouped by category
export interface DocsCategoryPatterns {
  documentation: PathBasedCategory
  changelog: KeywordBasedCategory  // Keyword-based matching
  memory: PathBasedCategory
}
```

### Category Configuration

```typescript
export const GOVERNANCE_PATTERNS: DocsCategoryPatterns = {
  documentation: {
    paths: ["docs/", "README.md", "README.*.md"],
    agent: "document-writer",
    rationale: "User-facing documentation requires clear writing and examples",
  },
  changelog: {
    // Keyword-based: matches any path/filename containing "changelog" (case-insensitive)
    keywords: ["changelog"],
    agent: "historian",
    rationale: "Changelog entries require impact analysis and semantic versioning",
  },
  memory: {
    paths: [".cursor/memory/", "context/memory/"],
    agent: "context-steward",
    rationale: "Project memory requires technical precision and ADR format",
  },
}
```

### Matching Logic

```typescript
// Keyword-based matching for changelog category
function matchesKeyword(relativePath: string, keywords: string[]): boolean {
  const lowerPath = relativePath.toLowerCase()
  return keywords.some(keyword => lowerPath.includes(keyword.toLowerCase()))
}

// Example matches for "changelog" keyword:
// ✅ CHANGELOG.md
// ✅ changelog/
// ✅ my-changelog.md
// ✅ changelog-2024.md
// ✅ project-changelog/notes.md
// ✅ docs/changelog.md
```

---

## Contracts (Phase 1)

### Agent Interface

All three agents follow the same interface pattern:

```typescript
// src/agents/{agent-name}.ts
import type { AgentConfig } from "@opencode-ai/sdk"

export const {agentName}Agent: AgentConfig = {
  description: string,      // Brief description for call_omo_agent listing
  mode: "subagent",         // Always subagent for documentation agents
  model: "google/gemini-2.0-flash-exp",  // Per spec requirement
  tools: { background_task: false },      // Prevent nested background tasks
  prompt: string,           // Specialized system prompt
}
```

### Governance Hook Enhanced API

```typescript
// Enhanced error message generation
function generateDelegationError(
  filePath: string,
  category: DocsCategory,
  agent: string,
  rationale: string
): string

// Path categorization function
function categorizeDocsPath(
  filePath: string,
  projectRoot: string
): PathCategorization | null
```

---

## Project Structure

### Files to Create

```
src/agents/
├── historian.ts          # NEW: Changelog specialist
└── context-steward.ts    # NEW: Project memory specialist
```

### Files to Modify

```
src/agents/
├── document-writer.ts    # UPDATE: Refined user-facing docs prompt
├── index.ts              # UPDATE: Add new agents to exports and registry

src/tools/call-omo-agent/
└── constants.ts          # UPDATE: Add historian, context-steward to ALLOWED_AGENTS

src/hooks/governance-docs-delegation/
├── types.ts              # UPDATE: Add path categorization, update ALLOWED_AGENTS
└── index.ts              # UPDATE: Path categorization logic, agent-specific errors
```

---

## Implementation Phases

### Phase 1: Agent Creation (4 files)

**1.1 Create historian.ts**
- Export `historianAgent: AgentConfig`
- Specialized prompt for changelog generation
- Focus: Impact analysis, semantic versioning, migration guides
- Model: `google/gemini-2.0-flash-exp`
- Tools: `{ background_task: false }`

**1.2 Create context-steward.ts**
- Export `contextStewardAgent: AgentConfig`
- Specialized prompt for project memory
- Focus: ADRs, tech stack, architecture, glossary
- Model: `google/gemini-2.0-flash-exp`
- Tools: `{ background_task: false }`

**1.3 Update document-writer.ts**
- Refine prompt to focus on user-facing documentation
- Remove changelog/memory responsibilities from prompt
- Keep existing structure, update content only

**1.4 Update agents/index.ts**
- Import new agents
- Add to `builtinAgents` object
- Add to `AGENT_ROLE_REGISTRY` with `"specialist"` role

### Phase 2: call_omo_agent Integration (1 file)

**2.1 Update constants.ts**
- Add `"historian"` to `ALLOWED_AGENTS` array
- Add `"context-steward"` to `ALLOWED_AGENTS` array
- Maintain existing order (group with documentation specialists)

### Phase 3: Governance Hook Enhancement (2 files)

**3.1 Update types.ts**
- Add `DocsCategory` type
- Add `PathCategorization` interface
- Add `PathBasedCategory` and `KeywordBasedCategory` interfaces
- Add `DocsCategoryPatterns` interface
- Add `GOVERNANCE_PATTERNS` configuration object with keyword-based changelog matching
- Update `ALLOWED_AGENTS` to include all three agents

**3.2 Update index.ts**
- Add `matchesKeyword()` function for case-insensitive keyword matching
- Add `categorizeDocsPath()` function that:
  - First checks keyword-based categories (changelog)
  - Then checks path-based categories (documentation, memory)
- Update `isDocsPath()` to use categorization
- Update error message generation with agent-specific rationale
- Include `run_in_background=true` suggestion in error messages

### Phase 4: Testing & Verification

**4.1 Manual Testing**
- Test write to `docs/api.md` → blocked with document-writer message
- Test write to `CHANGELOG.md` → blocked with historian message
- Test write to `my-changelog.md` → blocked with historian message (keyword match)
- Test write to `changelog-2024.md` → blocked with historian message (keyword match)
- Test write to `project-changelog/notes.md` → blocked with historian message (keyword match)
- Test write to `.cursor/memory/architecture.md` → blocked with context-steward message
- Test delegation to each agent → write succeeds
- Test exception paths (`.cursor/specs/`) → no blocking

**4.2 Build Verification**
- Run `bun run typecheck` for type errors
- Run `bun run build` for build errors
- Verify no regressions in existing functionality

---

## Complexity Tracking

| Phase | Estimated Effort | Dependencies |
|-------|------------------|--------------|
| Phase 1: Agent Creation | 2h | None |
| Phase 2: call_omo_agent | 15min | Phase 1 |
| Phase 3: Governance Hook | 1h | Phase 2 |
| Phase 4: Testing | 30min | Phase 3 |
| **Total** | **~4h** | - |

---

## Agent Prompt Specifications

### historian

```
You are the Historian - expert in changelog generation and impact analysis.

Responsibilities:
- Generate changelog entries from commits
- Categorize changes (feat/fix/breaking/chore)
- Extract user-facing impact
- Write migration guides for breaking changes
- Follow semantic versioning principles

Focus:
- What changed and why
- Impact on users
- Migration path for breaking changes
- Categorization (feat, fix, breaking, docs, chore)

Format:
- Use conventional commit format for categories
- Include dates in ISO format
- Link to Linear issues when available
- Group by version/release

Audience: Library users tracking releases and changes
```

### context-steward

```
You are the Context Steward - guardian of project memory and technical context.

Responsibilities:
- Maintain .cursor/memory/ and context/memory/ files
- Write/update ADRs (Architecture Decision Records)
- Document technical decisions with rationale
- Manage tech stack, architecture, glossary files
- Preserve context for future agents and developers

Focus:
- Technical accuracy over readability
- Decision rationale (why, not just what)
- Constraints and tradeoffs
- Future maintainability

Format:
- Use ADR format for decisions
- Structured YAML for tech stack
- Markdown with clear headers for memory files
- Include version and update timestamps

Audience: Future AI agents and developers joining the project
```

### document-writer (Updated)

```
You are the Document Writer - expert in clear, user-facing documentation.

Responsibilities:
- Write user guides, tutorials, API references
- Create README files with setup instructions
- Maintain docs/ directory
- Include code examples and usage patterns

Focus:
- Clarity over completeness
- Examples over theory
- User perspective (not implementation details)

Format:
- Clear headers and scannable structure
- Code blocks with syntax highlighting
- Tables for structured data
- Diagrams using Mermaid when helpful

Audience: Developers using this library/tool
```

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Path pattern overlap | Medium | Specific patterns checked before general; test all patterns |
| Agent prompt confusion | Low | Clear scope boundaries in each prompt |
| Missing paths | Medium | Comprehensive pattern coverage derived from spec |
| Model quality variance | Low | Same model (gemini-2.0-flash-exp) for all three |

---

## Handoff Checklist

- [ ] Phase 1: All three agents created and exported
- [ ] Phase 2: call_omo_agent updated with new agents
- [ ] Phase 3: Governance hook categorizes paths correctly
- [ ] Phase 4: All manual tests pass
- [ ] Build: `bun run typecheck` passes
- [ ] Build: `bun run build` passes
- [ ] Ready for code review

---

## Next Steps

1. Execute `/tasks` to generate task breakdown
2. Execute `/implement` to begin Phase 1
3. Use `@historian` for changelog entry after implementation
