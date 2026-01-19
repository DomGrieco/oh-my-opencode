# Unified Documentation Management Command - Task Breakdown

**Linear Issue**: [LIF-106](https://linear.app/lifelogger/issue/LIF-106/unified-documentation-management-command)
**Created**: 2025-12-29
**Total Estimate**: 22h (20h implementation + 2h buffer)

## Summary

| Phase | Tasks | Estimate | Status |
|-------|-------|----------|--------|
| Phase 1: Setup | 2 tasks | 30min | Not Started |
| Phase 2: Command Foundation | 8 tasks | 4h | Not Started |
| Phase 3: Linear Integration | 5 tasks | 2h | Not Started |
| Phase 4: Clarification Engine | 5 tasks | 2h | Not Started |
| Phase 5: Manager Agent Pattern | 6 tasks | 3h | Not Started |
| Phase 6: Scope-Specific Workflows | 7 tasks | 4.5h | Not Started |
| Phase 7: Validation & Testing | 4 tasks | 2h | Not Started |
| Phase 8: Governance & Completion | 4 tasks | 1.5h | Not Started |
| Phase 9: Documentation & Dogfooding | 4 tasks | 2h | Not Started |
| Phase 10: Polish | 3 tasks | 30min | Not Started |
| **Total** | **48 tasks** | **22h** | - |

---

## User Story Mapping

| User Story | Description | Tasks |
|------------|-------------|-------|
| US-1 | Single command for post-feature documentation | T2.1-T2.8, T5.1-T5.6 |
| US-2 | Bidirectional code-documentation validation | T7.1-T7.3 |
| US-3 | Manager agent orchestrating review agents (1-50+) | T5.1-T5.6 |
| US-4 | Unified documentation types management | T6.1-T6.7 |
| US-5 | Documentation sync/review at any time | T6.1-T6.7, T7.1-T7.3 |
| US-6 | User request preservation throughout workflow | T2.6 |
| US-7 | Combinable scope flags | T2.2, T2.3 |
| US-8 | Intelligent clarification for broad requests | T4.1-T4.5 |
| US-9 | Linear issue integration | T3.1-T3.5 |

---

## Phase 1: Setup (30min)

**Goal**: Prepare the environment and verify prerequisites.

| ID | Task | Status | Estimate | Dependencies | Files | Notes |
|----|------|--------|----------|--------------|-------|-------|
| T1.1 | Verify existing command patterns | Not Started | 15min | - | `~/.config/opencode/command/add-documentation.md`, `~/.config/opencode/command/update-context.md` | Read and understand existing patterns |
| T1.2 | Create command file skeleton | Not Started | 15min | T1.1 | `~/.config/opencode/command/documentation.md` | Frontmatter + basic structure |

**Checkpoint**: Command file exists with valid frontmatter, can be invoked (shows help).

### Task Details

**T1.1: Verify existing command patterns**
- Read `/add-documentation` command (598 lines)
- Read `/update-context` command (244 lines)
- Note: handoffs, agent delegation patterns, tool usage
- Document key patterns to reuse

**T1.2: Create command file skeleton**
- Create `~/.config/opencode/command/documentation.md`
- Add frontmatter with category, description, handoffs
- Add placeholder sections for each workflow step

---

## Phase 2: Command Foundation (4h)

**Goal**: Implement core command structure with argument parsing and scope analysis.

| ID | Task | Status | Estimate | Dependencies | Files | Notes |
|----|------|--------|----------|--------------|-------|-------|
| T2.1 | Implement frontmatter with handoffs | Not Started | 30min | T1.2 | `documentation.md` | document-writer, explore, oracle handoffs |
| T2.2 | Implement argument parsing section | Not Started | 45min | T2.1 | `documentation.md` | Parse LINEAR_ISSUE, scope flags, modifiers |
| T2.3 | Implement scope flag processing logic | Not Started | 45min | T2.2 | `documentation.md` | --docs, --memory, --context, --inline |
| T2.4 | Add preflight validation | Not Started | 30min | T2.3 | `documentation.md` | Load project context, verify prerequisites |
| T2.5 | Implement scope analysis phase | Not Started | 45min | T2.4 | `documentation.md` | Count files, determine doc types needed |
| T2.6 | Add user request preservation pattern | Not Started | 15min | T2.5 | `documentation.md` | Display and preserve throughout workflow |
| T2.7 | Add dry-run mode support | Not Started | 30min | T2.6 | `documentation.md` | Preview without execution |
| T2.8 | Add --parallel flag support | Not Started | 15min | T2.7 | `documentation.md` | Limit concurrent agents |

**Checkpoint**: Command parses all flags correctly, shows scope analysis, dry-run works.

### Task Details

**T2.1: Implement frontmatter with handoffs**
```yaml
---
category: docs
description: Unified documentation management with intelligent agent orchestration
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
```

**T2.2: Implement argument parsing section**
- Parse first argument as Linear issue ID (if matches pattern)
- Parse scope flags: `--docs`, `--memory`, `--context`, `--inline`
- Parse modifier flags: `--validate`, `--diff-based`, `--scope`, `--dry-run`, `--parallel`, `--no-clarify`, `--run-tests`
- Remaining text = user request

**T2.3: Implement scope flag processing logic**
- No flags = all scopes (full review)
- Single flag = only that scope
- Multiple flags = combined scopes
- Store in structured format for later phases

**T2.4: Add preflight validation**
- Call `read_context({ section: "all" })`
- Verify git repository exists (for diff-based mode)
- Check for existing documentation structure
- Validate Linear API key if issue ID provided

**T2.5: Implement scope analysis phase**
- Count files per scope type
- Identify existing documentation
- Calculate suggested agent count
- Build work distribution plan

**T2.6: Add user request preservation pattern**
- Display user request prominently at workflow start
- Include in all agent delegation prompts
- Reference in completion report

**T2.7: Add dry-run mode support**
- When `--dry-run` flag present:
  - Show what would be done
  - List files that would be created/modified
  - Show agent count and distribution
  - Do NOT execute any changes

**T2.8: Add --parallel flag support**
- Parse `--parallel <n>` argument
- Default: unlimited (system handles)
- Pass to manager agent for enforcement

---

## Phase 3: Linear Integration (2h)

**Goal**: Enable issue-scoped documentation via Linear issue ID.

| ID | Task | Status | Estimate | Dependencies | Files | Notes |
|----|------|--------|----------|--------------|-------|-------|
| T3.1 | Implement Linear issue detection | Not Started | 30min | T2.2 | `documentation.md` | Detect LIF-XXX pattern |
| T3.2 | Implement issue fetching | Not Started | 30min | T3.1 | `documentation.md` | Use linear_get_issue tool |
| T3.3 | Parse issue description for scope hints | Not Started | 30min | T3.2 | `documentation.md` | Extract mentioned files/modules |
| T3.4 | Find linked branch/PR for changed files | Not Started | 15min | T3.3 | `documentation.md` | Use git commands |
| T3.5 | Implement completion reporting to Linear | Not Started | 15min | T3.4 | `documentation.md` | Use linear_add_comment tool |

**Checkpoint**: `/documentation LIF-123` fetches issue, scopes correctly, reports completion.

### Task Details

**T3.1: Implement Linear issue detection**
- Regex pattern: `/^(LIF|[A-Z]+-)\d+$/`
- Check if first argument matches
- Store issue ID for later use

**T3.2: Implement issue fetching**
```markdown
Use `linear_get_issue` tool:
- Fetch title, description, status, labels
- Check for linked branches/PRs
- Find associated spec folder if exists
```

**T3.3: Parse issue description for scope hints**
- Look for file paths mentioned
- Look for module/component names
- Look for documentation type hints
- Build scope from issue context

**T3.4: Find linked branch/PR for changed files**
- Get branch name from issue
- Run `git diff main...HEAD --name-only` if on branch
- Add changed files to scope

**T3.5: Implement completion reporting to Linear**
- After documentation complete, call `linear_add_comment`
- Include summary of changes made
- List files created/modified
- Optionally update issue status

---

## Phase 4: Clarification Engine (2h)

**Goal**: Ask clarifying questions for broad/ambiguous requests before spawning many agents.

| ID | Task | Status | Estimate | Dependencies | Files | Notes |
|----|------|--------|----------|--------------|-------|-------|
| T4.1 | Implement ambiguity detection logic | Not Started | 45min | T2.5 | `documentation.md` | Detect when clarification needed |
| T4.2 | Create clarification question templates | Not Started | 30min | T4.1 | `documentation.md` | Scope, types, validation questions |
| T4.3 | Handle user responses | Not Started | 30min | T4.2 | `documentation.md` | Parse a/b/c or y/n responses |
| T4.4 | Implement default handling | Not Started | 15min | T4.3 | `documentation.md` | "all defaults" response |
| T4.5 | Add --no-clarify bypass support | Not Started | 15min | T4.4 | `documentation.md` | Skip questions, use defaults |

**Checkpoint**: Broad requests trigger questions, responses update scope, --no-clarify skips.

### Task Details

**T4.1: Implement ambiguity detection logic**
Trigger clarification when:
- No scope flags AND no Linear issue AND vague request
- Request uses broad terms ("everything", "all", "full review")
- Project is large (100+ files) and no scope limiting
- No `--no-clarify` flag present

**T4.2: Create clarification question templates**
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

**T4.3: Handle user responses**
- Parse response format: "1a 2c 3y 4n"
- Map to scope configuration
- Update work plan accordingly

**T4.4: Implement default handling**
- "all defaults" = proceed with sensible defaults
- Defaults: diff-based scope, all doc types, no inline, no validation

**T4.5: Add --no-clarify bypass support**
- When flag present, skip all questions
- Use defaults immediately
- Log that clarification was skipped

---

## Phase 5: Manager Agent Pattern (3h)

**Goal**: Implement dynamic agent scaling and parallel worker coordination.

| ID | Task | Status | Estimate | Dependencies | Files | Notes |
|----|------|--------|----------|--------------|-------|-------|
| T5.1 | Implement agent count calculation | Not Started | 30min | T2.5 | `documentation.md` | Scale 1-50+ based on scope |
| T5.2 | Create work distribution algorithm | Not Started | 45min | T5.1 | `documentation.md` | Divide work into packages |
| T5.3 | Implement parallel worker spawning | Not Started | 45min | T5.2 | `documentation.md` | Use background_task tool |
| T5.4 | Add worker result collection | Not Started | 30min | T5.3 | `documentation.md` | Collect via background_output |
| T5.5 | Implement result synthesis | Not Started | 30min | T5.4 | `documentation.md` | Merge into unified report |
| T5.6 | Implement partial failure handling | Not Started | 15min | T5.5 | `documentation.md` | Continue despite failures |

**Checkpoint**: Command spawns correct number of agents, collects results, handles failures.

### Task Details

**T5.1: Implement agent count calculation**
| Scope | Agent Count | Example |
|-------|-------------|---------|
| Single file | 1-2 | `--scope src/tools/grep/index.ts` |
| Single module | 3-5 | `--scope src/tools/grep/` |
| Multiple modules | 5-15 | `--docs --scope src/tools/` |
| Full project (one scope) | 10-20 | `--docs` |
| Full project (all scopes) | 20-50+ | No flags |
| Full + validation | 30-60+ | `--validate` |

**T5.2: Create work distribution algorithm**
- Divide files into work packages
- Each package: id, type, agent, files, mode, priority
- Balance load across agents
- Respect dependencies between packages

**T5.3: Implement parallel worker spawning**
```markdown
For each work package:
  background_task(
    agent="document-writer",
    description="Document {package.type} for {package.files.length} files",
    prompt="""
    TASK: [Scope-specific documentation task]
    
    EXPECTED OUTCOME: [Concrete deliverables]
    
    REQUIRED SKILLS: document-writer
    
    REQUIRED TOOLS: read, edit, grep, lsp_document_symbols
    
    MUST DO:
    - Focus on files: [file list]
    - Follow existing patterns
    - Respect anti-bloat guardrails
    
    MUST NOT DO:
    - Document outside assigned scope
    - Add emojis unless requested
    
    CONTEXT:
    - User Request: [preserved user request]
    - Documentation Type: [docs/memory/context/inline]
    """
  )
```

**T5.4: Add worker result collection**
- Track all spawned task IDs
- Poll for completion via background_output
- Collect results as they complete
- Timeout handling for stuck tasks

**T5.5: Implement result synthesis**
- Merge all worker outputs
- Aggregate metrics (files created, modified)
- Compile validation issues
- Generate unified summary

**T5.6: Implement partial failure handling**
- Continue even if some workers fail
- Report failed packages in summary
- Don't block successful work
- Suggest retry for failed packages

---

## Phase 6: Scope-Specific Workflows (4.5h)

**Goal**: Implement the four documentation scope workflows.

| ID | Task | Status | Estimate | Dependencies | Files | Notes |
|----|------|--------|----------|--------------|-------|-------|
| T6.1 | Port --docs workflow from add-documentation | Not Started | 1h | T5.3 | `documentation.md` | README, guides, API docs |
| T6.2 | Port --memory workflow from update-context | Not Started | 1h | T5.3 | `documentation.md` | constitution, architecture, etc. |
| T6.3 | Implement --context workflow | Not Started | 45min | T5.3 | `documentation.md` | project-context.yaml |
| T6.4 | Implement --inline workflow | Not Started | 1h | T5.3 | `documentation.md` | JSDoc/TSDoc comments |
| T6.5 | Add anti-bloat guardrails for memory | Not Started | 15min | T6.2 | `documentation.md` | File size limits |
| T6.6 | Implement scope combination logic | Not Started | 15min | T6.1-T6.4 | `documentation.md` | Handle multiple flags |
| T6.7 | Add --scope path filter support | Not Started | 15min | T6.6 | `documentation.md` | Limit to specific path |

**Checkpoint**: Each scope flag works independently and in combination.

### Task Details

**T6.1: Port --docs workflow from add-documentation**
- Discovery: Find documentation opportunities
- Delegation: Spawn document-writer agents
- Targets: README.md, docs/, API docs, guides
- Verification: Check created docs are valid

**T6.2: Port --memory workflow from update-context**
- Smart auto-detection of intent
- Memory file management with templates
- Anti-bloat guardrails (max lines per file)
- Diff-based learning from git changes

**T6.3: Implement --context workflow**
- Read current project-context.yaml
- Analyze codebase for updates needed
- Update tech_stack, architecture, conventions
- Validate YAML structure

**T6.4: Implement --inline workflow**
- Find functions/classes without JSDoc/TSDoc
- Generate appropriate documentation
- Use AST-grep for pattern matching
- Respect existing comment styles

**T6.5: Add anti-bloat guardrails for memory**
| File | Max Lines | Action if Exceeded |
|------|-----------|-------------------|
| `constitution.md` | 200 | Prune or split |
| `architecture.md` | 150 | Consolidate or archive |
| `tech-stack.md` | 100 | Remove deprecated |
| `glossary.md` | 200 | Archive least-used |
| `decisions/ADR-*.md` | 50 each | Split into multiple |

**T6.6: Implement scope combination logic**
- When multiple flags: run all selected scopes
- Merge work packages across scopes
- Avoid duplicate work on same files
- Unified reporting across scopes

**T6.7: Add --scope path filter support**
- Parse `--scope <path>` argument
- Filter all work packages to path
- Works with any scope flag combination

---

## Phase 7: Validation & Testing (2h)

**Goal**: Implement validation mode and bidirectional code-documentation checking.

| ID | Task | Status | Estimate | Dependencies | Files | Notes |
|----|------|--------|----------|--------------|-------|-------|
| T7.1 | Implement --validate mode | Not Started | 45min | T6.6 | `documentation.md` | Check without writing |
| T7.2 | Add bidirectional validation | Not Started | 45min | T7.1 | `documentation.md` | Code ↔ docs consistency |
| T7.3 | Implement --run-tests integration | Not Started | 30min | T7.2 | `documentation.md` | Use test output for validation |
| T7.4 | Generate validation report | Not Started | 15min | T7.3 | `documentation.md` | List mismatches and issues |

**Checkpoint**: --validate finds real issues, --run-tests uses test output.

### Task Details

**T7.1: Implement --validate mode**
- Check docs without writing changes
- Report issues found
- Suggest fixes
- Exit with status code

**T7.2: Add bidirectional validation**
- Code → Docs: Check documented features exist
- Docs → Code: Check code behavior matches docs
- Use AST analysis for code patterns
- Use grep for documentation claims

**T7.3: Implement --run-tests integration**
- Run `bun test` or configured test command
- Capture JSON output
- Compare test results to documented behavior
- Flag contradictions

**T7.4: Generate validation report**
```markdown
## Validation Report

### Issues Found: 5

| Type | Location | Issue | Suggested Fix |
|------|----------|-------|---------------|
| Stale | docs/api.md:45 | Function `foo` no longer exists | Remove section |
| Missing | src/tools/grep/index.ts | No JSDoc for `search()` | Add documentation |
| Mismatch | README.md:120 | Claims 10 tools, actually 11 | Update count |
```

---

## Phase 8: Governance & Completion (1.5h)

**Goal**: Integrate with governance hooks and generate completion reports.

| ID | Task | Status | Estimate | Dependencies | Files | Notes |
|----|------|--------|----------|--------------|-------|-------|
| T8.1 | Add workflow state updates | Not Started | 30min | T5.5 | `documentation.md` | Use update_workflow_state tool |
| T8.2 | Implement completion report generation | Not Started | 30min | T8.1 | `documentation.md` | Summary of all changes |
| T8.3 | Add deprecation warnings to old commands | Not Started | 30min | T8.2 | `add-documentation.md`, `update-context.md` | Point to /documentation |
| T8.4 | Verify governance hooks fire correctly | Not Started | 15min | T8.3 | - | path-validator, historian |

**Checkpoint**: Workflow state updated, completion report generated, old commands warn.

### Task Details

**T8.1: Add workflow state updates**
- Call `update_workflow_state` at completion
- Track documentation phase in spec folder
- Enable session resumption

**T8.2: Implement completion report generation**
```markdown
## Documentation Complete

**Duration**: 5m 32s
**Agents Used**: 12

### Summary
| Scope | Files Created | Files Modified |
|-------|---------------|----------------|
| docs | 3 | 5 |
| memory | 0 | 2 |
| inline | 0 | 15 |

### Files Changed
- Created: docs/guides/new-feature.md
- Modified: README.md
- Modified: .cursor/memory/architecture.md
...

### Validation Issues
- None found

### Next Steps
- Review changes with `git diff`
- Commit with `/commit`
```

**T8.3: Add deprecation warnings to old commands**
Add to top of `/add-documentation` and `/update-context`:
```markdown
> **DEPRECATED**: This command is deprecated. Use `/documentation` instead.
> - For public docs: `/documentation --docs`
> - For memory files: `/documentation --memory`
> - For everything: `/documentation`
```

**T8.4: Verify governance hooks fire correctly**
- Test that `governance-path-validator` fires on writes
- Test that `governance-historian` creates changelog
- Test that `governance-linear-injector` adds context

---

## Phase 9: Documentation & Dogfooding (2h)

**Goal**: Document the command and test it on oh-my-opencode itself.

| ID | Task | Status | Estimate | Dependencies | Files | Notes |
|----|------|--------|----------|--------------|-------|-------|
| T9.1 | Update workflow-commands.md guide | Not Started | 30min | T8.2 | `docs/guides/workflow-commands.md` | Add /documentation section |
| T9.2 | Dogfood: Run /documentation --docs | Not Started | 30min | T9.1 | - | Test on oh-my-opencode |
| T9.3 | Dogfood: Run /documentation --memory --validate | Not Started | 30min | T9.2 | - | Validate memory files |
| T9.4 | Fix issues found during dogfooding | Not Started | 30min | T9.3 | `documentation.md` | Address any bugs |

**Checkpoint**: Command documented, tested on real project, issues fixed.

### Task Details

**T9.1: Update workflow-commands.md guide**
- Add `/documentation` section
- Document all flags and combinations
- Add usage examples
- Note deprecation of old commands

**T9.2: Dogfood: Run /documentation --docs**
- Run on oh-my-opencode project
- Verify README, docs/ are updated correctly
- Check agent scaling works
- Note any issues

**T9.3: Dogfood: Run /documentation --memory --validate**
- Validate constitution, architecture, tech-stack
- Check for stale entries
- Verify anti-bloat guardrails work

**T9.4: Fix issues found during dogfooding**
- Address any bugs discovered
- Improve prompts if needed
- Adjust agent count formula if needed

---

## Phase 10: Polish (30min)

**Goal**: Final cleanup and verification.

| ID | Task | Status | Estimate | Dependencies | Files | Notes |
|----|------|--------|----------|--------------|-------|-------|
| T10.1 | Verify command file size < 800 lines | Not Started | 10min | T9.4 | `documentation.md` | Per success metrics |
| T10.2 | Run final typecheck | Not Started | 10min | T10.1 | - | Ensure no TS errors |
| T10.3 | Update workflow state to complete | Not Started | 10min | T10.2 | - | Mark LIF-106 complete |

**Checkpoint**: Command ready for release.

---

## Dependency Graph

```
Phase 1 (Setup)
├── T1.1 Verify patterns ─────────────────────┐
└── T1.2 Create skeleton ─────────────────────┴── Phase 2 (Foundation)
                                                        │
Phase 2 (Command Foundation)                            │
├── T2.1 Frontmatter ─────────────────────────────────┐ │
├── T2.2 Argument parsing ────────────────────────────┤ │
├── T2.3 Scope flags ─────────────────────────────────┤ │
├── T2.4 Preflight ───────────────────────────────────┤ │
├── T2.5 Scope analysis ──────────────────────────────┤ │
├── T2.6 User request preservation ───────────────────┤ │
├── T2.7 Dry-run mode ────────────────────────────────┤ │
└── T2.8 Parallel flag ───────────────────────────────┘ │
                    │                                    │
                    ▼                                    │
Phase 3 (Linear)    Phase 4 (Clarification)             │
├── T3.1-T3.5       ├── T4.1-T4.5                       │
│                   │                                    │
└───────────────────┴────────────────────────────────────┘
                    │
                    ▼
Phase 5 (Manager Agent Pattern)
├── T5.1 Agent count calculation
├── T5.2 Work distribution
├── T5.3 Parallel spawning ───────────────────────────┐
├── T5.4 Result collection                            │
├── T5.5 Result synthesis                             │
└── T5.6 Partial failure handling                     │
                    │                                  │
                    ▼                                  │
Phase 6 (Scope Workflows)                              │
├── T6.1 --docs workflow ─────────────────────────────┤
├── T6.2 --memory workflow ───────────────────────────┤
├── T6.3 --context workflow ──────────────────────────┤
├── T6.4 --inline workflow ───────────────────────────┤
├── T6.5 Anti-bloat guardrails                        │
├── T6.6 Scope combination                            │
└── T6.7 Path filter                                  │
                    │                                  │
                    ▼                                  │
Phase 7 (Validation)                                   │
├── T7.1 --validate mode                              │
├── T7.2 Bidirectional validation                     │
├── T7.3 --run-tests integration                      │
└── T7.4 Validation report                            │
                    │                                  │
                    ▼                                  │
Phase 8 (Governance)                                   │
├── T8.1 Workflow state updates                       │
├── T8.2 Completion report                            │
├── T8.3 Deprecation warnings                         │
└── T8.4 Governance hook verification                 │
                    │                                  │
                    ▼                                  │
Phase 9 (Documentation & Dogfooding)                   │
├── T9.1 Update workflow-commands.md                  │
├── T9.2 Dogfood --docs                               │
├── T9.3 Dogfood --memory --validate                  │
└── T9.4 Fix issues                                   │
                    │                                  │
                    ▼                                  │
Phase 10 (Polish)                                      │
├── T10.1 Verify file size                            │
├── T10.2 Final typecheck                             │
└── T10.3 Update workflow state                       │
```

---

## Recommended Execution Order

### Day 1: Foundation (6h)
1. **T1.1** → **T1.2** (Setup - 30min)
2. **T2.1** → **T2.2** → **T2.3** (Core parsing - 2h)
3. **T2.4** → **T2.5** → **T2.6** (Preflight & analysis - 1.5h)
4. **T2.7** → **T2.8** (Modifiers - 45min)
5. Commit Phase 1-2

### Day 2: Integration (4h)
1. **T3.1** → **T3.2** → **T3.3** → **T3.4** → **T3.5** (Linear - 2h)
2. **T4.1** → **T4.2** → **T4.3** → **T4.4** → **T4.5** (Clarification - 2h)
3. Commit Phase 3-4

### Day 3: Manager Pattern (3h)
1. **T5.1** → **T5.2** (Planning - 1.25h)
2. **T5.3** → **T5.4** (Execution - 1.25h)
3. **T5.5** → **T5.6** (Synthesis - 45min)
4. Commit Phase 5

### Day 4: Scope Workflows (4.5h)
1. **T6.1** (--docs - 1h)
2. **T6.2** + **T6.5** (--memory + guardrails - 1.25h)
3. **T6.3** (--context - 45min)
4. **T6.4** (--inline - 1h)
5. **T6.6** → **T6.7** (Combination - 30min)
6. Commit Phase 6

### Day 5: Validation & Completion (4h)
1. **T7.1** → **T7.2** → **T7.3** → **T7.4** (Validation - 2h)
2. **T8.1** → **T8.2** → **T8.3** → **T8.4** (Governance - 1.5h)
3. Commit Phase 7-8

### Day 6: Dogfooding & Polish (2.5h)
1. **T9.1** (Documentation - 30min)
2. **T9.2** → **T9.3** → **T9.4** (Dogfooding - 1.5h)
3. **T10.1** → **T10.2** → **T10.3** (Polish - 30min)
4. Final commit

---

## Parallel Opportunities

Tasks that can run in parallel (different files, no dependencies):

| Group | Tasks | Notes |
|-------|-------|-------|
| Phase 3+4 | T3.1-T3.5 ∥ T4.1-T4.5 | Linear and Clarification are independent |
| Phase 6 | T6.1 ∥ T6.2 ∥ T6.3 ∥ T6.4 | Scope workflows are independent |
| Phase 9 | T9.2 ∥ T9.3 | Dogfooding tests are independent |

---

## Notes

### Implementation Considerations
- Command file is markdown-based, no TypeScript compilation needed
- Reuse patterns from existing `/add-documentation` and `/update-context`
- All agent delegation via `background_task` tool
- Use `call_omo_agent` for synchronous delegations if needed

### Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Manager prompt too complex | Medium | High | Break into sections; test incrementally |
| Agent coordination overhead | Medium | Medium | Batch small work packages |
| Clarification flow interrupts | Low | Medium | Smart defaults; --no-clarify flag |
| Memory file bloat | Low | Medium | Hard limits in prompt; validation pass |

### Testing Notes
- No automated tests (per AGENTS.md)
- Manual testing via dogfooding on oh-my-opencode
- Test each scope flag individually and in combination
- Test Linear integration with real issue

### Files Modified Summary
| File | Lines (est.) | Changes |
|------|-------------|---------|
| `~/.config/opencode/command/documentation.md` | ~700 | New command file |
| `~/.config/opencode/command/add-documentation.md` | +5 | Deprecation warning |
| `~/.config/opencode/command/update-context.md` | +5 | Deprecation warning |
| `docs/guides/workflow-commands.md` | +50 | Documentation section |

### Success Metrics
| Metric | Target | How to Verify |
|--------|--------|---------------|
| Command file size | < 800 lines | `wc -l documentation.md` |
| Agent count accuracy | ±20% of scope | Manual observation |
| Full project review time | < 15 min for 100 files | Timed dogfooding |
| Partial failure recovery | 90% success rate | Test with failing agents |
