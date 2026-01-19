# Workflow Documentation Automation

**Linear Issue**: [LIF-112](https://linear.app/lifelogger/issue/LIF-112/workflow-documentation-automation-assess-in-review-execute)
**Created**: 2026-01-03
**Status**: Ready for Planning

## Overview

Integrate documentation automation into the spec-driven workflow by assessing documentation needs during the `/review` command and executing documentation generation after the `/test` command completes successfully. This ensures user-facing changes are properly documented before features are marked complete, while maintaining developer velocity through non-blocking gates and explicit override mechanisms.

## Problem Statement

### Current State

The spec-driven workflow (`/specify` → `/plan` → `/tasks` → `/implement` → `/review` → `/test`) has no documentation integration:

1. The `/add-documentation` command exists (33 lines) but is **never automatically triggered**
2. The `governance-docs-delegation` hook blocks unauthorized doc edits but doesn't assess what needs updating
3. The `/create-pr` command has a "Documentation updated" checklist item but no enforcement
4. Developers must manually remember to run `/add-documentation` after completing features
5. No mechanism exists to determine whether documentation is actually required for a change

### Issues

1. **Documentation is forgotten** - Features ship without updated docs because there's no reminder or gate
2. **No assessment of needs** - No tool determines which docs need updating based on change type
3. **Manual workflow gap** - The otherwise-automated workflow requires manual documentation intervention
4. **Wasted effort** - Developers sometimes update docs for internal changes that don't need it
5. **Quality inconsistency** - Some PRs have complete docs, others have none
6. **No audit trail** - When docs are skipped, there's no record of why

## User Stories

### US-1: As a developer completing a feature

I want the system to automatically assess whether my changes require documentation updates
So that I don't have to manually determine what docs need updating

**Acceptance Criteria:**
- [ ] During `/review`, the system analyzes changed files and detects documentation requirements
- [ ] Assessment identifies specific documentation targets (e.g., `docs/reference/commands.md`)
- [ ] Assessment includes reasoning for why docs are/aren't needed
- [ ] Assessment is persisted for later execution

### US-2: As a developer whose tests have passed

I want documentation to be automatically generated when required
So that I don't have to manually run `/add-documentation` after every feature

**Acceptance Criteria:**
- [ ] After `/test` passes and docs are required, documentation generation is triggered
- [ ] Documentation generation uses the existing `document-writer` agent
- [ ] Generation targets the specific docs identified during assessment
- [ ] Developer is notified when documentation generation completes

### US-3: As a developer with internal-only changes

I want the system to recognize when documentation is not needed
So that I'm not blocked by unnecessary documentation requirements

**Acceptance Criteria:**
- [ ] Pure refactoring changes are recognized as not needing docs
- [ ] Test-only changes are recognized as not needing docs
- [ ] CI/CD changes are recognized as not needing docs
- [ ] Internal utility changes without exported API changes are recognized as not needing docs

### US-4: As a developer who needs to skip documentation

I want an explicit way to skip documentation with a reason
So that I can proceed when documentation is genuinely not needed despite the assessment

**Acceptance Criteria:**
- [ ] Skip mechanism available (flag, annotation, or command option)
- [ ] Skip requires a reason to be provided
- [ ] Skip is recorded in workflow state for audit trail
- [ ] Skipped docs don't block workflow completion

### US-5: As a team lead reviewing PRs

I want visibility into documentation status before merge
So that I can ensure proper documentation accompanies user-facing changes

**Acceptance Criteria:**
- [ ] PR creation shows documentation status (completed, pending, skipped with reason)
- [ ] Documentation status is visible in PR body or labels
- [ ] Status persists across sessions for multi-session workflows

### US-6: As a developer resuming work across sessions

I want documentation assessment to persist between sessions
So that I don't lose progress when continuing work the next day

**Acceptance Criteria:**
- [ ] Assessment persists in workflow state file
- [ ] Resuming session shows documentation status summary
- [ ] System detects if assessment is stale due to code changes
- [ ] Stale assessments can be refreshed without restarting workflow

## Requirements

### Functional Requirements

#### FR-1: Documentation Needs Assessment
The system must analyze code changes during `/review` and determine documentation requirements based on:
- Changed file paths (commands, tools, hooks, agents, config schema)
- Change types (new files, modified exports, breaking changes)
- Conventional commit semantics when available

#### FR-2: Assessment Persistence
Documentation assessment must be stored in the workflow state with:
- Required/optional/not-needed status
- Identified documentation targets (file paths or sections)
- Reasoning for the determination
- Confidence level (high, medium, low)
- Timestamp and artifact hash for staleness detection

#### FR-3: Post-Test Documentation Execution
When tests pass successfully and documentation is required:
- System must trigger documentation generation
- Generation must use the `document-writer` agent
- Generation must respect `governance-docs-delegation` policies
- Completion must update workflow state

#### FR-4: Documentation Workflow Step
A "docs" step must be added to the workflow between "test" and "complete":
- Step is entered when docs are required and tests pass
- Step is skipped when docs are not required
- Step can be explicitly skipped with reason
- Completion of step (or skip) is required before "complete"

#### FR-5: Override Mechanism
Users must be able to override documentation requirements:
- Mark assessment as incorrect (false positive/negative)
- Skip documentation with mandatory reason
- Override persists in workflow state with audit trail

#### FR-6: Staleness Detection
System must detect when assessment becomes stale:
- Track artifact hashes at assessment time
- Compare against current state before execution
- Warn when significant code changes occurred after assessment
- Provide mechanism to refresh assessment

### Non-Functional Requirements

#### NFR-1: Non-Blocking Workflow
Documentation requirements must not hard-block development velocity:
- PR creation proceeds with documentation warnings, not blocks
- Workflow completion is the only hard gate (with skip option)
- No build failures for missing documentation

#### NFR-2: Audit Trail
All documentation decisions must be auditable:
- Assessment results recorded
- Skip reasons recorded with timestamp
- Override decisions recorded
- Data persists in workflow state file

#### NFR-3: Session Persistence
Documentation state must survive across multiple sessions:
- Multi-day workflows maintain documentation status
- State stored in workflow-state.json
- Compact status summary on session resume

#### NFR-4: Backward Compatibility
Existing workflows without documentation automation must continue working:
- Older spec folders without new fields treated as "docs not required"
- No breaking changes to workflow state schema
- Graceful degradation when assessment unavailable

## Scope

### In Scope

- Documentation needs assessment during `/review` command
- Documentation execution trigger after `/test` command
- New "docs" workflow step between test and complete
- Workflow state schema extensions for documentation tracking
- Skip/override mechanisms with audit trail
- Staleness detection for multi-session workflows
- Integration with existing `document-writer` agent
- Status visibility in PR creation flow

### Out of Scope

- Changes to the `document-writer` agent itself
- Changes to `governance-docs-delegation` hook behavior
- Automatic PR blocking based on documentation status
- Per-task documentation tracking within a feature
- ML-based assessment improvement (future enhancement)
- Integration with external documentation platforms (Mintlify, etc.)
- Changes to `/update-context` command for memory files

## Assumptions

1. The `/review` command will be implemented/updated to include assessment logic (currently command file may be missing)
2. The existing `document-writer` agent is capable of generating appropriate documentation when given targets
3. Workflow state files (workflow-state.json) can be extended with new fields without breaking existing functionality
4. The `update_workflow_state` tool will be updated to accept the new "docs" step
5. Developers will provide honest skip reasons rather than gaming the system
6. File path patterns are sufficient for most documentation requirement detection

## Dependencies

- **Existing Components:**
  - `/review` command and workflow infrastructure
  - `/test` command and test-specialist agent
  - `/add-documentation` command and document-writer agent
  - `governance-docs-delegation` hook
  - `update_workflow_state` tool
  - `workflow-state.json` persistence

- **External Dependencies:**
  - Linear API for issue status updates (if enabled)

## Success Criteria

1. **SC-1: Assessment Accuracy** - 80%+ of documentation assessments correctly identify when docs are needed (validated through 30-day observation of assessment vs. actual need)

2. **SC-2: Developer Adoption** - After rollout, 90%+ of features going through `/review` have documentation assessment completed

3. **SC-3: Documentation Coverage** - User-facing features have documentation created before PR merge (measured as reduction in "needs documentation" PR comments)

4. **SC-4: Workflow Velocity** - No measurable increase in time-to-merge for features (documentation happens in parallel or quickly)

5. **SC-5: Skip Audit Trail** - 100% of skipped documentation decisions have recorded reasons

6. **SC-6: Session Persistence** - Documentation state correctly persists and resumes across sessions without data loss

## Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Assessment false positives annoy developers | Medium | Medium | Make overrides easy and one-click; tune detection rules based on feedback |
| Assessment false negatives miss needed docs | Medium | High | Start with conservative detection (err toward required); track misses for tuning |
| Documentation generation quality varies | Low | Medium | Document-writer agent already validated; provide clear targets and context |
| Multi-session state corruption | Low | High | Use atomic writes; validate state on load; provide recovery mechanism |
| Governance hook conflicts | Low | Medium | Ensure /docs command uses sanctioned delegation path |

## Design Decisions

### DD-1: Separate "docs" Workflow Step

**Decision**: Add "docs" as a distinct workflow step rather than metadata on "complete"

**Context**: The feature requires gating workflow completion when docs are required

**Options Considered**:
1. Metadata-only on "complete" step
2. Auto-triggered side effect after test
3. Explicit "docs" step in workflow

**Rationale**: An explicit step provides clear visibility, easier gating logic, and better aligns with the existing step-based workflow model. Metadata-only approaches tend to become brittle and harder to visualize.

### DD-2: Assessment in /review, Execution after /test

**Decision**: Split assessment and execution across two commands

**Context**: Documentation should only be generated for verified (tested) implementations

**Options Considered**:
1. Assessment and execution both in /review
2. Assessment and execution both after /test
3. Assessment in /review, execution after /test (chosen)

**Rationale**: Early assessment provides planning value and catches issues before testing. Post-test execution ensures docs reflect verified behavior. This "assess now, execute later" pattern is well-established in workflow systems.

### DD-3: Non-Blocking PR Creation

**Decision**: Documentation status warns but doesn't block PR creation

**Context**: Need to balance documentation quality with developer velocity

**Options Considered**:
1. Hard block PR creation if docs pending
2. Soft warning with status annotation (chosen)
3. No integration with PR creation

**Rationale**: Hard blocking frustrates developers and causes workarounds. Soft warnings with visibility (labels, PR body annotations) enable informed decisions while maintaining velocity.

## Open Questions

1. **Detection Rule Tuning** - What is the right initial set of file patterns to detect documentation requirements? [NEEDS CLARIFICATION from team: Should we start conservative (more false positives) or permissive (more false negatives)?]

2. **Skip Reason Validation** - Should skip reasons be free-text or selected from a predefined list? Free-text is more flexible; predefined enables better analytics.

3. **Auto-trigger vs Manual** - After tests pass with docs required, should documentation generation auto-start or require explicit `/docs` command? [Recommendation: Auto-start with notification, but allow configuration for manual-only mode]
