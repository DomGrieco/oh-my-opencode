# OpenCode-first harness (web UI + layered memory + Linear integration)

**Linear Issue**: [LIF-132](https://linear.app/lifelogger/issue/LIF-132/spec-opencode-first-harness-web-ui-layered-memory-linear-integration)
**Created**: 2026-01-18
**Status**: Draft

## Overview

Build an OpenCode-first harness that makes it easy to spin up and manage reproducible coding/agent sessions across many repos and projects.

This harness provides:
- A repeatable, fast setup process (aiming toward a one-step install/onboarding).
- A reproducible runtime environment per project/session (initially envisioned as a minimal Linux environment provisioned in containers).
- A web-based control plane for visibility and direct interaction with OpenCode sessions.
- A layered memory model aligned to organizational scope (workspace -> team -> project -> session) with automated review/promotion.
- Tight integration with Linear as the managerial/organizational source of truth (issues, projects, ownership), while OpenCode sessions remain separate runtime entities.

The long-term direction is "OpenCode-first" but designed so additional CLI-based developer agents/tools could be added later.

## Problem / Motivation

Today, using OpenCode + oh-my-opencode across many projects is powerful but inconsistent and hard to scale:
- Setup is not yet a truly repeatable, low-friction workflow across arbitrary repos.
- Running work across multiple projects/sessions lacks a unified control plane for visibility and orchestration.
- Knowledge gained during sessions is valuable but can be lost to compaction or remain siloed, making it hard to build durable organizational memory.

This harness is intended to turn ad-hoc "spin up a session and hope the context sticks" into a reliable, scalable workflow that can be repeated daily.

## Goals

### MVP Goals

1. Repeatable setup
- A documented, repeatable process to use oh-my-opencode across any repo/project with minimal manual steps.

2. Reproducible runtime per session
- A session runs in an isolated, reproducible environment (envisioned as containerized) with the target repo checked out on a default branch unless a specific branch is requested.
- Local-first but remote-capable: sessions can run on remote execution nodes (e.g., a home server on the same network) while remaining controllable from the harness UI.

3. Web control plane for sessions
- A web app provides a consistent navigation model: `workspace -> team -> project -> sessions`.
- Users can connect to and interact with live OpenCode sessions from the web app.

4. Layered memory aligned to organizational scope
- Memory exists at workspace, team, project, and session scopes.
- Sessions can read higher-level memory when needed to make better decisions.
- Automated jobs promote useful learnings upward when sessions complete.

5. Linear as managerial backbone
- Linear provides the organizational + planning layer (workspaces/teams/projects/issues).
- OpenCode sessions are not stored as issues, but issues can be linked/assigned to sessions.

### Long-term Goals

- Trigger-driven orchestration (agents/workflows can start sessions, route work, and produce outcomes without a human driving each step).
- A "dogfooding" capture workflow (e.g., keybind-driven screenshot/log capture) that can create a new work item/spec and drive self-improvement with safety rails.
- Expand beyond OpenCode to support additional CLIs as pluggable runtimes.
- Clarification-seeking workflow: when agents need human direction, they can send questions to a centralized inbox and pause until a human reply is received.

## Non-goals

- Choosing the final implementation stack (backend language, DB choice, hosting model) in this document.
- A fully multi-tenant SaaS-grade product in the first iteration.
- Storing complete OpenCode session transcripts inside Linear.
- Unrestricted cross-session memory access by default (this is explicitly discouraged).

## Target Users / Personas

- Primary: A power user (you) running many OpenCode sessions across many repos, wanting strong repeatability and long-term memory.
- Secondary: A small team adopting a shared harness and shared governance for agentic workflows across multiple projects.

## Key Concepts

### Workspace
Top-level organizational boundary. Holds the highest-level memory and global governance.

### Team
Groups projects and sessions/workers. Defines default configuration: agents, tools, workflows, hooks, and contextual policies.

### Project
A repo (or logical product). Inherits team defaults but may diverge (especially for permissions/restrictions).

### Session / Worker
A running OpenCode instance. Sessions always belong to a team and may be associated with a project. Sessions can be human-driven or trigger-driven.

### Layered Memory
Memory exists at multiple scopes:
- Workspace memory (most stable, updated least frequently)
- Team memory
- Project memory
- Session memory (most active, updated most frequently)

## Core Experience (User Journeys)

### 1) Start a session for a project
- User selects a workspace, team, and project.
- User starts a new session/worker.
- The system provisions an isolated environment with the repo checked out (default branch or requested branch).
- The web UI can connect to the OpenCode session.

### 2) Work inside a session via the web UI
- User prompts the session from the web UI.
- The session can reference project/team/workspace memory as needed.
- The session produces outputs (responses, artifacts, changes) and writes session memory.

### 3) Close a session and promote learnings
- User (or automation) marks the session complete.
- A promotion job reviews session memory and updates project memory with durable learnings.
- Similar promotion can (less frequently) update team memory, and least frequently workspace memory.

### 4) Ask a cross-project question from a higher scope
- User asks a question at workspace or team scope (not inside a single session).
- The system routes the request: it can query across projects, create sessions if needed, and return results.
- Example query: "What PRs are opened and assigned to me in project ABC?" (output includes hyperlinks).

### 5) Ask for clarification and resume work
- A session determines it cannot proceed safely without human direction (e.g., ambiguous requirements, multiple valid interpretations with materially different scope).
- The session submits a clarification request to the centralized inbox, including concise context and suggested options.
- The harness marks the session as blocked and stops progress until a response is received.
- When a human replies, the response is delivered back to the waiting session and work resumes from the waiting point (even if the underlying worker needed to be resumed).

## Requirements

### Functional Requirements

#### Provisioning and environments
1. The system provisions an isolated, reproducible environment for a given repo.
2. The system checks out the repo at the default branch unless a branch is specified.
3. If a branch name is specified and does not exist, the system can create it from the default branch.
4. The environment includes OpenCode and the oh-my-opencode plugin configured and ready.

#### Session lifecycle and connectivity
1. Users can create, connect to, and end sessions.
2. The web UI shows session state and allows interaction with a live session.
3. Sessions are organized and discoverable under `workspace -> team -> project`.
4. A session always belongs to a team; association to a project is optional.

#### Workspace/team/project structure
1. Workspaces contain teams.
2. Teams contain projects and sessions.
3. Projects inherit team defaults (agents/tools/workflows/hooks) but can override/restrict.
4. The system supports project-specific restrictions (e.g., a research project with reduced permissions).

#### Request routing (orchestration)
1. The system accepts requests from different scopes (workspace/team/project/session).
2. The system determines which scope(s) to search and whether new sessions are required.
3. The system can create new sessions/workers as part of fulfilling a request.

#### Clarification inbox (human-in-the-loop)
1. A session can create a clarification request when it requires human direction to proceed safely (or to avoid a high-risk assumption).
2. Each clarification request includes:
   - The question
   - Minimal necessary context (what was attempted, what is blocked)
   - 2-3 suggested options (when applicable) with a recommended default
   - The scope it affects (workspace/team/project/session) and any linked issue
3. Clarification requests land in a centralized inbox that a human can monitor in one place (single "place to answer questions").
4. When a clarification request is submitted, the harness transitions the requesting session to a visible "blocked" state and prevents further progress until the question is resolved.
5. Waiting is passive: the harness must not require the session to repeatedly poll, re-prompt, or spend tokens while waiting for a response.
6. When the human responds in the inbox, the response is routed back to the correct waiting session and logged as part of the session record.
7. Resume-on-reply is supported: if the underlying worker cannot remain alive (e.g., timeouts/disconnects), the harness can resume work by continuing in an appropriate session context while preserving continuity from the user’s perspective.
8. Policy: time-bounded worker tasks do not block indefinitely; they return control to an orchestrator/manager context with a structured clarification request, and the orchestrator owns the wait/resume lifecycle.

#### Layered memory
1. Memory exists at workspace, team, project, and session scopes.
2. Session memory supports both short-term notes and durable memory designed to survive compaction.
3. Sessions can read project/team/workspace memory when appropriate.
4. The system supports automated memory review/promotion:
   - Project memory is updated when sessions complete.
   - Team memory updates less frequently than project memory.
   - Workspace memory updates least frequently.
5. Cross-session memory access is possible but off-by-default:
   - Requires an explicit flag or deliberate action.
   - Intended to be rare and governed.

#### Linear integration
1. Linear is used for organizational/project/issue management.
2. Linear issues can be linked/assigned to sessions.
3. Memory artifacts can be linked to Linear entities (workspace/team/project/issue) to create traceability.

#### Future: dogfooding capture workflow (not MVP)
1. User can trigger a capture action (e.g., screenshot/log selection) to file a request.
2. The system can create a new spec/issue and run a spec-driven workflow to improve itself.
3. Safety mechanisms exist for rollback/restart if failures or regressions are detected.

### Non-functional Requirements

1. Repeatability
- A user can provision and connect to a new session for a repo with minimal manual steps.

2. Reliability
- Sessions can reconnect after transient interruptions without losing critical state.

3. Governance and permissions
- Team/project configuration can restrict access to agents/tools/workflows.
- Sensitive capabilities are gated and auditable.

4. Auditability
- Memory promotion is reviewable and traceable to source sessions.
- The system preserves the raw idea text and important artifacts for future reference.

5. Extensibility
- New workflows, triggers, and additional runtimes/CLIs can be added without re-architecting the core hierarchy.

## User Stories

1. As a user, I want a repeatable setup process so that I can use OpenCode + the plugin across any repo without reinventing configuration each time.
- Acceptance Criteria:
  - Given any supported repo, I can start a ready-to-use session via a documented process.

2. As a user, I want to start a new session for a specific repo and branch so that I can work in an isolated environment for a feature/issue.
- Acceptance Criteria:
  - I can request default branch or a specific branch.
  - If the branch does not exist, the system can create it from default.

3. As a user, I want to see all sessions across my workspace/team/projects so that I can manage parallel work.
- Acceptance Criteria:
  - The web UI lists sessions and their associations (team/project/linked issue).

4. As a user, I want to interact with a live OpenCode session from the web UI so that I can prompt it without attaching a local terminal.
- Acceptance Criteria:
  - I can connect/disconnect to a session and submit prompts.

5. As a user, I want session memory to survive compactions so that I do not lose key decisions and learnings.
- Acceptance Criteria:
  - A session can write durable memory intended to persist beyond compaction.

6. As a user, I want project/team/workspace memory layers so that sessions can make better decisions using context beyond the current task.
- Acceptance Criteria:
  - A session can read project memory.
  - A session can read team/workspace memory when explicitly needed.

7. As a user, I want learnings from sessions to be promoted automatically so that project memory improves over time without manual curation.
- Acceptance Criteria:
  - When a session is marked complete, a promotion process updates project memory.

8. As a user, I want Linear issues to be linkable to sessions so that managerial tracking lives in Linear while runtime sessions remain outside Linear.
- Acceptance Criteria:
  - A session can be associated with a Linear issue.
  - The system can answer higher-scope questions using Linear context (e.g., PRs assigned to me for a project).

9. As a user, I want a single inbox for agent clarification questions so that I can unblock sessions quickly without hunting through many transcripts.
- Acceptance Criteria:
  - A session can submit a clarification question to a centralized inbox with enough context to answer quickly.
  - The session visibly pauses while waiting ("blocked" state).
  - While blocked, the system remains idle (no repeated polling or re-prompting).
  - When I reply in the inbox, the reply is delivered back to the correct waiting session.
  - The session resumes from the waiting point (even if it required a resume-on-reply continuation under the hood).

## Acceptance Criteria (MVP)

- [ ] A user can start a new session for a chosen project and connect to it via the web UI.
- [ ] Sessions are organized and navigable via `workspace -> team -> project -> sessions`.
- [ ] Team configuration exists and projects can apply additional restrictions.
- [ ] Session memory supports at least two modes: short-term notes and durable memory.
- [ ] A session can read project memory; reading higher-scope memory is possible and governed.
- [ ] When a session completes, project memory promotion runs and produces a reviewable update.
- [ ] A Linear issue can be linked to a session.
- [ ] A session can submit a clarification question to a centralized inbox and enter a visible blocked state.
- [ ] A human reply in the inbox is routed back to the correct waiting session and work resumes from the waiting point.
- [ ] The raw idea text is preserved as an artifact in the spec folder.

## Success Metrics (Measurable, technology-agnostic)

- Setup friction: A new repo can be onboarded into the harness workflow in <= 10 minutes by a single user following documentation.
- Time-to-first-session: A user can start and connect to a ready-to-use session for a repo in <= 3 minutes under normal conditions (excluding unusually large dependency downloads).
- Reliability: >= 95% of session connect attempts succeed without manual recovery steps.
- Knowledge retention: For sessions marked complete, >= 80% result in at least one promoted learning captured at the project level.
- Governance adoption: At least 2 distinct projects successfully use project-specific restrictions (reduced permissions) without breaking usability.
- Clarification throughput: >= 80% of clarification requests receive a human response within 30 minutes during active work hours.

## Assumptions

- Early versions optimize for a single user or small team rather than large-scale multi-tenant usage.
- Isolated environments are the primary mechanism to ensure repeatability (initially envisioned as container-based).
- Linear remains the preferred system of record for managerial work tracking.
- Users accept that cross-session memory access is intentionally difficult and opt-in.

## Risks / Constraints

- Complexity risk: layering sessions + web UI + memory + Linear integration can balloon scope.
- Security risk: remote session control and tool access require strict permissions and auditability.
- Memory quality risk: automated promotion may introduce noisy or incorrect long-term memory if not governed.
- Coupling risk: relying too heavily on Linear could constrain workflows if mappings are imperfect.
- Operational risk: running many concurrent sessions may introduce resource management challenges.

## Open Questions

1. Scope boundary
- What is the initial definition of a "workspace" in this harness: always 1:1 with a Linear workspace, or can it aggregate multiple?

2. Hosting model
- Is the initial deployment local-only (single machine) or remote-capable from day one?

3. Memory storage approach
- Should memory be file-based (e.g., markdown artifacts), database-backed, vector-search-backed, or a hybrid?
- If hybrid: should the canonical memory be markdown with YAML frontmatter plus a local index (e.g., SQLite) to support search/filtering?
- How will humans review and edit promoted memory?

4. Session identity and lifecycle
- What does "session complete" mean operationally (manual flag, inactivity, explicit command, or workflow completion)?

5. Governance model
- What is the minimum permission model required for MVP (team defaults + project overrides), and how will it be audited?

6. Linear mapping details
- Which Linear concepts map cleanly to workspace/team/project in the harness, and where do we need custom conventions?

7. Dogfooding safety
- What rollback/restart safeguards are required before enabling self-modifying workflows?

8. Clarification inbox semantics
- When should a session be required to ask (vs allowed to assume)?
- What are the inbox behaviors: timeouts, escalation, reassignment, and audit/history?
- Where does the question live for tracking: Linear comment, harness DB, or both?

## Artifacts

- `original-idea-text.md` (raw, preserved input text; treated as immutable reference)
