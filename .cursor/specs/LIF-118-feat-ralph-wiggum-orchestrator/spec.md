# Ralph Wiggum: Fully Automated Spec-Driven Development Orchestrator

**Linear Issue**: [LIF-118](https://linear.app/lifelogger/issue/LIF-118/ralph-wiggum-fully-automated-spec-driven-development-orchestrator)
**Created**: 2026-01-09
**Status**: Ready for Planning

## Overview

Ralph Wiggum is a fully automated spec-driven development orchestration system that transforms fuzzy ideas into merged pull requests with minimal human intervention. Named after the Simpsons character who says things that seem nonsensical but occasionally contain profound insights, this system takes ambiguous feature ideas and systematically transforms them into working, reviewed, tested, and documented code.

The system chains the entire development workflow: `/idea` (conversational spec discovery) -> spec.md -> plan.md -> tasks.md -> implementation -> testing -> code review -> documentation -> PR creation.

## Problem Statement

### Current State

Today, the spec-driven development workflow in oh-my-opencode requires:
1. Manual execution of each workflow phase (`/specify`, `/plan`, `/tasks`, `/implement`, `/review`, `/test`)
2. Human judgment to determine when output quality is sufficient to proceed
3. Manual coordination between phases with no automated quality gates
4. No standardized way to measure specification or implementation quality
5. Manual PR creation after implementation is complete
6. No automated resume capability when sessions are interrupted

### Issues

1. **Manual Phase Transitions**: Developers must manually invoke each workflow command, creating friction and cognitive overhead
2. **Subjective Quality Assessment**: No quantitative measure of specification or code quality; quality is determined by human gut feeling
3. **Iteration Fatigue**: Without clear "done" criteria, developers either over-iterate or ship prematurely
4. **Session Fragility**: Long workflows are interrupted by context limits, session timeouts, or external factors with no automatic recovery
5. **Inconsistent Review Depth**: Code review quality varies depending on time pressure and reviewer attention
6. **Delayed Feedback Loops**: Quality issues discovered late in the workflow require costly rework

## User Stories

### US-1: As a developer, I want to describe a fuzzy idea conversationally

I want to articulate a fuzzy feature idea in natural language through a guided interview  
So that I receive a well-structured specification without needing to know the exact format upfront

**Acceptance Criteria:**
- [ ] System conducts a 3-round progressive disclosure interview (Framing -> Discovery -> Shaping)
- [ ] Each round asks focused questions that build on previous answers
- [ ] Multi-expert consultation occurs at 2 checkpoint moments for diverse perspectives
- [ ] Interview transcript is preserved for traceability
- [ ] Final output is a complete spec.md following the project's specification template
- [ ] User can provide additional context or corrections at any point

### US-2: As a developer, I want autonomous workflow execution with quality gates

I want to initiate the full workflow from spec to PR with a single command  
So that I can focus on other work while the system handles implementation details

**Acceptance Criteria:**
- [ ] Single command (`/ralph`) executes the full workflow from existing spec.md to PR
- [ ] Each phase produces artifacts that meet quality thresholds before proceeding
- [ ] Workflow automatically iterates on failed quality gates up to configurable limits
- [ ] Progress is visible through status updates and event logging
- [ ] Workflow can be paused and resumed at any phase boundary
- [ ] Final output is a pull request ready for human review

### US-3: As a developer, I want quantitative quality scoring for reviews

I want review feedback to include a 0-100 quality score with clear rubric  
So that I can track quality improvement across iterations and set objective pass criteria

**Acceptance Criteria:**
- [ ] All review agents output structured JSON with `score: number` (0-100)
- [ ] Scores are accompanied by specific feedback explaining deductions
- [ ] Configurable `passThreshold` per review type (spec, plan, code)
- [ ] Score history is tracked in event log for each artifact
- [ ] Dashboard/status command shows score progression across iterations
- [ ] Scores are based on clear rubrics (completeness, clarity, testability, etc.)

### US-4: As a developer, I want checkpoint-based resume capability

I want to resume interrupted workflows from the last successful checkpoint  
So that long-running workflows survive session timeouts, context limits, and external interruptions

**Acceptance Criteria:**
- [ ] Workflow state is persisted to disk after each phase completion
- [ ] Resume command (`/ralph-resume`) reads state and continues from last checkpoint
- [ ] Partial work within a phase is discarded on resume (phase atomicity)
- [ ] Event log provides full audit trail for debugging
- [ ] Resume detects and warns about spec/plan changes since last checkpoint
- [ ] Background task TTL (30 minutes) is respected with periodic checkpointing

### US-5: As a developer, I want auto-created PRs to the configured target branch

I want the system to automatically create a pull request when the workflow completes  
So that I don't need to manually create PRs and can immediately request human review

**Acceptance Criteria:**
- [ ] PR is created using `gh` CLI upon successful workflow completion
- [ ] Target branch is read from `project-context.yaml` field `pr_target_branch`
- [ ] PR description includes summary from spec, implementation notes, and test results
- [ ] PR references the Linear issue for traceability
- [ ] PR body is formatted with clear sections (Summary, Changes, Testing)
- [ ] Workflow transitions to MERGED state only after PR is merged (not auto-merge)

### US-6: As a developer, I want to see current workflow status

I want a command to display the current state of an in-progress or completed workflow  
So that I can understand where the workflow is and what has been accomplished

**Acceptance Criteria:**
- [ ] `/ralph-status` shows current phase, progress, and any blockers
- [ ] Displays review scores for completed phases with iteration counts
- [ ] Shows task completion status for implementation phase
- [ ] Indicates time elapsed and estimated time remaining
- [ ] Links to relevant artifacts (spec.md, plan.md, PR URL)
- [ ] Works for both active and historical workflows

## Requirements

### Functional Requirements

#### FR-1: `/idea` Command - Conversational Spec Discovery

A new slash command that conducts a structured interview to transform fuzzy ideas into specifications.

**States**: INTAKE -> FRAMING -> DISCOVERY -> SHAPING -> DRAFT

**Behavior**:
- **INTAKE**: User provides initial idea description; system acknowledges and prepares interview
- **FRAMING**: Round 1 - High-level scoping questions (problem, users, constraints)
- **DISCOVERY**: Round 2 - Deep-dive into requirements (features, edge cases, dependencies)
- **SHAPING**: Round 3 - Refinement and prioritization (MVP scope, success criteria)
- **DRAFT**: System generates spec.md from interview transcript

**Multi-Expert Consultation**:
- At 2 checkpoints (end of FRAMING, end of DISCOVERY), system consults multiple agents in parallel
- Agents bring different perspectives (technical, UX, security, performance)
- Consultation results are synthesized into follow-up questions or refinements

#### FR-2: `/ralph` Command - Workflow Orchestration

A slash command that orchestrates the full spec-driven development workflow.

**States** (13 phases):
```
IDLE -> IDEA_INTAKE -> SPEC_DRAFTING -> SPEC_REVIEW -> PLAN_DRAFTING -> 
PLAN_REVIEW -> TASKS_DRAFTING -> IMPLEMENTING -> TESTING -> CODE_REVIEW -> 
DOCS_GENERATION -> PR_OPEN -> MERGED
```

**Transitions**:
- Each state transition is gated by quality checks
- Review states loop back to drafting states if score < threshold
- Maximum iterations prevent infinite loops
- Manual intervention required if max iterations reached without passing

**Artifact Generation**:
- SPEC_DRAFTING: Generates/updates spec.md
- PLAN_DRAFTING: Generates/updates plan.md
- TASKS_DRAFTING: Generates/updates tasks.md
- IMPLEMENTING: Generates source code per task breakdown
- TESTING: Generates and runs tests
- DOCS_GENERATION: Updates documentation (README, API docs)
- PR_OPEN: Creates GitHub pull request

#### FR-3: Review Gate System

Composable quality gates combining objective and subjective measures.

**Gate Types**:
1. **Objective Gates**: Automated checks that must pass
   - Lint: No lint errors in generated code
   - Typecheck: TypeScript compilation succeeds
   - Tests: All tests pass
   - Coverage: Meets minimum coverage threshold (if configured)

2. **Policy Gates**: Structural requirements
   - Required sections present in spec/plan
   - Task breakdown meets minimum granularity
   - All acceptance criteria are testable

3. **LLM Scoring Gate**: AI-assessed quality (0-100)
   - Based on clear rubric per artifact type
   - Considers completeness, clarity, consistency, testability
   - Returns structured feedback with specific improvement suggestions

**Combined Result**:
```typescript
interface GateResult {
  pass: boolean;           // All gates passed
  score: number;           // 0-100 composite score
  feedback: string;        // Human-readable summary
  details: {
    objective: ObjectiveResult[];
    policy: PolicyResult[];
    llm: LLMResult;
  };
}
```

#### FR-4: State Persistence and Resume

Event-sourced append-only log enabling perfect resume and debugging.

**State File**: `ralph-state.json` in spec folder

**Structure**:
```typescript
interface RalphState {
  id: string;                    // Workflow instance ID
  specPath: string;              // Path to spec folder
  linearIssue: string | null;    // Associated Linear issue
  currentState: RalphPhase;      // Current workflow phase
  reviews: {
    [artifact: string]: {
      attempts: number;
      scores: number[];
      lastFeedback: string;
    };
  };
  tasks: {
    total: number;
    completed: number;
    current: string | null;
  };
  events: RalphEvent[];          // Append-only event log
  createdAt: string;
  updatedAt: string;
}

interface RalphEvent {
  timestamp: string;
  type: string;
  phase: RalphPhase;
  data: Record<string, unknown>;
}
```

**Checkpoint Behavior**:
- State is written after each phase completion
- State is written before starting long-running operations
- Resume reads state and continues from `currentState`

#### FR-5: `/ralph-resume` Command

Resume an interrupted workflow from the last checkpoint.

**Behavior**:
- Reads `ralph-state.json` from spec folder
- Validates that spec.md and plan.md haven't changed (hash comparison)
- If changed, warns user and offers to restart from changed artifact
- Continues workflow from `currentState`
- Updates Linear issue status if applicable

#### FR-6: `/ralph-status` Command

Display comprehensive workflow status.

**Output Includes**:
- Current phase and time in phase
- Review scores per artifact with iteration counts
- Task progress (X of Y completed)
- Estimated time remaining
- Links to artifacts and PR (if created)
- Any blockers or warnings

#### FR-7: Linear Integration

Automatic Linear issue status updates throughout workflow.

**Status Transitions**:
- IDLE -> SPEC_DRAFTING: Set to "In Progress"
- PR_OPEN: Set to "In Review"
- MERGED: Set to "Done"
- Failed/Blocked: Add comment with details

**Branch Naming**:
- Use branch name from Linear issue (`linear_branch` tool)
- Fall back to conventional naming if no Linear issue

#### FR-8: Configuration

All thresholds and limits configurable via `oh-my-opencode.json`.

```typescript
interface RalphConfig {
  enabled: boolean;
  review: {
    spec: { passThreshold: number; maxIterations: number };
    plan: { passThreshold: number; maxIterations: number };
    code: { passThreshold: number; maxIterations: number };
  };
  stateDir?: string;  // Override state file location
  autoPR: boolean;    // Enable auto PR creation
  prTargetBranch?: string;  // Override target branch
}
```

**Defaults**:
- spec.passThreshold: 70
- spec.maxIterations: 3
- plan.passThreshold: 70
- plan.maxIterations: 2
- code.passThreshold: 80
- code.maxIterations: 3
- autoPR: true

### Non-Functional Requirements

#### NFR-1: Background Task Constraints

- Background task TTL is 30 minutes (OpenCode constraint)
- Workflows must checkpoint between major operations
- Long phases (IMPLEMENTING) must checkpoint after each task

#### NFR-2: Delegation Depth Limit

- OpenCode limits agent delegation to 2 levels
- Ralph orchestrator is level 1
- Specialist agents (product-strategist, strategic-planner, etc.) are level 2
- No further delegation allowed

#### NFR-3: Structured Output

- Review agents must return structured JSON with Zod-validated schema
- Schema includes: score, feedback, details, suggestions
- Invalid output is treated as failed review with score 0

#### NFR-4: Observability

- All state transitions logged with timestamps
- Event log enables full workflow replay
- Errors include context for debugging

#### NFR-5: Idempotency

- Resume from same checkpoint produces same results
- Re-running a phase with unchanged inputs produces unchanged outputs
- State mutations are atomic (no partial writes)

## Scope

### In Scope

- `/idea` command for conversational spec discovery
- `/ralph` command for full workflow orchestration
- `/ralph-resume` command for checkpoint-based resume
- `/ralph-status` command for status display
- Review gate system with 0-100 scoring
- Event-sourced state persistence
- Linear integration for status updates
- GitHub PR auto-creation
- Configuration via `oh-my-opencode.json`
- Addition of `pr_target_branch` field to `project-context.yaml` schema

### Out of Scope

- Multi-issue scheduling with DAG traversal (tracked in LIF-119)
- Automatic PR merge (only creation, not merge)
- Integration with CI/CD pipelines for deployment
- Custom review rubrics per project
- Parallel task execution within IMPLEMENTING phase
- Web UI for workflow visualization
- Integration with non-Linear issue trackers
- Custom objective gate definitions

## Assumptions

1. **Existing Workflow Commands Work**: `/specify`, `/plan`, `/tasks`, `/implement`, `/review`, `/test` are functional and can be invoked programmatically
2. **Agent Availability**: Specialist agents (product-strategist, strategic-planner, etc.) are available and configured
3. **Linear Integration**: Linear API key is configured and Linear tools are functional
4. **GitHub CLI**: `gh` CLI is installed and authenticated for PR creation
5. **Spec Folder Structure**: Standard spec folder structure exists (spec.md, plan.md, tasks.md, status.md)
6. **Single Active Workflow**: Only one Ralph workflow is active per spec folder at a time

## Dependencies

### Internal Dependencies
- Existing workflow commands (`/specify`, `/plan`, `/tasks`, `/implement`, `/review`, `/test`)
- Specialist agents (product-strategist, strategic-planner, task-planner, implementation-specialist)
- Linear tools (`linear_branch`, `linear_update_status`, `linear_add_comment`)
- Spec folder tools (`create_spec_folder`, `update_workflow_state`)
- Background task system (`background_task`)

### External Dependencies
- GitHub CLI (`gh`) for PR creation
- Linear API for issue management
- Git for version control operations

### Configuration Dependencies
- `project-context.yaml` for `pr_target_branch` configuration
- `oh-my-opencode.json` for Ralph configuration

## Success Criteria

1. **Minimal Manual Interventions**: Developer can go from idea to merged PR with fewer than 5 manual interventions (not counting the initial `/idea` or `/ralph` invocation)

2. **Measurable Quality**: Review quality scores average 75+ on passing iterations, demonstrating consistent quality improvement

3. **Perfect Resume**: Workflow resumes correctly after interruption 100% of the time when state file is intact

4. **Workflow Velocity**: Total workflow time is comparable to manual execution (within 1.5x of skilled developer time)

5. **Adoption**: 3+ features successfully shipped through Ralph workflow within first month of deployment

## Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| LLM scoring inconsistency | Medium | Medium | Use clear rubrics, average multiple evaluations, log scores for calibration |
| Context window exhaustion during long implementations | High | High | Checkpoint frequently, use aggressive compaction, limit task scope |
| Infinite review loops | Low | High | Hard cap on max iterations, escalate to human after limit |
| State file corruption | Low | High | Validate state on read, maintain backup checkpoints |
| PR creation failures | Low | Medium | Retry with backoff, fallback to manual with instructions |
| Agent delegation limit reached | Medium | Medium | Design workflow to stay within 2-level limit, combine operations where possible |
| Interview abandonment | Medium | Low | Save partial state, allow resume from any interview round |

## Design Decisions

### DD-1: Event-Sourced State Over Mutable State

**Decision**: Use append-only event log instead of mutable state object

**Context**: Need to support resume, debugging, and audit trails

**Options Considered**:
1. Mutable state file overwritten on each change
2. Event-sourced append-only log with derived current state
3. Database-backed state management

**Rationale**: Event sourcing provides perfect auditability, enables time-travel debugging, and naturally supports resume. The overhead of replaying events is negligible for workflow-scale operations. Database is overkill for single-workflow state.

### DD-2: Scoring-Based Quality Gates Over Binary Pass/Fail

**Decision**: Use 0-100 scoring with configurable thresholds instead of binary pass/fail

**Context**: Need objective quality measurement that allows tuning per project

**Options Considered**:
1. Binary pass/fail with subjective criteria
2. Weighted checklist scoring
3. Continuous 0-100 scoring with threshold

**Rationale**: Continuous scoring enables tracking improvement over iterations, allows projects to calibrate thresholds to their quality bar, and provides more actionable feedback than binary outcomes.

### DD-3: Phase Atomicity Over Partial Progress

**Decision**: Treat each phase as atomic; discard partial work on failure/resume

**Context**: Need clean resume semantics without complex partial-state handling

**Options Considered**:
1. Fine-grained progress tracking within phases
2. Phase-level atomicity with full re-execution on resume
3. Task-level checkpointing within IMPLEMENTING phase

**Rationale**: Phase atomicity simplifies resume logic significantly. Most phases complete quickly. IMPLEMENTING is the exception and uses task-level progress tracking internally while maintaining phase-level state for other phases.

### DD-4: PR Creation Not Auto-Merge

**Decision**: Automatically create PR but do not auto-merge

**Context**: Balance automation with human oversight

**Options Considered**:
1. Full automation including merge
2. Create PR only, human merges
3. Create PR with auto-merge after CI passes

**Rationale**: PR creation removes friction while preserving human review as the final quality gate. Auto-merge is dangerous for fully AI-generated code. Human merge decision provides accountability and final sanity check.

## Open Questions

1. **Rubric Customization**: Should projects be able to define custom scoring rubrics, or are sensible defaults sufficient for v1?
   - *Assumption for v1*: Use sensible defaults; custom rubrics are out of scope

2. **Parallel Implementation**: Should tasks within IMPLEMENTING phase execute in parallel using background agents?
   - *Assumption for v1*: Sequential execution; parallel execution is a future optimization

3. **Interview Persistence**: If `/idea` interview is interrupted, should it resume or restart?
   - *Assumption for v1*: Resume from last completed round if state exists
