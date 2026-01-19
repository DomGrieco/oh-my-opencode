# Ralph Wiggum: Fully Automated Spec-Driven Development - Task Breakdown

**Linear Issue**: [LIF-118](https://linear.app/lifelogger/issue/LIF-118/ralph-wiggum-fully-automated-spec-driven-development-orchestrator)
**Created**: 2026-01-09
**Total Estimate**: 70h (60h implementation + 10h buffer)

> **Note**: Includes 6 critical error handling tasks identified by Oracle validation.

---

## Phase 1: Foundation (9.5h)

**Goal**: Establish core infrastructure with types, state persistence, and orchestrator base class.

> Includes critical tasks: T1.8a (atomic writes), T1.10a (backup recovery)

| ID | Task | Status | Estimate | Dependencies | Files |
|----|------|--------|----------|--------------|-------|
| T1.1 | Create ralph feature directory structure | Not Started | 15min | None | `src/features/ralph/` |
| T1.2 | Define RalphPhase enum and all phase constants | Not Started | 30min | T1.1 | `src/features/ralph/constants.ts` |
| T1.3 | Define phase transition map with guard conditions | Not Started | 30min | T1.2 | `src/features/ralph/constants.ts` |
| T1.4 | Define RalphState interface with all fields | Not Started | 45min | T1.2 | `src/features/ralph/types.ts` |
| T1.5 | Define RalphEvent types for event sourcing | Not Started | 30min | T1.4 | `src/features/ralph/types.ts` |
| T1.6 | Define ReviewResult, ReviewHistory interfaces | Not Started | 30min | T1.4 | `src/features/ralph/types.ts` |
| T1.7 | Define TaskItem, InterviewState interfaces | Not Started | 30min | T1.4 | `src/features/ralph/types.ts` |
| T1.8 | Implement WorkflowStateStore class (read/write) | Not Started | 1h | T1.5 | `src/features/ralph/state-store.ts` |
| T1.8a | **[CRITICAL]** Implement atomic write with temp file pattern | Not Started | 45min | T1.8 | `src/features/ralph/state-store.ts` |
| T1.9 | Implement event append and state derivation | Not Started | 45min | T1.8a | `src/features/ralph/state-store.ts` |
| T1.10 | Implement state validation on load | Not Started | 30min | T1.8 | `src/features/ralph/state-store.ts` |
| T1.10a | **[CRITICAL]** Implement backup + corrupted state recovery | Not Started | 45min | T1.10 | `src/features/ralph/state-store.ts` |
| T1.11 | Implement base RalphOrchestrator class skeleton | Not Started | 1h | T1.3, T1.8 | `src/features/ralph/orchestrator.ts` |
| T1.12 | Implement phase transition method with guards | Not Started | 45min | T1.11 | `src/features/ralph/orchestrator.ts` |
| T1.13 | Extend RalphConfigSchema in config/schema.ts | Not Started | 30min | T1.4 | `src/config/schema.ts` |
| T1.14 | Create barrel exports for ralph feature | Not Started | 15min | T1.1-T1.13 | `src/features/ralph/index.ts` |

**Checkpoint**: 
- [ ] `bun run typecheck` passes
- [ ] State can be written and read from `ralph-state.json`
- [ ] Phase transitions work with guard conditions

### Task Details

**T1.8: Implement WorkflowStateStore class**
- File-based JSON persistence in spec folder
- Atomic writes (write to temp, rename)
- Event log append-only pattern
- Derive current state from events on load

**T1.11: Implement base RalphOrchestrator class**
- Constructor takes specPath, config
- Methods: `start()`, `transition()`, `getCurrentPhase()`, `getState()`
- Event emission for all state changes

**T1.8a: [CRITICAL] Implement atomic write with temp file pattern**
- Write to `.ralph-state.json.tmp` first
- Validate JSON is well-formed before rename
- Use `fs.renameSync()` for atomic move
- Handle rename failures (fall back to direct write with warning)

**T1.10a: [CRITICAL] Implement backup + corrupted state recovery**
- Create `.ralph-state.json.bak` before each write
- On load failure: attempt recovery from backup
- If backup also corrupt: derive state from event log
- Log recovery actions for debugging

---

## Phase 2: Review Gates (6.75h)

**Goal**: Implement composable quality gates with 0-100 scoring system.

> Includes critical task: T2.10a (LLM timeout handling)

| ID | Task | Status | Estimate | Dependencies | Files |
|----|------|--------|----------|--------------|-------|
| T2.1 | Define gate interfaces (Gate, GateResult) | Not Started | 30min | T1.6 | `src/features/ralph/gates/types.ts` |
| T2.2 | Define ObjectiveResult, PolicyResult, LLMResult | Not Started | 20min | T2.1 | `src/features/ralph/gates/types.ts` |
| T2.3 | Implement ObjectiveGate - lint check | Not Started | 30min | T2.1 | `src/features/ralph/gates/objective-gate.ts` |
| T2.4 | Implement ObjectiveGate - typecheck | Not Started | 30min | T2.3 | `src/features/ralph/gates/objective-gate.ts` |
| T2.5 | Implement ObjectiveGate - test runner | Not Started | 30min | T2.4 | `src/features/ralph/gates/objective-gate.ts` |
| T2.6 | Implement PolicyGate - section detection | Not Started | 30min | T2.1 | `src/features/ralph/gates/policy-gate.ts` |
| T2.7 | Implement PolicyGate - spec.md validation | Not Started | 20min | T2.6 | `src/features/ralph/gates/policy-gate.ts` |
| T2.8 | Implement PolicyGate - plan.md validation | Not Started | 20min | T2.6 | `src/features/ralph/gates/policy-gate.ts` |
| T2.9 | Define LLM scoring prompt template | Not Started | 30min | T2.1 | `src/features/ralph/gates/scoring-gate.ts` |
| T2.10 | Implement ScoringGate with structured output | Not Started | 45min | T2.9 | `src/features/ralph/gates/scoring-gate.ts` |
| T2.10a | **[CRITICAL]** Implement LLM timeout + cancellation handling | Not Started | 45min | T2.10 | `src/features/ralph/gates/scoring-gate.ts` |
| T2.11 | Implement score parsing and validation | Not Started | 30min | T2.10a | `src/features/ralph/gates/scoring-gate.ts` |
| T2.12 | Implement CombinedGate composite logic | Not Started | 45min | T2.5, T2.8, T2.11 | `src/features/ralph/gates/combined-gate.ts` |
| T2.13 | Implement threshold enforcement and iteration tracking | Not Started | 30min | T2.12 | `src/features/ralph/gates/combined-gate.ts` |
| T2.14 | Create gate barrel exports | Not Started | 15min | T2.1-T2.13 | `src/features/ralph/gates/index.ts` |

**Checkpoint**:
- [ ] ObjectiveGate can run lint/typecheck/tests
- [ ] PolicyGate validates spec.md sections
- [ ] ScoringGate returns 0-100 score with feedback
- [ ] CombinedGate respects passThreshold config

### Task Details

**T2.10: Implement ScoringGate with structured output**
- Use Zod schema for LLM response validation
- Rubric-based scoring (completeness, clarity, testability)
- Retry on malformed output (max 2 retries)
- Return score 0 if all retries fail

**T2.12: Implement CombinedGate composite logic**
- Run all gates in parallel
- Combine scores: objective (pass/fail), policy (pass/fail), LLM (0-100)
- Final score = LLM score if objective+policy pass, else 0
- Generate aggregated feedback

**T2.10a: [CRITICAL] Implement LLM timeout + cancellation handling**
- Default timeout: 120 seconds for LLM scoring
- AbortController for cancellation support
- On timeout: return score 0 with "timeout" feedback
- Configurable timeout in RalphConfig
- Log timeout events for monitoring

---

## Phase 3: Phase Executors (15.5h)

**Goal**: Implement all 8 phase executors with agent delegation.

> Includes critical tasks: T3.1a (delegation timeout), T3.10a (checkpoint-on-failure)

| ID | Task | Status | Estimate | Dependencies | Files |
|----|------|--------|----------|--------------|-------|
| T3.1 | Define Executor interface and base class | Not Started | 30min | T1.11 | `src/features/ralph/executors/types.ts` |
| T3.1a | **[CRITICAL]** Implement agent delegation timeout + retry policy | Not Started | 1h | T3.1 | `src/features/ralph/executors/types.ts` |
| T3.2 | Implement SpecDraftingExecutor | Not Started | 1h | T3.1a | `src/features/ralph/executors/spec-executor.ts` |
| T3.3 | Wire SpecDraftingExecutor to product-strategist | Not Started | 30min | T3.2 | `src/features/ralph/executors/spec-executor.ts` |
| T3.4 | Implement PlanDraftingExecutor | Not Started | 1h | T3.1 | `src/features/ralph/executors/plan-executor.ts` |
| T3.5 | Wire PlanDraftingExecutor to strategic-planner | Not Started | 30min | T3.4 | `src/features/ralph/executors/plan-executor.ts` |
| T3.6 | Implement TasksDraftingExecutor | Not Started | 1h | T3.1 | `src/features/ralph/executors/tasks-executor.ts` |
| T3.7 | Wire TasksDraftingExecutor to task-planner | Not Started | 30min | T3.6 | `src/features/ralph/executors/tasks-executor.ts` |
| T3.8 | Implement ImplementingExecutor skeleton | Not Started | 1h | T3.1 | `src/features/ralph/executors/implement-executor.ts` |
| T3.9 | Implement task parsing from tasks.md | Not Started | 45min | T3.8 | `src/features/ralph/executors/implement-executor.ts` |
| T3.10 | Implement per-task execution loop | Not Started | 1h | T3.9 | `src/features/ralph/executors/implement-executor.ts` |
| T3.10a | **[CRITICAL]** Implement checkpoint-on-failure before retry | Not Started | 30min | T3.10 | `src/features/ralph/executors/implement-executor.ts` |
| T3.11 | Implement per-task checkpointing | Not Started | 30min | T3.10a | `src/features/ralph/executors/implement-executor.ts` |
| T3.12 | Implement TestingExecutor | Not Started | 1.5h | T3.1 | `src/features/ralph/executors/test-executor.ts` |
| T3.13 | Wire TestingExecutor to test-specialist | Not Started | 30min | T3.12 | `src/features/ralph/executors/test-executor.ts` |
| T3.14 | Implement DocsGenerationExecutor | Not Started | 1h | T3.1 | `src/features/ralph/executors/docs-executor.ts` |
| T3.15 | Wire DocsGenerationExecutor to document-writer | Not Started | 30min | T3.14 | `src/features/ralph/executors/docs-executor.ts` |
| T3.16 | Implement PRCreationExecutor skeleton | Not Started | 45min | T3.1 | `src/features/ralph/executors/pr-executor.ts` |
| T3.17 | Implement gh CLI integration for PR creation | Not Started | 1h | T3.16 | `src/features/ralph/executors/pr-executor.ts` |
| T3.18 | Implement PR description generation | Not Started | 30min | T3.17 | `src/features/ralph/executors/pr-executor.ts` |
| T3.19 | Create executor barrel exports | Not Started | 15min | T3.1-T3.18 | `src/features/ralph/executors/index.ts` |

**Checkpoint**:
- [ ] Each executor can be instantiated and run
- [ ] Agent delegation works via background_task
- [ ] ImplementingExecutor checkpoints after each task
- [ ] PRCreationExecutor creates PR via gh CLI

### Task Details

**T3.10: Implement per-task execution loop**
- Parse tasks.md for task list
- For each task: delegate to implementation-specialist
- Update task status in state after completion
- Handle task failures with retry logic

**T3.1a: [CRITICAL] Implement agent delegation timeout + retry policy**
- Default timeout: 25 minutes (under background task TTL)
- Retry policy: 2 retries with exponential backoff
- On final timeout: mark task as failed, checkpoint, transition to PAUSED
- Configurable per-executor timeouts
- AbortController integration for clean cancellation

**T3.10a: [CRITICAL] Implement checkpoint-on-failure before retry**
- Save state immediately when task fails
- Include failure reason in event log
- Mark task as "failed" with attempt count
- On resume: skip completed tasks, retry failed task
- Prevent duplicate work on resume

**T3.17: Implement gh CLI integration**
- Read pr_target_branch from project-context.yaml
- Execute `gh pr create` with title, body, base branch
- Parse PR URL from output
- Handle errors (not authenticated, branch not pushed)

---

## Phase 4: /idea Command & Interview System (9h)

**Goal**: Implement conversational spec discovery via guided interview.

> Includes critical task: T4.3a (mid-interview persistence)

| ID | Task | Status | Estimate | Dependencies | Files |
|----|------|--------|----------|--------------|-------|
| T4.1 | Define interview types (InterviewRound, Entry) | Not Started | 30min | T1.7 | `src/features/ralph/interview/types.ts` |
| T4.2 | Define ExpertConsultation interface | Not Started | 20min | T4.1 | `src/features/ralph/interview/types.ts` |
| T4.3 | Implement IdeaInterviewer class skeleton | Not Started | 45min | T4.1 | `src/features/ralph/interview/interviewer.ts` |
| T4.3a | **[CRITICAL]** Implement mid-interview persistence + resume | Not Started | 1h | T4.3 | `src/features/ralph/interview/interviewer.ts` |
| T4.4 | Implement INTAKE round logic | Not Started | 30min | T4.3a | `src/features/ralph/interview/interviewer.ts` |
| T4.5 | Implement FRAMING round questions | Not Started | 45min | T4.3 | `src/features/ralph/interview/rounds.ts` |
| T4.6 | Implement DISCOVERY round questions | Not Started | 45min | T4.5 | `src/features/ralph/interview/rounds.ts` |
| T4.7 | Implement SHAPING round questions | Not Started | 45min | T4.6 | `src/features/ralph/interview/rounds.ts` |
| T4.8 | Implement multi-expert consultation at checkpoint 1 | Not Started | 1h | T4.5 | `src/features/ralph/interview/consultation.ts` |
| T4.9 | Implement multi-expert consultation at checkpoint 2 | Not Started | 30min | T4.8 | `src/features/ralph/interview/consultation.ts` |
| T4.10 | Implement consultation synthesis | Not Started | 30min | T4.9 | `src/features/ralph/interview/consultation.ts` |
| T4.11 | Implement transcript-to-spec synthesis | Not Started | 1h | T4.7 | `src/features/ralph/interview/synthesis.ts` |
| T4.12 | Implement spec.md template generation | Not Started | 30min | T4.11 | `src/features/ralph/interview/synthesis.ts` |
| T4.13 | Create /idea command definition | Not Started | 30min | T4.3 | `.opencode/command/idea.md` |
| T4.14 | Create interview barrel exports | Not Started | 15min | T4.1-T4.12 | `src/features/ralph/interview/index.ts` |

**Checkpoint**:
- [ ] `/idea` command starts interview flow
- [ ] 3 rounds complete with progressive questions
- [ ] Expert consultation runs at 2 checkpoints
- [ ] spec.md generated from transcript

### Task Details

**T4.3a: [CRITICAL] Implement mid-interview persistence + resume**
- Save interview state after each round completion
- Store transcript, current round, expert consultations
- On resume: detect existing interview state
- Offer to continue from last round or restart
- Handle partial round (user abandoned mid-question)

**T4.8: Implement multi-expert consultation**
- Parallel calls to 3-4 agents (oracle, security-specialist, etc.)
- Each agent reviews current transcript
- Synthesize insights into follow-up questions
- Store consultation results in interview state

**T4.11: Implement transcript-to-spec synthesis**
- Extract user stories from interview answers
- Identify requirements and acceptance criteria
- Generate structured spec.md following template
- Preserve interview transcript as appendix

---

## Phase 5: Orchestration Integration (6h)

**Goal**: Wire all components together into working orchestrator.

| ID | Task | Status | Estimate | Dependencies | Files |
|----|------|--------|----------|--------------|-------|
| T5.1 | Wire executors to orchestrator by phase | Not Started | 1h | T3.19, T1.11 | `src/features/ralph/orchestrator.ts` |
| T5.2 | Implement executor selection logic | Not Started | 30min | T5.1 | `src/features/ralph/orchestrator.ts` |
| T5.3 | Wire review gates to SPEC_REVIEW phase | Not Started | 30min | T2.14, T5.1 | `src/features/ralph/orchestrator.ts` |
| T5.4 | Wire review gates to PLAN_REVIEW phase | Not Started | 30min | T5.3 | `src/features/ralph/orchestrator.ts` |
| T5.5 | Wire review gates to CODE_REVIEW phase | Not Started | 30min | T5.4 | `src/features/ralph/orchestrator.ts` |
| T5.6 | Implement score threshold enforcement | Not Started | 45min | T5.5 | `src/features/ralph/orchestrator.ts` |
| T5.7 | Implement iteration counting and max check | Not Started | 30min | T5.6 | `src/features/ralph/orchestrator.ts` |
| T5.8 | Implement checkpoint save before long ops | Not Started | 30min | T5.1 | `src/features/ralph/orchestrator.ts` |
| T5.9 | Implement resume from checkpoint logic | Not Started | 45min | T5.8 | `src/features/ralph/orchestrator.ts` |
| T5.10 | Implement PAUSED state handling | Not Started | 30min | T5.7 | `src/features/ralph/orchestrator.ts` |
| T5.11 | Implement FAILED state handling | Not Started | 30min | T5.10 | `src/features/ralph/orchestrator.ts` |
| T5.12 | Implement run() main loop | Not Started | 45min | T5.1-T5.11 | `src/features/ralph/orchestrator.ts` |

**Checkpoint**:
- [ ] Orchestrator runs from IDLE to PR_OPEN
- [ ] Review gates block progression when score < threshold
- [ ] Iterations are tracked and max enforced
- [ ] Resume works from any checkpoint

### Task Details

**T5.9: Implement resume from checkpoint logic**
- Read state from ralph-state.json
- Validate spec.md/plan.md hashes for drift
- Warn user if artifacts changed
- Continue from currentPhase

**T5.12: Implement run() main loop**
- While not terminal state (MERGED, PAUSED, FAILED)
- Execute current phase's executor
- Run review gate if applicable
- Transition to next phase or loop back
- Checkpoint after each phase

---

## Phase 6: Commands & Tools (4h)

**Goal**: Create user-facing commands and tools.

| ID | Task | Status | Estimate | Dependencies | Files |
|----|------|--------|----------|--------------|-------|
| T6.1 | Create /ralph command definition | Not Started | 45min | T5.12 | `.opencode/command/ralph.md` |
| T6.2 | Implement /ralph argument parsing | Not Started | 30min | T6.1 | `.opencode/command/ralph.md` |
| T6.3 | Create /ralph-resume command definition | Not Started | 45min | T5.9 | `.opencode/command/ralph-resume.md` |
| T6.4 | Implement drift detection warning | Not Started | 30min | T6.3 | `.opencode/command/ralph-resume.md` |
| T6.5 | Create /ralph-status command definition | Not Started | 45min | T1.8 | `.opencode/command/ralph-status.md` |
| T6.6 | Implement status display formatting | Not Started | 30min | T6.5 | `.opencode/command/ralph-status.md` |
| T6.7 | Implement ralph_status tool | Not Started | 45min | T1.8 | `src/tools/ralph/tools.ts` |
| T6.8 | Create ralph tools barrel export | Not Started | 15min | T6.7 | `src/tools/ralph/index.ts` |
| T6.9 | Register ralph feature in plugin index | Not Started | 30min | T6.8 | `src/index.ts` |

**Checkpoint**:
- [ ] `/ralph` starts workflow from spec.md
- [ ] `/ralph-resume` continues from checkpoint
- [ ] `/ralph-status` shows current state and scores
- [ ] Tools registered and available

### Task Details

**T6.5: Create /ralph-status command**
- Display current phase and time in phase
- Show review scores per artifact with iteration counts
- Show task progress (X of Y completed)
- Display estimated time remaining
- Link to artifacts and PR URL

---

## Phase 7: Linear & GitHub Integration (4h)

**Goal**: Full integration with Linear issue tracking and GitHub PRs.

| ID | Task | Status | Estimate | Dependencies | Files |
|----|------|--------|----------|--------------|-------|
| T7.1 | Add pr_target_branch to project-context schema | Not Started | 30min | None | `src/tools/project-context/types.ts` |
| T7.2 | Implement pr_target_branch reading | Not Started | 30min | T7.1 | `src/tools/project-context/tools.ts` |
| T7.3 | Wire Linear status update on SPEC_DRAFTING | Not Started | 30min | T5.1 | `src/features/ralph/orchestrator.ts` |
| T7.4 | Wire Linear status update on PR_OPEN | Not Started | 30min | T7.3 | `src/features/ralph/orchestrator.ts` |
| T7.5 | Wire Linear comment on PAUSED/FAILED | Not Started | 30min | T7.4 | `src/features/ralph/orchestrator.ts` |
| T7.6 | Implement PR creation with target branch | Not Started | 45min | T7.2, T3.17 | `src/features/ralph/executors/pr-executor.ts` |
| T7.7 | Implement PR description with Linear reference | Not Started | 30min | T7.6 | `src/features/ralph/executors/pr-executor.ts` |
| T7.8 | Test Linear → PR → status flow | Not Started | 45min | T7.1-T7.7 | Manual testing |

**Checkpoint**:
- [ ] Linear issue status updates at phase transitions
- [ ] PR created with correct target branch
- [ ] PR description references Linear issue
- [ ] Comments added on workflow pause/failure

### Task Details

**T7.6: Implement PR creation with target branch**
- Read pr_target_branch from project-context.yaml
- Fall back to 'main' if not configured
- Use linear_branch tool for branch name
- Create PR via gh CLI with --base flag

---

## Phase 8: Testing & Documentation (4h)

**Goal**: Comprehensive test coverage and documentation.

| ID | Task | Status | Estimate | Dependencies | Files |
|----|------|--------|----------|--------------|-------|
| T8.1 | Write orchestrator unit tests | Not Started | 1h | T5.12 | `tests/ralph/orchestrator.test.ts` |
| T8.2 | Write state-store unit tests | Not Started | 45min | T1.10 | `tests/ralph/state-store.test.ts` |
| T8.3 | Write gate unit tests | Not Started | 45min | T2.14 | `tests/ralph/gates.test.ts` |
| T8.4 | Write executor integration tests | Not Started | 1h | T3.19 | `tests/ralph/executors.test.ts` |
| T8.5 | Update README with Ralph usage | Not Started | 30min | T6.9 | `README.md` |

**Checkpoint**:
- [ ] `bun test tests/ralph/` passes
- [ ] 80%+ coverage on core orchestration logic
- [ ] README documents /idea, /ralph, /ralph-resume, /ralph-status

### Task Details

**T8.1: Write orchestrator unit tests**
- Test phase transitions with mock executors
- Test guard conditions block invalid transitions
- Test event emission on state changes
- Test resume from various checkpoints

**T8.4: Write executor integration tests**
- Mock agent calls with canned responses
- Test ImplementingExecutor task loop
- Test PRCreationExecutor gh CLI integration
- Test error handling and retries

---

## Summary

| Phase | Tasks | Estimate | Status |
|-------|-------|----------|--------|
| Phase 1: Foundation | 16 tasks | 9.5h | Not Started |
| Phase 2: Review Gates | 15 tasks | 6.75h | Not Started |
| Phase 3: Phase Executors | 21 tasks | 15.5h | Not Started |
| Phase 4: /idea Command | 15 tasks | 9h | Not Started |
| Phase 5: Orchestration Integration | 12 tasks | 6h | Not Started |
| Phase 6: Commands & Tools | 9 tasks | 4h | Not Started |
| Phase 7: Linear & GitHub | 8 tasks | 4h | Not Started |
| Phase 8: Testing & Docs | 5 tasks | 4h | Not Started |
| **Total** | **101 tasks** | **58.75h** | - |
| **Buffer** | - | **10h** | - |
| **Grand Total** | **101 tasks** | **~70h** | - |

> 6 critical error handling tasks added based on Oracle validation (T1.8a, T1.10a, T2.10a, T3.1a, T3.10a, T4.3a)

---

## Recommended Execution Order

### Critical Path (Sequential)
1. **T1.1-T1.14** (Phase 1) - Foundation must complete first
2. **T2.1-T2.14** (Phase 2) - Gates depend on types
3. **T3.1-T3.19** (Phase 3) - Executors depend on gates
4. **T5.1-T5.12** (Phase 5) - Integration depends on executors

### Parallelizable Work
- **Phase 4** (Interview) can run in parallel with Phase 3 after T1.14
- **Phase 6** (Commands) can start after T5.12
- **Phase 7** (Linear/GitHub) can start after T3.17
- **Phase 8** (Testing) can start incrementally after each phase

### Suggested Sprint Breakdown

**Sprint 1 (16h)**: Foundation + Review Gates
- Complete Phase 1 (8h)
- Complete Phase 2 (6h)
- Buffer: 2h

**Sprint 2 (18h)**: Executors + Interview
- Complete Phase 3 (14h)
- Start Phase 4 (4h)

**Sprint 3 (14h)**: Interview + Integration
- Complete Phase 4 (4h)
- Complete Phase 5 (6h)
- Complete Phase 6 (4h)

**Sprint 4 (16h)**: Integration + Polish
- Complete Phase 7 (4h)
- Complete Phase 8 (4h)
- Integration testing (4h)
- Buffer: 4h

---

## Dependency Graph

```
Phase 1 (Foundation)
    │
    ├──► Phase 2 (Review Gates)
    │         │
    │         └──► Phase 3 (Executors) ◄──┐
    │                   │                  │
    │                   ├──► Phase 5 (Integration)
    │                   │         │
    │                   │         ├──► Phase 6 (Commands)
    │                   │         │
    │                   │         └──► Phase 7 (Linear/GitHub)
    │                   │
    │                   └──► Phase 8 (Testing) [incremental]
    │
    └──► Phase 4 (Interview) ──► Phase 5 (Integration)
```

---

## Risk Mitigation Tasks

| Risk | Mitigation Task | Phase |
|------|-----------------|-------|
| LLM scoring inconsistency | T2.10: Retry on malformed output | Phase 2 |
| LLM timeout/hang | **T2.10a: Timeout + cancellation handling** | Phase 2 |
| Context exhaustion | T3.11: Per-task checkpointing | Phase 3 |
| Agent delegation timeout | **T3.1a: Delegation timeout + retry policy** | Phase 3 |
| Task failure data loss | **T3.10a: Checkpoint-on-failure** | Phase 3 |
| Infinite review loops | T5.7: Max iteration enforcement | Phase 5 |
| State file corruption | T1.10: State validation on load | Phase 1 |
| State file partial write | **T1.8a: Atomic write with temp file** | Phase 1 |
| State recovery failure | **T1.10a: Backup + corrupted state recovery** | Phase 1 |
| PR creation failures | T3.17: Error handling with fallback | Phase 3 |
| Agent delegation depth | T3.2-T3.7: Direct agent calls, no nesting | Phase 3 |
| Interview data loss | **T4.3a: Mid-interview persistence** | Phase 4 |

---

## Notes

- **Background Task TTL**: 30 minutes - ensure no single operation exceeds 25 minutes
- **Delegation Depth**: Max 2 levels - Ralph is level 1, specialists are level 2
- **Checkpoint Frequency**: After each phase completion and before long operations
- **Test Coverage Target**: 80%+ for core orchestration logic
- **Bun Test Runner**: Use existing patterns from `tests/` directory
