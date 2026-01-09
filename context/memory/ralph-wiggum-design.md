# Ralph Wiggum: Fully Automated Spec-Driven Development

**Created**: 2026-01-08
**Status**: Design Complete, Ready for Implementation
**Author**: Sisyphus + User Collaboration

---

## Overview

Ralph Wiggum is an automated orchestration system that chains the entire spec-driven development workflow:
`/idea` → spec → plan → tasks → implement → test → review → docs → PR

Named after the Simpsons character who says things that seem nonsensical but occasionally contain profound insights - like how this system takes fuzzy ideas and transforms them into working code.

---

## Key Design Decisions (User Confirmed)

### 1. PR Creation
- **Decision**: Auto-create PR (fully autonomous)
- **Target Branch**: Read from `project-context.yaml` field `pr_target_branch` (e.g., `DomGrieco/oh-my-opencode`)
- **Action**: Add `pr_target_branch` field to project-context schema

### 2. Review Scoring System
- **Decision**: Replace strict iteration counts with 0-100 scoring
- **How It Works**:
  - Review agents output structured JSON with `score: number` (0-100)
  - Configurable `pass_threshold` per review type (default: 70)
  - Iteration continues until score >= threshold OR max iterations reached
- **Configuration** (in `oh-my-opencode.json`):
  ```json
  {
    "ralph": {
      "review": {
        "spec": { "passThreshold": 70, "maxIterations": 3 },
        "plan": { "passThreshold": 70, "maxIterations": 2 },
        "code": { "passThreshold": 80, "maxIterations": 3 }
      }
    }
  }
  ```
- **Structured Output**: Use OpenCode SDK's response format or JSON schema enforcement

### 3. Multi-Issue Scheduling
- **v1**: Option B - User specifies issue order manually
- **Future (backlog)**: Option A - Automatic DAG traversal with dependency resolution
- **Action**: Create Linear backlog issue for DAG feature

### 4. Voice Mode
- **Decision**: Removed from scope
- **Rationale**: Voice is external app (SuperWhisper) that pastes text - no special handling needed

---

## Architecture

### State Machine

```
IDLE → IDEA_INTAKE → SPEC_DRAFTING → SPEC_REVIEW ←→ (iterate)
                                          ↓
                                    PLAN_DRAFTING → PLAN_REVIEW ←→ (iterate)
                                                         ↓
                                                   TASKS_DRAFTING
                                                         ↓
                                    ┌─────────── IMPLEMENTING ←────────┐
                                    ↓                                   │
                                 TESTING                                │
                                    ↓                                   │
                               CODE_REVIEW ─────────────────────────────┘
                                    ↓ (all tasks done)
                             DOCS_GENERATION
                                    ↓
                                 PR_OPEN
                                    ↓
                                 MERGED
```

### Components

1. **RalphOrchestrator**: State machine controller, transition validation, checkpoint/resume
2. **WorkflowStateStore**: Event-sourced persistence to `ralph-state.json`
3. **IdeaInterviewer**: Conversational spec discovery (3 rounds: Framing → Discovery → Shaping)
4. **StepExecutors**: Delegates to existing agents (product-strategist, strategic-planner, etc.)
5. **ReviewGates**: Composable gates with 0-100 scoring

### Review Gate Structure

```typescript
interface ReviewResult {
  pass: boolean;
  score: number;  // 0-100
  feedback: string;
  suggestions: string[];
  breakdown: {
    objective: { lint: boolean; typecheck: boolean; tests?: boolean };
    policy: { sectionsPresent: string[]; sectionsMissing: string[] };
    quality: { score: number; rubric: string };
  };
}
```

### State Persistence (`ralph-state.json`)

```typescript
interface RalphState {
  version: "1.0";
  specFolder: string;
  linearIssue?: string;
  
  currentState: RalphPhase;
  
  // Review scores (not just iterations)
  reviews: {
    spec: { attempts: number; scores: number[]; lastFeedback: string };
    plan: { attempts: number; scores: number[]; lastFeedback: string };
    code: Record<string, { attempts: number; scores: number[]; lastFeedback: string }>;
  };
  
  tasks: { id: string; title: string; status: string; reviewScore?: number }[];
  currentTaskIndex: number;
  
  events: { timestamp: string; type: string; data?: unknown }[];
  
  createdAt: string;
  updatedAt: string;
}
```

---

## Task Breakdown (v1 Scope: ~50h)

### Phase A: Foundation (6h)
| ID | Task | Est. | Dependencies |
|----|------|------|--------------|
| T001 | Create RalphState TypeScript types | 1h | None |
| T002 | Implement WorkflowStateStore | 2h | T001 |
| T003 | Create RalphPhase enum & transition map | 1h | T001 |
| T004 | Implement base RalphOrchestrator class | 2h | T002, T003 |

### Phase B: Review Gates (8h)
| ID | Task | Est. | Dependencies |
|----|------|------|--------------|
| T005 | Implement ObjectiveGate interface | 1h | None |
| T006 | Implement PolicyGate interface | 1h | None |
| T007 | Implement ScoringGate with 0-100 output | 2h | None |
| T008 | Create combineGates utility | 30m | T005-T007 |
| T009 | Implement SpecReviewGate with scoring | 1h | T008 |
| T010 | Implement PlanReviewGate with scoring | 1h | T008 |
| T011 | Implement CodeReviewGate with scoring | 1.5h | T008 |

### Phase C: Step Executors (14.5h)
| ID | Task | Est. | Dependencies |
|----|------|------|--------------|
| T012 | Create StepExecutor interface | 30m | None |
| T013 | Implement SpecDraftingExecutor | 2h | T012 |
| T014 | Implement PlanDraftingExecutor | 2h | T012 |
| T015 | Implement TasksDraftingExecutor | 2h | T012 |
| T016 | Implement ImplementingExecutor | 3h | T012 |
| T017 | Implement TestingExecutor | 2h | T012 |
| T018 | Implement DocsGenerationExecutor | 1.5h | T012 |
| T019 | Implement PRCreationExecutor (with target branch) | 1.5h | T012 |

### Phase D: /idea Command (10.5h)
| ID | Task | Est. | Dependencies |
|----|------|------|--------------|
| T020 | Create IdeaState types | 30m | None |
| T021 | Implement IdeaInterviewer class | 3h | T020 |
| T022 | Implement discovery question generator | 2h | T021 |
| T023 | Implement multi-expert consultation | 2h | T021 |
| T024 | Implement spec synthesis from interview | 2h | T021, T023 |
| T025 | Create `/idea` command definition | 1h | T021-T024 |

### Phase E: Integration (7.5h)
| ID | Task | Est. | Dependencies |
|----|------|------|--------------|
| T026 | Wire step executors to orchestrator | 2h | T004, T012-T019 |
| T027 | Wire review gates with scoring to orchestrator | 1.5h | T004, T009-T011 |
| T028 | Implement score threshold enforcement | 1h | T026, T027 |
| T029 | Implement checkpoint/resume logic | 2h | T004, T002 |
| T030 | Implement PAUSED state handling | 1h | T028, T029 |

### Phase F: Commands (3.5h)
| ID | Task | Est. | Dependencies |
|----|------|------|--------------|
| T031 | Create `/ralph` command definition | 1.5h | T026-T030 |
| T032 | Create `/ralph-resume` command | 1h | T029, T031 |
| T033 | Create `/ralph-status` command | 1h | T002 |

### Phase G: Linear Integration (4h) - Simplified for v1
| ID | Task | Est. | Dependencies |
|----|------|------|--------------|
| T034 | Wire Linear status updates to orchestrator | 1h | T004 |
| T035 | Add pr_target_branch to project-context schema | 1h | None |
| T036 | Implement PR creation with target branch config | 2h | T019, T035 |

---

## Configuration Schema Addition

```yaml
# project-context.yaml
integrations:
  linear:
    team: "LIF"
    # ... existing
  github:
    pr_target_branch: "DomGrieco/oh-my-opencode"  # NEW
    
# oh-my-opencode.json
{
  "ralph": {
    "enabled": true,
    "review": {
      "spec": { "passThreshold": 70, "maxIterations": 3 },
      "plan": { "passThreshold": 70, "maxIterations": 2 },
      "code": { "passThreshold": 80, "maxIterations": 3 }
    },
    "autoCreatePR": true
  }
}
```

---

## Backlog Items (Post-v1)

### LIF-XXX: Automatic DAG Traversal for Multi-Issue Scheduling
- Parse Linear issue dependencies
- Build dependency DAG
- Topological sort for execution order
- Handle blocked issues gracefully
- Parallel execution of independent issues

---

## Research Sources (Session 2026-01-08)

1. **Existing Commands**: `/specify`, `/plan`, `/tasks`, `/implement`, `/review`, `/test`, `/create-pr`
2. **Background Agent**: `src/features/background-agent/manager.ts` - 30min TTL, polling
3. **Orchestration Agents**: OmO/Sisyphus (team-lead), implementation-specialist (manager)
4. **Oracle Recommendations**: Event-sourced state, iteration budgets, multi-expert consultation
5. **Spec Workflow**: `.cursor/specs/{ISSUE-ID}/` with workflow-state.json

---

## Next Steps

1. Create Linear issue for Ralph Wiggum
2. Create Linear backlog issue for DAG traversal
3. Run `/specify` to create formal spec
4. Run `/plan` to create implementation plan
5. Run `/tasks` to create task breakdown
6. Begin implementation with Phase A
