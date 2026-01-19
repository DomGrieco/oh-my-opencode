# Context Window Management Strategy for Skills (LIF-108)

**Generated**: 2025-12-29
**Analysis Method**: Deep Analysis Mode (11 parallel agents + 2 Oracle consultations)
**Linear Issue**: [LIF-108](https://linear.app/lifelogger/issue/LIF-108)

---

## Executive Summary

### Bottom Line Up Front

The current skill loading implementation has **significant context window inefficiencies** that become problematic at scale (50+ skills). However, the **LIF-108 implementation plan is sound** and can proceed with minor enhancements for context efficiency.

**Key Recommendations:**
1. **Proceed with LIF-108 as planned** - The spec/plan are well-designed
2. **Add context-aware optimizations** as Phase 2 enhancement (optional)
3. **Keep the two skill systems separate** but extract shared discovery layer
4. **Implement caching** with file mtime invalidation
5. **No semantic search needed** - keyword/category matching is sufficient for 50-200 skills

---

## Phase 1 Analysis Results

### Agent Coverage

| Agent Type | Count | Focus Areas |
|------------|-------|-------------|
| **Explore** | 4 | Current codebase patterns, loaders, hooks, SDK |
| **Librarian** | 4 | OpenCode docs, best practices, MCP patterns, semantic search |
| **AI-ML Expert** | 1 | Token optimization, scaling analysis |
| **Strategic Planner** | 1 | Two systems integration strategy |
| **Product Strategist** | 1 | Skill discovery UX |
| **Oracle** | 2 | Architecture design, performance analysis |

---

## Current State Analysis

### Problem 1: Passive Context Bloat

**Finding**: Skills are loaded into agent context in **two places**, both eagerly:

```
┌─────────────────────────────────────────────────────────────────┐
│                    CURRENT SKILL LOADING                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. STARTUP LOADER (src/features/claude-code-skill-loader/)     │
│     └── Loads FULL skill body into config.command               │
│     └── Token cost: ~500-2000 tokens PER SKILL                  │
│     └── Available as: /skill-name slash command                 │
│                                                                 │
│  2. RUNTIME TOOL (src/tools/skill/)                             │
│     └── Embeds skill list in tool description                   │
│     └── Token cost: ~50-100 tokens PER SKILL                    │
│     └── Re-reads all SKILL.md on every invocation               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Code Location**: `src/tools/skill/tools.ts` lines 75-78
```typescript
// Module-level execution - runs at import time
const availableSkills = discoverSkillsSync()
const skillListForDescription = availableSkills
  .map((s) => `- ${s.name}: ${s.description} (${s.scope})`)
  .join("\n")
```

### Problem 2: Token Cost Scaling

| Skill Count | Tool Description | Startup Templates | Total Overhead | % of 200k Context |
|-------------|------------------|-------------------|----------------|-------------------|
| 2 (current) | ~150 tokens | ~6,300 tokens | ~6,450 tokens | 3.2% |
| 10 | ~750 tokens | ~15,000 tokens | ~15,750 tokens | 7.9% |
| 50 | ~3,750 tokens | ~75,000 tokens | ~78,750 tokens | 39.4% |
| 100 | ~7,500 tokens | ~150,000 tokens | ~157,500 tokens | **78.8%** |
| 200 | ~15,000 tokens | ~300,000 tokens | **EXCEEDS** | **>100%** |

**Breaking Points:**
- **Safe**: <50 skills (~2,500 tokens in tool description)
- **Concerning**: 50-100 skills (~5,000-8,000 tokens)
- **Problematic**: 100+ skills (context unusable)

### Problem 3: No Caching

**Finding**: Every `skill()` tool invocation re-reads ALL SKILL.md files.

```typescript
// src/tools/skill/tools.ts line 280
async execute(args) {
  const skills = await discoverSkills()  // Re-reads EVERY time
  // ...
}
```

**No cache, no memoization, no file mtime checking.**

### Problem 4: Dual Discovery Systems

| System | Location | Purpose | Reads At |
|--------|----------|---------|----------|
| Startup Loader | `src/features/claude-code-skill-loader/` | Load as slash commands | Plugin init |
| Runtime Tool | `src/tools/skill/` | Search/execute skills | Every invocation |

**Both systems:**
- Read from the same directories
- Parse the same SKILL.md files
- Have no shared discovery layer
- Perform redundant work

---

## Research Findings

### OpenCode Native Skills Pattern

**Key Insight**: OpenCode's built-in `skill` tool uses **lazy loading**:

```typescript
// OpenCode's approach (from sst/opencode)
const addSkill = async (match: string) => {
  const md = await ConfigMarkdown.parse(match)
  // Only stores metadata, NOT full content
  skills[parsed.data.name] = {
    name: parsed.data.name,
    description: parsed.data.description,
    location: match,  // Path only, content loaded on invoke
  }
}
```

**Token savings**: 85%+ reduction by deferring full content loading.

### MCP Tool Discovery Pattern

**Finding**: MCP uses eager loading (all tools at once) - this is a **known pain point**:

> "With 7 MCP servers active, tool definitions consume **67,300 tokens** (33.7% of 200k context budget) before any conversation begins." - Claude Code Issue #11364

**Lesson**: Don't follow MCP's eager loading pattern.

### Best Practices from Frameworks

| Framework | Pattern | Token Savings |
|-----------|---------|---------------|
| Claude Skills | Progressive disclosure (metadata → instructions → resources) | 90%+ |
| LangChain | LLM-based tool selection middleware | 70-90% |
| Semantic Kernel | Vector-based function selection | 80-95% |
| CrewAI | `respect_context_window` auto-summarization | 60-80% |

### Semantic Search Analysis

**Verdict**: **NOT needed for oh-my-opencode**

| Approach | Complexity | Value for <200 skills |
|----------|------------|----------------------|
| Tag filtering | Low | High |
| Fuzzy matching | Low | High |
| Keyword index | Medium | High |
| Vector embeddings | High | Overkill |

**Recommendation**: Hybrid tag + fuzzy matching is sufficient.

---

## Architecture Recommendations

### Recommendation 1: Two-Tier Loading

```
┌─────────────────────────────────────────────────────────────────┐
│                    RECOMMENDED ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TIER 1: Lightweight Registry (Always in Context)               │
│  ├── Loaded at: Module initialization                           │
│  ├── Contains: name, scope only                                 │
│  ├── Token cost: ~15 tokens per skill                           │
│  └── Format: "- skill-name (scope)"                             │
│                                                                 │
│  TIER 2: Full Definition (On-Demand)                            │
│  ├── Loaded at: When skill is invoked                           │
│  ├── Contains: description, body, references                    │
│  ├── Cached: In-memory with mtime invalidation                  │
│  └── Token cost: Only when actively used                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Token Savings Projection:**
| Skills | Current | Two-Tier | Savings |
|--------|---------|----------|---------|
| 50 | ~3,750 tokens | ~750 tokens | **80%** |
| 100 | ~7,500 tokens | ~1,500 tokens | **80%** |
| 200 | ~15,000 tokens | ~3,000 tokens | **80%** |

### Recommendation 2: Keep Systems Separate

**Strategic Decision**: Keep startup loader and runtime tool **separate** but extract shared discovery.

```
┌─────────────────────────────────────────────────────────────────┐
│                    SYSTEM ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SHARED LAYER (new: src/shared/skill-discovery.ts)              │
│  ├── getSkillDirectories(config) → string[]                     │
│  ├── discoverSkillMetadata(dirs) → SkillMetadata[]              │
│  └── loadSkillContent(path) → SkillContent                      │
│                                                                 │
│  STARTUP LOADER (existing)                                      │
│  ├── Uses: shared discovery                                     │
│  ├── Purpose: Register as slash commands                        │
│  └── Loads: Full content (for template)                         │
│                                                                 │
│  RUNTIME TOOL (existing)                                        │
│  ├── Uses: shared discovery                                     │
│  ├── Purpose: Search/filter/execute                             │
│  └── Loads: Metadata first, content on invoke                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Rationale**:
- Different responsibilities (UX vs runtime flexibility)
- Shared layer eliminates code duplication
- Maintains backward compatibility
- Enables independent optimization

### Recommendation 3: Caching Strategy

```typescript
// Proposed: src/shared/skill-cache.ts

interface SkillCache {
  // In-memory cache with file mtime tracking
  metadata: Map<string, { skill: SkillMetadata; mtime: number }>;
  content: Map<string, { content: string; mtime: number }>;
  
  // Methods
  getMetadata(path: string): SkillMetadata | null;
  getContent(path: string): string | null;
  invalidateIfStale(path: string): boolean;
  clear(): void;
}

// Cache invalidation triggers:
// 1. File mtime changed
// 2. Session compacted (event hook)
// 3. Manual refresh via skill tool
// 4. TTL expiry (30s default)
```

**Cache Locations:**
| Cache Type | Scope | Persistence | Use Case |
|------------|-------|-------------|----------|
| Metadata cache | Process | Memory | Fast skill listing |
| Content cache | Session | Memory | Avoid re-reading on repeat invocation |
| Disk cache | None | N/A | Overkill for local files |

### Recommendation 4: Metadata Schema Enhancement

**Current Schema** (minimal):
```yaml
name: skill-name
description: Skill description
```

**Enhanced Schema** (for discoverability):
```yaml
# Required (existing)
name: skill-name
description: Short description (50-150 chars)

# Optional (new - for future discovery tool)
category: development | workflow | quality | research | integration | utilities
keywords: [typescript, testing, refactor]
triggers: ["test", "write tests", "unit test"]  # Auto-activation patterns
version: 1.0.0  # For marketplace/shared skills
```

**Implementation Note**: These fields are **optional enhancements** - not required for LIF-108.

---

## LIF-108 Implementation Implications

### Verdict: Proceed with Current Plan

The LIF-108 spec and plan are **well-designed** and should proceed as documented. The context window concerns are:

1. **Not blocking** for the current implementation
2. **Addressable** as Phase 2 optimization
3. **Not triggered** until skill count exceeds ~50

### Recommended Additions to LIF-108

#### Addition 1: Skill Count Warning

Add to context-window-monitor hook:
```typescript
// Warn when skill overhead exceeds threshold
const skillTokenOverhead = skillCount * 75;  // ~75 tokens per skill average
if (skillTokenOverhead > 5000) {
  log(`Warning: ${skillCount} skills consuming ~${skillTokenOverhead} tokens`);
}
```

#### Addition 2: Shared Discovery Layer (Optional)

Extract common discovery logic:
```typescript
// src/shared/skill-discovery.ts
export function getSkillDirectories(config: OhMyOpenCodeConfig): SkillDirectory[] {
  const dirs: SkillDirectory[] = [];
  
  // Priority order (highest to lowest)
  if (config.opencode?.skills ?? true) {
    dirs.push({ path: ".opencode/skill/", scope: "opencode-project", priority: 1 });
  }
  if (config.claude_code?.skills ?? true) {
    dirs.push({ path: ".claude/skills/", scope: "project", priority: 2 });
  }
  // ... etc
  
  return dirs;
}
```

#### Addition 3: Future-Proof Frontmatter

Document optional fields for future discovery tool:
```markdown
## SKILL.md Format

### Required Fields
- `name`: Unique identifier (lowercase, hyphens)
- `description`: What the skill does (20-150 chars)

### Optional Fields (for future skill discovery)
- `category`: One of [development, workflow, quality, research, integration, utilities]
- `keywords`: Array of search terms
- `triggers`: Phrases that auto-activate this skill
```

---

## Token Budget Guidelines

### Recommended Budget Allocation

For a 200k token context window:

| Component | Budget | Actual Current | Status |
|-----------|--------|----------------|--------|
| System prompt | 5% (10k) | ~3k | ✅ OK |
| Tool descriptions | 5% (10k) | ~5k | ✅ OK |
| Skill metadata | 2.5% (5k) | ~150 | ✅ OK |
| Conversation | 80% (160k) | - | - |
| Buffer | 7.5% (15k) | - | - |

### Scaling Thresholds

| Skill Count | Action Required |
|-------------|-----------------|
| 1-30 | None - current implementation is fine |
| 31-50 | Monitor - watch context usage |
| 51-100 | Optimize - implement two-tier loading |
| 100+ | Redesign - need skill discovery tool |

---

## Action Items

### Immediate (LIF-108)
- [x] Proceed with spec/plan as documented
- [ ] Add `opencode.skills` config toggle
- [ ] Support 4 directory sources
- [ ] Priority ordering for duplicates

### Short-Term (Post LIF-108)
- [ ] Extract shared discovery layer
- [ ] Add skill count to context monitor
- [ ] Implement metadata-only caching

### Medium-Term (Future Enhancement)
- [ ] Two-tier loading architecture
- [ ] Enhanced metadata schema (category, keywords)
- [ ] Skill discovery tool improvements

---

## Appendix: Agent Analysis Sources

### Explore Agents
1. Current skill loading patterns - Token costs, eager loading issues
2. Claude Code loader patterns - Startup vs runtime loading
3. OpenCode plugin SDK patterns - Tool description constraints
4. Hook-based context injection - Conditional loading patterns

### Librarian Agents
1. OpenCode skills documentation - Native lazy loading pattern
2. LLM context management best practices - Progressive disclosure
3. MCP tool discovery patterns - Eager loading problems
4. Semantic search for skill matching - Lightweight alternatives

### Expert Agents
1. AI-ML Expert - Token optimization, scaling thresholds
2. Strategic Planner - Two systems integration strategy
3. Product Strategist - Skill discovery UX recommendations

### Oracle Consultations
1. Architecture design - Two-tier loading, shared layer
2. Performance analysis - Caching strategy, scaling limits

---

## Conclusion

The context window management concerns are **valid but not blocking** for LIF-108. The current implementation works well for small skill counts (<50), and optimizations can be added incrementally as the ecosystem grows.

**Key Takeaway**: Implement LIF-108 as planned, with awareness that future scaling may require the two-tier loading architecture described in this analysis.
