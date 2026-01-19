# OpenCode Native Skills Support

**Linear Issue**: [LIF-108](https://linear.app/lifelogger/issue/LIF-108/add-opencode-native-skills-support)
**Created**: 2025-12-30
**Status**: Ready for Planning

## Overview

Enable oh-my-opencode to discover and load skills from OpenCode's native skill directories (`.opencode/skill/` and `~/.config/opencode/skill/`) in addition to the currently supported Claude Code directories (`.claude/skills/`). This unifies skill loading across both ecosystems, allowing users to organize skills using OpenCode conventions while maintaining backward compatibility with Claude Code.

## Problem Statement

### Current State

oh-my-opencode currently loads skills exclusively from Claude Code-compatible directories:
- `~/.claude/skills/` (user-level skills)
- `./.claude/skills/` (project-level skills)

Skills are loaded via two components:
1. **Skill Loader** (`src/features/claude-code-skill-loader/`) - Loads skills as slash commands at plugin startup
2. **Skill Tool** (`src/tools/skill/`) - Runtime tool for discovering and executing skills

### Issues

1. **Ecosystem Fragmentation**: Users who prefer OpenCode conventions must duplicate their skills in Claude Code directories or miss functionality entirely

2. **Configuration Inconsistency**: Commands already support OpenCode directories (`~/.config/opencode/command/`, `.opencode/command/`), but skills do not, creating a confusing asymmetry

3. **OpenCode Adoption Barrier**: New OpenCode users expect skills to work from OpenCode-native paths; having to learn Claude Code conventions creates friction

4. **Missing Permission System**: OpenCode has a permission system (`permission.skill` with `allow`/`deny`/`ask` values) that oh-my-opencode doesn't integrate with

## User Stories

### US-1: As an OpenCode user
I want my skills in `~/.config/opencode/skill/` to be automatically discovered
So that I can use OpenCode conventions without learning Claude Code paths

**Acceptance Criteria:**
- [ ] Skills in `~/.config/opencode/skill/<name>/SKILL.md` are discovered
- [ ] These skills appear in the skill tool's available skills list
- [ ] Skills can be executed via the skill tool
- [ ] Skills are loaded as slash commands at startup

### US-2: As a project maintainer
I want to place project-specific skills in `.opencode/skill/`
So that my team can use skills without depending on Claude Code directories

**Acceptance Criteria:**
- [ ] Skills in `.opencode/skill/<name>/SKILL.md` are discovered
- [ ] Project-level OpenCode skills take precedence over user-level OpenCode skills
- [ ] Skills work identically to Claude Code skills (references, scripts, assets)
- [ ] Skills load correctly from git worktrees and nested project structures
- [ ] Nested skills are supported (e.g., `.opencode/skill/python/testing/SKILL.md` → `python/testing`)

### US-3: As a user with skills in multiple locations
I want clear, predictable priority ordering when skill names conflict
So that I understand which skill will execute

**Acceptance Criteria:**
- [ ] Priority order is clearly defined and documented
- [ ] Project-level skills override user-level skills
- [ ] OpenCode skills and Claude Code skills of the same name follow consistent rules
- [ ] No silent conflicts - conflicts are discoverable via the skill tool

### US-4: As a Claude Code migrator
I want my existing `.claude/skills/` to continue working unchanged
So that adopting OpenCode features doesn't break my workflow

**Acceptance Criteria:**
- [ ] Existing Claude Code skills continue to work
- [ ] No configuration changes required for backward compatibility
- [ ] Claude Code skill format (`SKILL.md` with frontmatter) remains supported

### US-5: As a plugin administrator
I want to control which skill sources are enabled
So that I can enforce organizational policies on skill loading

**Acceptance Criteria:**
- [ ] Skills from all sources can be disabled individually via configuration
- [ ] Existing `claude_code.skills` toggle continues to control Claude Code paths
- [ ] New toggle available for OpenCode skill paths
- [ ] Default behavior loads from all enabled sources

### US-6: As an agent with many available skills
I want skill metadata to be loaded efficiently without bloating my context
So that I can work effectively without wasting tokens on unused skill definitions

**Acceptance Criteria:**
- [ ] Skill tool description contains compact skill list (names only, ~15 tokens/skill)
- [ ] Full skill content loaded only when skill is invoked
- [ ] Skill discovery uses cached metadata (not re-reading files every invocation)
- [ ] Cache invalidated when skill files change (mtime-based)

### US-7: As an agent looking for a specific capability
I want to search and filter skills by name, category, or scope
So that I can find the right skill without scanning all descriptions

**Acceptance Criteria:**
- [ ] Skill tool supports optional `query` parameter for filtering
- [ ] Search matches against skill name and description
- [ ] Filter by scope (e.g., only project skills, only opencode skills)
- [ ] Results ranked by relevance

## Requirements

### Functional Requirements

#### FR-1: OpenCode Global Skill Discovery
The system shall discover skills from the user's global OpenCode skill directory (`~/.config/opencode/skill/`).

#### FR-2: OpenCode Project Skill Discovery
The system shall discover skills from the current project's OpenCode skill directory (`.opencode/skill/`).

#### FR-3: Unified Skill Loading
Skills from all enabled directories shall be loaded with consistent behavior regardless of source location.

#### FR-4: Priority Resolution and Deduplication
When skills with the same name exist in multiple directories, the system shall load **only the highest-priority skill** and skip duplicates. Priority order (highest to lowest):
1. Project-level OpenCode (`.opencode/skill/`)
2. Project-level Claude Code (`.claude/skills/`)
3. User-level OpenCode (`~/.config/opencode/skill/`)
4. User-level Claude Code (`~/.claude/skills/`)

Duplicate skills (same name, lower priority) shall NOT be loaded. This prevents confusion and ensures predictable behavior when users have the same skill in both ecosystems.

#### FR-5: Scope Identification
Each loaded skill shall include its scope for disambiguation:
- `opencode-project` - From `.opencode/skill/`
- `opencode-user` - From `~/.config/opencode/skill/`
- `project` - From `.claude/skills/` (existing)
- `user` - From `~/.claude/skills/` (existing)

#### FR-6: Configuration Toggles
The system shall support enabling/disabling skill sources via configuration:
- Existing: `claude_code.skills` (boolean, default: `true`) - Controls Claude Code directories (`~/.claude/skills/`, `.claude/skills/`)
- New: `opencode.skills` (boolean, default: `true`) - Controls OpenCode directories (`~/.config/opencode/skill/`, `.opencode/skill/`)

**Behavior when disabled:**
- When `opencode.skills` is `false`, skills from `.opencode/skill/` and `~/.config/opencode/skill/` shall not be discovered or loaded.
- When `claude_code.skills` is `false`, skills from `.claude/skills/` and `~/.claude/skills/` shall not be discovered or loaded.
- Both toggles default to `true`, enabling all skill sources.

#### FR-7: SKILL.md Compatibility
Skills from OpenCode directories shall support the same SKILL.md format as Claude Code skills, including:
- Frontmatter (name, description, license, allowed-tools, metadata)
- Markdown body with skill instructions
- References, scripts, and assets subdirectories

#### FR-8: User-Facing Messages
User-facing messages in the skill tool shall accurately reflect all enabled skill directories. Error messages such as "No skills found" shall reference all configured directories, not just Claude Code paths.

#### FR-9: Two-Tier Loading Architecture
The system shall implement a two-tier loading strategy for context efficiency:
- **Tier 1 (Always in context)**: Skill names and scopes only (~15 tokens/skill)
- **Tier 2 (On-demand)**: Full skill content including description, body, and references

This reduces constant context overhead from ~75 tokens/skill to ~15 tokens/skill (80% reduction).

#### FR-10: Shared Skill Discovery Layer
The system shall implement a shared discovery layer used by both:
- Startup loader (`src/features/claude-code-skill-loader/`)
- Runtime tool (`src/tools/skill/`)

This layer shall provide:
- `getSkillDirectories(config)` → List of directories to scan with priorities
- `discoverSkillMetadata(dirs)` → Metadata-only discovery (name, description, scope, path)
- `loadSkillContent(path)` → On-demand full content loading

#### FR-11: Skill Caching with Invalidation
The system shall cache discovered skill metadata with the following behavior:
- Cache persists for the process lifetime (in-memory)
- Cache entries include file modification time (mtime)
- Cache entries invalidated when source file mtime changes
- Cache cleared on `session.compacted` event
- Optional TTL (default: none for local files)

#### FR-12: Skill Discovery and Filtering
The skill tool shall support discovery operations:
- List all available skills with compact metadata
- Filter by scope (`opencode-project`, `project`, `opencode-user`, `user`)
- Search by skill name (substring match)
- Search by description keywords (optional)

#### FR-13: Nested Skill Directory Support
The system shall support nested skill directories to enable organizational hierarchy. Skills shall be discovered using glob patterns that match nested structures:
- OpenCode directories: `{skill,skills}/**/SKILL.md`
- Claude Code directories: `skills/**/SKILL.md`

**Nested skill naming**:
- Skill names for nested skills shall be derived from the relative path
- Example: `.opencode/skill/python/testing/SKILL.md` → skill name `python/testing`
- The frontmatter `name` field, if present, takes precedence over path-derived names
- Nested names use forward slashes (`/`) as separators, matching upstream OpenCode conventions

**Benefits**:
- Enables categorical organization (e.g., `python/`, `typescript/`, `workflows/`)
- Compatibility with community skill libraries like [obra/superpowers](https://github.com/obra/superpowers)
- Matches upstream OpenCode's glob pattern for full compatibility

### Non-Functional Requirements

#### NFR-1: Performance
Skill discovery shall complete within 500ms for up to 100 skills across all directories on local filesystem. Network-mounted directories may exceed this target.

#### NFR-2: Backward Compatibility
All existing Claude Code skill configurations and behaviors shall remain unchanged.

#### NFR-3: Error Resilience
Invalid or unreadable skill directories shall be skipped without affecting discovery of valid skills.

#### NFR-4: Transparency
The skill tool shall clearly indicate which directory each skill was loaded from.

#### NFR-5: Context Efficiency
The skill system shall minimize context window usage:
- Skill list in tool description: <20 tokens per skill (names only)
- Safe scaling: Up to 100 skills without performance degradation
- Warning threshold: Log when skill overhead exceeds 3,000 tokens
- Full skill content: Only loaded when explicitly invoked

#### NFR-6: Cache Performance
Skill discovery with caching shall complete within:
- First discovery: <500ms for 100 skills
- Cached discovery: <10ms for 100 skills
- Cache invalidation check: <1ms per skill (stat only)

## Scope

### In Scope

- Discovery of skills from `.opencode/skill/` (project)
- Discovery of skills from `~/.config/opencode/skill/` (user)
- Loading OpenCode skills as slash commands
- Runtime skill tool support for OpenCode paths
- Configuration toggle for OpenCode skill sources
- Priority ordering when names conflict
- Scope labeling in skill descriptions
- **Context-optimized loading** (two-tier: metadata + on-demand content)
- **Shared skill discovery layer** (DRY between loader and tool)
- **Skill caching with invalidation** (file mtime-based)
- **Enhanced skill discovery** (search/filter by name, category, scope)
- **Nested skill directories** (hierarchical organization via `**/SKILL.md` glob)

### Out of Scope

- OpenCode's `permission.skill` system integration (future enhancement)
- OpenCode's `compatibility` field validation (OpenCode-specific vs universal skills)
- Skill creation/scaffolding tools
- Skill marketplace or remote skill loading
- Migration tools for Claude Code to OpenCode paths
- Changes to how skills are executed (only discovery/loading changes)
- Semantic/embedding-based skill search (overkill for <200 skills)
- Vector databases or external search services

## Assumptions

1. **SKILL.md Format Compatibility**: OpenCode and Claude Code use compatible SKILL.md formats with optional OpenCode-specific fields that can be safely ignored

2. **Directory Structure**: Skills support both flat (`<name>/SKILL.md`) and nested (`<category>/<name>/SKILL.md`) directory structures. Optional subdirectories (`references/`, `scripts/`, `assets/`) are supported at the skill level.

3. **No Breaking Changes**: Users with existing Claude Code skills will not need to modify anything

4. **Single Active Project**: Skills are loaded relative to `process.cwd()`; git worktree scenarios work by changing the working directory

5. **Nested Skill Naming**: For nested skills, the skill name is derived from the relative path unless overridden by frontmatter `name` field. Path separators are normalized to forward slashes (`/`).

## Dependencies

- **Existing Skill Loader**: `src/features/claude-code-skill-loader/` must be extended, not replaced
- **Existing Skill Tool**: `src/tools/skill/` must be extended to discover from new paths
- **Config Schema**: `src/config/schema.ts` needs new configuration options
- **File Utilities**: Existing `resolveSymlink`, `parseFrontmatter` utilities are reusable

## Success Criteria

| Metric | Target |
|--------|--------|
| Skills from `~/.config/opencode/skill/` discovered | 100% |
| Skills from `.opencode/skill/` discovered | 100% |
| Existing Claude Code skills continue working | 100% |
| Skill discovery time (100 skills) | < 500ms |
| Configuration toggles work correctly | All combinations tested |

## Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| SKILL.md format differences between ecosystems | Low | Medium | Support superset of both formats, ignore unknown fields |
| Name collision confusion | Medium | Medium | Clear scope labels, documented priority order |
| Performance degradation with 4 directories | Low | Low | Parallel directory scanning, lazy loading |
| Breaking changes to Claude Code users | Low | High | Extensive backward compatibility testing |

## Design Decisions

### DD-1: Extend Existing Loaders
**Decision**: Extend the existing claude-code-skill-loader rather than creating a separate opencode-skill-loader.

**Context**: Need to add OpenCode skill paths while maintaining a unified skill loading system.

**Options Considered**:
1. Separate loader for OpenCode skills
2. Extend existing loader with new paths
3. Create unified skill loader from scratch

**Rationale**: Option 2 minimizes code duplication, maintains consistent behavior, and reduces maintenance burden. The loader already handles all skill loading logic; only path sources need expansion.

### DD-2: Priority Order (Project > User, OpenCode > Claude)
**Decision**: OpenCode project skills take highest priority, followed by Claude project, then OpenCode user, then Claude user.

**Context**: Users may have skills with the same name in multiple locations.

**Options Considered**:
1. OpenCode before Claude at each level
2. Claude before OpenCode at each level
3. Configurable priority
4. Error on conflicts

**Rationale**: OpenCode paths represent the user's current preferred workflow. Project-level always overrides user-level (consistent with commands). This matches user expectations when explicitly using OpenCode conventions.

### DD-3: Additive Configuration Toggles
**Decision**: Add new `opencode.skills` toggle rather than modifying existing `claude_code.skills`.

**Context**: Users may want to enable/disable each source independently.

**Options Considered**:
1. Single toggle for all skills
2. Separate toggles per ecosystem
3. Per-directory toggles

**Rationale**: Option 2 provides flexibility for organizations that want to standardize on one ecosystem while keeping defaults that enable both.

### DD-4: Duplicate Handling (Single Load, No Warnings)
**Decision**: When a skill with the same name exists in multiple directories, load only the highest-priority version (per FR-4). Do not log warnings for duplicates.

**Context**: Users migrating between ecosystems may have the same skill in both `.claude/skills/` and `.opencode/skill/`. Need to define how duplicates are handled.

**Options Considered**:
1. Load both and let execution fail on ambiguity
2. Load highest-priority only, warn about skipped duplicates
3. Load highest-priority only, silent (no warning)
4. Error on duplicates, require user to resolve

**Rationale**: Option 3 is chosen because:
- Duplicates are **expected behavior** during migration, not errors
- Priority ordering is intentional (project overrides user, OpenCode overrides Claude)
- Warnings create noise for intentional overrides
- Users can discover all skills (with sources) via the skill tool if they need visibility

**Implementation Note**: The skill tool's list functionality shall show all discovered skills with their sources, allowing users to identify duplicates if needed.

## Open Questions

1. **Future Permission System**: Should we plan the architecture to accommodate OpenCode's `permission.skill` system in a future iteration?

2. **Compatibility Field**: OpenCode skills can specify `compatibility: opencode` in frontmatter. Should we warn when loading such skills in Claude Code-only environments?

~~3. **Conflict Visibility**: When name conflicts occur, should we log a warning or only show conflicts when explicitly listing skills?~~
   - **RESOLVED**: See DD-4. No warnings for duplicates; users can discover via skill tool list.
