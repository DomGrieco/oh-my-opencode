# Rule Keeper Agent

**Linear Issue**: [LIF-110](https://linear.app/lifelogger/issue/LIF-110/rule-keeper-agent-automated-project-rule-maintenance-in-spec)
**Created**: 2025-12-30
**Updated**: 2026-01-03
**Status**: Ready for Planning

## Overview

The Rule Keeper system is a **two-agent architecture** for maintaining project knowledge files (`AGENTS.md`, and in Phase 2, `.cursor/rules/*.mdc`) across any codebase.

### Dual-Agent Architecture

| Agent | Role | Responsibility |
|-------|------|----------------|
| **Rule Keeper** | Monitor/Orchestrator | Discovers project structure, detects when rules need updating, audits for staleness, delegates to Rule Engineer |
| **Rule Engineer** | Writer/Expert | Contains all prompt engineering knowledge, writes and updates rule files, enforces templates and quality standards |

**Design Philosophy**: Like OmO orchestrates specialized agents, Rule Keeper orchestrates project knowledge maintenance by delegating to the Rule Engineer specialist. This separation ensures:
- **Rule Keeper** focuses on WHEN and WHERE rules are needed
- **Rule Engineer** focuses on HOW to write excellent, high-quality rules

**Key Insight**: Upstream oh-my-opencode uses **8 AGENTS.md files** in a hierarchical structure (root + 7 subdirectories). This pattern enables directory-specific context that scales with codebase complexity.

### Why Two Agents?

1. **Separation of Concerns**: Monitoring/detection logic is distinct from writing/template expertise
2. **Reusability**: Rule Engineer can be invoked directly for rule writing tasks
3. **Quality Control**: Rule Keeper validates Rule Engineer's output before proposing to user
4. **Knowledge Encapsulation**: All prompt engineering lessons learned live in Rule Engineer's prompt
5. **Mirrors OmO Pattern**: Orchestrator → Specialist delegation pattern proven effective

## Problem Statement

### Current State

Project knowledge files (`AGENTS.md`) provide critical context to AI agents during development. Currently:

1. **Manual maintenance** - Developers must remember to update rules after implementing new patterns
2. **Single-file approach** - Most projects have only a root `AGENTS.md`, missing directory-specific context
3. **No discovery** - Agents don't know what context exists where in unfamiliar codebases
4. **Staleness** - Rules drift from actual implementation as codebases evolve
5. **Inconsistent depth** - No guidance on what level of detail each directory needs

### Issues

1. **Knowledge Drift**: Rules reference outdated patterns, file structures, or conventions that no longer exist
2. **Missing Patterns**: Newly established coding patterns aren't captured in rules, causing agents to miss important context
3. **Workflow Gap**: The spec-driven workflow (`/specify` → `/plan` → `/tasks` → `/implement` → `/review` → `/test`) has no rule maintenance step
4. **Manual Overhead**: Developers must context-switch to update documentation after implementation
5. **Flat Structure**: Single root AGENTS.md doesn't scale for complex projects with distinct modules
6. **No Navigation**: Agents exploring unfamiliar codebases lack directory-level guidance

### Vision

A rule-keeper that works like a knowledgeable team member who:
- Explores any new codebase and creates appropriate AGENTS.md hierarchy
- Detects when code changes introduce patterns worth documenting
- Maintains context at the right level of detail for each directory
- Learns from existing project conventions, not imposing its own

## User Stories

### US-1: As a Developer on Any Project

I want the rule-keeper to analyze my project structure and create appropriate AGENTS.md files
So that AI agents have proper context regardless of my project's language or structure

**Acceptance Criteria:**
- [ ] Works with any language (TypeScript, Python, Rust, Go, etc.)
- [ ] Detects project structure from root (no hardcoded paths)
- [ ] Creates AGENTS.md at appropriate directory levels
- [ ] Adapts content depth based on directory complexity
- [ ] Learns from existing AGENTS.md patterns in the project

### US-2: As a Developer Implementing Features

I want rule updates proposed after I implement new patterns
So that future agents understand the patterns I've established

**Acceptance Criteria:**
- [ ] Detects new patterns from code changes
- [ ] Routes proposals to the correct directory's AGENTS.md
- [ ] Proposes incremental updates (not full regeneration)
- [ ] Requires confirmation before applying changes

### US-3: As a Project Maintainer

I want to configure rule-keeper behavior for my project
So that it respects our conventions and enforces our standards

**Acceptance Criteria:**
- [ ] Configuration via `.opencode/rule-keeper.yaml` or `oh-my-opencode.json`
- [ ] Can specify protected/enforced sections (e.g., TDD requirements)
- [ ] Can customize templates for AGENTS.md sections
- [ ] Can set thresholds for tier selection

### US-4: As an AI Agent (OmO/Sisyphus)

I want to delegate rule maintenance to a specialized agent
So that project knowledge stays current without consuming my context

**Acceptance Criteria:**
- [ ] Invocable via `call_omo_agent` or `background_task`
- [ ] Returns structured proposals with file paths and rationale
- [ ] Uses same tool patterns as other OmO agents (read, grep, ast_grep, etc.)
- [ ] Respects anti-bloat limits

### US-5: As a New Team Member

I want AGENTS.md files that help me navigate an unfamiliar codebase
So that I (or AI agents) can quickly find where to make changes

**Acceptance Criteria:**
- [ ] Navigation-tier AGENTS.md for complex directories
- [ ] Clear STRUCTURE sections showing file purposes
- [ ] Links between parent and child AGENTS.md files
- [ ] Consistent formatting across all AGENTS.md files

### US-6: As a Developer in Code Review

I want rule updates to be proposed after the `/review` command
So that refined patterns from code review are captured in project rules

**Acceptance Criteria:**
- [ ] After `/review` command completion, rule keeper analyzes review outcomes
- [ ] Patterns that were corrected during review are prioritized for rule updates
- [ ] User can approve, modify, or skip proposed updates
- [ ] Updates are linked to the Linear issue being reviewed

## Requirements

### Functional Requirements

#### FR-1: Project Discovery & Analysis

The rule-keeper MUST dynamically analyze any project:

**Project Detection:**
- Detect project type from manifest files (package.json, Cargo.toml, pyproject.toml, go.mod, etc.)
- Identify primary languages from file extensions
- Detect framework patterns (React, FastAPI, Axum, etc.)
- Find existing AGENTS.md files and learn their patterns

**Directory Analysis:**
- Traverse from project root (respect .gitignore)
- Classify directories by purpose (implementation, config, tests, docs, etc.)
- Detect complexity metrics (file count, subdirectory count, code patterns)
- Identify which directories need AGENTS.md files

**Tool Usage:**
```
read_context      → Understand project configuration
glob              → Find existing AGENTS.md files
grep              → Search for patterns across codebase
ast_grep_search   → Detect code structure patterns
lsp_document_symbols → Understand module structure
```

#### FR-2: Tiered AGENTS.md System

Three content tiers based on directory purpose:

**Navigation Tier** (index directories):
- Trigger: Directory contains 3+ subdirectories with code
- Purpose: Help agents find the right subdirectory
- Sections: OVERVIEW, STRUCTURE (table with links to child AGENTS.md)
- Example: `src/` in a monorepo, `packages/` directory

**Standard Tier** (implementation modules):
- Trigger: Contains implementation files with documentable patterns
- Purpose: Full context for working in this module
- Sections: OVERVIEW, STRUCTURE, [DOMAIN TABLES], HOW TO ADD, ANTI-PATTERNS
- Example: `src/agents/`, `lib/auth/`, `pkg/handlers/`

**Minimal Tier** (simple utilities):
- Trigger: Few files, single purpose, no complex patterns
- Purpose: Basic orientation without overhead
- Sections: OVERVIEW, STRUCTURE (file descriptions only)
- Example: `utils/`, small helper directories

**Tier Detection Heuristics:**
1. Count subdirectories containing code files
2. Count implementation files vs config files
3. Analyze for repeated patterns worth documenting
4. Consider consistency with sibling AGENTS.md files
5. Respect explicit tier override in config

#### FR-3: Pattern Detection & Routing

Detect patterns from code and route to correct AGENTS.md:

**Pattern Sources:**
- New files added to a directory
- Repeated code structures (via ast_grep)
- Import patterns and dependencies
- Error handling approaches
- Naming conventions

**Routing Logic:**
1. Identify which directory the pattern belongs to
2. Find nearest AGENTS.md (or propose creating one)
3. Determine which section the pattern fits
4. Check for conflicts with existing content
5. Propose update to correct file

#### FR-4: Anti-Bloat Guardrails

Configurable limits to prevent rule file bloat:

| Metric | Default | Configurable |
|--------|---------|--------------|
| Root AGENTS.md max lines | 200 | Yes |
| Standard tier max lines | 100 | Yes |
| Minimal tier max lines | 40 | Yes |
| Pattern occurrence threshold | 3 | Yes |
| Similarity merge threshold | 80% | Yes |

**Guardrail Behaviors:**
- Warn when approaching 80% of limit
- Block proposals that would exceed limit
- Suggest splitting into subdirectory AGENTS.md when root is full
- Merge similar patterns automatically

#### FR-5: Configuration System

Project-specific customization via optional config file.

**Zero-Config Default Behavior:**
- Rule-keeper works out-of-the-box with sensible defaults
- No configuration file required
- Auto-detects project type, languages, and structure
- Uses built-in templates and thresholds

**First-Run Behavior:**

On first `/update-rules --discover`, rule-keeper:

1. Analyzes project structure (manifest files, file extensions, directories)
2. Detects appropriate settings (scan paths, languages, frameworks)
3. **Proposes** creating `rule-keeper.yaml` with detected configuration
4. User confirms before any config file is created
5. Proceeds with AGENTS.md proposals using detected/confirmed settings

**Example First-Run Flow:**
```
$ /update-rules --discover

Analyzing project structure...
- Detected: TypeScript project (package.json)
- Languages: .ts, .tsx
- Scan paths: src/, lib/
- Found 0 existing AGENTS.md files

Proposal 1 of 3: Create configuration file
+-------------------------------------------+
| .opencode/rule-keeper.yaml                |
+-------------------------------------------+
| rule_keeper:                              |
|   scan_paths: ["src", "lib"]              |
|   code_extensions: ["ts", "tsx"]          |
|   tiers:                                  |
|     navigation_min_subdirs: 3             |
+-------------------------------------------+
Rationale: Detected TypeScript project, configured defaults

Proposal 2 of 3: Create src/AGENTS.md (navigation tier)
...

Accept proposals? [a]ll / [1-2] individual / [s]kip / [e]dit
```

**Configuration File Schema:**

```yaml
# .opencode/rule-keeper.yaml (OPTIONAL - works without it)
rule_keeper:
  # Discovery settings (auto-detected if not specified)
  scan_paths: ["src", "lib", "packages"]  # or "auto"
  ignore_paths: ["node_modules", "dist", "vendor", ".git"]
  code_extensions: ["ts", "tsx", "py", "rs", "go"]  # or "auto"
  
  # Tier thresholds
  tiers:
    navigation_min_subdirs: 3
    minimal_max_files: 5
    standard_min_patterns: 2
  
  # Template customization
  templates:
    required_sections: ["OVERVIEW", "STRUCTURE"]
    optional_sections: ["HOW TO ADD", "ANTI-PATTERNS", "EXAMPLES"]
    custom_sections:
      - name: "TDD"
        in_files: ["AGENTS.md"]  # root only
        template: |
          ## TDD (Test-Driven Development)
          **MANDATORY for new features.** Follow RED-GREEN-REFACTOR.
  
  # Anti-bloat settings
  limits:
    root_max_lines: 200
    standard_max_lines: 100
    minimal_max_lines: 40
    pattern_threshold: 3
  
  # Protected content (won't be removed/modified)
  protected:
    - file: "AGENTS.md"
      sections: ["TDD", "DEPLOYMENT"]
```

**Config Precedence:**
1. Explicit `rule-keeper.yaml` values (highest priority)
2. Auto-detected project settings
3. Built-in defaults (lowest priority)

#### FR-6: Direct Apply with Summary Report

Changes are applied directly, with a summary report for transparency:

**Execution Flow:**
1. Rule Keeper delegates to Rule Engineer
2. Rule Engineer writes AGENTS.md files directly
3. Rule Keeper reports summary of changes
4. Human reviews at PR stage

**Summary Report Format:**
```json
{
  "changes": [
    {
      "file": "src/agents/AGENTS.md",
      "action": "created",
      "tier": "standard",
      "lines": 85,
      "patterns_documented": ["temperature 0.1", "tool restrictions", "mode classification"]
    }
  ],
  "summary": {
    "files_created": 2,
    "files_updated": 1,
    "total_lines_added": 185
  }
}
```

**Preview Option:**
Use `--dry-run` to preview changes without applying:
```bash
/update-rules --discover --dry-run
```
This shows what would be created/updated without writing files.

#### FR-7: /update-rules Command

Explicit slash command for on-demand maintenance:

```
/update-rules [options]

Options:
  --scope <path>     Target specific directory (default: project root)
  --discover         Create missing AGENTS.md files
  --audit            Check existing files for staleness
  --sync             Update root STRUCTURE links
  --dry-run          Show proposals without applying
```

**Command Workflow:**
1. Analyze specified scope
2. Detect missing AGENTS.md files (if --discover)
3. Detect pattern changes since last update
4. Generate proposals
5. Present for confirmation
6. Apply approved changes
7. Update workflow state

#### FR-8: Workflow Integration

Integration with existing spec-driven workflow commands as **explicit steps** (not automatic hooks):

- `/review` command (assess step): After assessment, optionally prompt for AGENTS.md updates based on patterns found
- `/test` command (docs step): After tests pass, optionally prompt to document final tested patterns
- `/update-rules` command: Explicit standalone invocation for on-demand analysis
- Configurable: Users can enable/disable prompts within workflow commands
- Non-blocking: Workflow continues if user skips rule updates

**Note**: Rule-keeper is NOT an automatic lifecycle hook. It only runs when:
1. User explicitly invokes `/update-rules`
2. User reaches the rule-update step within `/review` or `/test` commands

### Non-Functional Requirements

#### NFR-1: Performance

- Rule analysis should complete within 30 seconds for typical codebases
- Background task execution should not block main workflow
- Incremental analysis (only changed files) for large codebases

#### NFR-2: Accuracy

- Proposed patterns must be verifiable in the codebase
- No hallucinated patterns or file references
- Proposed updates must preserve existing rule structure

#### NFR-3: Usability

- Clear, actionable proposals with rationale
- Minimal user interaction for common cases
- Helpful error messages when limits are exceeded

#### NFR-4: Compatibility

- Must work with any project structure (not just oh-my-opencode)
- Must work with existing `AGENTS.md` format
- Must integrate with existing hook system and workflow commands

## Scope

### In Scope

**Core (Project-Agnostic):**
- Dynamic project discovery and analysis
- Hierarchical AGENTS.md creation and maintenance
- Tiered content depth (Navigation/Standard/Minimal)
- Pattern detection from code changes
- Anti-bloat guardrails with configurable limits
- `/update-rules` command
- Proposal confirmation flow
- Root-to-subdirectory link maintenance

**Configuration Layer:**
- Project-specific templates
- Protected/enforced sections
- Custom tier thresholds
- Scan path customization

**Integration:**
- Workflow command steps (optional prompts in /review and /test)
- Background task execution
- Linear issue linking

### Out of Scope (Phase 1)

**Deferred to Phase 2:**
- `.cursor/rules/*.mdc` file maintenance (see Phase 2 Preview below)
- Cross-directory rule inheritance detection
- Rule conflict resolution between parent/child AGENTS.md

**Not Planned:**
- Automatic updates without confirmation → Safety constraint (permanent)
- Cross-repository synchronization
- Rule effectiveness analytics
- Natural language rule search

### Phase 2 Preview: .cursor/rules/*.mdc Support

Phase 2 will extend Rule Engineer's knowledge to include:

| Feature | Description |
|---------|-------------|
| **MDC File Detection** | Discover existing `.cursor/rules/*.mdc` files |
| **Glob Pattern Rules** | Create rules that apply only to matching file patterns |
| **Always-Apply Rules** | Create `alwaysApply: true` rules for project-wide enforcement |
| **Rule Hierarchy** | Manage rules at project, directory, and user levels |
| **Template System** | MDC-specific templates for common rule types |

**MDC Rule Categories** (Phase 2):
```yaml
# Example .cursor/rules/typescript-agents.mdc
---
globs: ["src/agents/*.ts"]
description: "Agent development rules"
---
- Use temperature 0.1 for deterministic output
- Always specify tool restrictions
- Include mode: "subagent" or "primary"
- Document agent purpose in description field
```

Phase 2 implementation will reuse Rule Engineer's pattern detection and Rule Keeper's orchestration.

## Agent Design

### Dual-Agent Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Rule Keeper System                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                     Rule Keeper (Orchestrator)                      │ │
│  │  model: anthropic/claude-sonnet-4-5                                │ │
│  │  role: Monitor, detect, audit, delegate                            │ │
│  │                                                                     │ │
│  │  Responsibilities:                                                  │ │
│  │  • Discover project structure and existing rules                   │ │
│  │  • Detect directories needing AGENTS.md                            │ │
│  │  • Audit existing rules for staleness/drift                        │ │
│  │  • Classify directories into tiers                                 │ │
│  │  • Delegate writing tasks to Rule Engineer                         │ │
│  │  • Validate Rule Engineer output before user confirmation          │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    │ delegates                           │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                     Rule Engineer (Specialist)                      │ │
│  │  model: anthropic/claude-sonnet-4-5                                │ │
│  │  role: Write, update, enforce templates                            │ │
│  │                                                                     │ │
│  │  Responsibilities:                                                  │ │
│  │  • Write high-quality AGENTS.md content                            │ │
│  │  • Apply tier-specific templates (Navigation/Standard/Minimal)     │ │
│  │  • Encode prompt engineering best practices                        │ │
│  │  • Detect and document code patterns                               │ │
│  │  • Enforce anti-bloat guardrails                                   │ │
│  │  • Generate evidence-based proposals with rationale                │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Model & Configuration

```typescript
// src/agents/rule-keeper.ts

export const ruleKeeperAgent: AgentConfig = {
  model: "anthropic/claude-sonnet-4-5",
  temperature: 0.1,
  mode: "subagent",
  description: "Monitors project structure, detects rule maintenance needs, audits for staleness, and delegates to rule-engineer for writing",
  tools: {
    include: [
      // Discovery & Analysis
      "read", "glob", "grep", "ast_grep_search",
      "lsp_document_symbols", "lsp_workspace_symbols",
      // Context
      "read_context", "memory_read", "memory_list",
      // Delegation to rule-engineer (manager role can use call_omo_agent)
      "call_omo_agent",
      // Project understanding
      "serena_get_symbols_overview", "serena_find_symbol",
      // Linear integration
      "linear_branch", "linear_update_status",
    ]
  }
}

// src/agents/rule-engineer.ts

export const ruleEngineerAgent: AgentConfig = {
  model: "anthropic/claude-sonnet-4-5",
  temperature: 0.1,
  mode: "subagent",
  description: "Expert in writing high-quality AGENTS.md files using prompt engineering best practices, tier templates, and evidence-based patterns",
  tools: {
    include: [
      // Analysis (read-only for pattern detection)
      "read", "glob", "grep", "ast_grep_search",
      "lsp_document_symbols",
      // Context
      "read_context", "memory_read",
      // Writing
      "edit", "write",
      // Linear integration
      "linear_branch", "linear_update_status",
    ]
  }
}
```

### Prompt Engineering Principles (Rule Engineer Knowledge)

The Rule Engineer encodes all our lessons learned from OmO, Oracle, and workflow commands:

#### 1. Tool-First Approach (from OmO)
```
BEFORE proposing any AGENTS.md content:
1. glob("**/AGENTS.md") → Find existing patterns
2. read_context() → Understand project config
3. grep/ast_grep → Detect code patterns
4. THEN synthesize proposals
```

#### 2. Evidence-Based Proposals (from Oracle)
```
Pattern: "Use temperature 0.1 for code agents"
Evidence: Found in src/agents/oracle.ts:15, src/agents/explore.ts:22
Occurrences: 5 files
```

#### 3. Incremental Over Wholesale (from OmO playbooks)
```
WRONG: Regenerate entire AGENTS.md
RIGHT: Add new ANTI-PATTERN section with 2 items
```

#### 4. Learn From Project (adaptive)
```
IF existing AGENTS.md uses "## CONVENTIONS" header:
  USE "## CONVENTIONS" (not "## CODE STYLE")
```

### Encoded Lessons Learned (Rule Engineer Knowledge Base)

The Rule Engineer's prompt contains all prompt engineering patterns we've developed. These patterns are detected in code and enforced in AGENTS.md files.

#### Agent Patterns (from OmO, Oracle, Explore, etc.)

| Pattern | Detection | Documentation |
|---------|-----------|---------------|
| **Temperature 0.1** | `temperature: 0.1` in agent configs | "Use temperature 0.1 for deterministic code agents" |
| **Tool Restrictions** | `tools: { include: [...] }` or `tools: { exclude: [...] }` | Document which tools each agent type should use |
| **Mode Classification** | `mode: "primary"` vs `mode: "subagent"` | Document agent hierarchy and delegation patterns |
| **Reasoning Effort** | `reasoningEffort: "medium"` | Document when to use extended thinking |
| **7-Section Delegation Prompt** | TASK/EXPECTED OUTCOME/REQUIRED SKILLS/etc. | Document delegation prompt structure |
| **Background Task Pattern** | `background_task(agent=...)` | Document parallel execution patterns |

#### Oracle Response Patterns

```markdown
## RESPONSE STRUCTURE (for advisory agents)

**Essential** (always include):
- **Bottom line**: 2-3 sentences capturing recommendation
- **Action plan**: Numbered steps for implementation
- **Effort estimate**: Quick(<1h), Short(1-4h), Medium(1-2d), Large(3d+)

**Expanded** (when relevant):
- **Why this approach**: Brief reasoning and trade-offs
- **Watch out for**: Risks, edge cases, mitigations
```

#### OmO Orchestration Patterns

```markdown
## ORCHESTRATION PATTERNS (for orchestrator agents)

### Intent Classification
- TRIVIAL → Direct tools, no agents
- EXPLORATION → Assess search scope first
- IMPLEMENTATION → Check for spec folder
- ORCHESTRATION → Break down, then assess each step

### Blocking Gates
- Pre-Search: Try direct tools first
- Pre-Edit: Must read file before editing
- Pre-Delegation: Use 7-section prompt structure
- Pre-Completion: Must have verification evidence

### Evidence Requirements
| Action | Required Evidence |
|--------|-------------------|
| File edit | lsp_diagnostics clean |
| Build | Exit code 0 |
| Test | Pass count |
| Delegation | Agent result received |
```

#### Command Workflow Patterns (from /review, /specify, /plan, etc.)

| Pattern | Detection | Documentation |
|---------|-----------|---------------|
| **Numbered Steps** | `1. Step one` / `2. Step two` | "Workflow commands use numbered steps" |
| **GOVERNANCE Section** | `Call Historian` / `update_workflow_state` | "Commands that modify files must call governance tools" |
| **References Section** | `## References` with file paths | "Commands list their dependencies" |
| **Detect/Confirm Pattern** | Detect context → Confirm with user → Execute | "Interactive commands follow detect/confirm/execute flow" |
| **Spec Folder Integration** | `read tasks.md` / `check spec folder` | "Feature commands integrate with spec-driven workflow" |

#### Anti-Pattern Detection

The Rule Engineer detects and documents anti-patterns found in the codebase:

```yaml
# Patterns to detect and flag in ANTI-PATTERNS section
type_safety:
  - "as any" → "NEVER use type erasure"
  - "@ts-ignore" → "Fix the actual type error"
  - "@ts-expect-error" → "Only for genuinely impossible types"

package_manager:
  - "npm install" → "Use bun only"
  - "yarn add" → "Use bun only"
  - "npx" → "Use bunx"

agent_config:
  - "temperature > 0.3" for code agents → "Use 0.1 for deterministic output"
  - Missing tool restrictions → "Always specify tools: { include: [...] }"

publishing:
  - "bun publish" locally → "Use GitHub Actions workflow_dispatch"
  - Manual version bump → "Version managed by CI workflow"
```

### Prompt Engineering Principles

Following OmO/Sisyphus patterns:

1. **Tool-First Approach**: Always gather evidence before proposing
   ```
   BEFORE proposing any AGENTS.md content:
   1. glob("**/AGENTS.md") → Find existing patterns
   2. read_context() → Understand project config
   3. grep/ast_grep → Detect code patterns
   4. THEN synthesize proposals
   ```

2. **Evidence-Based Proposals**: Every proposal must cite sources
   ```
   Pattern: "Use temperature 0.1 for code agents"
   Evidence: Found in src/agents/oracle.ts:15, src/agents/explore.ts:22
   Occurrences: 5 files
   ```

3. **Incremental Over Wholesale**: Small, focused updates
   ```
   WRONG: Regenerate entire AGENTS.md
   RIGHT: Add new ANTI-PATTERN section with 2 items
   ```

4. **Learn From Project**: Adapt to existing conventions
   ```
   IF existing AGENTS.md uses "## CONVENTIONS" header:
     USE "## CONVENTIONS" (not "## CODE STYLE")
   ```

### Workflow Integration

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Rule Keeper System Flow                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  TRIGGERS                                                                │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐        │
│  │  /update-rules   │  │ /review command  │  │ /test command   │        │
│  │  (explicit)      │  │ (assess step)    │  │ (docs step)     │        │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬────────┘        │
│           │                     │                     │                  │
│           └─────────────────────┼─────────────────────┘                  │
│                                 ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    RULE KEEPER (Orchestrator)                    │    │
│  │                                                                  │    │
│  │  1. Discover project structure (glob, read_context)             │    │
│  │  2. Find existing AGENTS.md files                               │    │
│  │  3. Classify directories into tiers                             │    │
│  │  4. Detect directories needing rules                            │    │
│  │  5. Audit existing rules for staleness                          │    │
│  │                                                                  │    │
│  └────────────────────────────┬────────────────────────────────────┘    │
│                               │                                          │
│                               │ delegates writing tasks                  │
│                               ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    RULE ENGINEER (Specialist)                    │    │
│  │                                                                  │    │
│  │  1. Analyze code patterns (ast_grep, grep)                      │    │
│  │  2. Apply tier-appropriate template                             │    │
│  │  3. Generate evidence-based content                             │    │
│  │  4. Enforce anti-bloat limits                                   │    │
│  │  5. Write AGENTS.md file directly                               │    │
│  │                                                                  │    │
│  └────────────────────────────┬────────────────────────────────────┘    │
│                               │                                          │
│                               │ reports completion                       │
│                               ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    RULE KEEPER (Summary)                         │    │
│  │                                                                  │    │
│  │  1. Report files created/updated                                │    │
│  │  2. List patterns documented                                    │    │
│  │  3. Update workflow state                                       │    │
│  │                                                                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                               │                                          │
│                               ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    PR REVIEW (Human Checkpoint)                  │    │
│  │                                                                  │    │
│  │  Changes reviewed by humans at PR stage (consistent with        │    │
│  │  how all other agents work in the system)                       │    │
│  │                                                                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Note**: 
- Rule-keeper applies changes directly (no user confirmation step)
- Human review happens at PR stage (consistent with other agents)
- Use `--dry-run` flag to preview changes without applying
- Git provides rollback if changes need to be reverted

## Standard Templates

### Navigation Tier Template

```markdown
# [DIRECTORY_NAME] KNOWLEDGE BASE

## OVERVIEW

[1-2 sentence description of what this directory contains]

## STRUCTURE

| Directory | Purpose | Details |
|-----------|---------|---------|
| `subdir1/` | [Purpose] | [See AGENTS.md](./subdir1/AGENTS.md) |
| `subdir2/` | [Purpose] | [See AGENTS.md](./subdir2/AGENTS.md) |

## NAVIGATION

- For [task A], see `subdir1/`
- For [task B], see `subdir2/`
```

### Standard Tier Template

```markdown
# [MODULE_NAME] KNOWLEDGE BASE

## OVERVIEW

[1-2 sentence description of module purpose and responsibility]

## STRUCTURE

\`\`\`
module/
├── file1.ext     # [Description]
├── file2.ext     # [Description]
├── subdir/       # [Description]
└── index.ext     # [Export/entry point]
\`\`\`

## [DOMAIN-SPECIFIC SECTION]

| Category | Description |
|----------|-------------|
| Item 1 | Details |
| Item 2 | Details |

## HOW TO ADD

1. Create new file following pattern
2. Add to index/exports
3. Update relevant configs

## ANTI-PATTERNS

- [Forbidden pattern 1]
- [Forbidden pattern 2]
```

### Minimal Tier Template

```markdown
# [DIRECTORY_NAME]

## OVERVIEW

[1 sentence description]

## STRUCTURE

\`\`\`
directory/
├── file1.ext    # [Description]
└── file2.ext    # [Description]
\`\`\`
```

## Design Decisions

### DD-0: Two-Agent Architecture (Rule Keeper + Rule Engineer)

**Decision**: Split functionality into two specialized agents rather than one monolithic agent.

**Rationale**:
1. **Separation of Concerns**: Monitoring/detection (Rule Keeper) is distinct from writing/template expertise (Rule Engineer)
2. **Reusability**: Rule Engineer can be invoked directly for ad-hoc rule writing tasks
3. **Quality Control**: Rule Keeper validates Rule Engineer's output before proposing to user
4. **Knowledge Encapsulation**: All prompt engineering lessons live in Rule Engineer's prompt, making it the single source of truth
5. **Mirrors OmO Pattern**: Proven orchestrator → specialist delegation pattern
6. **Maintainability**: Updates to writing templates only require changes to Rule Engineer

**Agent Responsibilities**:

| Rule Keeper (Orchestrator) | Rule Engineer (Specialist) |
|---------------------------|---------------------------|
| Project structure discovery | Pattern analysis and detection |
| Directory tier classification | Template application |
| Staleness/drift detection | Evidence-based content generation |
| Delegation and validation | Anti-bloat enforcement |
| User interaction | High-quality rule writing |

### DD-1: Direct Apply with PR Review

**Decision**: Rule updates are applied directly without user confirmation. Human review happens at PR stage.

**Rationale**: 
1. Consistent with how other agents work (OmO, implementation-specialist, frontend-ui-ux-engineer all edit directly)
2. PR review provides human oversight - no need for double confirmation
3. Reduces friction in the workflow
4. `--dry-run` option available when preview is needed
5. Git provides rollback if changes are incorrect

### DD-2: Incremental Updates Over Regeneration

**Decision**: Propose incremental changes, not full file rewrites.

**Rationale**: Preserves existing structure, formatting, and organization. Git provides history if regeneration is needed.

### DD-3: Project-Agnostic Core

**Decision**: Core functionality works on any project; customization via config.

**Rationale**: Rule-keeper should be useful across the OmO ecosystem, not just oh-my-opencode. Works with TypeScript, Python, Rust, Go, monorepos, etc.

### DD-4: Learn From Existing Patterns

**Decision**: Analyze existing AGENTS.md files to learn project conventions.

**Rationale**: Consistency with existing project style is more important than imposing defaults.

### DD-5: Tiered Depth by Purpose

**Decision**: Three tiers (Navigation/Standard/Minimal) based on directory purpose.

**Rationale**: Not all directories need the same level of documentation. Over-documenting simple directories adds noise.

### DD-6: Configuration Over Convention

**Decision**: All thresholds and templates are configurable.

**Rationale**: Different projects have different needs. Sensible defaults with full override capability.

### DD-7: .cursor/rules Deferred to Phase 2

**Decision**: Focus Phase 1 on AGENTS.md hierarchy only.

**Rationale**: AGENTS.md is the primary context mechanism in OpenCode. `.cursor/rules/*.mdc` adds complexity and can be addressed in a future phase.

### DD-8: Zero-Config with Optional Config Proposal

**Decision**: Rule-keeper works out-of-the-box with auto-detected defaults; configuration file is proposed (not auto-created) on first run.

**Options Considered**:
1. Auto-create config on first run (rejected - creates files without asking, violates DD-1)
2. Require config before running (rejected - high friction, not project-agnostic)
3. Work with defaults, propose config for confirmation (chosen - zero friction + user control)

**Rationale**: 
- Zero setup friction: Works immediately on any project
- Respects user confirmation philosophy (DD-1)
- Auto-detection handles most cases without config
- Users can customize after seeing proposed defaults
- Config file becomes documentation of project-specific settings

## Assumptions

1. **User Preference**: Users prefer to confirm rule updates rather than have them applied automatically
2. **Model Choice**: Claude Sonnet 4.5 provides sufficient reasoning for pattern detection and writing
3. **Git Workflow**: All rule files are version-controlled, allowing users to revert if needed
4. **Workflow Commands Exist**: `/review` and `/test` commands exist and can include optional rule-update steps
5. **Project Diversity**: Rule-keeper will be used across many project types, not just TypeScript

## Dependencies

- **OpenCode Plugin SDK**: `@opencode-ai/sdk` for agent definition and tool access
- **Existing Hook System**: `src/hooks/` infrastructure for workflow integration
- **Existing Command Loader**: `src/features/claude-code-command-loader/` for `/update-rules` command
- **Existing Agent Infrastructure**: `src/agents/` patterns for agent implementation
- **Linear Integration**: Existing Linear tools for issue linking
- **Workflow State**: `update_workflow_state` tool for workflow tracking

## Success Criteria

| Metric | Target | Measurement |
|--------|--------|-------------|
| Project Compatibility | Works on 5+ project types | Test on TS, Python, Rust, Go, monorepo |
| Discovery Accuracy | 90% correct tier assignment | Manual audit |
| Pattern Detection | 80% of new patterns captured | Sample review |
| User Adoption | 50% of proposals accepted | Usage analytics |
| Bloat Prevention | No files exceed configured limits | Automated check |
| Time Savings | 10+ min saved per feature | Developer survey |

## Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Over-eager updates | Medium | Low | Pattern threshold (3+ occurrences) before proposing |
| Rule file corruption | Low | High | Always show diff preview; git provides rollback |
| Context window overflow | Medium | Medium | Incremental analysis; rule file size limits |
| User fatigue from prompts | Medium | Medium | Batch updates; "skip for session" option |
| Model hallucination | Low | Medium | Require codebase evidence for each proposal |
| Project-specific assumptions | Medium | Medium | Configuration system; learn from existing patterns |

## Appendix: oh-my-opencode Configuration

This is the specific configuration for using rule-keeper in the oh-my-opencode project:

```yaml
# .opencode/rule-keeper.yaml
rule_keeper:
  scan_paths: ["src"]
  code_extensions: ["ts"]
  
  templates:
    custom_sections:
      - name: "TDD"
        in_files: ["AGENTS.md"]
        required: true
        template: |
          ## TDD (Test-Driven Development)
          
          **MANDATORY for new features and bug fixes.** Follow RED-GREEN-REFACTOR:
          
          | Phase | Action | Verification |
          |-------|--------|--------------|
          | RED | Write failing test first | `bun test` -> FAIL |
          | GREEN | Write minimal code to pass | `bun test` -> PASS |
          | REFACTOR | Improve while tests stay green | `bun test` -> PASS |
  
  protected:
    - file: "AGENTS.md"
      sections: ["TDD", "DEPLOYMENT", "COMMANDS"]
  
  # oh-my-opencode specific anti-patterns to always include
  enforced_antipatterns:
    - "as any, @ts-ignore, @ts-expect-error"
    - "npm/yarn/npx (use bun only)"
    - "Direct bun publish (use GitHub Actions)"
    - "Temperature > 0.3 for code agents"
```

This configuration ensures:
1. TDD section is always present in root AGENTS.md
2. Project-specific anti-patterns are enforced
3. Protected sections won't be accidentally modified

## Open Questions (Resolved)

1. **~~Trigger Frequency~~**: Configurable via hooks, default to opt-in per command
2. **~~Cross-File Patterns~~**: Route to most specific applicable AGENTS.md
3. **~~Pattern Detection Scope~~**: Analyze files modified in current session + recent git changes
4. **~~Project-Agnostic~~**: RESOLVED - Core is generic, project-specific via config
5. **~~Tier Selection~~**: RESOLVED - Heuristics + config overrides
6. **~~.cursor/rules~~**: RESOLVED - Deferred to Phase 2
