# Rule Keeper Agent - Task Breakdown

**Linear Issue**: [LIF-110](https://linear.app/lifelogger/issue/LIF-110/rule-keeper-agent-automated-project-rule-maintenance-in-spec)
**Created**: 2026-01-03
**Total Estimate**: 17h

---

## Phase 1: Rule Engineer Agent (Specialist) (5h)

**Goal**: Create the Rule Engineer specialist agent that contains all prompt engineering knowledge for writing high-quality AGENTS.md files. This agent is built first because it contains the core knowledge that Rule Keeper will delegate to.

| ID | Task | Status | Estimate | Files | Dependencies |
|----|------|--------|----------|-------|--------------|
| T1.1 | Create rule-engineer agent config file | Not Started | 30min | `src/agents/rule-engineer.ts` | None |
| T1.2 | Encode OmO orchestration patterns in prompt | Not Started | 1h | `src/agents/rule-engineer.ts` | T1.1 |
| T1.3 | Encode Oracle response patterns in prompt | Not Started | 30min | `src/agents/rule-engineer.ts` | T1.1 |
| T1.4 | Encode command workflow patterns in prompt | Not Started | 30min | `src/agents/rule-engineer.ts` | T1.1 |
| T1.5 | Encode anti-pattern detection rules | Not Started | 30min | `src/agents/rule-engineer.ts` | T1.1 |
| T1.6 | Add tier templates (Navigation/Standard/Minimal) | Not Started | 45min | `src/agents/rule-engineer.ts` | T1.1 |
| T1.7 | Add to agent types and registration | Not Started | 30min | `src/agents/types.ts`, `src/agents/index.ts` | T1.1-T1.6 |
| T1.8 | Test rule-engineer independently | Not Started | 45min | Manual testing | T1.7 |

**Checkpoint**: Rule Engineer agent is callable via `call_omo_agent(subagent_type="rule-engineer")` and can write high-quality AGENTS.md content when given context.

### Task Details

**T1.1: Create rule-engineer agent config file**
- Create new file `src/agents/rule-engineer.ts`
- Follow pattern from `src/agents/product-strategist.ts`
- Set model: `anthropic/claude-sonnet-4-5`
- Set temperature: `0.1`
- Set mode: `subagent`
- Define tools: `read`, `glob`, `grep`, `ast_grep_search`, `lsp_document_symbols`, `read_context`, `memory_read`, `edit`, `write`
- Export `ruleEngineerAgent` constant

**T1.2: Encode OmO orchestration patterns in prompt**
- Add Intent Classification patterns (TRIVIAL/EXPLORATION/IMPLEMENTATION/ORCHESTRATION)
- Add Blocking Gates (Pre-Search, Pre-Edit, Pre-Delegation, Pre-Completion)
- Add Evidence Requirements table
- Add 7-section delegation prompt structure

**T1.3: Encode Oracle response patterns in prompt**
- Add Bottom Line structure
- Add Action Plan format
- Add Effort Estimate categories (Quick/Short/Medium/Large)
- Add "Why this approach" and "Watch out for" sections

**T1.4: Encode command workflow patterns in prompt**
- Add numbered steps pattern
- Add GOVERNANCE section pattern
- Add References section pattern
- Add Detect/Confirm/Execute flow
- Add Spec Folder Integration pattern

**T1.5: Encode anti-pattern detection rules**
- Add type safety anti-patterns (`as any`, `@ts-ignore`, `@ts-expect-error`)
- Add package manager anti-patterns (`npm`, `yarn`, `npx`)
- Add agent config anti-patterns (temperature > 0.3, missing tool restrictions)
- Add publishing anti-patterns (direct `bun publish`, manual version bump)

**T1.6: Add tier templates (Navigation/Standard/Minimal)**
- Add Navigation tier template (OVERVIEW + STRUCTURE table with links)
- Add Standard tier template (OVERVIEW + STRUCTURE + domain sections + HOW TO ADD + ANTI-PATTERNS)
- Add Minimal tier template (OVERVIEW + STRUCTURE only)
- Add tier selection heuristics in prompt

**T1.7: Add to agent types and registration**
- Add `"rule-engineer"` to `BuiltinAgentName` union in `src/agents/types.ts`
- Add `"rule-engineer"` to `DELEGATABLE_AGENTS` array in `src/agents/types.ts`
- Add import and export in `src/agents/index.ts`
- Add to `builtinAgents` record
- Add to `AGENT_ROLE_REGISTRY` with role `"specialist"`

**T1.8: Test rule-engineer independently**
- Run `bun run typecheck` to verify no type errors
- Test via `call_omo_agent(subagent_type="rule-engineer", prompt="Write AGENTS.md for src/agents/")`
- Verify output follows tier templates
- Verify evidence-based patterns are cited

---

## Phase 2: Rule Keeper Agent (Orchestrator) (4h)

**Goal**: Create the Rule Keeper orchestrator agent that discovers project structure, detects rule needs, and delegates writing to Rule Engineer.

| ID | Task | Status | Estimate | Files | Dependencies |
|----|------|--------|----------|-------|--------------|
| T2.1 | Create rule-keeper agent config file | Not Started | 30min | `src/agents/rule-keeper.ts` | T1.7 |
| T2.2 | Add project discovery logic to prompt | Not Started | 1h | `src/agents/rule-keeper.ts` | T2.1 |
| T2.3 | Add tier detection heuristics | Not Started | 45min | `src/agents/rule-keeper.ts` | T2.1 |
| T2.4 | Add delegation logic to rule-engineer | Not Started | 45min | `src/agents/rule-keeper.ts` | T2.1 |
| T2.5 | Add validation logic for proposals | Not Started | 30min | `src/agents/rule-keeper.ts` | T2.1 |
| T2.6 | Add to agent types and registration | Not Started | 15min | `src/agents/types.ts`, `src/agents/index.ts` | T2.1-T2.5 |
| T2.7 | Test two-agent interaction | Not Started | 30min | Manual testing | T2.6 |

**Checkpoint**: Rule Keeper agent discovers project structure, classifies directories into tiers, and successfully delegates to Rule Engineer for writing.

### Task Details

**T2.1: Create rule-keeper agent config file**
- Create new file `src/agents/rule-keeper.ts`
- Follow pattern from `src/agents/implementation-specialist.ts` (manager pattern)
- Set model: `anthropic/claude-sonnet-4-5`
- Set temperature: `0.1`
- Set mode: `subagent`
- Define tools: `read`, `glob`, `grep`, `ast_grep_search`, `lsp_document_symbols`, `lsp_workspace_symbols`, `read_context`, `memory_read`, `memory_list`, `call_omo_agent`, `serena_get_symbols_overview`, `serena_find_symbol`
- Export `ruleKeeperAgent` constant

**T2.2: Add project discovery logic to prompt**
- Add workflow for `read_context()` → project configuration
- Add workflow for `glob("**/AGENTS.md")` → existing rule files
- Add workflow for `glob("**/{package.json,Cargo.toml,pyproject.toml,go.mod}")` → manifest detection
- Add directory traversal logic (respect .gitignore)
- Add project type detection (TypeScript, Python, Rust, Go, monorepo)

**T2.3: Add tier detection heuristics**
- Navigation tier: 3+ subdirectories with code
- Standard tier: Implementation files with documentable patterns
- Minimal tier: Few files, single purpose
- Add config override support
- Add consistency check with sibling AGENTS.md files

**T2.4: Add delegation logic to rule-engineer**
- Add delegation template using `call_omo_agent`
- Include: TASK, TIER, EXISTING_CONTENT, PROJECT_CONTEXT
- Include: MUST DO (detect patterns, apply template, cite evidence, APPLY DIRECTLY)
- Include: MUST NOT DO (exceed line limit, modify protected sections)

**T2.5: Add validation logic for proposals**
- Validate line count against tier limits
- Validate protected sections not modified
- Validate evidence citations present
- Add dry-run mode support

**T2.6: Add to agent types and registration**
- Add `"rule-keeper"` to `BuiltinAgentName` union in `src/agents/types.ts`
- Add `"rule-keeper"` to `DELEGATABLE_AGENTS` array in `src/agents/types.ts`
- Add import and export in `src/agents/index.ts`
- Add to `builtinAgents` record
- Add to `AGENT_ROLE_REGISTRY` with role `"manager"` (can delegate to rule-engineer)

**T2.7: Test two-agent interaction**
- Run `bun run typecheck` to verify no type errors
- Test via `call_omo_agent(subagent_type="rule-keeper", prompt="Discover and create AGENTS.md for src/")`
- Verify Rule Keeper delegates to Rule Engineer
- Verify Rule Engineer writes files directly
- Verify summary report is returned

---

## Phase 3: Configuration Schema (1.5h)

**Goal**: Add RuleKeeperConfigSchema to the configuration system for project-specific customization.

| ID | Task | Status | Estimate | Files | Dependencies |
|----|------|--------|----------|-------|--------------|
| T3.1 | Implement RuleKeeperConfigSchema (create schema, add to main config, export types, update schema.json) | Not Started | 1h | `src/config/schema.ts`, `src/config/index.ts`, `assets/oh-my-opencode.schema.json` | T2.6 |

**Checkpoint**: Configuration schema is complete with IDE autocomplete support via JSON schema.

### Task Details

**T3.1: Implement RuleKeeperConfigSchema**
Complete implementation of configuration schema:

1. **Create sub-schemas** in `src/config/schema.ts`:
   - `RuleKeeperTierThresholdsSchema` (navigation_min_subdirs: 3, minimal_max_files: 5, standard_min_patterns: 2)
   - `RuleKeeperLimitsSchema` (root_max_lines: 200, standard_max_lines: 100, minimal_max_lines: 40, pattern_threshold: 3)
   - `RuleKeeperTemplateSchema` for custom sections
   - `RuleKeeperProtectedSectionSchema` for protected content

2. **Create main `RuleKeeperConfigSchema`** with all fields:
   - enabled, scan_paths, ignore_paths, code_extensions, tiers, templates, limits, protected, enforced_antipatterns, prompt_in_review, prompt_in_test

3. **Add to main config**: `rule_keeper: RuleKeeperConfigSchema.optional()` in `OhMyOpenCodeConfigSchema`

4. **Export types** from `src/config/index.ts`:
   - `RuleKeeperConfig`, `RuleKeeperTierThresholds`, `RuleKeeperLimits`, `RuleKeeperTemplate`, `RuleKeeperProtectedSection`

5. **Update JSON schema**: Run `bun run build:schema`, verify IDE autocomplete works

---

## Phase 4: /update-rules Command (2h)

**Goal**: Create the `/update-rules` slash command for on-demand rule maintenance.

| ID | Task | Status | Estimate | Files | Dependencies |
|----|------|--------|----------|-------|--------------|
| T4.1 | Create command markdown file | Not Started | 45min | `.opencode/command/update-rules.md` | T2.6 |
| T4.2 | Test command invocation | Not Started | 30min | Manual testing | T4.1 |
| T4.3 | Document usage in command help | Not Started | 30min | `.opencode/command/update-rules.md` | T4.1 |
| T4.4 | Edge case handling | Not Started | 15min | Agent prompt refinement | T4.2 |

**Checkpoint**: `/update-rules` command is available in OpenCode with `--discover`, `--audit`, `--sync`, `--dry-run` options.

### Task Details

**T4.1: Create command markdown file**
- Create `.opencode/command/update-rules.md`
- Follow pattern from `.opencode/command/sync-fork.md`
- Add YAML frontmatter:
  - `category: docs`
  - `description: Analyze and maintain project AGENTS.md files`
  - `argument-hint: [--scope <path>] [--discover] [--audit] [--sync] [--dry-run]`
  - `agent: rule-keeper`
- Add Overview section explaining the command
- Add Options table with all flags
- Add Examples section with common use cases
- Add Workflow section explaining the process

**T4.2: Test command invocation**
- Test `/update-rules --help` shows options
- Test `/update-rules --discover --dry-run` on oh-my-opencode
- Test `/update-rules --scope src/agents` targets specific directory
- Verify rule-keeper agent is invoked correctly

**T4.3: Document usage in command help**
- Add detailed option descriptions
- Add example outputs
- Add troubleshooting section
- Add requirements section (git, project structure)

**T4.4: Edge case handling**
- Handle empty project (no code files)
- Handle project with no manifest files
- Handle directories with only config files
- Add clear error messages for each case

---

## Phase 5: Testing & Dogfooding (3.5h)

**Goal**: Validate the Rule Keeper system by running it on oh-my-opencode itself.

| ID | Task | Status | Estimate | Files | Dependencies |
|----|------|--------|----------|-------|--------------|
| T5.1 | Run --discover --dry-run on oh-my-opencode | Not Started | 30min | Review output | T4.2 |
| T5.2 | Verify tier detection | Not Started | 30min | Review proposals | T5.1 |
| T5.3 | Apply proposals to create AGENTS.md files | Not Started | 30min | AGENTS.md files | T5.2 |
| T5.4 | Test on sample Python/Go/Rust projects | Not Started | 30min | External | T5.3 |
| T5.5 | Document findings and adjust prompts | Not Started | 15min | Agent files | T5.4 |
| T5.6 | Integration test: full two-agent workflow | Not Started | 30min | Manual testing | T5.3 |
| T5.7 | Performance benchmark on various project sizes | Not Started | 30min | Benchmark results | T5.3 |
| T5.8 | Error handling and recovery test | Not Started | 30min | Manual testing | T5.3 |

**Checkpoint**: oh-my-opencode has AGENTS.md hierarchy created/updated by rule-keeper with verified quality.

### Task Details

**T5.1: Run --discover --dry-run on oh-my-opencode**
- Execute `/update-rules --discover --dry-run`
- Capture output for analysis
- Note any errors or unexpected behavior
- Verify project type detected as TypeScript

**T5.2: Verify tier detection**
- Verify `src/` detected as Navigation tier (has 7+ subdirs)
- Verify `src/agents/` detected as Standard tier (implementation files)
- Verify `src/hooks/` detected as Standard tier (implementation files)
- Verify `src/tools/` detected as Navigation tier (has subdirs)
- Verify `src/shared/` detected as Minimal tier (utilities)
- Check tier assignments match expectations

**T5.3: Apply proposals to create AGENTS.md files**
- Execute `/update-rules --discover` (without --dry-run)
- Review created AGENTS.md files
- Verify content follows tier templates
- Verify patterns are evidence-based
- Verify anti-bloat limits respected

**T5.4: Test on sample Python/Go/Rust projects**
- Run `/update-rules --discover --dry-run` on sample projects
- Test on at least one Python project (FastAPI/Django sample)
- Test on at least one Go project if available
- Test on at least one Rust project if available
- Verify project type detected correctly for each
- Verify appropriate file extensions detected
- Note any language-specific issues

**T5.5: Document findings and adjust prompts**
- Document any prompt adjustments needed
- Update agent prompts based on findings
- Add any missing patterns or templates
- Update tier detection heuristics if needed

**T5.6: Integration test: full two-agent workflow**
- Test complete flow: /update-rules → Rule Keeper → Rule Engineer → AGENTS.md created
- Verify Rule Keeper correctly delegates to Rule Engineer
- Verify Rule Engineer writes files directly
- Verify summary report is accurate
- Test with --dry-run flag to verify preview mode

**T5.7: Performance benchmark on various project sizes**
- Test on small project (~1k lines): verify < 10s completion
- Test on medium project (~10k lines): verify < 30s completion  
- Test on large project (~100k lines): verify reasonable completion time
- Document any performance bottlenecks
- Verify incremental analysis works for large projects

**T5.8: Error handling and recovery test**
- Test behavior when Rule Engineer fails mid-write
- Test behavior with malformed existing AGENTS.md
- Test behavior with permission errors
- Verify clear error messages are produced
- Verify partial changes are not left in corrupted state

---

## Phase 6: Workflow Command Integration (Optional) (2h)

**Goal**: Integrate rule-keeper as an optional step in `/review` and `/test` commands.

| ID | Task | Status | Estimate | Files | Dependencies |
|----|------|--------|----------|-------|--------------|
| T6.1 | Add rule-keeper step to /review command | Not Started | 45min | `.opencode/command/review.md` | T5.3 |
| T6.2 | Add rule-keeper step to /test command | Not Started | 45min | `.opencode/command/test.md` | T5.3 |
| T6.3 | Document workflow integration | Not Started | 15min | Command files | T6.1, T6.2 |
| T6.4 | Test workflow integration | Not Started | 15min | Manual testing | T6.3 |

**Checkpoint**: `/review` and `/test` commands include optional AGENTS.md update step.

### Task Details

**T6.1: Add rule-keeper step to /review command**
- Add optional step after code review assessment
- Check `prompt_in_review` config setting
- Prompt user: "Would you like to update AGENTS.md based on patterns found? [y/n]"
- If yes, invoke rule-keeper with scope of reviewed files
- If no, continue workflow

**T6.2: Add rule-keeper step to /test command**
- Add optional step after tests pass
- Check `prompt_in_test` config setting
- Prompt user: "Would you like to document tested patterns in AGENTS.md? [y/n]"
- If yes, invoke rule-keeper with scope of tested files
- If no, continue workflow

**T6.3: Document workflow integration**
- Update command help text
- Add examples of workflow integration
- Document config options for enabling/disabling

**T6.4: Test workflow integration**
- Test `/review` with rule-keeper step
- Test `/test` with rule-keeper step
- Verify user can skip rule updates
- Verify workflow continues after rule updates

---

## Phase 7: Documentation (0.5h)

**Goal**: Update README if significant changes warrant documentation.

| ID | Task | Status | Estimate | Files | Dependencies |
|----|------|--------|----------|-------|--------------|
| T7.1 | Update README if significant | Not Started | 30min | `README.md` | T5.5 |

**Checkpoint**: Documentation is updated to reflect new rule-keeper functionality.

### Task Details

**T7.1: Update README if significant**
- Add rule-keeper to Agents section if warranted
- Add `/update-rules` to Commands section
- Add configuration options to Configuration section
- Keep changes minimal - only document if significant

---

## Summary

| Phase | Tasks | Estimate | Status |
|-------|-------|----------|--------|
| Phase 1: Rule Engineer Agent (Specialist) | 8 tasks | 5h | Not Started |
| Phase 2: Rule Keeper Agent (Orchestrator) | 7 tasks | 4h | Not Started |
| Phase 3: Configuration Schema | 1 task | 1h | Not Started |
| Phase 4: /update-rules Command | 4 tasks | 2h | Not Started |
| Phase 5: Testing & Dogfooding | 8 tasks | 3.5h | Not Started |
| Phase 6: Workflow Integration (Optional) | 4 tasks | 2h | Not Started |
| Phase 7: Documentation | 1 task | 0.5h | Not Started |
| **Total** | **33 tasks** | **18h** | - |

<!-- Note: Total increased from 17h to 18h due to added integration/performance/error-recovery tests -->

---

## Recommended Execution Order

### Critical Path (14.5h core functionality)

1. **T1.1** first (foundation for Rule Engineer)
2. **T1.2-T1.6** can be done in parallel (all modify same file, different sections)
3. **T1.7** after T1.1-T1.6 (registration depends on agent being complete)
4. **T1.8** after T1.7 (testing depends on registration)
5. Commit Phase 1: "feat(agents): add rule-engineer specialist agent"

6. **T2.1** first (foundation for Rule Keeper)
7. **T2.2-T2.5** can be done in parallel (all modify same file, different sections)
8. **T2.6** after T2.1-T2.5 (registration depends on agent being complete)
9. **T2.7** after T2.6 (testing depends on registration)
10. Commit Phase 2: "feat(agents): add rule-keeper orchestrator agent"

11. **T3.1-T3.4** sequential (each depends on previous)
12. Commit Phase 3: "feat(config): add RuleKeeperConfigSchema"

13. **T4.1** first (command file)
14. **T4.2-T4.4** sequential (testing and refinement)
15. Commit Phase 4: "feat(command): add /update-rules command"

16. **T5.1-T5.5** sequential (dogfooding workflow)
17. Commit Phase 5: "feat(dogfood): create AGENTS.md hierarchy for oh-my-opencode"

### Optional (2h)

18. **T6.1-T6.4** sequential (workflow integration)
19. Commit Phase 6: "feat(workflow): integrate rule-keeper into /review and /test"

### Documentation (0.5h)

20. **T7.1** (documentation update)
21. Commit Phase 7: "docs: add rule-keeper documentation"

---

## Notes

- **Dependency Chain**: Rule Keeper depends on Rule Engineer being complete (Phase 2 depends on Phase 1)
- **Parallel Opportunities**: Within each phase, prompt sections (T1.2-T1.6, T2.2-T2.5) can be developed in parallel
- **Testing Points**: Each phase has a testing task to verify before moving on
- **Dogfooding**: Phase 5 is critical for validating real-world usage
- **Optional Phase**: Phase 6 can be deferred if time is constrained
- **Schema Regeneration**: After Phase 3, run `bun run build:schema` to update JSON schema

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Prompt too long | Split into sections, use templates |
| Tier detection inaccurate | Add config overrides, test on multiple projects |
| Context window overflow | Use incremental analysis, anti-bloat limits |
| Two-agent coordination issues | Test delegation thoroughly in T2.7 |
| Command not recognized | Verify command loader picks up new file |
