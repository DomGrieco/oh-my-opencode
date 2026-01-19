# Configurable Cursor Paths with Template Variables

**Linear Issue**: [LIF-109](https://linear.app/lifelogger/issue/LIF-109/configurable-cursor-paths-with-template-variables)
**Created**: 2025-12-30
**Status**: Ready for Planning

## Overview

Enable users to configure the location of project artifact directories (specs, memory, learnings, etc.) through a centralized configuration, with automatic detection of existing directory conventions. The default location changes from `.cursor/` to `context/` while maintaining full backward compatibility for existing projects.

## Problem Statement

### Current State

The oh-my-opencode plugin has **115+ hardcoded path references** across 49+ files, creating several challenges:

- **Dual-path conventions**: Both `.cursor/` (Cursor IDE legacy) and `context/` (OpenCode convention) exist
- **No centralized configuration**: Path constants scattered across multiple files (`src/tools/spec/types.ts`, `src/tools/memory/constants.ts`, `src/shared/workflow-context.ts`, etc.)
- **Silent behavior**: Users don't know which path convention is being used or why
- **Limited flexibility**: Users cannot customize paths without modifying source code
- **Inconsistent defaults**: Some features default to `.cursor/`, others to `context/`

### Issues

1. **Migration friction**: Teams moving from Cursor IDE to OpenCode have no clear path forward for their existing `.cursor/` directories
2. **Configuration opacity**: No way to verify which paths are active or override defaults
3. **Cross-tool compatibility**: Users of multiple tools (Cursor, Claude Code, OpenCode) need different path conventions
4. **CI/CD limitations**: No environment variable overrides for ephemeral build environments
5. **Monorepo challenges**: No per-package path customization options
6. **Documentation mismatch**: Agent prompts contain hardcoded path examples that may not match user configuration

## User Stories

### US-1: As a Cursor IDE migrant
I want my existing `.cursor/specs/` and `.cursor/memory/` directories to continue working automatically
So that I can adopt OpenCode without restructuring my project.

**Acceptance Criteria:**
- [ ] Existing `.cursor/` directories are auto-detected at startup
- [ ] Auto-detected paths are used without requiring any configuration
- [ ] User receives visual feedback indicating which paths are active
- [ ] No data loss or migration required to start using OpenCode

### US-2: As a team lead standardizing on OpenCode
I want to configure all path locations in a single configuration file
So that my entire team uses consistent conventions.

**Acceptance Criteria:**
- [ ] All artifact paths configurable via `oh-my-opencode.json`
- [ ] Configuration is validated with clear error messages
- [ ] IDE autocomplete works for path configuration (JSON Schema)
- [ ] Project-level config overrides user-level config

### US-3: As a developer working in CI/CD
I want to override path locations via environment variables
So that I can configure paths in ephemeral build environments.

**Acceptance Criteria:**
- [ ] Environment variables can override configured paths
- [ ] Environment variable naming follows consistent convention
- [ ] CI/CD environments work without project-level config file

### US-4: As a power user
I want to verify my path configuration is correct
So that I can debug issues and confirm expected behavior.

**Acceptance Criteria:**
- [ ] Verification mechanism shows all active paths
- [ ] Each path shows its source (detected, config, environment, default)
- [ ] Validation warnings appear for misconfigured paths
- [ ] Path status (exists/will create) is visible

### US-5: As a user receiving path validation errors
I want actionable error messages that reference my actual configuration
So that I can quickly fix path issues.

**Acceptance Criteria:**
- [ ] Error messages show the user's active paths, not hardcoded defaults
- [ ] Suggestions reference configured path values
- [ ] Errors explain why validation failed and how to fix

### US-6: As a new OpenCode user
I want sensible defaults without any configuration
So that I can start using the tool immediately.

**Acceptance Criteria:**
- [ ] New projects default to `context/` convention
- [ ] Defaults are documented and discoverable
- [ ] No configuration required for basic functionality

## Requirements

### Functional Requirements

#### FR-1: Centralized Path Configuration
Users can configure all artifact paths in a single `paths` object within `oh-my-opencode.json`:
```json
{
  "paths": {
    "specs": "context/specs/",
    "memory": "context/memory/",
    "learnings": "context/learnings/",
    "changelog": "changelog/",
    "transcripts": "context/transcripts/"
  }
}
```

#### FR-2: Automatic Path Detection
When no explicit configuration is provided, the system detects existing directory conventions:
- Check for existing `.cursor/specs/` or `.cursor/memory/` directories
- If found, use `.cursor/` convention automatically
- If not found, default to `context/` convention
- Detection occurs once at startup, result is cached

#### FR-3: Configuration Priority Order
Path resolution follows this priority (highest to lowest):
1. **Explicit configuration** in `paths` object
2. **Environment variable** override (e.g., `OPENCODE_SPECS_PATH`)
3. **Auto-detected** existing directory convention
4. **Default value** (`context/{type}/`)

#### FR-4: Path Validation Integration
The governance path validator hook uses configured paths:
- `allowed_paths` defaults include all configured paths
- Validation error messages reference configured values
- Block/warn mode respects user's path configuration

#### FR-5: Agent Prompt Path Injection
Agent prompts dynamically use configured paths:
- Governance template injects configured path values
- Agent examples reference actual user configuration
- No hardcoded paths in user-visible content

#### FR-6: Startup Feedback
On startup, users see active path configuration:
- Toast/log message shows detected or configured paths
- Source indicator (detected/config/default) for each path
- Warning if paths don't exist and will be created

#### FR-7: Path Verification Mechanism
Users can verify their path configuration:
- Command or tool to display all active paths
- Shows source for each path (config, detected, env, default)
- Validates path existence and accessibility
- Lists any configuration warnings

#### FR-8: Environment Variable Overrides
Support environment variable overrides for CI/CD:
- `OPENCODE_SPECS_PATH` - Override specs directory
- `OPENCODE_MEMORY_PATH` - Override memory directory
- `OPENCODE_LEARNINGS_PATH` - Override learnings directory
- Environment variables take precedence over config file

### Non-Functional Requirements

#### NFR-1: Zero Breaking Changes
No existing workflow should break:
- All current path conventions continue to work
- No migration required for existing users
- `.cursor/` paths remain valid indefinitely

#### NFR-2: Performance
Path resolution should not impact startup time:
- Cache resolved paths per session
- Symlink resolution only when necessary
- Directory existence checks at startup, not per-operation

#### NFR-3: Cross-Platform Compatibility
Paths work correctly on all platforms:
- Windows backslash normalization
- macOS case-insensitive filesystem handling
- Linux case-sensitive paths supported
- Network mounts and Docker volumes work correctly

#### NFR-4: Schema Validation
Path configuration is validated:
- JSON Schema provides autocomplete and validation
- Invalid paths produce helpful error messages
- Relative paths resolved against project root

## Scope

### In Scope
- Centralized `paths` configuration object
- Auto-detection of existing directory conventions
- Environment variable overrides
- Updated path validation with configured values
- Dynamic path injection in agent prompts
- Startup feedback showing active paths
- Path verification mechanism
- JSON Schema updates for IDE support
- Documentation updates

### Out of Scope
- Template variable syntax (e.g., `${PROJECT_ROOT}`) - Simple string paths are sufficient
- Per-package configuration in monorepos - Document as future enhancement
- Automatic migration tooling (`.cursor/` → `context/`) - Users manually move if desired
- Path aliasing (e.g., `@specs/` syntax) - Unnecessary complexity
- Multi-root workspace support - Out of scope for v1

## Assumptions

1. **Relative paths are sufficient**: Users don't need absolute path support; relative paths resolved against project root meet all use cases
2. **Single convention per project**: Projects use one path convention (`.cursor/` or `context/`), not mixed
3. **Detection is reliable**: Checking for directory existence is a reliable detection method
4. **Backward compatibility is paramount**: Existing `.cursor/` users should never be forced to migrate
5. **Environment variables are for CI/CD**: Most users configure via `oh-my-opencode.json`, env vars are for automation

## Dependencies

### Technical Dependencies
- Zod schema validation (existing)
- JSON Schema generation (existing build step)
- OpenCode plugin configuration system (existing)
- Governance path validator hook (existing, requires updates)
- Agent prompt system (existing, requires updates)

### External Dependencies
- None identified

## Success Criteria

| Metric | Target | Measurement |
|--------|--------|-------------|
| Zero breaking changes | 100% backward compatible | All existing tests pass without modification |
| Configuration adoption | Optional, not required | New users can start without any config |
| Path detection accuracy | 100% correct detection | Detect existing `.cursor/` directories reliably |
| Error message quality | Actionable messages | Errors reference configured paths, not hardcoded values |
| Startup feedback | Clear path visibility | Users can see which paths are active on startup |
| Documentation | Complete | All path options documented with examples |

## Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Breaking existing `.cursor/` projects | Low | High | Auto-detection with `.cursor/` in allowed paths permanently |
| Configuration complexity | Medium | Medium | Sensible defaults, optional config, good docs |
| Performance degradation | Low | Low | Cache resolved paths per session |
| Cross-platform issues | Medium | Medium | Comprehensive path normalization, platform-specific tests |
| Agent prompt inconsistency | Medium | Medium | Dynamic injection from config, not hardcoded |
| Symlink edge cases | Low | Medium | Resolve symlinks before validation |

## Design Decisions

### DD-1: Single `paths` Object vs Distributed Configuration
**Decision**: Single centralized `paths` object at config root level.

**Context**: Currently, paths are configured in multiple locations (`memory_tools.memory_path`, `meta_learning.storage_path`, `governance.historian.changelog_path`).

**Options Considered**:
1. Keep distributed configuration in feature-specific objects
2. Create centralized `paths` object with all path settings
3. Support both with centralized as primary, distributed as aliases

**Rationale**: Centralized configuration improves discoverability, reduces duplication, and creates a single source of truth. Existing distributed configs become deprecated aliases that read from `paths`.

### DD-2: Template Variables
**Decision**: No template variable support. Use simple string paths.

**Context**: User requested `${SPEC_DIR}` style variables.

**Options Considered**:
1. `${VAR}` syntax (Shell/Docker style)
2. `<VAR>` syntax (Jest style)
3. No template variables, simple strings only

**Rationale**: Template variables add complexity without significant value. Paths are already relative to project root, eliminating the need for `${PROJECT_ROOT}`. Simple strings are self-documenting and easier to validate.

### DD-3: Default Path Convention
**Decision**: `context/` is the default for new projects, with auto-detection of existing `.cursor/`.

**Context**: Need to balance OpenCode-native conventions with Cursor IDE backward compatibility.

**Options Considered**:
1. Always default to `.cursor/` (maximum compatibility)
2. Always default to `context/` (OpenCode-native)
3. Auto-detect existing, default to `context/` for new (hybrid)

**Rationale**: Hybrid approach gives new users modern defaults while preserving existing project structures. Detection is simple and reliable (directory existence check).

### DD-4: Migration Approach
**Decision**: Soft deprecation with indefinite coexistence, no forced migration.

**Context**: Users with `.cursor/` directories need a path forward.

**Options Considered**:
1. Auto-migrate with prompt
2. Deprecation warnings with migration deadline
3. Indefinite support for both conventions

**Rationale**: Forcing migration risks breaking workflows and alienating users. Both conventions can coexist indefinitely. Users who want to migrate can do so manually.

### DD-5: Validation Mode Default
**Decision**: Keep `warn` as the default validation mode.

**Context**: Path validation can either warn or block writes to non-standard paths.

**Options Considered**:
1. `block` - Strict enforcement by default
2. `warn` - Educational warnings by default
3. `disabled` - No validation by default

**Rationale**: `warn` is educational without being disruptive. Teams can graduate to `block` when ready for strict enforcement.

## Open Questions

1. **Monorepo Support**: Should per-package path configuration be a future enhancement? (Assumed: yes, out of scope for v1)

2. **Migration Tooling**: Should we provide a `/migrate-paths` command in a future version? (Assumed: nice-to-have, not v1)

## Appendix: Path Reference

### Current Hardcoded Paths (115+ occurrences)

| Path Type | Current Default | New Default | Files Affected |
|-----------|-----------------|-------------|----------------|
| Specs | `context/specs/` | `context/specs/` | 15+ |
| Memory | `context/memory/` | `context/memory/` | 12+ |
| Learnings | `context/learnings/` | `context/learnings/` | 8+ |
| Transcripts | `context/transcripts/` | `context/transcripts/` | 4+ |
| Changelog | `changelog/` | `changelog/` | 3+ |

### Legacy Path Support

| Legacy Path | Status | Notes |
|-------------|--------|-------|
| `.cursor/specs/` | Supported | Auto-detected, fully functional |
| `.cursor/memory/` | Supported | Auto-detected, fully functional |
| `.opencode/` | Supported | In allowed paths |
| `.serena/` | Supported | In allowed paths |
| `.claude/` | Supported | In allowed paths |

### Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `OPENCODE_SPECS_PATH` | Override specs directory | `OPENCODE_SPECS_PATH=".cursor/specs/"` |
| `OPENCODE_MEMORY_PATH` | Override memory directory | `OPENCODE_MEMORY_PATH=".cursor/memory/"` |
| `OPENCODE_LEARNINGS_PATH` | Override learnings directory | `OPENCODE_LEARNINGS_PATH="artifacts/learnings/"` |
| `OPENCODE_CHANGELOG_PATH` | Override changelog directory | `OPENCODE_CHANGELOG_PATH="docs/changelog/"` |
| `OPENCODE_TRANSCRIPTS_PATH` | Override transcripts directory | `OPENCODE_TRANSCRIPTS_PATH="logs/transcripts/"` |
