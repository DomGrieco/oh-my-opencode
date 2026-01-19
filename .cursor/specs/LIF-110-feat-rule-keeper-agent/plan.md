# Rule Keeper Agent - Implementation Plan

**Linear Issue**: [LIF-110](https://linear.app/lifelogger/issue/LIF-110/rule-keeper-agent-automated-project-rule-maintenance-in-spec)
**Created**: 2026-01-03
**Author**: Strategic Planner (OmO)

## Summary

The Rule Keeper system is a **two-agent architecture** for maintaining project knowledge files:

| Agent | Role | Responsibility |
|-------|------|----------------|
| **Rule Keeper** | Monitor/Orchestrator | Discovers project structure, detects rule needs, audits for staleness, delegates to Rule Engineer |
| **Rule Engineer** | Writer/Expert | Contains all prompt engineering knowledge, writes high-quality AGENTS.md files, enforces templates |

The system uses a tiered content approach (Navigation/Standard/Minimal), detects patterns from code analysis, and proposes evidence-based updates with user confirmation. The `/update-rules` command provides on-demand maintenance, while optional workflow integration enables post-implementation rule analysis.

## Technical Context

| Aspect | Details |
|--------|---------|
| **Language** | TypeScript 5.7+ |
| **Runtime** | Bun >= 1.0.0 |
| **Framework** | @opencode-ai/plugin SDK |
| **Package Manager** | Bun only (NEVER npm/yarn) |
| **Target Files** | `src/agents/`, `.opencode/command/`, `src/config/`, `src/hooks/` |
| **Build** | Dual output - `bun build` (ESM) + `tsc --emitDeclarationOnly` |

## Constitution Check

| Principle | Compliance |
|-----------|------------|
| **I. Plugin-First Architecture** | ✅ All features via @opencode-ai/plugin SDK (agent, command, config) |
| **II. Multi-Model Excellence** | ✅ Uses Claude Sonnet 4.5 for strong reasoning + writing |
| **III. Multi-Layered Orchestration** | ✅ rule-keeper as utility/specialist agent in hierarchy |
| **IV. Bun-Native Development** | ✅ Bun exclusively for all operations |
| **V. Hook-Driven Enhancement** | ✅ Optional post-implement/post-review hooks for workflow integration |
| **VI. Dogfooding** | ✅ Will use itself to maintain oh-my-opencode AGENTS.md |
| **VII. GitHub Actions Publishing** | ✅ No local publish, uses CI workflow |

## Architecture

### Component Diagram (Two-Agent System)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Rule Keeper System                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                         Entry Points                                │ │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐   │ │
│  │  │  /update-rules   │  │ /review command  │  │ /test command   │   │ │
│  │  │  Explicit invoke │  │ (assess step)    │  │ (docs step)     │   │ │
│  │  └────────┬─────────┘  └────────┬─────────┘  └────────┬────────┘   │ │
│  └───────────│─────────────────────│─────────────────────│────────────┘ │
│              │                     │                     │              │
│              └─────────────────────┼─────────────────────┘              │
│                                    ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │               RULE KEEPER (Orchestrator Agent)                   │   │
│  │  model: anthropic/claude-sonnet-4-5  |  mode: subagent          │   │
│  │                                                                  │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │   │
│  │  │    Discovery    │  │  Tier Detection │  │   Validation    │  │   │
│  │  │  • glob, read   │  │  • Navigation   │  │  • Quality      │  │   │
│  │  │  • read_context │  │  • Standard     │  │  • Limits       │  │   │
│  │  │  • find rules   │  │  • Minimal      │  │  • Protected    │  │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘  │   │
│  └──────────────────────────────┬──────────────────────────────────┘   │
│                                 │                                       │
│                                 │ delegates writing tasks               │
│                                 ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │               RULE ENGINEER (Specialist Agent)                   │   │
│  │  model: anthropic/claude-sonnet-4-5  |  mode: subagent          │   │
│  │                                                                  │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │   │
│  │  │ Pattern Detect  │  │    Templates    │  │   Anti-Bloat    │  │   │
│  │  │ • ast_grep      │  │  • Navigation   │  │  • Line limits  │  │   │
│  │  │ • grep patterns │  │  • Standard     │  │  • Pattern ≥3   │  │   │
│  │  │ • agent/cmd     │  │  • Minimal      │  │  • Merge similar│  │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘  │   │
│  │                                                                  │   │
│  │  ENCODED KNOWLEDGE BASE:                                         │   │
│  │  • OmO orchestration patterns (Intent Gate, Blocking Gates)     │   │
│  │  • Oracle response structure (Bottom line, Action plan)         │   │
│  │  • 7-section delegation prompt structure                        │   │
│  │  • Command workflow patterns (/review, /specify, /plan)         │   │
│  │  • Anti-patterns (as any, npm/yarn, temperature >0.3)           │   │
│  │                                                                  │   │
│  └──────────────────────────────┬──────────────────────────────────┘   │
│                                 │                                       │
│                                 │ returns proposals                     │
│                                 ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Proposal Output (JSON)                        │   │
│  │  • file: path to AGENTS.md                                       │   │
│  │  • action: create | update                                       │   │
│  │  • tier: navigation | standard | minimal                         │   │
│  │  • sections: { OVERVIEW, STRUCTURE, ANTI-PATTERNS, ... }        │   │
│  │  • patterns_detected: [{ name, evidence[], occurrences }]       │   │
│  │  • rationale: why this change is proposed                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. TRIGGER: /update-rules command OR /review (assess step) OR /test (docs step)
                                │
                                ▼
2. RULE KEEPER: Discover project structure
   ├── read_context() → Project configuration
   ├── glob("**/AGENTS.md") → Existing rule files
   ├── glob("**/{package.json,Cargo.toml,pyproject.toml}") → Manifest files
   └── Classify directories into tiers
                                │
                                ▼
3. RULE KEEPER: For each directory needing rules
   │
   └──► DELEGATE TO RULE ENGINEER
                                │
                                ▼
4. RULE ENGINEER: Analyze and write
   ├── ast_grep_search → Code structure patterns
   ├── grep → Import patterns, naming conventions
   ├── Apply tier-appropriate template
   ├── Enforce anti-bloat limits
   └── write() / edit() → Apply changes directly
                                │
                                ▼
5. RULE KEEPER: Report summary
   ├── List files created/updated
   ├── List patterns documented
   └── Update workflow state
                                │
                                ▼
6. PR REVIEW: Human checkpoint
   └── Changes reviewed at PR stage (like all other agents)
```

**Note**: No user confirmation step. Changes apply directly. Use `--dry-run` to preview.

## Data Models

### RuleKeeperConfig Schema

```typescript
// Add to src/config/schema.ts

export const RuleKeeperTierThresholdsSchema = z.object({
  navigation_min_subdirs: z.number().default(3),
  minimal_max_files: z.number().default(5),
  standard_min_patterns: z.number().default(2),
})

export const RuleKeeperLimitsSchema = z.object({
  root_max_lines: z.number().default(200),
  standard_max_lines: z.number().default(100),
  minimal_max_lines: z.number().default(40),
  pattern_threshold: z.number().default(3),
  similarity_merge_threshold: z.number().default(80),
})

export const RuleKeeperTemplateSchema = z.object({
  name: z.string(),
  in_files: z.array(z.string()).optional(),
  required: z.boolean().optional(),
  template: z.string(),
})

export const RuleKeeperProtectedSectionSchema = z.object({
  file: z.string(),
  sections: z.array(z.string()),
})

export const RuleKeeperConfigSchema = z.object({
  enabled: z.boolean().default(true),
  // Discovery settings
  scan_paths: z.union([z.array(z.string()), z.literal("auto")]).default("auto"),
  ignore_paths: z.array(z.string()).default([
    "node_modules", "dist", "vendor", ".git", "build", "coverage"
  ]),
  code_extensions: z.union([z.array(z.string()), z.literal("auto")]).default("auto"),
  
  // Tier thresholds
  tiers: RuleKeeperTierThresholdsSchema.optional(),
  
  // Templates
  templates: z.object({
    required_sections: z.array(z.string()).default(["OVERVIEW", "STRUCTURE"]),
    optional_sections: z.array(z.string()).default(["HOW TO ADD", "ANTI-PATTERNS", "EXAMPLES"]),
    custom_sections: z.array(RuleKeeperTemplateSchema).optional(),
  }).optional(),
  
  // Anti-bloat
  limits: RuleKeeperLimitsSchema.optional(),
  
  // Protected content
  protected: z.array(RuleKeeperProtectedSectionSchema).optional(),
  
  // Enforced anti-patterns (always included)
  enforced_antipatterns: z.array(z.string()).optional(),
  
  // Workflow integration (these control whether /review and /test commands prompt for rule updates)
  prompt_in_review: z.boolean().default(true),  // Prompt during /review command
  prompt_in_test: z.boolean().default(true),    // Prompt during /test command
})

export type RuleKeeperConfig = z.infer<typeof RuleKeeperConfigSchema>
```

### Proposal Types

```typescript
// src/agents/rule-keeper/types.ts

export type ContentTier = "navigation" | "standard" | "minimal"
export type ProposalAction = "create" | "update"

export interface DetectedPattern {
  name: string
  evidence: string[]
  occurrences: number
}

export interface SectionContent {
  header: string
  content: string
  protected?: boolean
}

export interface RuleProposal {
  file: string
  action: ProposalAction
  tier: ContentTier
  sections: Record<string, SectionContent>
  rationale: string
  patterns_detected: DetectedPattern[]
  estimated_lines: number
  conflicts?: string[]
}

export interface ProposalSummary {
  files_to_create: number
  files_to_update: number
  total_lines_added: number
  warnings: string[]
}

export interface RuleKeeperOutput {
  proposals: RuleProposal[]
  summary: ProposalSummary
  config_proposal?: {
    path: string
    content: string
    rationale: string
  }
}

export interface DirectoryAnalysis {
  path: string
  tier: ContentTier
  file_count: number
  subdir_count: number
  code_files: string[]
  has_agents_md: boolean
  patterns: DetectedPattern[]
}

export interface ProjectAnalysis {
  root: string
  type: string | null // e.g., "typescript", "python", "rust", "go", "monorepo"
  languages: string[]
  frameworks: string[]
  existing_agents_md: string[]
  directories: DirectoryAnalysis[]
}
```

### Command Options

```typescript
// src/agents/rule-keeper/types.ts

export interface UpdateRulesOptions {
  scope?: string        // Target specific directory (default: project root)
  discover?: boolean    // Create missing AGENTS.md files
  audit?: boolean       // Check existing files for staleness
  sync?: boolean        // Update root STRUCTURE links
  dryRun?: boolean      // Show proposals without applying
}
```

## API Contracts

### Agent Interfaces

```typescript
// src/agents/rule-keeper.ts

import type { AgentConfig } from "@opencode-ai/sdk"

export const ruleKeeperAgent: AgentConfig = {
  model: "anthropic/claude-sonnet-4-5",
  temperature: 0.1,
  mode: "subagent",
  description: "Monitors project structure, detects rule maintenance needs, audits for staleness, and delegates writing to rule-engineer",
  tools: {
    include: [
      // Discovery & Analysis (read-only)
      "read", "glob", "grep", "ast_grep_search",
      "lsp_document_symbols", "lsp_workspace_symbols",
      // Context
      "read_context", "memory_read", "memory_list",
      // Delegation to Rule Engineer (manager role can use call_omo_agent)
      "call_omo_agent",
      // Project understanding
      "serena_get_symbols_overview", "serena_find_symbol",
      // Linear integration
      "linear_branch", "linear_update_status",
    ]
  },
  prompt: RULE_KEEPER_PROMPT,
}

// src/agents/rule-engineer.ts

export const ruleEngineerAgent: AgentConfig = {
  model: "anthropic/claude-sonnet-4-5",
  temperature: 0.1,
  mode: "subagent",
  description: "Expert in writing high-quality AGENTS.md files using prompt engineering best practices, tier templates, and evidence-based patterns",
  tools: {
    include: [
      // Analysis (for pattern detection)
      "read", "glob", "grep", "ast_grep_search",
      "lsp_document_symbols",
      // Context
      "read_context", "memory_read",
      // Writing
      "edit", "write",
      // Linear integration
      "linear_branch", "linear_update_status",
    ]
  },
  prompt: RULE_ENGINEER_PROMPT, // Contains all encoded knowledge
}
```

### Command Interface

```markdown
# /update-rules Command

---
description: Analyze and maintain project AGENTS.md files
argument-hint: [--scope <path>] [--discover] [--audit] [--sync] [--dry-run]
agent: rule-keeper
---

Execute rule-keeper agent to analyze project structure and propose AGENTS.md updates.

## Options

- `--scope <path>`: Target specific directory (default: project root)
- `--discover`: Create missing AGENTS.md files based on tier detection
- `--audit`: Check existing AGENTS.md files for staleness/drift
- `--sync`: Update root AGENTS.md STRUCTURE section with links to child files
- `--dry-run`: Show proposals without applying changes

## Examples

```bash
# Full discovery - find and create all missing AGENTS.md
/update-rules --discover

# Audit existing rules for staleness
/update-rules --audit

# Update only a specific directory
/update-rules --scope src/hooks

# Preview changes without applying
/update-rules --dry-run --discover
```

## Workflow

1. Analyze project structure and detect directory tiers
2. Scan for code patterns worth documenting
3. Generate proposals with evidence-based rationale
4. Present proposals for user confirmation
5. Apply approved changes
```

### Workflow Command Integration

Rule-keeper is invoked as a **step within existing workflow commands**, not as an automatic hook:

```
/review command (assess step):
  └── After code review assessment, optionally invoke rule-keeper
      to propose documentation updates based on patterns found during review

/test command (docs step):
  └── After tests pass, optionally invoke rule-keeper
      to document final tested patterns in AGENTS.md

/update-rules command (explicit):
  └── User explicitly invokes for on-demand analysis
```

**Key Principle**: Rule-keeper is NOT an automatic hook. It's:
1. A standalone command (`/update-rules`)
2. An optional step within `/review` and `/test` workflows
3. Always requires user confirmation before changes

## Project Structure

### Files to Create

```
src/agents/
├── rule-keeper.ts              # Orchestrator agent config + prompt (NEW)
├── rule-engineer.ts            # Specialist agent config + prompt (NEW)

.opencode/command/
├── update-rules.md             # Slash command definition (NEW)

src/config/
├── schema.ts                   # Add RuleKeeperConfigSchema (MODIFY)
├── index.ts                    # Export rule-keeper types (MODIFY)

.opencode/command/
├── review.md                   # Update to include rule-keeper step (MODIFY - Phase 6)
├── test.md                     # Update to include rule-keeper step (MODIFY - Phase 6)
```

### Files to Modify

| File | Changes |
|------|---------|
| `src/agents/index.ts` | Import and register `ruleKeeperAgent` and `ruleEngineerAgent` |
| `src/agents/types.ts` | Add `"rule-keeper"` and `"rule-engineer"` to `BuiltinAgentName` and `DELEGATABLE_AGENTS`; Add to `AGENT_ROLE_REGISTRY`: `"rule-keeper": "manager"`, `"rule-engineer": "specialist"` |
| `src/config/schema.ts` | Add `RuleKeeperConfigSchema`, add to `OhMyOpenCodeConfigSchema` |

## Implementation Phases

### Phase 1: Rule Engineer Agent (Expert/Specialist) (5h)

**Why Rule Engineer first?** The Rule Engineer contains all the encoded knowledge (templates, patterns, anti-patterns). Building it first lets us validate the writing quality before adding orchestration.

| Step | Task | Files | Estimate |
|------|------|-------|----------|
| 1.1 | Create rule-engineer agent config | `src/agents/rule-engineer.ts` | 30min |
| 1.2 | Encode OmO orchestration patterns in prompt | `src/agents/rule-engineer.ts` | 1h |
| 1.3 | Encode Oracle response patterns in prompt | `src/agents/rule-engineer.ts` | 30min |
| 1.4 | Encode command workflow patterns in prompt | `src/agents/rule-engineer.ts` | 30min |
| 1.5 | Encode anti-pattern detection rules | `src/agents/rule-engineer.ts` | 30min |
| 1.6 | Add tier templates (Navigation/Standard/Minimal) | `src/agents/rule-engineer.ts` | 45min |
| 1.7 | Add to agent types and registration | `src/agents/types.ts`, `src/agents/index.ts` | 30min |
| 1.8 | Test rule-engineer independently | Manual testing | 45min |

**Phase 1 Deliverables:**
- `rule-engineer` agent callable via `call_omo_agent`
- All encoded knowledge in prompt (OmO, Oracle, commands, anti-patterns)
- Three tier templates embedded
- Can write high-quality AGENTS.md when given context

### Phase 2: Rule Keeper Agent (Orchestrator) (4h)

| Step | Task | Files | Estimate |
|------|------|-------|----------|
| 2.1 | Create rule-keeper agent config | `src/agents/rule-keeper.ts` | 30min |
| 2.2 | Add project discovery logic to prompt | `src/agents/rule-keeper.ts` | 1h |
| 2.3 | Add tier detection heuristics | `src/agents/rule-keeper.ts` | 45min |
| 2.4 | Add delegation logic to rule-engineer | `src/agents/rule-keeper.ts` | 45min |
| 2.5 | Add validation logic for proposals | `src/agents/rule-keeper.ts` | 30min |
| 2.6 | Add to agent types and registration | `src/agents/types.ts`, `src/agents/index.ts` | 15min |
| 2.7 | Test two-agent interaction | Manual testing | 30min |

**Phase 2 Deliverables:**
- `rule-keeper` agent callable via `call_omo_agent`
- Discovers project structure automatically
- Correctly classifies directories into tiers
- Successfully delegates to rule-engineer
- Validates proposals before returning

### Phase 3: Configuration Schema (1.5h)

| Step | Task | Files | Estimate |
|------|------|-------|----------|
| 3.1 | Create RuleKeeperConfigSchema | `src/config/schema.ts` | 45min |
| 3.2 | Add to OhMyOpenCodeConfigSchema | `src/config/schema.ts` | 15min |
| 3.3 | Export types from config index | `src/config/index.ts` | 15min |
| 3.4 | Update schema.json | `assets/oh-my-opencode.schema.json` | 15min |

**Phase 3 Deliverables:**
- Configuration schema with all options
- JSON schema for IDE autocomplete
- Type-safe config access

### Phase 4: /update-rules Command (2h)

| Step | Task | Files | Estimate |
|------|------|-------|----------|
| 4.1 | Create command markdown file | `.opencode/command/update-rules.md` | 45min |
| 4.2 | Define command options (--discover, --audit, --sync, --dry-run) | Part of 4.1 | included |
| 4.3 | Test command invocation | Manual testing | 30min |
| 4.4 | Document usage in command help | `.opencode/command/update-rules.md` | 30min |
| 4.5 | Edge case handling (no project, empty dirs) | Agent prompt refinement | 15min |

**Phase 4 Deliverables:**
- `/update-rules` command available in OpenCode
- Supports `--discover`, `--audit`, `--sync`, `--dry-run` options
- Invokes rule-keeper which delegates to rule-engineer
- Clear error messages and help text

### Phase 5: Testing & Dogfooding (2h)

| Step | Task | Files | Estimate |
|------|------|-------|----------|
| 5.1 | Run `/update-rules --discover --dry-run` on oh-my-opencode | Review output | 30min |
| 5.2 | Verify tier detection (src/, src/agents/, src/hooks/, etc.) | Review proposals | 30min |
| 5.3 | Apply proposals to create missing AGENTS.md files | AGENTS.md files | 30min |
| 5.4 | Test on a Python project (if available) | External | 15min |
| 5.5 | Document findings and adjust prompts | Agent files | 15min |

**Phase 5 Deliverables:**
- oh-my-opencode AGENTS.md hierarchy created/updated by rule-keeper
- Verified project-agnostic operation
- Prompt refinements based on real usage

### Phase 6: Workflow Command Integration (Optional) (2h)

| Step | Task | Files | Estimate |
|------|------|-------|----------|
| 6.1 | Add rule-keeper step to /review command | `.opencode/command/review.md` | 45min |
| 6.2 | Add rule-keeper step to /test command | `.opencode/command/test.md` | 45min |
| 6.3 | Document workflow integration in command help | Command files | 15min |
| 6.4 | Test workflow integration | Manual testing | 15min |

**Phase 6 Deliverables:**
- `/review` command includes optional AGENTS.md update step (after assess)
- `/test` command includes optional AGENTS.md update step (after tests pass)
- User prompted to confirm/skip rule updates within workflow

### Phase 7: Documentation (30min)

| Step | Task | Files | Estimate |
|------|------|-------|----------|
| 7.1 | Document in README if significant | README.md | 30min |

**Phase 7 Deliverables:**
- README updated with rule-keeper system documentation

## Dependencies

### Internal (This Repo)

| Dependency | Status | Notes |
|------------|--------|-------|
| Agent infrastructure (`src/agents/`) | Exists | Follow existing patterns |
| Command loader (`src/features/claude-code-command-loader/`) | Exists | Commands in `.opencode/command/` |
| Config schema (`src/config/schema.ts`) | Exists | Add new schema section |
| Hook system (`src/hooks/`) | Exists | For workflow integration (Phase 5) |
| call_omo_agent tool | Exists | For delegation from OmO |

### External

| Dependency | Status | Notes |
|------------|--------|-------|
| @opencode-ai/plugin SDK | Required | Core plugin infrastructure |
| Zod | Required | Schema validation (already in use) |

## Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Over-eager proposals | Medium | Low | Pattern threshold (3+ occurrences) before proposing |
| Hallucinated patterns | Low | Medium | Require evidence (file:line) for each pattern |
| Context window overflow | Medium | Medium | Incremental analysis; anti-bloat limits |
| User fatigue from prompts | Medium | Medium | Batch proposals; "skip all" option in prompt |
| Project type misdetection | Low | Low | Allow manual config override |
| Protected section corruption | Low | High | Explicit protected section handling in prompt |
| Tier assignment errors | Medium | Low | Config-based tier overrides |

## Testing Strategy

### Manual Testing Checklist

1. **Command Availability**
   - [ ] `/update-rules` appears in command list
   - [ ] `/update-rules --help` shows options

2. **Discovery Mode**
   - [ ] Detects project type correctly (TypeScript for oh-my-opencode)
   - [ ] Finds existing AGENTS.md files
   - [ ] Proposes tiers appropriately (src/ = navigation, src/hooks/ = standard)

3. **Proposal Quality**
   - [ ] Proposals include evidence (file paths, line numbers)
   - [ ] Anti-bloat limits respected
   - [ ] Templates match tier specification

4. **Configuration**
   - [ ] Zero-config works on fresh project
   - [ ] Config file proposals are sensible
   - [ ] Protected sections not modified

5. **Cross-Project**
   - [ ] Works on TypeScript project (oh-my-opencode)
   - [ ] Works on Python project (if available)
   - [ ] Handles empty/simple projects gracefully

### Dogfooding

Run `/update-rules --discover --dry-run` on oh-my-opencode and verify:
- Correct tier detection for src/, src/agents/, src/hooks/, etc.
- Proposals align with existing AGENTS.md structure
- No duplicate content proposed

## Success Metrics

| Metric | Target |
|--------|--------|
| Project Compatibility | Works on TypeScript, detects Python/Rust/Go |
| Discovery Accuracy | 90% correct tier assignment |
| Proposal Quality | 80% of proposals accepted by user |
| Bloat Prevention | No files exceed configured limits |
| Command Response Time | < 30 seconds for typical project |

## Time Summary

| Phase | Estimate |
|-------|----------|
| Phase 1: Rule Engineer Agent (Specialist) | 5h |
| Phase 2: Rule Keeper Agent (Orchestrator) | 4h |
| Phase 3: Configuration Schema | 1.5h |
| Phase 4: /update-rules Command | 2h |
| Phase 5: Testing & Dogfooding | 2h |
| Phase 6: Workflow Integration (Optional) | 2h |
| Phase 7: Documentation | 0.5h |
| **Total** | **17h** |

**Critical Path**: Phases 1 → 2 → 3 → 4 → 5 (14.5h for core functionality)
**Optional**: Phase 6 (workflow integration can be deferred)

**Why the increase from 14h to 17h?**
1. Two agents instead of one (adds 3h for Rule Engineer)
2. More thorough testing phase (dogfooding on oh-my-opencode)
3. Better separation of concerns reduces long-term maintenance

## Agent Prompt Outlines

### Rule Keeper (Orchestrator) Prompt Outline

1. **Role Definition**
   - Project-agnostic orchestrator agent
   - Discovers, monitors, delegates
   - Never writes AGENTS.md directly (delegates to rule-engineer)
   - Reports summary after completion

2. **Discovery Workflow**
   ```
   1. read_context() → Understand project config
   2. glob("**/AGENTS.md") → Find existing rules
   3. glob("**/{package.json,Cargo.toml,...}") → Detect project type
   4. For each directory:
      - Count subdirs with code → tier classification
      - Check for existing AGENTS.md → staleness audit
   5. Compile list of directories needing rules
   6. Delegate each to rule-engineer (applies directly)
   7. Report summary of changes
   ```

3. **Tier Detection Heuristics**
   - Navigation: 3+ subdirectories with code
   - Standard: Implementation files with patterns
   - Minimal: Simple utilities, few files

4. **Delegation Template**
   ```
   call_omo_agent(subagent_type="rule-engineer", prompt="""
   TASK: Write/update AGENTS.md for {directory}
   TIER: {navigation|standard|minimal}
   EXISTING_CONTENT: {current AGENTS.md if any}
   PROJECT_CONTEXT: {read_context output}
   MUST DO: Detect patterns, apply tier template, cite evidence, APPLY DIRECTLY
   MUST NOT DO: Exceed {line_limit} lines, modify protected sections
   """)
   ```

5. **Dry-Run Mode**
   - When `--dry-run` flag is set, report what would change without applying
   - Useful for previewing before committing to changes

### Rule Engineer (Specialist) Prompt Outline

1. **Role Definition**
   - Expert AGENTS.md writer
   - Contains all prompt engineering knowledge
   - Writes evidence-based, template-conforming content
   - **Applies changes directly** (no confirmation step)

2. **Encoded Knowledge Sections**
   - OmO orchestration patterns (Intent Gate, Blocking Gates)
   - Oracle response patterns (Bottom line, Action plan)
   - 7-section delegation prompt structure
   - Command workflow patterns (/review, /specify, /plan)
   - Anti-patterns to detect and document

3. **Pattern Detection Workflow**
   ```
   1. ast_grep_search → Code structure patterns
   2. grep → Text patterns (imports, naming)
   3. Compare against encoded patterns → Match
   4. Filter: only patterns with ≥3 occurrences
   5. Generate evidence: file:line for each
   ```

4. **Tier Templates**
   - Navigation: OVERVIEW + STRUCTURE table with links
   - Standard: OVERVIEW + STRUCTURE + domain sections + HOW TO ADD + ANTI-PATTERNS
   - Minimal: OVERVIEW + STRUCTURE only

5. **Anti-Bloat Enforcement**
   - Check line count against tier limit
   - Merge similar patterns automatically
   - Warn at 80% of limit

6. **Execution**
   ```
   1. Detect patterns in target directory
   2. Apply tier-appropriate template
   3. Generate content with evidence
   4. write() or edit() → Apply directly
   5. Return summary to Rule Keeper:
      {
        "file": "src/agents/AGENTS.md",
        "action": "created",
        "tier": "standard",
        "lines": 85,
        "patterns_documented": ["temperature 0.1", "tool restrictions"]
      }
   ```

## Next Steps

After plan approval:
1. Run `/tasks` to create task breakdown
2. Run `/implement` to start Phase 1
3. Dogfood on oh-my-opencode after Phase 4

## Appendix: Example oh-my-opencode Configuration

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
          
          **MANDATORY for new features and bug fixes.** Follow RED-GREEN-REFACTOR.
  
  protected:
    - file: "AGENTS.md"
      sections: ["TDD", "DEPLOYMENT", "COMMANDS"]
  
  enforced_antipatterns:
    - "as any, @ts-ignore, @ts-expect-error"
    - "npm/yarn/npx (use bun only)"
    - "Direct bun publish (use GitHub Actions)"
    - "Temperature > 0.3 for code agents"
```
