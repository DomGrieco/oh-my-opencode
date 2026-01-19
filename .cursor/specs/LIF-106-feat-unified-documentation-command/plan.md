# Unified Documentation Management Command - Implementation Plan

**Linear Issue**: [LIF-106](https://linear.app/lifelogger/issue/LIF-106/unified-documentation-management-command)
**Created**: 2025-12-29
**Author**: Strategic Planner (OmO)

## Summary

This plan details the implementation of a unified `/documentation` command that consolidates `/add-documentation` and `/update-context` into a single intelligent orchestrator. The command will use a Manager Agent pattern to dynamically scale worker agents (1-50+) based on scope, support combinable flags for precise control, integrate with Linear issues, and implement intelligent clarification for broad requests.

## Technical Context

| Aspect | Details |
|--------|---------|
| **Language** | TypeScript 5.7+ |
| **Runtime** | Bun >= 1.0.0 |
| **Framework** | @opencode-ai/plugin SDK |
| **Command Type** | Markdown-based slash command |
| **Target Location** | `~/.config/opencode/command/documentation.md` |
| **Supporting Code** | None required (orchestration via existing agents) |

## Constitution Check

| Principle | Compliance | Notes |
|-----------|------------|-------|
| **I. Plugin-First Architecture** | ✅ Compliant | Uses markdown command format, no core modifications |
| **II. Multi-Model Excellence** | ✅ Compliant | Leverages existing agents: document-writer (Gemini), explore (Grok), oracle (GPT-5.2), librarian (Claude Sonnet) |
| **III. Multi-Layered Agent Orchestration** | ✅ Compliant | Manager agent pattern coordinates worker agents via `background_task` |
| **IV. Bun-Native Development** | ✅ Compliant | No package additions required |
| **V. Hook-Driven Enhancement** | ⚠️ N/A | Command, not hook |
| **VI. Dogfooding** | ✅ Compliant | Command will be used to document oh-my-opencode itself |
| **VII. GitHub Actions Publishing Only** | ✅ Compliant | No publish changes needed |

## Research Findings

### Existing Command Analysis

**`/add-documentation`** (598 lines):
- Rich frontmatter with handoffs to document-writer, docs-publisher, multimodal-looker
- 6-step workflow: Preflight → Discovery → Delegation → Docs Site → Verification → Governance
- Tool selection guide and agent delegation matrix
- `call_omo_agent` for delegation with 7-section prompts

**`/update-context`** (244 lines):
- Smart auto-detection of intent (init, update, view, validate, learn)
- Memory file management with templates
- Anti-bloat guardrails (max lines per file)
- Diff-based learning from git changes
- Governance integration (Context Steward, Historian)

### Existing Agent Analysis

**`document-writer`**:
- Model: `google/gemini-3-flash-preview`
- Mode: subagent
- Tools: `background_task: false` (cannot spawn sub-agents)
- Specializes in README, API docs, architecture docs, user guides
- Uses todo-driven workflow

**`omo`**:
- Model: `anthropic/claude-opus-4-5` with extended thinking
- Mode: primary
- Complex orchestration patterns with 7-section prompts
- Supports `background_task`, `call_omo_agent`
- Has agent hierarchy knowledge

### Background Task System

From `src/features/background-agent/manager.ts`:
- `BackgroundManager.launch()` creates child sessions with role-based tool restrictions
- Supports 50+ concurrent tasks (polling-based)
- Session completion detection via `session.idle` event or polling
- Automatic notification to parent session on completion

### Memory Tools

From `src/tools/memory/tools.ts`:
- `memory_write`, `memory_read`, `memory_list`, `memory_edit`, `memory_delete`
- Default base path: `context/memory/`
- Supports subdirectories and automatic `.md` extension
- Security: Path traversal blocked

### Linear Tools

From `src/tools/linear/tools.ts`:
- `linear_get_issue`: Fetch issue details
- `linear_add_comment`: Add completion comments
- `linear_update_status`: Update issue status
- Graceful fallback when LINEAR_API_KEY not set

## Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    /documentation Command                        │
│                   (documentation.md)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐   ┌──────────────────┐   ┌─────────────────┐  │
│  │ Flag Parser │──▶│ Intent Classifier │──▶│ Scope Analyzer  │  │
│  └─────────────┘   └──────────────────┘   └────────┬────────┘  │
│                                                     │           │
│                           ┌─────────────────────────▼───────┐   │
│                           │      Clarification Engine       │   │
│                           │   (if ambiguous & !--no-clarify)│   │
│                           └─────────────────────────┬───────┘   │
│                                                     │           │
│  ┌──────────────────────────────────────────────────▼───────┐   │
│  │                   Manager Agent                           │   │
│  │                  (OmO orchestrates)                       │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │ - Determine agent count from scope                 │  │   │
│  │  │ - Spawn workers via background_task                │  │   │
│  │  │ - Collect and synthesize results                   │  │   │
│  │  │ - Report progress and completion                   │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └───────────────────────────────────────────────────────────┘   │
│                              │                                   │
│         ┌────────────────────┼────────────────────┐             │
│         ▼                    ▼                    ▼             │
│  ┌─────────────┐     ┌─────────────┐      ┌─────────────┐      │
│  │ Doc Workers │     │Memory Workers│      │Context Worker│     │
│  │(document-   │     │(document-   │      │(direct tools)│     │
│  │ writer)     │     │ writer)     │      │             │      │
│  └──────┬──────┘     └──────┬──────┘      └──────┬──────┘      │
│         │                    │                    │              │
│         ▼                    ▼                    ▼              │
│  ┌─────────────┐     ┌─────────────┐      ┌─────────────┐      │
│  │ docs/       │     │ .cursor/    │      │ .opencode/  │      │
│  │ README.md   │     │ memory/     │      │ project-    │      │
│  │ API docs    │     │             │      │ context.yaml│      │
│  └─────────────┘     └─────────────┘      └─────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. User invokes: /documentation [LINEAR_ISSUE] [FLAGS] [REQUEST]
      │
      ▼
2. Parse arguments
   - Linear issue ID (if present)
   - Scope flags: --docs, --memory, --context, --inline
   - Modifier flags: --validate, --diff-based, --scope, --dry-run, etc.
   - User request text
      │
      ▼
3. Linear Integration (if LINEAR_ISSUE provided)
   - linear_get_issue(issueId)
   - Extract scope hints from description
   - Check for linked branch/PR
   - Find spec folder if exists
      │
      ▼
4. Scope Analysis
   - Count files in scope
   - Determine documentation types needed
   - Check for existing documentation
      │
      ▼
5. Clarification (if needed && !--no-clarify)
   - Detect ambiguous/broad requests
   - Present clarifying questions
   - Wait for user response
      │
      ▼
6. Manager Agent Orchestration
   - Calculate agent count (1-50+ based on scope)
   - Create work distribution plan
   - Spawn workers via background_task
      │
      ▼
7. Worker Execution (parallel)
   - Document-writer agents for content
   - Direct tools for context updates
   - Anti-bloat guardrails enforced
      │
      ▼
8. Result Synthesis
   - Collect all worker outputs
   - Merge into unified report
   - Handle partial failures
      │
      ▼
9. Governance Integration
   - Update Linear issue (if applicable)
   - Create changelog entries
   - Update workflow state
      │
      ▼
10. Report Completion
   - Summary of changes
   - Files created/modified
   - Validation results
   - Next steps
```

## Data Models

### Command Arguments Interface

```typescript
interface DocumentationArgs {
  // Positional argument (optional)
  linearIssue?: string  // e.g., "LIF-123"
  
  // Scope flags (combinable)
  docs: boolean         // --docs: Public documentation (README, guides, API docs)
  memory: boolean       // --memory: Memory files (constitution, architecture, etc.)
  context: boolean      // --context: Project configuration (project-context.yaml)
  inline: boolean       // --inline: Inline code comments (JSDoc/TSDoc)
  
  // Modifier flags
  validate: boolean     // --validate: Check without writing
  diffBased: boolean    // --diff-based: Limit to branch changes
  scope?: string        // --scope <path>: Limit to specific path
  dryRun: boolean       // --dry-run: Preview only
  parallel?: number     // --parallel <n>: Max concurrent agents
  noClarify: boolean    // --no-clarify: Skip questions
  runTests: boolean     // --run-tests: Trigger tests for validation
  
  // User request (remaining text)
  userRequest?: string
}
```

### Scope Analysis Result

```typescript
interface ScopeAnalysis {
  // Derived from arguments
  scopeTypes: ('docs' | 'memory' | 'context' | 'inline')[]
  
  // From file analysis
  totalFiles: number
  filesPerScope: {
    docs: number
    memory: number
    context: number
    inline: number
  }
  
  // Agent scaling
  suggestedAgentCount: number
  workDistribution: WorkPackage[]
  
  // Linear context
  linearIssue?: {
    id: string
    identifier: string
    title: string
    description: string
    specFolder?: string
    changedFiles?: string[]
  }
}
```

### Work Package (for agent distribution)

```typescript
interface WorkPackage {
  id: string                        // e.g., "wp-001"
  type: 'docs' | 'memory' | 'context' | 'inline'
  agent: string                     // Target agent name
  files: string[]                   // Files to process
  mode: 'create' | 'update' | 'validate'
  priority: 'high' | 'medium' | 'low'
  dependencies?: string[]           // IDs of packages this depends on
}
```

### Documentation Result

```typescript
interface DocumentationResult {
  status: 'success' | 'partial' | 'failed'
  summary: string
  
  // Work completed
  packages: {
    id: string
    status: 'completed' | 'failed' | 'skipped'
    filesCreated: string[]
    filesModified: string[]
    error?: string
  }[]
  
  // Aggregated metrics
  totalAgents: number
  totalFiles: number
  filesCreated: number
  filesModified: number
  validationIssues?: string[]
  
  // Timing
  startedAt: Date
  completedAt: Date
  duration: string
  
  // Linear integration
  linearCommentAdded?: boolean
  linearStatusUpdated?: boolean
}
```

### Anti-Bloat Guardrails

```typescript
interface BloatGuardrails {
  fileLimits: {
    'constitution.md': 200    // lines
    'architecture.md': 150
    'tech-stack.md': 100
    'glossary.md': 200
    'decisions/ADR-*.md': 50
  }
  
  entryWordLimits: {
    principle: 50
    rationale: 30
    component: 20
    techEntry: 10
    termDefinition: 15
    adrTotal: 100
  }
  
  deduplicationThreshold: 0.8  // 80% similarity = merge
}
```

## API Contracts

### Manager Agent Delegation Pattern

```markdown
call_omo_agent(subagent_type="document-writer", run_in_background=true, prompt="""
TASK: [Scope-specific documentation task]

EXPECTED OUTCOME: [Concrete deliverables for this work package]

REQUIRED SKILLS: document-writer

REQUIRED TOOLS: read, edit, grep, lsp_document_symbols, ast_grep_search

MUST DO:
- Focus on files: [file list]
- Follow existing patterns in project
- Verify all code examples work
- Respect anti-bloat guardrails

MUST NOT DO:
- Document outside assigned scope
- Add emojis unless requested
- Skip verification
- Create redundant documentation

CONTEXT:
- User Request: [preserved user request]
- Documentation Type: [docs/memory/context/inline]
- Existing Patterns: [from discovery phase]
- File Size Limits: [if memory scope]
""")
```

### Linear Integration Pattern

```typescript
// Step 1: Fetch issue context
const issue = await linear_get_issue({ issueId: args.linearIssue })

// Step 2: Parse scope from issue
const scopeHints = parseDescriptionForScope(issue.description)
const specFolder = await findSpecFolder(issue.identifier)
const changedFiles = await getChangedFilesFromBranch(issue.branchName)

// Step 3: After completion, report back
await linear_add_comment({
  issueId: args.linearIssue,
  body: generateCompletionComment(result)
})

// Step 4: Optionally update status
if (args.updateStatus) {
  await linear_update_status({
    issueId: args.linearIssue,
    status: 'in_review'
  })
}
```

### Clarification Workflow

```markdown
## Clarification Questions

Based on your request, I have some clarifying questions:

**Scope**: Full project has {N} modules and {M} files.
1. Focus on: [a] What changed this branch [b] Core modules [c] Everything?

**Documentation Types**: You haven't specified which types to update.
2. Include which? [a] Public docs only [b] Memory files only [c] Everything?

**Inline Comments**: Source files have {X} functions without JSDoc.
3. Add inline documentation? [y/n]

**Validation**: Running validation pass doubles the work.
4. Run validation after documentation? [y/n]

Reply with your choices (e.g., "1c 2c 3y 4n") or "all defaults" to proceed with defaults.
```

## Project Structure

### Command File Location

```
~/.config/opencode/command/
└── documentation.md        # The unified command (NEW)

# Existing commands (preserved during deprecation period)
└── add-documentation.md    # Will add deprecation warning
└── update-context.md       # Will add deprecation warning
```

### Command File Structure

```markdown
---
category: docs
description: Unified documentation management with intelligent agent orchestration, combinable scope flags, Linear integration, and dynamic scaling.
handoffs:
  - label: Write Documentation Content
    agent: document-writer
    prompt: Write documentation for the specified scope
  - label: Explore Codebase
    agent: explore
    prompt: Find documentation opportunities in the codebase
  - label: Review Documentation
    agent: oracle
    prompt: Review documentation for accuracy and completeness
---

# Documentation

[Command body with steps 0-9]
```

## Implementation Phases

### Phase 1: Command Foundation (4h)

| Step | Task | Files | Estimate |
|------|------|-------|----------|
| 1.1 | Create command file with frontmatter | `documentation.md` | 30min |
| 1.2 | Implement argument parsing section | `documentation.md` | 45min |
| 1.3 | Implement scope flag processing logic | `documentation.md` | 45min |
| 1.4 | Add preflight validation (load project context) | `documentation.md` | 30min |
| 1.5 | Implement scope analysis phase | `documentation.md` | 45min |
| 1.6 | Add user request preservation pattern | `documentation.md` | 15min |
| 1.7 | Add dry-run mode support | `documentation.md` | 30min |

### Phase 2: Linear Integration (2h)

| Step | Task | Files | Estimate |
|------|------|-------|----------|
| 2.1 | Implement Linear issue detection and fetching | `documentation.md` | 30min |
| 2.2 | Parse issue description for scope hints | `documentation.md` | 30min |
| 2.3 | Find linked branch/PR for changed files | `documentation.md` | 30min |
| 2.4 | Implement completion reporting to Linear | `documentation.md` | 30min |

### Phase 3: Clarification Engine (2h)

| Step | Task | Files | Estimate |
|------|------|-------|----------|
| 3.1 | Implement ambiguity detection logic | `documentation.md` | 45min |
| 3.2 | Create clarification question templates | `documentation.md` | 30min |
| 3.3 | Handle user responses and defaults | `documentation.md` | 30min |
| 3.4 | Add --no-clarify bypass support | `documentation.md` | 15min |

### Phase 4: Manager Agent Pattern (3h)

| Step | Task | Files | Estimate |
|------|------|-------|----------|
| 4.1 | Implement agent count calculation | `documentation.md` | 30min |
| 4.2 | Create work distribution algorithm | `documentation.md` | 45min |
| 4.3 | Implement parallel worker spawning via background_task | `documentation.md` | 45min |
| 4.4 | Add worker result collection and synthesis | `documentation.md` | 45min |
| 4.5 | Implement partial failure handling | `documentation.md` | 15min |

### Phase 5: Scope-Specific Workflows (4h)

| Step | Task | Files | Estimate |
|------|------|-------|----------|
| 5.1 | Port `--docs` workflow from add-documentation | `documentation.md` | 1h |
| 5.2 | Port `--memory` workflow from update-context | `documentation.md` | 1h |
| 5.3 | Implement `--context` workflow (project-context.yaml) | `documentation.md` | 45min |
| 5.4 | Implement `--inline` workflow (JSDoc/TSDoc) | `documentation.md` | 1h |
| 5.5 | Add anti-bloat guardrails for memory operations | `documentation.md` | 15min |

### Phase 6: Validation & Testing (2h)

| Step | Task | Files | Estimate |
|------|------|-------|----------|
| 6.1 | Implement `--validate` mode | `documentation.md` | 45min |
| 6.2 | Add bidirectional code-documentation validation | `documentation.md` | 45min |
| 6.3 | Implement `--run-tests` integration | `documentation.md` | 30min |

### Phase 7: Governance & Completion (1.5h)

| Step | Task | Files | Estimate |
|------|------|-------|----------|
| 7.1 | Add workflow state updates | `documentation.md` | 30min |
| 7.2 | Implement completion report generation | `documentation.md` | 30min |
| 7.3 | Add deprecation warnings to old commands | `add-documentation.md`, `update-context.md` | 30min |

### Phase 8: Documentation & Testing (1.5h)

| Step | Task | Files | Estimate |
|------|------|-------|----------|
| 8.1 | Update workflow-commands.md guide | `docs/guides/workflow-commands.md` | 30min |
| 8.2 | Dogfood: Run /documentation on oh-my-opencode | N/A | 45min |
| 8.3 | Fix issues found during dogfooding | `documentation.md` | 15min |

## Dependencies

### Internal (This Repo)

| Dependency | Status | Notes |
|------------|--------|-------|
| `document-writer` agent | Exists | Primary worker agent |
| `explore` agent | Exists | For codebase discovery |
| `oracle` agent | Exists | For validation and review |
| `memory_*` tools | Exists | For memory file operations |
| `linear_*` tools | Exists | For Linear integration |
| `background_task` tool | Exists | For parallel agent spawning |
| `read_context` tool | Exists | For project context loading |

### External

| Dependency | Status | Notes |
|------------|--------|-------|
| LINEAR_API_KEY | Optional | Graceful fallback when not set |
| Git repository | Required | For diff-based mode |

## Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Manager prompt too complex for single agent | Medium | High | Break into sections; use clear boundaries; test incrementally |
| Agent coordination overhead | Medium | Medium | Batch small work packages; use sensible defaults for agent count |
| Clarification flow interrupts workflow | Low | Medium | Smart defaults; --no-clarify flag; remember preferences |
| Memory file bloat despite guardrails | Low | Medium | Hard limits in prompt; validation pass after updates |
| Diff-based mode misses documentation | Medium | Low | Warn user about scope limitation; suggest full review periodically |
| Linear API rate limiting | Low | Low | Cache issue data; batch updates |

## Testing Strategy

### Unit Testing
- Test argument parsing for all flag combinations
- Test scope analysis with different file counts
- Test agent count calculation formula

### Integration Testing
- Run with each scope flag individually
- Run with combined scope flags
- Test Linear integration with mock issue
- Test --dry-run mode produces no changes

### Dogfooding
- Run `/documentation --docs` on oh-my-opencode
- Run `/documentation --memory --validate` to check constitution/architecture
- Run `/documentation LIF-106` to document this feature itself

## Success Metrics

| Metric | Target |
|--------|--------|
| Command file size | < 800 lines |
| Agent count accuracy | Scale matches scope within 20% |
| Full project review time | < 15 minutes for 100-file project |
| Partial failure recovery | 90% of work packages succeed even with failures |
| User satisfaction | Positive feedback on dogfooding |

## Time Summary

| Phase | Estimate |
|-------|----------|
| Phase 1: Command Foundation | 4h |
| Phase 2: Linear Integration | 2h |
| Phase 3: Clarification Engine | 2h |
| Phase 4: Manager Agent Pattern | 3h |
| Phase 5: Scope-Specific Workflows | 4h |
| Phase 6: Validation & Testing | 2h |
| Phase 7: Governance & Completion | 1.5h |
| Phase 8: Documentation & Testing | 1.5h |
| **Total** | **20h** |

## Next Steps

After plan approval:
1. Run `/tasks` to create detailed task breakdown with Linear sub-issues
2. Run `/implement` to begin Phase 1 (Command Foundation)
3. Test each phase before proceeding to next
4. Dogfood the command on oh-my-opencode after Phase 5

## Open Questions

### Q1: Deprecation Timeline
**Proposed**: Maintain `/add-documentation` and `/update-context` for 2 release cycles after `/documentation` ships. Add deprecation warnings. Remove in version N+3.
**Status**: ✅ Resolved in spec (see DD-1)

### Q2: Test Output Format
**Proposed**: Accept JSON test output via `--run-tests` flag. Format: `{ "tests": [{ "name": "", "status": "pass|fail", "output": "" }] }`
**Status**: ✅ Resolved in spec

### Q3: Maximum Agent Limit
**Question**: Should there be a hard cap on agent count to prevent runaway resource usage?
**Proposed**: Default max 50, configurable via `--parallel` flag.
**Status**: Pending - verify background_task system handles 50+ gracefully

## Design Decisions Summary

| ID | Decision | Rationale |
|----|----------|-----------|
| DD-1 | Command as orchestrator, not implementer | Leverage existing agents; reduce maintenance |
| DD-2 | Manager agent pattern | Clean separation; intelligent work distribution |
| DD-3 | Preserve user request in all delegations | Prevent agent drift during complex workflows |
| DD-4 | Combinable flags over exclusive flags | More flexible; follows CLI conventions |
| DD-5 | Clarification before execution | Resource efficiency; user experience balance |

## References

- Spec: `.cursor/specs/LIF-106-feat-unified-documentation-command/spec.md`
- Existing `/add-documentation`: `~/.config/opencode/command/add-documentation.md`
- Existing `/update-context`: `~/.config/opencode/command/update-context.md`
- Document-writer agent: `src/agents/document-writer.ts`
- OmO agent patterns: `src/agents/omo.ts`
- Background manager: `src/features/background-agent/manager.ts`
- Memory tools: `src/tools/memory/tools.ts`
- Linear tools: `src/tools/linear/tools.ts`
- Workflow commands guide: `docs/guides/workflow-commands.md`
