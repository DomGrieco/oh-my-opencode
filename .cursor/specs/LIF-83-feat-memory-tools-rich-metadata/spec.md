# Memory Tools Rich Metadata Enhancement

**Linear Issue**: [LIF-83](https://linear.app/lifelogger/issue/LIF-83/memory-tools-rich-metadata-enhancement)
**Created**: 2025-12-26
**Updated**: 2025-12-28
**Status**: Ready for Planning

## Parent Context

> This is a scope extension of [LIF-73](https://linear.app/lifelogger/issue/LIF-73/self-improving-chat-review-system-chat-auditor-agent-context-threshold): Self-Improving Chat Review System
> 
> Parent Status: In Review
> Parent Branch: `hello/lif-73-self-improving-chat-review-system-chat-auditor-agent-context`

## Summary

Enhance memory tools with rich metadata and **self-maintaining infrastructure** to enable intelligent agent decisions and close the self-improving loop. The memory system MUST be **autonomous and require zero manual maintenance** from human users.

## Core Principle: Self-Maintaining Memory System

The memory system MUST be fully autonomous:
- **Auto-indexing**: Index updates automatically on every write (write-through)
- **Self-healing**: Detects and repairs drift on startup (reconciliation)
- **Zero manual maintenance**: No rebuild commands, no manual index updates
- **Graceful degradation**: Works even if index is corrupted (falls back to file scan)
- **Governance enforcement**: Prevents rogue agents from bypassing memory tools

---

## Background

During LIF-73 review and subsequent analysis, we identified critical gaps in the memory system:

1. **No metadata**: `memory_list` returns only file paths without context
2. **No filtering**: Agents must read each file to understand contents (wasted tokens)
3. **No index**: O(n) queries don't scale to thousands of memories
4. **No governance**: Rogue agents can bypass memory tools with direct `edit`/`write`
5. **No temporal tracking**: No way to know when facts became true or expired

**Research inspiration**: Graphiti knowledge graphs (bi-temporal model, entity linking) adapted for file-based storage without graph database overhead.

---

## Enhancements

### 1. Rich Metadata in `memory_list`

* Add frontmatter parsing: description, tags, lastModified, sizeTokens, confidence, source
* Enables agents to filter by tags, sort by recency, budget tokens, trust high-confidence memories
* **Pagination support**: limit, offset, hasMore for large result sets
* **Sorting options**: sortBy (created, updated, title, path), sortOrder (asc, desc)
* **Aggregations**: counts by type, tag, status for system overview
* **Filtering**: filterByType, filterByTags, filterByStatus, filterByDateRange

### 2. `memory_stats` Tool

* Memory system health metrics: totalFiles, totalTokens, byCategory, staleCount, lowConfidenceCount
* Enables agents to assess memory health, trigger cleanup, identify gaps
* **Index health status**: lastReconciled, driftDetected, orphanedEntries
* **Per-path stats**: breakdown by memory directory (context/memory/, context/learnings/, etc.)

### 3. `memory_validate` Tool

* Mark memories as validated with validatedBy, validatedAt, notes
* Closes the self-improving loop by allowing human/agent validation of extracted learnings
* Updates frontmatter with validation metadata
* Triggers index update for validation status

### 4. `memory_link` Tool

* Create relationships between memories: implements, supersedes, relates, contradicts
* Enables lightweight knowledge graph traversal without full graph database
* Updates `relatedTo`, `supersedes`, `supersededBy` fields in both linked memories
* Bidirectional linking: when A links to B, B's `relatedTo` also updated

### 5. Frontmatter Schema (Bi-Temporal)

Standardized schema with **bi-temporal timestamps** (inspired by Graphiti knowledge graphs):

```yaml
---
# Required (auto-generated if not provided)
id: mem-2025-001                    # Unique identifier
title: "Memory Title"               # Human-readable title
created: 2025-01-15T10:00:00Z       # When memory was created (ingestion time)
updated: 2025-12-28T00:00:00Z       # When memory was last modified

# Recommended
description: "Brief summary for discoverability"
type: decision | learning | fact | preference | context | glossary
tags: [architecture, tooling, orchestration]
status: draft | active | deprecated | superseded

# Bi-temporal (optional) - for temporal facts
validFrom: 2025-01-15T00:00:00Z     # When this fact became true in reality
validUntil: 2025-06-01T00:00:00Z    # When this fact stopped being true (if applicable)

# Provenance
source: manual | extraction | import | migration
sourceSession: abc123               # Session ID if auto-extracted
confidence: 0.85                    # 0-1 reliability score (for learnings)

# Validation
validated: true
validatedBy: human | agent
validatedAt: 2025-12-28T00:00:00Z

# Relationships (lightweight graph)
relatedTo: [mem-002, mem-003]       # Related memories
supersedes: mem-001                 # Memory this replaces
supersededBy: mem-004               # Memory that replaced this
implements: LIF-83                  # Linear issue this implements
---
```

### 6. `memory_write` Metadata Support

* Accept optional metadata parameter alongside content
* **Auto-generate** `id`, `created`, `updated` if not provided
* **Auto-extract** title from first heading if not provided
* Prepend YAML frontmatter to content automatically
* **Write-through indexing**: Update `_index.json` atomically with file write
* Backward compatible: metadata parameter is optional, plain content still works

```typescript
// Example usage
memory_write({
  fileName: "decisions/ADR-001",
  content: "# Use Bun Exclusively\n\nWe decided to use Bun...",
  metadata: {
    title: "Use Bun Exclusively",
    description: "Decision to use Bun as the only package manager",
    type: "decision",
    tags: ["architecture", "tooling"],
    validFrom: "2025-01-15T00:00:00Z"
  }
})
```

### 7. `memory_read` Metadata Extraction

* Parse and return frontmatter alongside content
* Return structured metadata object in result
* Handle files without frontmatter gracefully (metadata: null)

```typescript
// Return format
{
  success: true,
  content: "# Use Bun Exclusively\n\nWe decided to use Bun...",
  metadata: {
    id: "mem-2025-001",
    title: "Use Bun Exclusively",
    type: "decision",
    tags: ["architecture", "tooling"],
    created: "2025-01-15T10:00:00Z",
    updated: "2025-12-28T00:00:00Z",
    validFrom: "2025-01-15T00:00:00Z"
  }
}
```

### 8. Auto-Maintaining Index System (CRITICAL)

**Zero manual maintenance required.** The index maintains itself automatically.

#### 8.1 Index Structure (`_index.json`)

Each memory directory gets its own index file:
- `context/memory/_index.json`
- `context/learnings/_index.json`

```json
{
  "$schema": "./memory-index.schema.json",
  "version": 1,
  "generatedAt": "2025-12-28T00:00:00Z",
  "lastReconciled": "2025-12-28T00:00:00Z",
  
  "entries": {
    "mem-001": {
      "path": "decisions/ADR-001.md",
      "title": "Use Bun Exclusively",
      "description": "Decision to use Bun as package manager",
      "type": "decision",
      "tags": ["architecture", "tooling"],
      "status": "active",
      "created": "2025-01-15T10:00:00Z",
      "updated": "2025-12-28T00:00:00Z",
      "validFrom": "2025-01-15T00:00:00Z",
      "checksum": "sha256:abc123...",
      "relatedTo": ["mem-002"],
      "confidence": 0.95
    }
  },
  
  "indexes": {
    "byType": { "decision": ["mem-001"], "learning": ["mem-003"] },
    "byTag": { "architecture": ["mem-001", "mem-002"] },
    "byStatus": { "active": ["mem-001"], "deprecated": ["mem-005"] }
  },
  
  "stats": {
    "totalEntries": 47,
    "byType": { "decision": 12, "learning": 28, "fact": 7 },
    "staleCount": 3,
    "lowConfidenceCount": 5
  }
}
```

#### 8.2 Write-Through Indexing

On every `memory_write`, `memory_edit`, `memory_delete`, `memory_link`, `memory_validate`:
1. Perform the file operation
2. Compute checksum of new content
3. Update/insert/remove entry in `_index.json`
4. Rebuild affected indexes (byType, byTag, byStatus)
5. Update stats
6. Atomic write of index file (write to temp, then rename)

#### 8.3 Startup Reconciliation (Self-Healing)

On plugin initialization, for each memory directory:
1. Load `_index.json` (or create empty if missing)
2. Scan all `.md` files in directory
3. For each file:
   - If missing from index → parse frontmatter, add entry
   - If checksum differs → re-parse frontmatter, update entry
4. For each index entry:
   - If file missing → remove orphaned entry
5. Rebuild all indexes from entries
6. Save reconciled index with `lastReconciled` timestamp
7. Log any drift detected (for observability)

#### 8.4 Graceful Degradation

If `_index.json` is corrupted, missing, or unparseable:
- Log warning (not error)
- Rebuild index from scratch by scanning all files
- Continue normal operation
- Never fail or block on index issues

### 9. Migration Strategy

For existing memory files without frontmatter:

* `memory_read` returns `metadata: null` for legacy files (backward compatible)
* `memory_list` includes legacy files with path-only entries (no metadata fields)
* Reconciliation adds legacy files to index with `path` and `checksum` only
* Optional `memory_migrate` command to batch-add frontmatter to legacy files:
  - Auto-generates `id` from filename
  - Auto-extracts `title` from first heading
  - Sets `created` from file mtime
  - Sets `source: migration`
* Mixed state (some files with frontmatter, some without) works correctly

### 10. Governance Hook: Memory Path Enforcement

Prevent rogue agents from bypassing memory tools and breaking the self-maintaining system.

#### Hook: `governance-memory-enforcer`

* **Blocks**: Direct `edit`/`write` tool usage on memory paths
* **Allows**: `memory_write`, `memory_edit`, `memory_delete`, `memory_link`, `memory_validate`
* **Guides**: Blocked attempts show helpful message directing to correct tools
* **Configurable**: Can be disabled via config for edge cases

**Protected paths:**
- `context/memory/`
- `context/learnings/`
- `.cursor/memory/`

**Blocked message example:**
```
⚠️ Memory Path Detected

Direct edits to memory files are blocked to maintain index integrity.

Use the memory tools instead:
- memory_write - Create/update memories (auto-manages frontmatter + index)
- memory_edit - Edit existing memories (preserves metadata)
- memory_delete - Remove memories (cleans up index)

Why? Memory tools auto-generate frontmatter, update the index, and maintain 
the self-improving system. Direct edits bypass these safeguards.
```

**Rationale:** Memory tools auto-manage frontmatter and index. Direct edits bypass these safeguards, causing:
- Missing/malformed frontmatter
- Index drift (stale queries until next reconciliation)
- Broken relationships
- Lost metadata

---

## User Stories

### US-1: Intelligent Memory Selection

**As an** AI agent
**I want** to see memory descriptions, tags, and confidence scores when listing
**So that** I can intelligently select relevant memories without reading each one

**Acceptance Criteria:**
```gherkin
Given memories with frontmatter metadata
When I call memory_list with includeMetadata=true
Then I receive metadata for each file (description, tags, confidence, etc.)
And I can filter by type, tags, or status
And I can paginate results for large collections
```

### US-2: Self-Maintaining Index

**As a** developer using oh-my-opencode
**I want** the memory index to maintain itself automatically
**So that** I never need to run manual rebuild commands

**Acceptance Criteria:**
```gherkin
Given memory files in context/memory/
When I use memory_write to create/update a file
Then the _index.json is updated atomically
And when the plugin starts
Then any drift between index and files is auto-repaired
And I never need to manually maintain the index
```

### US-3: Rogue Agent Protection

**As a** system administrator
**I want** to prevent agents from bypassing memory tools
**So that** the index stays in sync and metadata is preserved

**Acceptance Criteria:**
```gherkin
Given an agent attempts to use edit() on context/memory/foo.md
When the governance-memory-enforcer hook intercepts
Then the edit is blocked with a helpful message
And the agent is directed to use memory_write instead
```

### US-4: Temporal Fact Tracking

**As an** AI agent tracking project decisions
**I want** to record when facts became true and when they expired
**So that** I can understand the evolution of project knowledge

**Acceptance Criteria:**
```gherkin
Given a decision that was made on 2025-01-15
And that decision was superseded on 2025-06-01
When I write the memory with validFrom and validUntil
Then the temporal bounds are preserved in frontmatter
And I can query for currently-valid facts
```

---

## Acceptance Criteria

### Self-Maintaining Requirements (Critical)

- [ ] **AC-AUTO-1**: Index updates automatically on `memory_write` (write-through, no manual rebuild)
- [ ] **AC-AUTO-2**: Index updates automatically on `memory_edit`, `memory_delete`, `memory_link`, `memory_validate`
- [ ] **AC-AUTO-3**: Index self-heals on plugin startup (reconciliation detects and fixes drift)
- [ ] **AC-AUTO-4**: Corrupted/missing index auto-rebuilds from files (graceful degradation)
- [ ] **AC-AUTO-5**: No user-facing commands required to maintain index
- [ ] **AC-AUTO-6**: Works correctly with mixed files (with/without frontmatter)

### Metadata Requirements

- [ ] **AC-META-1**: `memory_write` accepts optional metadata parameter
- [ ] **AC-META-2**: Auto-generates `id`, `created`, `updated` when not provided
- [ ] **AC-META-3**: Auto-extracts `title` from first heading when not provided
- [ ] **AC-META-4**: `memory_read` returns parsed frontmatter as metadata object
- [ ] **AC-META-5**: Bi-temporal fields (`validFrom`, `validUntil`) supported and indexed
- [ ] **AC-META-6**: Files without frontmatter return `metadata: null` (backward compatible)

### Query Requirements

- [ ] **AC-QUERY-1**: `memory_list` supports filtering by type, tags, status, date range
- [ ] **AC-QUERY-2**: `memory_list` supports pagination (limit, offset, returns hasMore)
- [ ] **AC-QUERY-3**: `memory_list` supports sorting (created, updated, title; asc/desc)
- [ ] **AC-QUERY-4**: Index-based queries are O(1) for tag/type/status lookups
- [ ] **AC-QUERY-5**: `memory_stats` returns health metrics including index status

### Relationship Requirements

- [ ] **AC-REL-1**: `relatedTo` array links memories without graph database
- [ ] **AC-REL-2**: `supersedes`/`supersededBy` track memory evolution
- [ ] **AC-REL-3**: `memory_link` tool manages relationships bidirectionally
- [ ] **AC-REL-4**: Relationships are indexed for traversal queries

### Governance Requirements

- [ ] **AC-GOV-1**: Direct `edit` to memory paths is blocked with guidance message
- [ ] **AC-GOV-2**: Direct `write` to memory paths is blocked with guidance message
- [ ] **AC-GOV-3**: Memory tools (`memory_write`, `memory_edit`, etc.) are allowed through
- [ ] **AC-GOV-4**: Hook is configurable (can disable via `hooks.governance-memory-enforcer.enabled: false`)
- [ ] **AC-GOV-5**: Protected paths are configurable

### Validation Requirements

- [ ] **AC-VAL-1**: `memory_validate` updates frontmatter with validation metadata
- [ ] **AC-VAL-2**: Validation status is indexed and queryable
- [ ] **AC-VAL-3**: `memory_stats` includes validation metrics (validatedCount, pendingCount)

---

## Non-Goals (Explicitly Out of Scope)

These are intentionally excluded to keep the system lightweight:

- ❌ **Full graph database** (Neo4j, FalkorDB, etc.) - overkill for ~1000s of files
- ❌ **LLM-based entity extraction** on write - adds latency/cost to every operation
- ❌ **Semantic/vector search** - simple text/tag search is sufficient for now
- ❌ **Real-time embedding generation** - cost prohibitive, not needed at this scale
- ❌ **Complex deduplication algorithms** (MinHash, LSH) - manual review is fine
- ❌ **File watchers for external changes** - startup reconciliation is sufficient

---

## Technical Notes

### Why Write-Through + Reconciliation?

| Approach | Prevention | Self-Healing | Complexity | Choice |
|----------|------------|--------------|------------|--------|
| Manual rebuild | ❌ None | ❌ User action | Low | ❌ |
| File watcher only | ✅ Real-time | ⚠️ Race conditions | High | ❌ |
| Write-through only | ✅ Our writes | ❌ External edits | Medium | ❌ |
| Reconciliation only | ❌ Reactive | ✅ Startup | Low | ❌ |
| **Write-through + Reconciliation** | ✅ Our writes | ✅ Safety net | Medium | ✅ |

**Decision**: Write-through for writes we control + startup reconciliation as safety net = zero maintenance.

### Why Governance Hook?

Defense in depth:
1. **Layer 1 (Proactive)**: Governance hook blocks rogue writes before they happen
2. **Layer 2 (Reactive)**: Startup reconciliation fixes any drift that slips through
3. **Layer 3 (Resilience)**: Graceful degradation if index corrupted

### Performance Expectations

| Operation | Expected Latency | Notes |
|-----------|------------------|-------|
| `memory_write` | ~10-20ms | File write + index update |
| `memory_read` | ~5-10ms | File read + frontmatter parse |
| `memory_list` (indexed) | ~5ms | O(1) index lookup |
| `memory_list` (full scan) | ~100-500ms | Fallback for 1000 files |
| Startup reconciliation | ~200-1000ms | One-time, scales with file count |

### Index File Size

- ~100 bytes per entry (compressed JSON)
- 1000 memories ≈ 100KB index file
- 10000 memories ≈ 1MB index file
- Well within acceptable limits for atomic read/write

---

## Implementation Order (Suggested)

| Phase | Enhancements | Priority | Effort |
|-------|--------------|----------|--------|
| **Phase 1** | 5, 6, 7, 8 | P0 | ~8h |
| **Phase 2** | 1, 10 | P0 | ~4h |
| **Phase 3** | 2, 3, 4 | P1 | ~4h |
| **Phase 4** | 9 | P2 | ~2h |

**Phase 1** establishes the self-maintaining foundation (frontmatter + auto-index).
**Phase 2** adds query power and governance protection.
**Phase 3** adds tooling for validation and linking.
**Phase 4** handles migration of legacy files.

---

## Dependencies

- LIF-73 must be merged (provides base memory tools)
- Uses existing `src/shared/frontmatter.ts` utilities
- Uses existing governance hook patterns from `src/hooks/governance-*`

---

## Related

- **Parent**: LIF-73 (Self-Improving Chat Review System)
- **Sibling**: LIF-75 (Native Serena Replacement) - memory policy integration
- **Inspiration**: Graphiti bi-temporal model (lightweight adaptation, no graph DB)
- **Depends on**: Existing memory tools from LIF-73 (`memory_write`, `memory_read`, `memory_list`, `memory_edit`, `memory_delete`)
- **Pattern**: Similar to `governance-docs-delegation` hook for document protection

---

## Open Questions

- [RESOLVED] Token estimation algorithm → Use simple char/4 approximation
- [RESOLVED] Should we use semantic search? → Deferred to future issue, text/tag search sufficient for now
- [RESOLVED] Should we use a graph database? → No, file-based with JSON index is sufficient

---

*Originally created via /scope-extend from LIF-73.*
*Updated 2025-12-28: Added auto-indexing (Enhancement 8), bi-temporal timestamps (Enhancement 5), memory_write/read metadata (Enhancements 6-7), governance hook (Enhancement 10), migration strategy (Enhancement 9), comprehensive acceptance criteria, and self-maintaining requirements. Research inspired by Graphiti knowledge graph patterns.*
