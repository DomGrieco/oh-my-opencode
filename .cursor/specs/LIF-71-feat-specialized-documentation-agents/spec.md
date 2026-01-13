# Feature Specification: Specialized Documentation Agents

**Feature ID**: LIF-71  
**Type**: Feature  
**Status**: Specification  
**Created**: 2025-12-21  
**Linear Issue**: [LIF-71](https://linear.app/lifelogger/issue/LIF-71)

## Overview

Implement path-based governance routing with three specialized documentation agents instead of a single generic `document-writer`. Each agent will have specialized prompts, capabilities, and responsibilities based on documentation type.

## Background

### Current State

The governance-docs-delegation hook currently routes all documentation writes to a single `document-writer` agent:

- **Paths protected**: `docs/`, `README*.md`, `CHANGELOG.md`, `changelog/`, `.cursor/memory/`, `context/memory/`
- **Single agent**: `document-writer` handles all documentation types
- **Problem**: One agent trying to be expert at user-facing docs, changelogs, AND project memory
- **Result**: Generic output, inconsistent quality across documentation types

### Problems with Current Approach

1. **Conflicting Expertise**: User-facing docs require clarity and examples; changelogs need impact analysis and semantic versioning; project memory needs technical precision and ADR format
2. **Generic Prompts**: Single prompt tries to cover all use cases, resulting in mediocre output
3. **Missed Specialization**: We already have `historian` agent (OpenCode builtin) for changelogs but governance doesn't use it
4. **Inconsistent Quality**: Documentation quality varies depending on whether task aligns with agent's primary focus

## Proposed Solution

### Three Specialized Agents

| Agent | Model | Paths | Expertise |
|-------|-------|-------|-----------|
| **document-writer** | `google/gemini-2.0-flash-exp` | `docs/`, `README*.md` | User-facing documentation, tutorials, API references |
| **historian** | `google/gemini-2.0-flash-exp` | `changelog/`, `CHANGELOG.md` | Changelog generation, impact analysis, migration guides |
| **context-steward** | `google/gemini-2.0-flash-exp` | `.cursor/memory/`, `context/memory/` | Project memory, ADRs, architecture docs, tech stack |

### Path-Based Routing

Governance hook will categorize documentation writes by path and route to the appropriate agent:

```typescript
// Example routing logic
if (filePath.startsWith('docs/') || filePath.match(/README.*\.md$/)) {
  requiredAgent = 'document-writer'
} else if (filePath.startsWith('changelog/') || filePath === 'CHANGELOG.md') {
  requiredAgent = 'historian'
} else if (filePath.includes('/memory/')) {
  requiredAgent = 'context-steward'
}
```

### Enhanced Error Messages

Instead of generic delegation messages, users get context-specific guidance:

**Before:**
```
❌ Documentation changes must be delegated to document-writer
```

**After:**
```
❌ Changelog updates must be delegated to historian
Remediation: call_omo_agent(subagent_type="historian", run_in_background=true, prompt="...")
Note: Historian specializes in impact analysis and semantic versioning

❌ Memory file changes must be delegated to context-steward  
Remediation: call_omo_agent(subagent_type="context-steward", run_in_background=true, prompt="...")
Note: Context Steward maintains ADRs and project memory for future agents

❌ Documentation changes must be delegated to document-writer
Remediation: call_omo_agent(subagent_type="document-writer", run_in_background=true, prompt="...")
Note: Document Writer creates clear user-facing documentation with examples
```

## User Stories

### As a developer

- When I try to update `docs/api.md`, I'm routed to `document-writer` who understands API documentation patterns
- When I try to update `CHANGELOG.md`, I'm routed to `historian` who can analyze commits and extract impact
- When I try to update `.cursor/memory/architecture.md`, I'm routed to `context-steward` who maintains project memory in ADR format

### As an agent orchestrator (OmO)

- I get clear guidance on which agent to delegate to based on file path
- Error messages explain WHY that specific agent is required
- I can run agents in background for parallel documentation updates

### As a project maintainer

- Changelog quality improves with impact analysis and semantic versioning
- Project memory stays consistent in ADR format for future agents
- User-facing docs maintain clarity and include examples

## Success Criteria

1. **Three Agents Created**: `document-writer`, `historian`, `context-steward` exist in `src/agents/` with specialized prompts
2. **Included in call_omo_agent**: All three agents added to `ALLOWED_AGENTS` constant
3. **Path Categorization**: Governance hook can categorize documentation paths into three categories
4. **Specialized Error Messages**: Error messages provide agent-specific rationale and remediation
5. **Model Consistency**: All three agents use `google/gemini-2.0-flash-exp`
6. **Testing**: Governance hook correctly routes to each agent based on path patterns
7. **Background Delegation**: Error messages suggest `run_in_background=true` by default

## Scope

### In Scope

- Create `historian` agent in `src/agents/historian.ts` (OmO equivalent of OpenCode builtin)
- Create `context-steward` agent in `src/agents/context-steward.ts`
- Update `document-writer` agent with refined user-facing docs prompt
- Add all three agents to `call_omo_agent` ALLOWED_AGENTS
- Update `governance-docs-delegation` hook with path categorization logic
- Update error messages with agent-specific rationale
- Add specialized prompts for each agent type
- Testing governance routing for all three agent types

### Out of Scope

- Changing governance enforcement mode (stays `"block"`)
- Modifying exception paths (`.cursor/specs/` still excepted)
- Adding new protected paths beyond current patterns
- Changing agent models after initial implementation
- Automatic changelog generation from git commits (historian is manually invoked)

## Technical Details

### Agent Prompts

**document-writer**:
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

Audience: Developers using this library/tool
```

**historian**:
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

Audience: Library users tracking releases and changes
```

**context-steward**:
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

Format: Use ADR format for decisions, structured YAML for tech stack
Audience: Future AI agents and developers joining the project
```

### Path Patterns

```typescript
export const GOVERNANCE_PATTERNS = {
  documentation: {
    paths: ["docs/", "README.md", "README.*.md"],
    agent: "document-writer",
    rationale: "User-facing documentation requires clear writing and examples",
  },
  changelog: {
    // Keyword-based matching: any path/filename containing "changelog" (case-insensitive)
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

The governance hook uses two matching strategies:

1. **Path-based matching** (for `documentation` and `memory`):
   - Directory prefix: `docs/` matches `docs/api.md`, `docs/guide/intro.md`
   - Exact filename: `README.md` matches only `README.md`
   - Wildcard: `README.*.md` matches `README.ko.md`, `README.ja.md`

2. **Keyword-based matching** (for `changelog`):
   - Case-insensitive substring match in path or filename
   - `changelog` matches: `CHANGELOG.md`, `changelog/`, `my-changelog.md`, `project-changelog/notes.md`
   - Prevents false positives by matching whole word or common patterns
```

### Exception Paths

These paths remain excepted (any agent can write):
- `.cursor/specs/` (feature spec folders)
- `context/specs/` (spec folders)

## Implementation Phases

### Phase 1: Agent Creation
1. Create `src/agents/historian.ts` (OmO version)
2. Create `src/agents/context-steward.ts`
3. Update `src/agents/document-writer.ts` with refined prompt
4. Add all three to `src/agents/index.ts` exports

### Phase 2: call_omo_agent Integration
1. Add `historian` to `ALLOWED_AGENTS` in `src/tools/call-omo-agent/constants.ts`
2. Add `context-steward` to `ALLOWED_AGENTS`
3. Verify `document-writer` and `docs-publisher` already included

### Phase 3: Governance Hook Enhancement
1. Add path categorization logic to `src/hooks/governance-docs-delegation/types.ts`
2. Update `categorizeDocsPath()` function
3. Update error message generation with agent-specific rationale
4. Update logging to include category information

### Phase 4: Testing
1. Test direct write to `docs/api.md` → blocked with document-writer message
2. Test direct write to `CHANGELOG.md` → blocked with historian message
3. Test direct write to `.cursor/memory/architecture.md` → blocked with context-steward message
4. Test delegation to each agent → write succeeds
5. Test exception paths still work (`.cursor/specs/`)

## Dependencies

- LIF-70 must be complete (governance hook session agent registration working)
- OmO agent system operational
- call_omo_agent tool available

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Agent prompt confusion | Agents write wrong doc type | Clear prompt boundaries, examples in prompts |
| Path pattern overlap | Wrong agent selected | Test all patterns, prioritize specific over general |
| Missing paths | Some docs bypass governance | Comprehensive pattern coverage in tests |
| Model quality variance | Inconsistent output | Use same model (gemini-flash-3-preview) for all |

## Open Questions

- Should we add more path patterns (e.g., `docs/architecture/` → context-steward)?
- Should historian auto-trigger on git commits or stay manual only?
- Should context-steward have access to additional tools (LSP, AST-grep) for code analysis?

## Acceptance Criteria

- [ ] `historian` agent exists in `src/agents/historian.ts` with specialized prompt
- [ ] `context-steward` agent exists in `src/agents/context-steward.ts` with specialized prompt
- [ ] `document-writer` agent updated with refined user-facing docs prompt
- [ ] All three agents use `google/gemini-2.0-flash-exp` model
- [ ] All three agents added to `ALLOWED_AGENTS` in call_omo_agent
- [ ] Governance hook categorizes paths into three categories
- [ ] Changelog category uses keyword-based matching (case-insensitive)
- [ ] Keyword "changelog" matches: `CHANGELOG.md`, `changelog/`, `my-changelog.md`, `changelog-2024.md`
- [ ] Error messages include agent-specific rationale
- [ ] Error messages suggest `run_in_background=true` by default
- [ ] Tests verify routing to correct agent based on path
- [ ] Tests verify keyword-based routing for changelog patterns
- [ ] Tests verify delegation succeeds for each agent type
- [ ] Exception paths still work (`.cursor/specs/`)

## References

- [LIF-70](https://linear.app/lifelogger/issue/LIF-70): Governance hook fix (prerequisite)
- [LIF-69](https://linear.app/lifelogger/issue/LIF-69): Delegation policy framework
- ADR Format: https://adr.github.io/
- Semantic Versioning: https://semver.org/
