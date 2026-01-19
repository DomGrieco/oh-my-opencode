# Unified Workflow System - Architecture Comparison

**Date**: 2025-12-30
**Author**: Strategic Planner (OmO)
**Context**: LIF-109 (Configurable Cursor Paths) - Extended Analysis

## Executive Summary

This document analyzes four architectural approaches for implementing a unified workflow system that coordinates multi-step operations (specify → plan → tasks → implement → review → test). After thorough analysis, **Option D: Hybrid Command-Agent** is recommended as it best fits the existing codebase patterns and provides optimal developer experience.

---

## Current State Analysis

### Existing Infrastructure

```
CURRENT ARCHITECTURE

Commands (.opencode/command/*.md)
  /specify  - Creates spec folder + spec.md
  /plan     - Creates plan.md from spec.md
  /tasks    - Creates tasks.md from plan.md
  /implement - Executes tasks.md
  /review   - Reviews implementation
  /test     - Writes/runs tests

Hooks (src/hooks/)
  workflow-state-enforcer - Detects commands, suggests agents
  governance-path-validator - Validates write paths
  governance-historian - Tracks changes
  governance-linear-injector - Injects Linear context

Tools (src/tools/)
  spec/ - create_spec_folder, update_workflow_state
  linear/ - linear_branch, linear_update_status, etc.
  call-omo-agent/ - Delegates to specialized agents

Shared (src/shared/)
  workflow-context.ts - State management (428 lines)
  command-preflight.ts - Preflight validation
  artifact-response.ts - Response formatting

Agents (src/agents/)
  OmO.ts - Team lead orchestrator
  implementation-specialist.ts - Manager-level coordinator
  [domain specialists] - Frontend, backend, etc.
```

### Key Observations

1. **Command-centric design**: Each workflow step is a markdown command
2. **State persistence**: `workflow-state.json` in spec folders
3. **Hook-driven validation**: Preflight checks via hooks
4. **Agent hierarchy**: OmO → Specialists → Domain experts
5. **Manual coordination**: User must invoke each command

---

## Option A: Single Command with Internal Orchestration

### Architecture Diagram

```
+------------------------------------------------------------------+
|                    /workflow (Mega-Command)                       |
+------------------------------------------------------------------+
|                                                                   |
|  +------------+    +------------+    +------------+               |
|  |   SPECIFY  |--->|    PLAN    |--->|   TASKS    |               |
|  |   Phase    |    |   Phase    |    |   Phase    |               |
|  +------------+    +------------+    +------------+               |
|        |                 |                 |                      |
|        v                 v                 v                      |
|  +------------+    +------------+    +------------+               |
|  | CHECKPOINT |    | CHECKPOINT |    | CHECKPOINT |               |
|  | (Human OK) |    | (Human OK) |    | (Human OK) |               |
|  +------------+    +------------+    +------------+               |
|                                                                   |
|                    INTERNAL STATE MACHINE                         |
|  +---------------------------------------------------------------+|
|  | { phase: "specify", paused: false, artifacts: {...} }         ||
|  +---------------------------------------------------------------+|
|                                                                   |
+------------------------------------------------------------------+
                           |
                           v
                  +------------------+
                  |  Calls agents    |
                  |  per phase       |
                  +------------------+
```

### Implementation Sketch

```typescript
// .opencode/command/workflow.md (pseudo-code)
---
description: "Complete workflow from spec to test"
---

## Workflow Controller

1. Parse current phase from workflow-state.json
2. For each phase in [specify, plan, tasks, implement, review, test]:
   a. Check if phase already complete -> skip
   b. Execute phase logic (inline or delegate)
   c. Present checkpoint to user
   d. Wait for approval -> proceed or pause
   e. Update workflow-state.json
3. Mark workflow complete
```

### Pros

| Advantage | Impact |
|-----------|--------|
| Single entry point | Simpler user mental model |
| Built-in pause/resume | Session continuity |
| Centralized state | Easy to debug |
| Linear flow | Predictable execution |

### Cons

| Disadvantage | Impact |
|--------------|--------|
| Monolithic command | Hard to maintain (~2000+ lines) |
| Context window bloat | All phases in one prompt |
| No parallel execution | Sequential only |
| Testing complexity | Can't test phases independently |
| Markdown limitations | Complex flow control in MD |

### Implementation Complexity

**Effort**: High (40+ hours)
- Requires building pause/resume logic in markdown
- Need custom checkpoint UI pattern
- Complex state transitions within single command
- Heavy on context window

### Fit with Existing Codebase

**Score**: 3/10

The existing codebase uses individual commands per step. A mega-command would:
- Contradict current architecture
- Require rewriting all 6 workflow commands
- Not leverage existing hook infrastructure
- Break the modular command pattern

---

## Option B: Workflow Agent (Orchestrator-as-Agent)

### Architecture Diagram

```
+------------------------------------------------------------------+
|                   workflow-orchestrator Agent                     |
|                   (Primary Agent - Claude Opus)                   |
+------------------------------------------------------------------+
|                                                                   |
|  System Prompt:                                                   |
|  "You are a workflow coordinator. Given a feature request,        |
|   execute the full workflow: specify -> plan -> tasks -> ..."     |
|                                                                   |
|  Tools:                                                           |
|  - create_spec_folder                                             |
|  - update_workflow_state                                          |
|  - call_omo_agent (for specialists)                               |
|  - linear_* tools                                                 |
|                                                                   |
|  Behavior:                                                        |
|  1. Creates spec folder                                           |
|  2. Writes spec.md                                                |
|  3. Calls product-strategist for plan.md                          |
|  4. Calls linear-coordinator for tasks.md                         |
|  5. Calls implementation-specialist for code                      |
|  6. Calls code-reviewer for review                                |
|  7. Calls test-specialist for tests                               |
|                                                                   |
+------------------------------------------------------------------+
                           |
                           v
              +------------+------------+
              |                         |
   +----------v----------+  +-----------v---------+
   | product-strategist  |  |implementation-spec. |
   |     (spec.md)       |  |     (code)          |
   +---------------------+  +---------------------+
```

### Implementation Sketch

```typescript
// src/agents/workflow-orchestrator.ts
export const workflowOrchestratorAgent: AgentConfig = {
  description: "Executes complete feature workflows from spec to test",
  mode: "primary",
  model: "anthropic/claude-opus-4-5",
  thinking: { type: "enabled", budgetTokens: 32000 },
  prompt: WORKFLOW_ORCHESTRATOR_PROMPT,
  tools: {
    // Only workflow-related tools
    create_spec_folder: true,
    update_workflow_state: true,
    call_omo_agent: true,
    linear_update_status: true,
    // Read/write for artifacts
    read: true,
    write: true,
    edit: true,
  },
}

const WORKFLOW_ORCHESTRATOR_PROMPT = `
You are the Workflow Orchestrator - responsible for coordinating complete
feature development from specification to testing.

## Workflow Steps

1. SPECIFY: Create spec folder, write spec.md with requirements
2. PLAN: Delegate to product-strategist for architecture
3. TASKS: Delegate to linear-coordinator for breakdown
4. IMPLEMENT: Delegate to implementation-specialist
5. REVIEW: Delegate to code-reviewer
6. TEST: Delegate to test-specialist

## Execution Rules

- Execute steps in order
- Wait for each delegation to complete
- Update workflow-state.json after each step
- Report progress to user between steps
- Handle errors gracefully (retry or escalate)

## Human Checkpoints

After each major phase (plan, implement, test), pause and ask:
"[OK] {Phase} complete. Proceed to {NextPhase}? (y/n)"
`
```

### Pros

| Advantage | Impact |
|-----------|--------|
| Agent flexibility | Can reason about workflow |
| Error handling | Agent can adapt to failures |
| Human checkpoints | Natural conversation flow |
| Specialized delegates | Best agent per step |

### Cons

| Disadvantage | Impact |
|--------------|--------|
| Token intensive | Full workflow context per session |
| Unpredictable | Agent might deviate from flow |
| Complex debugging | Multi-agent coordination issues |
| State management | Agent must track progress |
| Duplicate logic | Workflow logic in agent AND commands |

### Implementation Complexity

**Effort**: Medium-High (30+ hours)
- Create new workflow-orchestrator agent
- Define coordination protocol
- Build reliable delegation patterns
- Test multi-agent flows

### Fit with Existing Codebase

**Score**: 5/10

Partially fits:
- Leverages existing agent infrastructure
- Can use existing tools
- BUT: Duplicates command logic in agent prompt
- Conflicts with OmO's role as team lead

---

## Option C: State Machine Approach

### Architecture Diagram

```
+------------------------------------------------------------------+
|                    WorkflowStateMachine                           |
|                    (src/features/workflow-fsm/)                   |
+------------------------------------------------------------------+
|                                                                   |
|  States:                                                          |
|  +--------------------------------------------------------------+ |
|  | INIT -> SPECIFYING -> PLANNING -> TASKING ->                 | |
|  |         IMPLEMENTING -> REVIEWING -> TESTING -> COMPLETE     | |
|  +--------------------------------------------------------------+ |
|                                                                   |
|  Transitions (triggered by hooks):                                |
|  +------------------+    +------------------+                     |
|  | on_file_write    |--->| check_artifacts  |                     |
|  | (spec.md)        |    | -> transition()  |                     |
|  +------------------+    +------------------+                     |
|                                                                   |
|  Events:                                                          |
|  - ARTIFACT_CREATED(spec.md) -> SPECIFYING -> PLANNING            |
|  - ARTIFACT_CREATED(plan.md) -> PLANNING -> TASKING               |
|  - TASK_COMPLETED -> increment counter                            |
|  - ALL_TASKS_DONE -> IMPLEMENTING -> REVIEWING                    |
|                                                                   |
|  Persistence:                                                     |
|  - workflow-state.json (same location as today)                   |
|  - Enriched with FSM state                                        |
|                                                                   |
+------------------------------------------------------------------+
                           |
         Hook fires on file write
                           |
                           v
              +------------------------+
              |  governance-workflow   |
              |  (new hook)            |
              +------------------------+
```

### Implementation Sketch

```typescript
// src/features/workflow-fsm/machine.ts
import { createMachine, interpret } from 'xstate'

export const workflowMachine = createMachine({
  id: 'workflow',
  initial: 'init',
  context: {
    specPath: null,
    linearIssueId: null,
    completedArtifacts: [],
  },
  states: {
    init: {
      on: {
        START: 'specifying',
      }
    },
    specifying: {
      on: {
        SPEC_CREATED: 'planning',
      }
    },
    planning: {
      on: {
        PLAN_CREATED: 'tasking',
      }
    },
    tasking: {
      on: {
        TASKS_CREATED: 'implementing',
      }
    },
    implementing: {
      on: {
        IMPLEMENTATION_DONE: 'reviewing',
      }
    },
    reviewing: {
      on: {
        REVIEW_PASSED: 'testing',
        REVIEW_FAILED: 'implementing',
      }
    },
    testing: {
      on: {
        TESTS_PASSED: 'complete',
        TESTS_FAILED: 'implementing',
      }
    },
    complete: {
      type: 'final',
    }
  }
})

// Hook that monitors state machine
export function createWorkflowFSMHook(ctx: PluginInput) {
  const service = interpret(workflowMachine)
  
  return {
    "tool.run.result": async (input, output) => {
      if (output.name === "write") {
        const filePath = output.args.filePath
        if (filePath.endsWith("spec.md")) {
          service.send({ type: "SPEC_CREATED" })
        }
        // ... other transitions
      }
    }
  }
}
```

### Pros

| Advantage | Impact |
|-----------|--------|
| Formal model | Clear state transitions |
| Debuggable | Can visualize state machine |
| Event-driven | Reactive to file changes |
| Testable | Unit test each transition |
| Decoupled | Commands don't know about FSM |

### Cons

| Disadvantage | Impact |
|--------------|--------|
| New dependency | xstate or similar library |
| Complexity | FSM concepts for simple flow |
| Hook overhead | Every write triggers FSM check |
| Rigid | Hard to handle edge cases |
| Discovery | Users don't see the FSM |

### Implementation Complexity

**Effort**: Medium (25-30 hours)
- Add xstate dependency
- Implement state machine
- Create FSM monitoring hook
- Integrate with existing tools
- Test transition logic

### Fit with Existing Codebase

**Score**: 6/10

Good conceptual fit:
- Formalizes existing implicit state machine
- Works with hook infrastructure
- Doesn't change user-facing commands
- BUT: Adds complexity for simple linear flow
- Overkill for current use case

---

## Option D: Hybrid Command-Agent (Recommended)

### Architecture Diagram

```
+------------------------------------------------------------------+
|                    HUMAN-FACING LAYER                             |
|                    (Commands - User Invokes)                      |
+------------------------------------------------------------------+
|                                                                   |
|  +--------+  +--------+  +--------+  +----------+  +--------+     |
|  |/specify|  | /plan  |  | /tasks |  |/implement|  | /test  |     |
|  +---+----+  +---+----+  +---+----+  +----+-----+  +---+----+     |
|      |           |           |            |            |          |
|      v           v           v            v            v          |
|  +---------------------------------------------------------------+|
|  |              SHARED PREFLIGHT LAYER                           ||
|  |  - Validate prerequisites                                     ||
|  |  - Detect spec folder                                         ||
|  |  - Load workflow state                                        ||
|  |  - Inject context (Linear, artifacts)                         ||
|  +---------------------------------------------------------------+|
|                                                                   |
+------------------------------------------------------------------+
                           |
                           | Delegates via call_omo_agent
                           |
                           v
+------------------------------------------------------------------+
|                    AGENT EXECUTION LAYER                          |
|                    (Automated Sub-Steps)                          |
+------------------------------------------------------------------+
|                                                                   |
|  +------------------+  +-------------------------------------+    |
|  | product-         |  | implementation-specialist           |    |
|  | strategist       |  | +-- backend-typescript              |    |
|  | (spec, plan)     |  | +-- frontend-react                  |    |
|  +------------------+  | +-- test-specialist                  |    |
|                        +-------------------------------------+    |
|  +------------------+                                             |
|  | linear-          |  +-------------------+                      |
|  | coordinator      |  | code-reviewer     |                      |
|  | (tasks)          |  +-------------------+                      |
|  +------------------+                                             |
|                                                                   |
+------------------------------------------------------------------+
                           |
                           | Reads/Writes
                           |
                           v
+------------------------------------------------------------------+
|                    PERSISTENCE LAYER                              |
|                    (Spec Folder)                                  |
+------------------------------------------------------------------+
|                                                                   |
|  .cursor/specs/{ISSUE-ID}-{type}-{name}/                          |
|  +-- spec.md                                                      |
|  +-- plan.md                                                      |
|  +-- tasks.md                                                     |
|  +-- status.md                                                    |
|  +-- workflow-state.json  <-- State persisted here                |
|  +-- reviews/                                                     |
|                                                                   |
+------------------------------------------------------------------+
```

### Key Insight: The Current System IS Already Option D

Looking at the codebase, we already have:
- Commands for human-facing steps (/specify, /plan, etc.)
- Agents for automated sub-steps (implementation-specialist, etc.)
- Coordination via spec folder state (workflow-state.json)

**What's missing is proper coordination between them.**

### Enhanced Hybrid Design

```
ENHANCEMENT: Workflow Coordinator Enhancement

1. Unified Preflight (src/shared/command-preflight.ts)
   - Consolidate all validation logic
   - Inject workflow state into commands
   - Provide consistent UX across commands

2. Auto-Progression Hook (src/hooks/workflow-auto-progression/)
   - Detects workflow step completion
   - Suggests next command
   - Optionally auto-invokes next step

3. Workflow Resume Tool (src/tools/workflow/)
   - resume_workflow() - Pick up where left off
   - workflow_status() - Show current state
   - workflow_skip() - Skip to specific step (with force flag)

4. Enhanced workflow-state.json
   - Add checkpoint metadata
   - Track human approvals
   - Store execution history
```

### Implementation Sketch

```typescript
// src/hooks/workflow-auto-progression/index.ts
export function createWorkflowAutoProgressionHook(ctx: PluginInput) {
  return {
    "tool.run.result": async (input, output) => {
      // Detect update_workflow_state calls
      if (output.name === "update_workflow_state") {
        const result = JSON.parse(output.result)
        if (!result.success) return
        
        const nextStep = getNextWorkflowStep(result.step)
        if (nextStep) {
          const message = `[OK] ${result.step} complete.

Next step: /${nextStep}

Would you like to proceed? Run \`/${nextStep}\` or say "proceed" to continue.`
          
          injectHookMessage(input.sessionID, message, { agent: input.agent })
        }
      }
    }
  }
}

// src/tools/workflow/tools.ts
export function createWorkflowResumeTool(ctx: PluginInput) {
  return tool({
    description: "Resume the current workflow from the last checkpoint",
    args: {
      specPath: tool.schema.string().optional(),
      skipTo: tool.schema.enum(["specify", "plan", "tasks", "implement", "review", "test"]).optional(),
    },
    async execute(args) {
      // Find spec folder (from branch, args, or glob)
      const specPath = args.specPath || await detectSpecFolder(ctx)
      if (!specPath) {
        return "No active workflow found. Use /specify to start a new one."
      }
      
      const state = readWorkflowState(specPath)
      if (!state) {
        return `No workflow state in ${specPath}. Run /specify to initialize.`
      }
      
      const nextStep = args.skipTo || getNextWorkflowStep(state.currentStep)
      
      return `
## Workflow Status

Spec: ${specPath}
Current Step: ${state.currentStep}
Completed: ${state.completedSteps.join(" -> ")}
Next: /${nextStep}

To continue, run: \`/${nextStep}\`
Or to skip ahead (not recommended): \`resume_workflow(skipTo="${nextStep}")\`
`
    }
  })
}
```

### Pros

| Advantage | Impact |
|-----------|--------|
| Minimal changes | Enhances existing system |
| Familiar UX | Same commands users know |
| Modular | Each command is independent |
| Testable | Commands can be tested alone |
| Flexible | Skip steps when needed |
| Human-in-loop | User controls progression |
| Best of both | Commands + Agent power |

### Cons

| Disadvantage | Impact |
|--------------|--------|
| Coordination complexity | Need hook + tool combo |
| Multiple files | State split across artifacts |
| Learning curve | Users must understand flow |

### Implementation Complexity

**Effort**: Low-Medium (15-20 hours)
- Create auto-progression hook
- Add resume/status tools
- Enhance preflight validation
- Test end-to-end flow

### Fit with Existing Codebase

**Score**: 9/10

Excellent fit:
- Builds on existing command system
- Uses existing agent hierarchy
- Leverages existing hooks infrastructure
- Uses existing workflow-state.json
- Matches constitution principles (Dogfooding, Hook-Driven)

---

## Comparison Matrix

| Criterion | Option A | Option B | Option C | Option D |
|-----------|----------|----------|----------|----------|
| **Implementation Effort** | High (40h) | Med-High (30h) | Medium (25h) | Low (15h) |
| **Codebase Fit** | 3/10 | 5/10 | 6/10 | 9/10 |
| **Maintainability** | Poor | Medium | Good | Excellent |
| **User Experience** | Good | Good | Hidden | Excellent |
| **Token Efficiency** | Poor | Medium | Good | Excellent |
| **Testability** | Poor | Medium | Excellent | Good |
| **Flexibility** | Low | High | Low | High |
| **Error Recovery** | Hard | Medium | Easy | Easy |
| **Parallel Potential** | None | Low | Medium | High |

---

## Recommendation: Option D (Hybrid Command-Agent)

### Rationale

1. **Path of Least Resistance**: Builds on existing infrastructure
2. **Constitution Alignment**: 
   - Principle V (Hook-Driven Enhancement)
   - Principle VI (Dogfooding)
3. **User Experience**: Familiar command UX with enhanced coordination
4. **Implementation Risk**: Lowest risk, incremental changes
5. **Future-Proof**: Can evolve to full state machine later if needed

### Implementation Phases

```
Phase 1: Foundation (4h)
+-- Create workflow-auto-progression hook
+-- Add resume_workflow tool

Phase 2: Coordination (6h)
+-- Enhance command-preflight.ts
+-- Add workflow_status tool
+-- Integrate with existing commands

Phase 3: Polish (5h)
+-- Add progress visualization
+-- Handle edge cases
+-- Documentation

Total: ~15 hours
```

### Next Steps

1. Create detailed implementation plan with this approach
2. Run `/tasks` to break down into implementable units
3. Implement Phase 1 foundation
4. Test with real workflow scenarios
5. Iterate based on feedback

---

## Appendix: Alternative Consideration

If more autonomous behavior is desired in the future, consider:

**Option E: Supervisor Pattern**

A lightweight supervisor hook that monitors workflow commands and can:
- Auto-invoke next step after confirmation
- Retry failed steps with escalation
- Batch multiple steps for "fast mode"

This would be an extension of Option D, not a replacement.
