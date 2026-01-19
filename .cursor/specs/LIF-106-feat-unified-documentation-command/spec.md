# Unified Documentation Management Command

**Linear Issue**: [LIF-106](https://linear.app/lifelogger/issue/LIF-106/unified-documentation-management-command)
**Created**: 2025-12-29
**Updated**: 2025-12-29
**Status**: Ready for Planning

## Overview

Create a unified `/documentation` command that consolidates the functionality of `/add-documentation` and `/update-context` into a single, intelligent documentation orchestrator. This command manages all documentation workflows across the project using the OpenCode OMO agent system, providing a one-stop solution for documentation creation, review, validation, and maintenance.

The command supports flexible scope control through combinable flags, intelligent clarification for broad requests, and dynamic agent scaling based on workload - from a single targeted update to spawning dozens of parallel agents for comprehensive project-wide documentation.

## Problem Statement

### Current State

The project currently has two separate documentation commands:

1. **`/add-documentation`** - Creates and updates project documentation including:
   - README files
   - API documentation
   - Architecture documentation
   - User guides
   - Inline documentation (JSDoc/TSDoc)
   - Documentation site structure

2. **`/update-context`** - Manages project context/memory files including:
   - constitution.md (principles)
   - architecture.md (system design)
   - tech-stack.md (technologies)
   - glossary.md (domain terms)
   - ADR files (architecture decisions)
   - Diff-based learning from git changes

### Issues

1. **Fragmented workflow**: Users must invoke two different commands for related documentation tasks
2. **No unified review**: Cannot get a holistic view of documentation health across all types
3. **Missing bidirectional validation**: No system to validate that code matches documentation and vice versa
4. **No documentation management oversight**: No manager agent coordinating documentation efforts
5. **Limited scope awareness**: Each command operates independently without knowledge of the other's state
6. **No live testing integration**: Documentation cannot be validated against actual runtime behavior
7. **Post-feature documentation gap**: No streamlined workflow for "just finished a feature, document everything"
8. **No Linear integration**: Cannot scope documentation to a specific issue/feature automatically

## User Stories

### US-1: As a developer who just completed a feature
I want to run a single command that documents everything related to my changes
So that I can ensure my work is fully documented before creating a PR

**Acceptance Criteria:**
- [ ] Single `/documentation` command handles the full documentation workflow
- [ ] System detects what changed (from git diff or PR context)
- [ ] Spawns appropriate review agents for different documentation segments
- [ ] Updates all relevant documentation types (code comments, internal docs, public docs)
- [ ] Provides a summary of documentation changes made

### US-2: As a project maintainer
I want to validate that existing documentation matches the current code behavior
So that I can ensure documentation accuracy and prevent stale/incorrect documentation

**Acceptance Criteria:**
- [ ] Bidirectional validation between code and documentation
- [ ] Code patterns validate against documented behavior
- [ ] Documentation claims validate against actual code
- [ ] Live testing results can be used to verify documented behavior
- [ ] Report of documentation-code mismatches generated

### US-3: As a team lead
I want a manager agent that orchestrates multiple documentation review agents
So that documentation review is thorough, parallel, and efficient

**Acceptance Criteria:**
- [ ] Manager agent coordinates dynamically scaled review agents
- [ ] Each review agent examines different aspects (security, API, architecture)
- [ ] Manager identifies documentation opportunities from code review
- [ ] Results are synthesized into actionable recommendations
- [ ] Work is parallelized for efficiency
- [ ] Agent count scales based on scope (1-50+ agents)

### US-4: As a developer
I want the system to manage all documentation types in one place
So that I don't need to remember which command handles which documentation type

**Acceptance Criteria:**
- [ ] Command handles: code comments, internal docs, public docs, API docs, memory entries, project-context
- [ ] System auto-detects appropriate documentation type from context
- [ ] Unified interface for all documentation operations
- [ ] Consistent output format across all documentation types

### US-5: As a project owner
I want to run documentation review at any time to sync docs with code
So that documentation stays current as the project evolves

**Acceptance Criteria:**
- [ ] Command can be run in "full review" mode
- [ ] Identifies outdated documentation
- [ ] Suggests updates based on code changes
- [ ] Updates OMO memory system entries as needed
- [ ] Tracks documentation maintenance history

### US-6: As a developer
I want to specify my request and have the system adhere to it throughout
So that I get documentation focused on what I need, not generic output

**Acceptance Criteria:**
- [ ] User request displayed at top of workflow
- [ ] System respects user's specific request throughout execution
- [ ] Documentation output aligns with stated goals
- [ ] No unrelated documentation created

### US-7: As a developer
I want to control which documentation types get updated using combinable flags
So that I can run quick, targeted updates without full project review

**Acceptance Criteria:**
- [ ] Scope flags available: `--docs`, `--memory`, `--context`, `--inline`
- [ ] Flags can be combined: `--docs --memory` updates both
- [ ] Default (no flags) runs full comprehensive review
- [ ] Modifier flags work with any combination: `--validate`, `--diff-based`, `--scope`
- [ ] `--dry-run` shows what would happen without executing

### US-8: As a developer with a broad request
I want the system to ask clarifying questions before spawning many agents
So that I don't waste resources on unwanted documentation work

**Acceptance Criteria:**
- [ ] System detects ambiguous/broad requests
- [ ] Presents relevant clarifying questions
- [ ] Waits for user response before proceeding
- [ ] Offers sensible defaults if user wants to skip questions
- [ ] Questions are context-aware (e.g., knows project size and complexity)

### US-9: As a developer working on a Linear issue
I want to provide just the issue ID and have everything documented automatically
So that I don't need to manually specify scope for feature work

**Acceptance Criteria:**
- [ ] Command accepts Linear issue ID as argument: `/documentation LIF-123`
- [ ] System fetches issue details, description, and linked context
- [ ] Automatically scopes documentation to files/modules related to the issue
- [ ] Uses issue description to understand what needs documenting
- [ ] Updates issue with documentation completion status

## Command Interface

### Basic Syntax

```
/documentation [LINEAR_ISSUE] [SCOPE_FLAGS] [MODIFIER_FLAGS] [USER_REQUEST]
```

### Scope Flags (Combinable)

Scope flags control WHAT gets documented. They are additive - combine multiple to expand scope.

| Flag | Description | What's Included |
|------|-------------|-----------------|
| `--docs` | Public documentation | README, guides, API docs, architecture docs in `docs/` |
| `--memory` | Memory/context files | constitution.md, architecture.md, tech-stack.md, glossary.md, ADRs |
| `--context` | Project configuration | `.opencode/project-context.yaml` |
| `--inline` | Inline code comments | JSDoc/TSDoc/docstrings in source files |

**Behavior:**
- No scope flags = Full review (all scopes)
- One flag = Only that scope
- Multiple flags = Combined scopes

### Modifier Flags (Always Combinable)

Modifier flags control HOW documentation happens. They work with any scope combination.

| Flag | Description | Effect |
|------|-------------|--------|
| `--validate` | Validation mode | Check docs without writing, report issues |
| `--diff-based` | Branch changes only | Limit to files changed in current branch vs main |
| `--scope <path>` | Path filter | Limit to specific file or directory |
| `--dry-run` | Preview mode | Show what would be done, don't execute |
| `--parallel <n>` | Agent limit | Max concurrent agents (default: unlimited) |
| `--no-clarify` | Skip questions | Proceed without clarification prompts |
| `--run-tests` | Trigger tests | Run tests and use output for validation |

### Usage Examples

```bash
# Full project review (spawns many agents)
/documentation

# Full review with user context
/documentation please focus on the new auth module

# Document a specific Linear issue
/documentation LIF-123

# Linear issue with additional context
/documentation LIF-106 focus on the command interface and flags

# Only public docs
/documentation --docs

# Memory files + inline comments
/documentation --memory --inline

# Docs for current branch changes only
/documentation --docs --diff-based

# Validate everything, don't write
/documentation --validate

# Validate only memory files
/documentation --memory --validate

# Preview what full review would do
/documentation --dry-run

# Limit to specific directory
/documentation --scope src/tools/

# Combined: docs + memory for a path, preview only
/documentation --docs --memory --scope src/agents/ --dry-run

# Full review with limited parallelism
/documentation --parallel 10

# Skip clarification questions, just do it
/documentation --no-clarify
```

### Linear Issue Integration

When a Linear issue ID is provided:

```bash
/documentation LIF-123
```

The system will:

1. **Fetch issue details** via `linear_get_issue`
   - Title, description, labels, status
   - Linked branches, PRs, parent issues

2. **Determine scope from issue**
   - Parse description for mentioned files/modules
   - Check linked branch for changed files
   - Identify related spec folder if exists

3. **Auto-configure documentation**
   - Scope to relevant files/modules
   - Use issue description as user request context
   - Include spec folder documentation if applicable

4. **Report back to Linear**
   - Add comment with documentation summary
   - Update issue status if appropriate

**Example Flow:**
```
User: /documentation LIF-106

System: Fetching issue LIF-106...

Issue: "Unified Documentation Management Command"
Description: "Create unified /documentation command..."
Branch: lif-106-unified-documentation-command
Spec Folder: .cursor/specs/LIF-106-feat-unified-documentation-command/

Detected scope:
- Spec files in .cursor/specs/LIF-106-*
- Command file (to be created)
- Related docs in docs/guides/

Proceeding with documentation for LIF-106...
[Spawns targeted agents for this scope]
```

## Requirements

### Functional Requirements

#### FR-1: Unified Command Interface
The `/documentation` command must provide a single entry point for all documentation workflows with:
- Combinable scope flags (`--docs`, `--memory`, `--context`, `--inline`)
- Modifier flags that work with any scope combination
- Linear issue ID as optional first argument
- Free-form user request text

#### FR-2: User Request Handling
When invoked, the command must:
- Accept and display the user's specific request prominently
- Adhere to the user's request throughout all operations
- Focus documentation efforts on what the user asked for

#### FR-3: Multi-Agent Review Architecture
The system must spawn and coordinate multiple agents with dynamic scaling:
- Agent count scales based on scope (see FR-8)
- Manager agent coordinates all worker agents
- Each agent examines different aspects/segments
- Results are synthesized into unified recommendations
- All work parallelized via `background_task`

#### FR-4: Documentation Scope Coverage
The unified command must manage:
- Code comments (inline documentation) - `--inline`
- Internal project documentation (architecture, decisions) - `--docs`
- Public-facing documentation (README, guides) - `--docs`
- API documentation (endpoints, interfaces, types) - `--docs`
- OMO memory system entries (constitution, tech-stack, glossary, etc.) - `--memory`
- Project configuration (project-context.yaml) - `--context`
- Business requirement and functionality specifications - `--docs`

#### FR-5: Bidirectional Validation
The system must validate in both directions:
- Code validates against documentation (code behavior matches docs)
- Documentation validates against code (documented features exist)

#### FR-6: Live Testing Integration
The system must support validation using live testing results:
- Accept test output as validation evidence (JSON format)
- Optionally trigger tests with `--run-tests` flag
- Compare documented behavior against test results
- Flag documentation that contradicts test behavior

#### FR-7: Existing Command Integration
The unified command must incorporate functionality from:
- `/add-documentation` - All documentation creation patterns
- `/update-context` - All memory file management patterns

#### FR-8: Dynamic Agent Scaling
The system must scale agent count based on detected scope:

| Scope | Agent Count | Example |
|-------|-------------|---------|
| Single file | 1-2 | `/documentation --scope src/tools/grep/index.ts` |
| Single module | 3-5 | `/documentation --scope src/tools/grep/` |
| Multiple modules | 5-15 | `/documentation --docs --scope src/tools/` |
| Full project (one scope) | 10-20 | `/documentation --docs` |
| Full project (all scopes) | 20-50+ | `/documentation` |
| Full + validation | 30-60+ | `/documentation --validate` |

The manager agent determines exact count based on:
- Number of files to process
- Complexity of documentation needed
- Available parallelization opportunities

#### FR-9: Intelligent Clarification
For broad or ambiguous requests, the system must:

1. **Detect ambiguity** when:
   - No scope flags AND no Linear issue AND vague request
   - Request uses broad terms ("everything", "all", "full review")
   - Project is large (100+ files) and no scope limiting

2. **Present clarifying questions**:
   - "Full project has {N} modules. Focus on: [a] What changed this branch [b] Core modules [c] Everything?"
   - "Include inline code comments? [y/n]"
   - "Run validation pass after documentation? [y/n]"

3. **Respect user preference**:
   - `--no-clarify` skips all questions, uses defaults
   - Quick response options (a/b/c or y/n)
   - "Just do everything" is valid response

#### FR-10: Anti-Bloat Guardrails
For memory file operations, inherit guardrails from `/update-context`:

| File | Max Lines | Action if Exceeded |
|------|-----------|-------------------|
| `constitution.md` | 200 | Prune or split |
| `architecture.md` | 150 | Consolidate or archive |
| `tech-stack.md` | 100 | Remove deprecated or consolidate |
| `glossary.md` | 200 | Archive least-used |
| `decisions/ADR-*.md` | 50 each | Split into multiple |

Additional guardrails:
- Entry word limits per type
- Deduplication checks (80% similarity = merge)
- Priority scoring for what to keep

#### FR-11: Linear Issue Integration
When a Linear issue ID is provided:
- Fetch issue details via `linear_get_issue`
- Parse description for scope hints
- Check for linked branch/PR for changed files
- Check for associated spec folder
- Auto-scope documentation to relevant areas
- Report completion back to Linear via comment

### Non-Functional Requirements

#### NFR-1: Performance
- Review agents must run in parallel via `background_task`
- Total execution time scales linearly with scope, not exponentially
- Background tasks used for all agent delegations
- Progress updates as agents complete

#### NFR-2: Reliability
- Partial failures should not block the entire workflow
- Results should be synthesized even if some agents fail
- Error handling must be graceful with actionable error messages
- Failed agents reported in summary, not silently ignored

#### NFR-3: Observability
- Clear progress indicators during execution
- Real-time updates as background agents complete
- Detailed logs of what each agent is reviewing
- Summary report at completion with metrics

#### NFR-4: Consistency
- Output format consistent across all documentation types
- Consistent with existing OmO agent patterns
- Uses existing guardrails and instructions
- Flag behavior predictable and documented

## Scope

### In Scope

- Creating the `/documentation` command markdown file
- Defining the multi-agent orchestration workflow
- Integrating existing `/add-documentation` functionality
- Integrating existing `/update-context` functionality
- Manager agent coordination of review agents
- Bidirectional code-documentation validation
- Support for all documentation types listed
- OMO memory system integration
- Project-context.yaml management
- Linear integration for issue-scoped documentation
- Combinable flag system
- Intelligent clarification workflow
- Dynamic agent scaling
- Anti-bloat guardrails

### Out of Scope

- Creating new agents (reuse existing document-writer, explore, librarian, oracle)
- Modifying existing agent prompts (beyond delegation patterns)
- Changes to the memory tools implementation
- Building a documentation site infrastructure
- Automated deployment of documentation
- External documentation platform integrations
- Real-time documentation sync

## Assumptions

1. The existing document-writer agent is sufficient for documentation creation tasks
2. The explore agent can effectively analyze code for documentation opportunities
3. The oracle agent can provide architectural guidance for documentation decisions
4. The background_task system supports the required parallelization (50+ concurrent)
5. Users have appropriate project context loaded (via read_context)
6. Linear integration is optional but available when configured
7. The existing memory tools provide sufficient CRUD operations
8. Projects follow the standard spec folder structure when applicable

## Dependencies

### Technical Dependencies

- Existing `/add-documentation` command patterns
- Existing `/update-context` command patterns
- OmO agent system (background_task, call_omo_agent)
- Memory tools (memory_write, memory_read, memory_edit, memory_list)
- Document-writer agent
- Explore agent
- Oracle agent (for validation and review synthesis)
- Linear tools (linear_get_issue, linear_add_comment, linear_update_status)
- Governance hooks (historian, path-validator)

### External Dependencies

- User must have appropriate permissions for file operations
- Git repository for diff-based analysis
- LINEAR_API_KEY environment variable for Linear integration (optional)

## Success Criteria

1. **Unification**: Single command replaces need for both `/add-documentation` and `/update-context` for common workflows
2. **Adoption**: Users prefer `/documentation` over separate commands for comprehensive documentation tasks
3. **Coverage**: All documentation types currently handled by existing commands are supported
4. **Efficiency**: Multi-agent review completes within reasonable time bounds
5. **Quality**: Documentation validation catches real mismatches between code and docs
6. **Maintainability**: Command follows existing patterns and is easy to extend
7. **Flexibility**: Flag combinations allow precise scope control
8. **Scalability**: Can spawn 50+ agents for large projects without issues

## Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Agent coordination complexity | Medium | High | Use proven OmO orchestration patterns; clear 7-section prompts |
| Performance degradation with many parallel agents | Low | Medium | Use `--parallel` flag to limit; background_task handles queuing |
| Incomplete integration of existing commands | Medium | Medium | Thorough testing; phased rollout with both old and new commands available |
| User confusion about flag combinations | Medium | Low | Clear documentation; helpful error messages; examples |
| Memory system bloat from aggressive documentation | Low | Medium | Leverage anti-bloat guardrails inherited from update-context |
| Linear API rate limiting | Low | Low | Cache issue data; batch updates |
| Clarification workflow annoys users | Medium | Low | `--no-clarify` flag; smart defaults; learn from patterns |

## Design Decisions

### DD-1: Command as Orchestrator, Not Implementer
**Decision**: The `/documentation` command orchestrates existing agents rather than implementing documentation logic itself.
**Context**: Need to balance comprehensive functionality with maintainability.
**Options Considered**:
1. Monolithic command with all logic inline
2. Command as orchestrator delegating to existing agents
3. Create new specialized documentation agents
**Rationale**: Option 2 leverages existing battle-tested agents (document-writer, explore, oracle) while providing unified coordination. This follows DRY principles and reduces maintenance burden.

### DD-2: Manager Agent Pattern
**Decision**: Use a manager agent that spawns and coordinates worker agents, rather than having the command directly manage multiple parallel agent calls.
**Context**: Need to coordinate dynamically scaled agents (1-50+).
**Options Considered**:
1. Command directly spawns all agents
2. Single manager agent coordinates all others
3. Hierarchical manager agents (doc manager + code review manager)
**Rationale**: Option 2 provides cleaner separation of concerns. The manager agent can make intelligent decisions about what to review, how many agents to spawn, and how to synthesize results.

### DD-3: Preserve User Request Context
**Decision**: User request is captured at invocation and preserved throughout all agent delegations.
**Context**: Users complained that AI agents "forget" what was asked midway through complex workflows.
**Options Considered**:
1. Pass request once at start
2. Include request in every agent delegation prompt
3. Store request in session state, inject into all agent contexts
**Rationale**: Option 2 ensures each agent sees the original user intent, preventing drift during complex multi-agent workflows.

### DD-4: Combinable Flags Over Exclusive Flags
**Decision**: Use additive/combinable scope flags (`--docs`, `--memory`) instead of exclusive flags (`--docs-only`).
**Context**: Users want flexible control over documentation scope.
**Options Considered**:
1. Exclusive flags (`--docs-only`, `--memory-only`)
2. Combinable flags (`--docs`, `--memory`)
3. Subcommands (`/documentation docs`, `/documentation memory`)
**Rationale**: Option 2 is more flexible, more concise, and follows CLI conventions. Users can combine any flags they want. No flags means "everything".

### DD-5: Clarification Before Execution
**Decision**: For broad/ambiguous requests, ask clarifying questions before spawning many agents.
**Context**: Spawning 50+ agents for unwanted work wastes resources and time.
**Options Considered**:
1. Always ask questions
2. Smart detection + questions for ambiguous cases
3. Never ask, always use defaults
**Rationale**: Option 2 balances user experience with resource efficiency. Clear requests proceed immediately. Ambiguous requests get clarification. Users can skip with `--no-clarify`.

## Resolved Questions

### Q1: Deprecation timeline
**Resolution**: Maintain `/add-documentation` and `/update-context` in parallel for 2 release cycles after `/documentation` ships. Add deprecation warnings pointing to unified command. Remove in version N+3.

### Q2: Default behavior scope
**Resolution**: No flags = full project review (all scopes). Use `--diff-based` flag to limit to current branch changes. This matches user expectation that "just run the command" does comprehensive work.

### Q3: Live testing integration details
**Resolution**: Accept JSON test output via stdin or file. Format: `{ "tests": [{ "name": "", "status": "pass|fail", "output": "" }] }`. Optionally trigger tests with `--run-tests` flag which runs `bun test` or configured test command and captures output.

## References

- Existing `/add-documentation` command: `~/.config/opencode/command/add-documentation.md`
- Existing `/update-context` command: `~/.config/opencode/command/update-context.md`
- Document-writer agent: `src/agents/document-writer.ts`
- OmO agent patterns: `src/agents/omo.ts`
- Memory tools: `src/tools/memory/`
- Linear tools: `src/tools/linear/`
- Workflow commands guide: `docs/guides/workflow-commands.md`
