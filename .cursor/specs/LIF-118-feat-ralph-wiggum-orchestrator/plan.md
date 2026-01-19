# Ralph Wiggum: Fully Automated Spec-Driven Development - Implementation Plan

**Linear Issue**: [LIF-118](https://linear.app/lifelogger/issue/LIF-118/ralph-wiggum-fully-automated-spec-driven-development-orchestrator)
**Created**: 2026-01-09
**Author**: Strategic Planner (OmO)

## Summary

Ralph Wiggum is a fully automated spec-driven development orchestrator that transforms fuzzy ideas into merged pull requests. This plan implements a 13-phase state machine with event-sourced persistence, 0-100 quality scoring gates, and full Linear/GitHub integration. The implementation builds on existing oh-my-opencode patterns (workflow-context.ts, spec tools, Linear tools) and extends the scaffolded ralph-loop hook into a comprehensive orchestration feature.

## Technical Context

| Aspect | Details |
|--------|---------|
| **Language** | TypeScript 5.7+ |
| **Runtime** | Bun >= 1.0.0 |
| **Framework** | @opencode-ai/plugin SDK |
| **Primary Location** | `src/features/ralph/` |
| **Config Integration** | Extends existing `RalphLoopConfigSchema` in `src/config/schema.ts` |
| **State Persistence** | Event-sourced JSON in spec folder (`ralph-state.json`) |
| **Testing** | Bun test runner (`tests/ralph/`) |

## Constitution Check

| Principle | Compliance |
|-----------|------------|
| Plugin-first architecture | ✅ Uses @opencode-ai/plugin SDK, tool() and hook() patterns |
| Bun-native development | ✅ No npm/yarn, uses Bun test runner |
| Hook-driven enhancement | ✅ Extends existing ralph-loop hook pattern |
| Multi-layered orchestration | ✅ Leverages existing specialist agents (product-strategist, strategic-planner, etc.) |
| Event-sourced state | ✅ Append-only event log with derived current state |

## Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              RALPH ORCHESTRATOR                                  │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────────────────────┐│
│  │ Commands        │  │ State Machine     │  │ Review Gates                   ││
│  │ /idea           │──│ RalphOrchestrator │──│ ObjectiveGate (lint/type/test) ││
│  │ /ralph          │  │ 13 Phases         │  │ PolicyGate (structure)         ││
│  │ /ralph-resume   │  │ Transition Map    │  │ ScoringGate (0-100 LLM)        ││
│  │ /ralph-status   │  └────────┬──────────┘  └─────────────────────────────────┘│
│  └─────────────────┘           │                                                │
│                                ▼                                                │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │                         PHASE EXECUTORS                                     ││
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌─────────────────────┐││
│  │  │IdeaExecutor  │ │SpecExecutor │ │PlanExecutor │ │ImplementExecutor   │││
│  │  │(interview)   │ │(drafting)    │ │(drafting)    │ │(task-by-task)      │││
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └─────────────────────┘││
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌─────────────────────┐││
│  │  │TasksExecutor │ │TestExecutor │ │DocsExecutor │ │PRExecutor          │││
│  │  │(breakdown)   │ │(generate)    │ │(README/API)  │ │(gh pr create)      │││
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └─────────────────────┘││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │                         STATE PERSISTENCE                                   ││
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────────────────┐ ││
│  │  │WorkflowStateStore│  │RalphEvent[]      │  │ralph-state.json           │ ││
│  │  │(event-sourced)   │──│(append-only log) │──│(per spec folder)          │ ││
│  │  └──────────────────┘  └──────────────────┘  └───────────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           EXTERNAL INTEGRATIONS                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────────────────────────┐│
│  │ Linear API      │  │ GitHub CLI      │  │ Existing Agents                  ││
│  │ linear_branch   │  │ gh pr create    │  │ product-strategist               ││
│  │ linear_update   │  │ gh pr view      │  │ strategic-planner                ││
│  │ linear_comment  │  │                 │  │ task-planner                     ││
│  └─────────────────┘  └─────────────────┘  │ implementation-specialist        ││
│                                            │ test-specialist                   ││
│                                            │ document-writer                   ││
│                                            └───────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────────┘
```

### State Machine Diagram

```
                         ┌──────┐
                         │ IDLE │
                         └──┬───┘
                            │ /idea or /ralph
                            ▼
                    ┌───────────────┐
                    │ IDEA_INTAKE   │ ◄─── /idea (conversational)
                    └───────┬───────┘
                            │ interview complete
                            ▼
        ┌──────────► ┌───────────────┐
        │            │ SPEC_DRAFTING │
        │            └───────┬───────┘
        │                    │
        │                    ▼
        │            ┌───────────────┐
        │ score<70   │ SPEC_REVIEW   │─────────┐
        │            └───────┬───────┘         │ score≥70
        │                    │                 │
        └────────────────────┘                 ▼
        ┌──────────► ┌───────────────┐
        │            │ PLAN_DRAFTING │
        │            └───────┬───────┘
        │                    │
        │                    ▼
        │            ┌───────────────┐
        │ score<70   │ PLAN_REVIEW   │─────────┐
        │            └───────┬───────┘         │ score≥70
        │                    │                 │
        └────────────────────┘                 ▼
                            ┌───────────────┐
                            │TASKS_DRAFTING │
                            └───────┬───────┘
                                    │
                                    ▼
                     ┌────► ┌───────────────┐
                     │      │ IMPLEMENTING  │ (per-task checkpoints)
                     │      └───────┬───────┘
                     │              │
                     │              ▼
                     │      ┌───────────────┐
                     │      │   TESTING     │
                     │      └───────┬───────┘
                     │              │
                     │              ▼
                     │      ┌───────────────┐
                     │      │ CODE_REVIEW   │───────┐
                     │      └───────┬───────┘       │
                     │              │ score<80      │ score≥80
                     └──────────────┘               ▼
                            ┌───────────────┐
                            │DOCS_GENERATION│
                            └───────┬───────┘
                                    │
                                    ▼
                            ┌───────────────┐
                            │   PR_OPEN     │
                            └───────┬───────┘
                                    │ (manual merge)
                                    ▼
                            ┌───────────────┐
                            │    MERGED     │
                            └───────────────┘
```

### Data Flow

```
1. User runs /idea "fuzzy idea description"
   └─> IdeaInterviewer conducts 3-round interview
       └─> Multi-expert consultation at 2 checkpoints
           └─> Synthesizes spec.md from transcript
               └─> Transitions to SPEC_DRAFTING

2. SPEC_DRAFTING phase
   └─> SpecDraftingExecutor delegates to product-strategist
       └─> Generates/refines spec.md
           └─> Transitions to SPEC_REVIEW

3. SPEC_REVIEW phase
   └─> ReviewGate evaluates spec.md
       ├─> Objective checks (structure validation)
       ├─> Policy checks (required sections)
       └─> LLM scoring (0-100)
           ├─> score >= 70: Transitions to PLAN_DRAFTING
           └─> score < 70 && attempts < max: Loop back to SPEC_DRAFTING
               └─> score < 70 && attempts >= max: PAUSED (human intervention)

4. [Similar pattern for PLAN phases]

5. IMPLEMENTING phase
   └─> ImplementingExecutor reads tasks.md
       └─> For each task:
           ├─> Delegates to implementation-specialist
           ├─> Checkpoints after each task completion
           └─> Updates task status in state
               └─> All tasks complete: Transitions to TESTING

6. CODE_REVIEW phase
   └─> Aggregated review of all changes
       └─> score >= 80: Transitions to DOCS_GENERATION
           └─> score < 80: Loop back to IMPLEMENTING (with feedback)

7. PR_OPEN phase
   └─> PRCreationExecutor:
       ├─> Reads pr_target_branch from project-context.yaml
       ├─> Creates PR via gh CLI
       ├─> Updates Linear issue status to "In Review"
       └─> Transitions to MERGED (after manual merge)
```

## Data Models

### RalphPhase Enum

```typescript
export type RalphPhase =
  | "IDLE"
  | "IDEA_INTAKE"
  | "SPEC_DRAFTING"
  | "SPEC_REVIEW"
  | "PLAN_DRAFTING"
  | "PLAN_REVIEW"
  | "TASKS_DRAFTING"
  | "IMPLEMENTING"
  | "TESTING"
  | "CODE_REVIEW"
  | "DOCS_GENERATION"
  | "PR_OPEN"
  | "MERGED"
  | "PAUSED"  // Human intervention required
  | "FAILED"  // Unrecoverable error
```

### RalphState Interface

```typescript
export interface RalphState {
  /** State format version */
  version: "1.0"
  
  /** Unique workflow instance ID */
  id: string
  
  /** Path to spec folder (relative to repo root) */
  specPath: string
  
  /** Associated Linear issue ID (e.g., "LIF-118") */
  linearIssue: string | null
  
  /** Current workflow phase */
  currentPhase: RalphPhase
  
  /** Review tracking with scores */
  reviews: {
    spec: ReviewHistory
    plan: ReviewHistory
    code: ReviewHistory
  }
  
  /** Task execution tracking */
  tasks: {
    total: number
    completed: number
    current: string | null
    items: TaskItem[]
  }
  
  /** Interview state (for /idea) */
  interview: InterviewState | null
  
  /** Append-only event log */
  events: RalphEvent[]
  
  /** PR URL after creation */
  prUrl: string | null
  
  /** ISO timestamp when workflow started */
  createdAt: string
  
  /** ISO timestamp of last update */
  updatedAt: string
}

export interface ReviewHistory {
  attempts: number
  scores: number[]
  lastFeedback: string
  lastReviewedAt: string | null
}

export interface TaskItem {
  id: string
  title: string
  status: "pending" | "in_progress" | "completed" | "failed"
  reviewScore?: number
}

export interface InterviewState {
  round: "INTAKE" | "FRAMING" | "DISCOVERY" | "SHAPING" | "DRAFT"
  transcript: InterviewEntry[]
  expertConsultations: ExpertConsultation[]
}

export interface InterviewEntry {
  role: "system" | "user" | "assistant"
  content: string
  timestamp: string
}

export interface ExpertConsultation {
  checkpoint: string
  experts: string[]
  insights: string[]
  timestamp: string
}
```

### RalphEvent Interface (Event Sourcing)

```typescript
export interface RalphEvent {
  /** Event ID */
  id: string
  
  /** ISO timestamp */
  timestamp: string
  
  /** Event type */
  type: RalphEventType
  
  /** Phase when event occurred */
  phase: RalphPhase
  
  /** Event-specific data */
  data: Record<string, unknown>
}

export type RalphEventType =
  | "workflow_started"
  | "phase_entered"
  | "phase_exited"
  | "interview_round_completed"
  | "expert_consultation_completed"
  | "artifact_generated"
  | "review_started"
  | "review_completed"
  | "task_started"
  | "task_completed"
  | "checkpoint_saved"
  | "pr_created"
  | "linear_status_updated"
  | "error_occurred"
  | "workflow_paused"
  | "workflow_resumed"
  | "workflow_completed"
```

### ReviewResult Interface (Gate Output)

```typescript
export interface ReviewResult {
  /** Combined pass/fail */
  pass: boolean
  
  /** Composite score (0-100) */
  score: number
  
  /** Human-readable summary */
  feedback: string
  
  /** Improvement suggestions */
  suggestions: string[]
  
  /** Detailed breakdown */
  details: {
    objective: ObjectiveResult
    policy: PolicyResult
    llm: LLMResult
  }
}

export interface ObjectiveResult {
  lint: { pass: boolean; errors: number }
  typecheck: { pass: boolean; errors: number }
  tests?: { pass: boolean; passed: number; failed: number }
}

export interface PolicyResult {
  sectionsPresent: string[]
  sectionsMissing: string[]
  pass: boolean
}

export interface LLMResult {
  score: number
  rubric: string
  feedback: string
}
```

### Configuration Schema Extension

```typescript
// Extends existing RalphLoopConfigSchema
export const RalphConfigSchema = z.object({
  enabled: z.boolean().default(false),
  
  review: z.object({
    spec: z.object({
      passThreshold: z.number().min(0).max(100).default(70),
      maxIterations: z.number().min(1).max(10).default(3),
    }),
    plan: z.object({
      passThreshold: z.number().min(0).max(100).default(70),
      maxIterations: z.number().min(1).max(10).default(2),
    }),
    code: z.object({
      passThreshold: z.number().min(0).max(100).default(80),
      maxIterations: z.number().min(1).max(10).default(3),
    }),
  }).optional(),
  
  autoPR: z.boolean().default(true),
  prTargetBranch: z.string().optional(), // Override project-context
  stateDir: z.string().optional(), // Override default location
})
```

## Project Structure

```
src/features/ralph/
├── index.ts                    # Barrel export, hook registration
├── types.ts                    # All TypeScript interfaces and types
├── constants.ts                # Phase definitions, transition map, defaults
├── orchestrator.ts             # RalphOrchestrator class (state machine)
├── state-store.ts              # WorkflowStateStore (event-sourced persistence)
├── gates/
│   ├── index.ts                # Gate exports
│   ├── types.ts                # Gate interfaces
│   ├── objective-gate.ts       # Lint, typecheck, test gates
│   ├── policy-gate.ts          # Structure validation
│   ├── scoring-gate.ts         # LLM 0-100 scoring
│   └── combined-gate.ts        # Composite gate logic
├── executors/
│   ├── index.ts                # Executor exports
│   ├── types.ts                # Executor interface
│   ├── idea-executor.ts        # Interview logic
│   ├── spec-executor.ts        # Spec drafting
│   ├── plan-executor.ts        # Plan drafting
│   ├── tasks-executor.ts       # Task breakdown
│   ├── implement-executor.ts   # Task-by-task implementation
│   ├── test-executor.ts        # Test generation/execution
│   ├── docs-executor.ts        # Documentation generation
│   └── pr-executor.ts          # GitHub PR creation
├── interview/
│   ├── index.ts                # Interview exports
│   ├── interviewer.ts          # IdeaInterviewer class
│   ├── rounds.ts               # Round-specific question generators
│   └── synthesis.ts            # Transcript to spec.md conversion
└── utils.ts                    # Shared utilities

src/tools/ralph/
├── index.ts                    # Tool exports
├── types.ts                    # Tool parameter/result types
└── tools.ts                    # ralph_status, ralph_state tools

.opencode/command/
├── idea.md                     # /idea command definition
├── ralph.md                    # /ralph command definition
├── ralph-resume.md             # /ralph-resume command definition
└── ralph-status.md             # /ralph-status command definition

tests/ralph/
├── orchestrator.test.ts        # State machine tests
├── state-store.test.ts         # Persistence tests
├── gates.test.ts               # Gate logic tests
└── executors.test.ts           # Executor unit tests
```

## Implementation Phases

### Phase 1: Foundation (8h)

| Step | Task | Files | Estimate |
|------|------|-------|----------|
| 1.1 | Create ralph feature directory structure | `src/features/ralph/` | 15min |
| 1.2 | Define all TypeScript types and interfaces | `types.ts` | 1.5h |
| 1.3 | Define RalphPhase enum and transition map | `constants.ts` | 45min |
| 1.4 | Implement WorkflowStateStore (event-sourced) | `state-store.ts` | 2h |
| 1.5 | Implement base RalphOrchestrator class | `orchestrator.ts` | 2h |
| 1.6 | Extend RalphConfigSchema in config/schema.ts | `src/config/schema.ts` | 30min |
| 1.7 | Create barrel exports | `index.ts` files | 30min |

**Deliverables**: Core infrastructure with state persistence and phase transitions.

### Phase 2: Review Gates (6h)

| Step | Task | Files | Estimate |
|------|------|-------|----------|
| 2.1 | Define gate interfaces | `gates/types.ts` | 30min |
| 2.2 | Implement ObjectiveGate (lint, typecheck, tests) | `gates/objective-gate.ts` | 1.5h |
| 2.3 | Implement PolicyGate (section validation) | `gates/policy-gate.ts` | 1h |
| 2.4 | Implement ScoringGate with LLM prompt | `gates/scoring-gate.ts` | 1.5h |
| 2.5 | Implement CombinedGate with threshold logic | `gates/combined-gate.ts` | 1h |
| 2.6 | Create gate exports | `gates/index.ts` | 30min |

**Deliverables**: Composable review gates with 0-100 scoring.

### Phase 3: Phase Executors (14h)

| Step | Task | Files | Estimate |
|------|------|-------|----------|
| 3.1 | Define executor interface | `executors/types.ts` | 30min |
| 3.2 | Implement SpecDraftingExecutor | `executors/spec-executor.ts` | 1.5h |
| 3.3 | Implement PlanDraftingExecutor | `executors/plan-executor.ts` | 1.5h |
| 3.4 | Implement TasksDraftingExecutor | `executors/tasks-executor.ts` | 1.5h |
| 3.5 | Implement ImplementingExecutor (task-by-task) | `executors/implement-executor.ts` | 3h |
| 3.6 | Implement TestingExecutor | `executors/test-executor.ts` | 2h |
| 3.7 | Implement DocsGenerationExecutor | `executors/docs-executor.ts` | 1.5h |
| 3.8 | Implement PRCreationExecutor | `executors/pr-executor.ts` | 2h |
| 3.9 | Create executor exports | `executors/index.ts` | 30min |

**Deliverables**: All phase executors with agent delegation.

### Phase 4: /idea Command & Interview System (8h)

| Step | Task | Files | Estimate |
|------|------|-------|----------|
| 4.1 | Define interview types | `interview/types.ts` | 30min |
| 4.2 | Implement IdeaInterviewer class | `interview/interviewer.ts` | 2.5h |
| 4.3 | Implement round question generators | `interview/rounds.ts` | 1.5h |
| 4.4 | Implement multi-expert consultation | `interview/consultation.ts` | 1.5h |
| 4.5 | Implement transcript-to-spec synthesis | `interview/synthesis.ts` | 1.5h |
| 4.6 | Create /idea command definition | `.opencode/command/idea.md` | 30min |

**Deliverables**: Conversational spec discovery via guided interview.

### Phase 5: Orchestration Integration (6h)

| Step | Task | Files | Estimate |
|------|------|-------|----------|
| 5.1 | Wire executors to orchestrator | `orchestrator.ts` | 1.5h |
| 5.2 | Wire review gates to phase transitions | `orchestrator.ts` | 1h |
| 5.3 | Implement score threshold enforcement | `orchestrator.ts` | 1h |
| 5.4 | Implement checkpoint/resume logic | `orchestrator.ts` | 1.5h |
| 5.5 | Implement PAUSED state handling | `orchestrator.ts` | 1h |

**Deliverables**: Fully wired orchestrator with all phase logic.

### Phase 6: Commands & Tools (4h)

| Step | Task | Files | Estimate |
|------|------|-------|----------|
| 6.1 | Create /ralph command definition | `.opencode/command/ralph.md` | 45min |
| 6.2 | Create /ralph-resume command | `.opencode/command/ralph-resume.md` | 45min |
| 6.3 | Create /ralph-status command | `.opencode/command/ralph-status.md` | 45min |
| 6.4 | Implement ralph_status tool | `src/tools/ralph/tools.ts` | 45min |
| 6.5 | Register tools and exports | `src/tools/ralph/index.ts` | 30min |
| 6.6 | Register ralph feature in plugin | `src/index.ts` | 30min |

**Deliverables**: All user-facing commands and tools.

### Phase 7: Linear & GitHub Integration (4h)

| Step | Task | Files | Estimate |
|------|------|-------|----------|
| 7.1 | Add pr_target_branch to project-context schema | `src/tools/project-context/` | 45min |
| 7.2 | Wire Linear status updates to orchestrator | `orchestrator.ts` | 1h |
| 7.3 | Implement PR creation with target branch | `executors/pr-executor.ts` | 1.5h |
| 7.4 | Test Linear → PR → Merged flow | Manual testing | 45min |

**Deliverables**: Full Linear and GitHub integration.

### Phase 8: Testing & Documentation (4h)

| Step | Task | Files | Estimate |
|------|------|-------|----------|
| 8.1 | Write orchestrator unit tests | `tests/ralph/orchestrator.test.ts` | 1h |
| 8.2 | Write state-store unit tests | `tests/ralph/state-store.test.ts` | 45min |
| 8.3 | Write gate unit tests | `tests/ralph/gates.test.ts` | 45min |
| 8.4 | Write executor integration tests | `tests/ralph/executors.test.ts` | 1h |
| 8.5 | Update README with Ralph usage | `README.md` | 30min |

**Deliverables**: Comprehensive test coverage and documentation.

## Dependencies

### Internal (This Repo)

| Dependency | Status | Notes |
|------------|--------|-------|
| `src/shared/workflow-context.ts` | ✅ Exists | Extend WorkflowState, WorkflowStep |
| `src/tools/spec/` | ✅ Exists | Use create_spec_folder, update_workflow_state |
| `src/tools/linear/` | ✅ Exists | Use all 7 Linear tools |
| `src/config/schema.ts` | ✅ Exists | Extend RalphLoopConfigSchema → RalphConfigSchema |
| `src/features/builtin-commands/` | ✅ Exists | Existing ralph-loop template (to refactor) |
| `src/agents/` | ✅ Exists | product-strategist, strategic-planner, task-planner, implementation-specialist, test-specialist, document-writer |

### External

| Dependency | Status | Notes |
|------------|--------|-------|
| `gh` CLI | Required | GitHub PR creation via `gh pr create` |
| `bun` | Required | Test runner, build tool |
| `@opencode-ai/plugin` | Required | SDK for tool/hook definitions |
| `zod` | Required | Schema validation |

## Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| LLM scoring inconsistency | Medium | Medium | Clear rubrics, average 3 evaluations, log scores for calibration |
| Context exhaustion in long implementations | High | High | Per-task checkpointing, aggressive compaction, limit task scope |
| Infinite review loops | Low | High | Hard cap on maxIterations, escalate to PAUSED after limit |
| State file corruption | Low | High | Validate state on read, event log enables reconstruction |
| PR creation failures | Low | Medium | Retry with backoff, fallback to instructions if gh unavailable |
| Agent delegation depth limit (2) | Medium | Medium | Design executors to work within limit, avoid nested delegation |
| Background task TTL (30min) | Medium | Medium | Phase-level checkpoints, no single operation > 25min |
| Interview abandonment | Medium | Low | Save partial interview state, allow resume from any round |

## Testing Strategy

### Unit Tests

| Component | Test Focus |
|-----------|------------|
| `RalphOrchestrator` | Phase transitions, guard conditions, event emission |
| `WorkflowStateStore` | Event sourcing, state derivation, persistence |
| `ObjectiveGate` | Lint/typecheck/test integration |
| `PolicyGate` | Section detection, pass/fail logic |
| `ScoringGate` | LLM prompt construction, score parsing |
| `CombinedGate` | Threshold logic, iteration tracking |

### Integration Tests

| Flow | Test Focus |
|------|------------|
| Spec → Review → Pass | Full phase execution, gate integration |
| Spec → Review → Fail → Retry | Iteration logic, feedback incorporation |
| Implement → Test → Review | Multi-phase coordination |
| PR Creation | gh CLI integration, Linear status update |
| Resume from checkpoint | State loading, phase resumption |

### Manual Testing Checklist

- [ ] `/idea` interview flow (all 3 rounds)
- [ ] `/ralph` from existing spec.md
- [ ] `/ralph-resume` after interruption
- [ ] `/ralph-status` display accuracy
- [ ] Review score calibration (run 5+ reviews, check consistency)
- [ ] PR creation with correct target branch
- [ ] Linear status transitions

## Success Metrics

| Metric | Target |
|--------|--------|
| Manual interventions per workflow | < 5 (excluding initial command) |
| Review scores on passing iterations | Average 75+ |
| Resume success rate | 100% when state file intact |
| Workflow time vs manual | Within 1.5x of skilled developer |
| Test coverage | 80%+ for core orchestration logic |

## Time Summary

| Phase | Estimate |
|-------|----------|
| Phase 1: Foundation | 8h |
| Phase 2: Review Gates | 6h |
| Phase 3: Phase Executors | 14h |
| Phase 4: /idea Command | 8h |
| Phase 5: Orchestration Integration | 6h |
| Phase 6: Commands & Tools | 4h |
| Phase 7: Linear & GitHub | 4h |
| Phase 8: Testing & Docs | 4h |
| **Total** | **54h** |

*Buffer for integration issues and debugging: +10h = **64h total***

## Design Decisions

### DD-1: Feature Location

**Decision**: `src/features/ralph/` (not `src/tools/ralph/`)

**Rationale**: Ralph is a complex orchestration feature with hooks, state management, and multiple components. Tools directory is for simple tool definitions. Features directory matches the complexity level (similar to `background-agent/`, `orchestration/`).

### DD-2: Event-Sourced State

**Decision**: Append-only event log with derived current state

**Rationale**: Enables perfect auditability, time-travel debugging, and robust resume. Existing `workflow-context.ts` uses simpler mutable state; Ralph's complexity warrants event sourcing.

### DD-3: Separate Executors from Orchestrator

**Decision**: Each phase has dedicated executor class

**Rationale**: Single responsibility, testability, extensibility. Orchestrator only handles transitions; executors handle phase-specific logic.

### DD-4: Command Definitions in .opencode/command/

**Decision**: Markdown command files (not builtin-commands)

**Rationale**: Follows established pattern for workflow commands. Enables step/requires/produces/next workflow validation. Existing `/specify`, `/plan`, etc. use this pattern.

### DD-5: Scoring Gate with Structured LLM Output

**Decision**: LLM returns JSON with Zod-validated schema

**Rationale**: Ensures consistent scoring format, enables retry on malformed output, matches NFR-3 requirement for structured output.

## Next Steps

After plan approval:
1. Run `/tasks` to create detailed task breakdown with Linear issue linking
2. Create git branch: `hello/lif-118-ralph-wiggum-fully-automated-spec-driven-development`
3. Begin Phase 1 implementation: Foundation types and state store
4. Update Linear issue status to "In Progress"
