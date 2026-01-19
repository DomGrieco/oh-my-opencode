# OpenCode Native Skills Support - Task Breakdown

**Linear Issue**: [LIF-108](https://linear.app/lifelogger/issue/LIF-108/add-opencode-native-skills-support)
**Created**: 2025-12-30
**Updated**: 2026-01-03 (FR-13 nested skills support added)
**Total Estimate**: 5h 36min (4h 40min implementation + 56min testing buffer)

## Summary

| Phase | Tasks | Estimate | With Buffer |
|-------|-------|----------|-------------|
| Phase 0: Shared Discovery Layer (NEW) | 6 tasks | 65min | 78min |
| Phase 1: Schema & Types | 5 tasks | 30min | 36min |
| Phase 2: Skill Loader Extension | 4 tasks | 45min | 54min |
| Phase 3: Skill Tool Extension | 5 tasks | 45min | 54min |
| Phase 4: Plugin Integration | 3 tasks | 30min | 36min |
| Phase 5: Context-Optimized Tool (NEW) | 3 tasks | 30min | 36min |
| Phase 6: Cache Integration (NEW) | 2 tasks | 20min | 24min |
| Phase 7: Documentation & Schema | 2 tasks | 15min | 18min |
| **Total** | **30 tasks** | **4h 40min** | **5h 36min** |

### Design Philosophy

This implementation follows a **context-first architecture**:
- **80% token reduction** in skill tool description
- **10-50x faster** discovery with caching
- **DRY** shared layer between loader and tool
- **Future-proof** for 100+ skills
- **Nested skills** for categorical organization (compatible with upstream OpenCode)

---

## Phase 0: Shared Discovery Layer (65min + 13min buffer) - NEW

**Goal**: Create shared skill discovery infrastructure with caching and nested skill support
**Checkpoint**: `bun run typecheck` passes, cache tests work, nested skills discovered
**Rationale**: Foundation for context-efficient skill loading with upstream compatibility

| ID | Task | Status | Estimate | Dependencies | Notes |
|----|------|--------|----------|--------------|-------|
| T000 | Create `SkillDirectory` and `SkillMetadata` interfaces | Not Started | 10min | - | src/shared/skill-discovery.ts |
| T001 | Implement `SkillCache` singleton with mtime invalidation | Not Started | 15min | T000 | src/shared/skill-discovery.ts |
| T002 | Implement `getSkillDirectories(config)` function | Not Started | 10min | T000 | src/shared/skill-discovery.ts |
| T003 | Implement `discoverSkillMetadata(dirs)` with glob patterns | Not Started | 15min | T001, T002 | Use `{skill,skills}/**/SKILL.md` for nested support (FR-13) |
| T004 | Implement `deriveSkillName()` for nested path handling | Not Started | 10min | T003 | Path-derived names for nested skills (e.g., `python/testing`) |
| T005 | Export from `src/shared/index.ts` | Not Started | 5min | T004 | src/shared/index.ts |

**Phase 0 Checkpoint**:
- [ ] `bun run typecheck` passes
- [ ] Cache invalidation works (file change detected)
- [ ] Discovery returns metadata without body content
- [ ] Cached discovery <10ms for 100 skills (batch stat optimization)
- [ ] Nested skills discovered correctly (e.g., `skill/python/testing/SKILL.md` → `python/testing`)

---

## Phase 1: Schema & Types (30min + 6min buffer)

**Goal**: Add configuration schema and type definitions for OpenCode skills
**Checkpoint**: `bun run typecheck` passes

| ID | Task | Status | Estimate | Dependencies | Notes |
|----|------|--------|----------|--------------|-------|
| T101 | Add `OpencodeConfigSchema` with `skills` boolean | Not Started | 10min | - | src/config/schema.ts |
| T102 | Export `OpencodeConfig` type | Not Started | 5min | T101 | src/config/schema.ts |
| T103 | Add `opencode` field to `OhMyOpenCodeConfigSchema` | Not Started | 5min | T102 | src/config/schema.ts |
| T104 | Update `SkillScope` type in loader types | Not Started | 5min | - | src/features/claude-code-skill-loader/types.ts |
| T105 | Update `SkillScope` type in tool types | Not Started | 5min | - | src/tools/skill/types.ts |

**Phase 1 Checkpoint**:
- [ ] `bun run typecheck` passes
- [ ] No new lint errors

---

## Phase 2: Skill Loader Extension (45min + 9min buffer)

**Goal**: Add functions to load skills from OpenCode directories
**Checkpoint**: New functions exported, typecheck passes
**Dependencies**: Phase 1 must be complete

| ID | Task | Status | Estimate | Dependencies | Notes |
|----|------|--------|----------|--------------|-------|
| T201 | Add `loadOpencodeGlobalSkills()` function | Not Started | 15min | T104 | src/features/claude-code-skill-loader/loader.ts |
| T202 | Add `loadOpencodeProjectSkills()` function | Not Started | 15min | T104 | src/features/claude-code-skill-loader/loader.ts |
| T203 | Export new functions from index.ts | Not Started | 5min | T201, T202 | src/features/claude-code-skill-loader/index.ts |
| T204 | Verify `loadSkillsFromDir` handles new scopes | Not Started | 10min | T104 | src/features/claude-code-skill-loader/loader.ts |

**Phase 2 Checkpoint**:
- [ ] `bun run typecheck` passes
- [ ] Functions exported correctly
- [ ] Can import `loadOpencodeGlobalSkills`, `loadOpencodeProjectSkills` from index

---

## Phase 3: Skill Tool Extension (45min + 9min buffer)

**Goal**: Update skill tool to discover skills from all 4 directories with priority ordering
**Checkpoint**: Skill tool discovers from all directories
**Dependencies**: Phase 1 must be complete (T105 for SkillScope type)

| ID | Task | Status | Estimate | Dependencies | Notes |
|----|------|--------|----------|--------------|-------|
| T301 | Add OpenCode directories to `discoverSkillsSync()` | Not Started | 10min | T105 | src/tools/skill/tools.ts |
| T302 | Add OpenCode directories to `discoverSkills()` | Not Started | 10min | T105 | src/tools/skill/tools.ts |
| T303 | Update `formatSkillList()` "no skills" message | Not Started | 10min | - | src/tools/skill/tools.ts |
| T304 | Update skill description to include scope source | Not Started | 10min | T301, T302 | src/tools/skill/tools.ts |
| T305 | Ensure priority order in skill deduplication | Not Started | 5min | T301, T302 | src/tools/skill/tools.ts |

**Phase 3 Checkpoint**:
- [ ] `bun run typecheck` passes
- [ ] Skill tool lists all 4 directories in "no skills" message

---

## Phase 4: Plugin Integration (30min + 6min buffer)

**Goal**: Integrate OpenCode skill loading into plugin entry point with correct priority
**Checkpoint**: `bun run build` passes, skills load from OpenCode directories
**Dependencies**: Phase 2 must be complete

| ID | Task | Status | Estimate | Dependencies | Notes |
|----|------|--------|----------|--------------|-------|
| T401 | Import new skill loader functions | Not Started | 5min | T203 | src/index.ts |
| T402 | Add `opencode.skills` config check | Not Started | 10min | T103 | src/index.ts |
| T403 | Integrate OpenCode skills into command merging with priority | Not Started | 15min | T401, T402 | src/index.ts |

**Phase 4 Checkpoint**:
- [ ] `bun run build` passes
- [ ] `bun run typecheck` passes
- [ ] Skills from `.opencode/skill/` load correctly

---

## Phase 5: Context-Optimized Tool Description (30min + 6min buffer) - NEW

**Goal**: Optimize skill tool for minimal context usage
**Checkpoint**: Tool description uses compact format (~15 tokens/skill)
**Dependencies**: Phase 0 and Phase 3 must be complete

| ID | Task | Status | Estimate | Dependencies | Notes |
|----|------|--------|----------|--------------|-------|
| T501 | Refactor `skillListForDescription` to compact format | Not Started | 10min | T003, T301 | src/tools/skill/tools.ts |
| T502 | Replace sync discovery with cached metadata access | Not Started | 10min | T501 | src/tools/skill/tools.ts |
| T503 | Add optional `scope` and `query` filter parameters | Not Started | 10min | T502 | src/tools/skill/tools.ts |

**Phase 5 Checkpoint**:
- [ ] Tool description shows only `- name (scope)` per skill
- [ ] Discovery uses cache (fast second call)
- [ ] Scope filter works: `skill({ scope: "opencode-project" })`
- [ ] Query filter works: `skill({ query: "python" })`

---

## Phase 6: Cache Integration & Hooks (20min + 4min buffer) - NEW

**Goal**: Wire cache to session lifecycle events
**Checkpoint**: Cache clears on session compact
**Dependencies**: Phase 0 must be complete

| ID | Task | Status | Estimate | Dependencies | Notes |
|----|------|--------|----------|--------------|-------|
| T601 | Wire skill loader to use shared discovery | Not Started | 10min | T004 | src/features/claude-code-skill-loader/loader.ts |
| T602 | Add cache clear on `session.compacted` event | Not Started | 10min | T004 | src/index.ts |

**Phase 6 Checkpoint**:
- [ ] Loader uses shared discovery layer
- [ ] Cache clears on session.compacted

---

## Phase 7: Documentation & Schema (15min + 3min buffer)

**Goal**: Update JSON schema and documentation
**Checkpoint**: Schema includes new config, README documents feature
**Dependencies**: Phase 1 must be complete (schema changes)

| ID | Task | Status | Estimate | Dependencies | Notes |
|----|------|--------|----------|--------------|-------|
| T701 | Run `bun run build:schema` to update JSON schema | Not Started | 5min | T103 | assets/oh-my-opencode.schema.json |
| T702 | Add documentation for OpenCode skills + context optimization | Not Started | 10min | T701 | README.md |

**Phase 7 Checkpoint**:
- [ ] JSON schema includes `opencode.skills` field
- [ ] README documents new configuration option
- [ ] README mentions context-efficient loading

---

## Dependency Graph

```
Phase 0 (Shared Discovery Layer) - FOUNDATION
├── T000 → T001, T002
├── T001 + T002 → T003
├── T003 → T004 (nested skill name derivation)
└── T004 → T005

Phase 1 (Schema & Types) - can run parallel with Phase 0
├── T101 → T102 → T103
├── T104 (independent)
└── T105 (independent)

Phase 2 (Skill Loader) - depends on T104, T005
├── T201 ─┬─→ T203
├── T202 ─┘
└── T204

Phase 3 (Skill Tool) - depends on T105, T005
├── T301 ─┬─→ T304, T305
├── T302 ─┘
└── T303 (independent)

Phase 4 (Plugin Integration) - depends on T103, T203
├── T401 ─┬─→ T403
└── T402 ─┘

Phase 5 (Context-Optimized Tool) - depends on T004, T301
├── T501 → T502 → T503

Phase 6 (Cache Integration) - depends on T005
├── T601 (wire loader)
└── T602 (session event)

Phase 7 (Documentation) - depends on T103
└── T701 → T702
```

### Critical Path

```
T000 → T001 → T003 → T004 → T501 → T502 → T503 (Context optimization + nested skills)
         ↘ T002 ↗

T101 → T102 → T103 → T402 → T403 (Config + Integration)

T104 → T201 → T203 → T401 → T403 (Loader)
     ↘ T202 ↗

T105 → T301 → T305 (Tool discovery)
     ↘ T302 ↗
```

---

## Manual Testing Checklist (Dogfooding)

### Basic Functionality Tests (After Phase 4)

| Test | Steps | Expected Result |
|------|-------|-----------------|
| OpenCode user skill | Create `~/.config/opencode/skill/test/SKILL.md`, run `/skill` | Skill appears with `(opencode-user)` |
| OpenCode project skill | Create `.opencode/skill/test/SKILL.md`, run `/skill` | Skill appears with `(opencode-project)` |
| Priority ordering | Same skill name in `.opencode/skill/` and `.claude/skills/` | OpenCode version wins |
| Config toggle off | Set `{"opencode": {"skills": false}}` | OpenCode paths not scanned |
| Backward compatibility | Existing `.claude/skills/` unchanged | All existing skills work |
| Nested skill (flat name) | Create `.opencode/skill/python/testing/SKILL.md` | Skill name is `python/testing` |
| Nested skill (frontmatter override) | Add `name: custom-name` to frontmatter | Skill name is `custom-name`, not path |
| Deep nesting | Create `.opencode/skill/a/b/c/SKILL.md` | Skill name is `a/b/c` |

### Context Optimization Tests (After Phase 6)

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Compact description | Inspect skill tool description | Shows `- name (scope)` only, no full descriptions |
| Token count | Count tokens in skill list | ~15 tokens per skill (not ~75) |
| Cache hit | Run skill discovery twice | Second call <10ms (check logs) |
| Cache invalidation | Modify SKILL.md, run discovery | Updated content reflected |
| Scope filter | Run `skill({ scope: "opencode-project" })` | Only project skills shown |
| Session compact | Trigger compact, verify discovery | Full re-discovery (cache cleared) |

### Performance Tests (After Phase 6)

| Test | Metric | Target |
|------|--------|--------|
| 10 skills discovery (cold) | Time | <100ms |
| 10 skills discovery (cached) | Time | <5ms |
| 50 skills discovery (cold) | Time | <300ms |
| 50 skills discovery (cached) | Time | <10ms |
| Token overhead (50 skills) | Tokens | <1000 tokens |

---

## Notes

- **No test framework**: All testing is manual via dogfooding
- **Build validation**: Run `bun run build && bun run typecheck` after each phase
- **Incremental commits**: Commit after each phase checkpoint passes
- **Rollback point**: Tag current state before starting implementation

## References

- Spec: `.cursor/specs/LIF-108-feat-opencode-native-skills-support/spec.md`
- Plan: `.cursor/specs/LIF-108-feat-opencode-native-skills-support/plan.md`
