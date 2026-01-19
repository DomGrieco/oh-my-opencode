# LSP Setup Documentation & Project Initialization Modernization

**Linear Issue**: [LIF-107](https://linear.app/lifelogger/issue/LIF-107/lsp-setup-documentation-and-project-initialization-modernization)
**Created**: 2025-12-30
**Status**: Ready for Implementation

## Overview

Create comprehensive LSP server setup documentation and modernize the project initialization experience for oh-my-opencode plugin. This feature addresses the critical gap between installation and productive use by providing clear guidance for Language Server Protocol configuration and a streamlined, OmO-native initialization flow that works for both new and existing projects.

## Problem Statement

### Current State

The oh-my-opencode plugin supports 22 built-in LSP servers (TypeScript, Python, Rust, Go, C/C++, Java, Ruby, Swift, Dart, and more) with 11 LSP tools available to AI agents. Project initialization tooling exists in `.opencode/tool/init-project/` with tech detection, config generation, and AGENTS.md templating capabilities. The plugin works with sensible defaults once configured.

### Issues

1. **No LSP Setup Documentation**: Users don't know which LSP servers to install for their programming languages, what installation commands to use, or how to verify successful setup. LSP tool failures are silent, providing no guidance on how to resolve issues.

2. **Undiscoverable Initialization**: The init-project tool exists but lacks a command entry point. Users must know to ask the AI agent directly, with no first-run experience guiding new users through setup.

3. **Outdated Initialization Patterns**: The existing init-project logic predates the OmO plugin and uses patterns from the old OpenCode agent system rather than leveraging OmO's multi-agent orchestration capabilities.

4. **Fragmented Configuration Understanding**: Three configuration files (`opencode.json`, `oh-my-opencode.json`, `project-context.yaml`) serve different purposes, but users don't know which file to edit for what purpose.

5. **No Setup Validation**: Users have no way to verify their LSP configuration is working correctly before encountering failures during actual use.

6. **Silent Failure Modes**: When LSP servers aren't installed or crash, error messages don't explain what went wrong or how to fix it.

## User Stories

### US-1: As a new oh-my-opencode user
I want a quick start guide that gets me to a working state in under 5 minutes
So that I can experience the plugin's value without extensive setup research.

**Acceptance Criteria:**
- [ ] Quick start documentation exists covering minimal viable setup
- [ ] Documentation is accessible from README within first 3 scrolls
- [ ] Steps are numbered and copy-paste friendly
- [ ] Time estimate (5 min) is realistic for the documented path
- [ ] Success verification step confirms setup is working

### US-2: As a developer working in TypeScript/JavaScript
I want clear instructions for setting up TypeScript LSP support
So that I can use hover, go-to-definition, and other IDE features through the AI agent.

**Acceptance Criteria:**
- [ ] Installation command provided (`npm i -g typescript-language-server typescript`)
- [ ] Verification command confirms server is working
- [ ] Common issues documented with solutions (missing `typescript`, no `tsconfig.json`)
- [ ] Configuration example shows how to customize LSP settings
- [ ] Works on macOS, Linux, and Windows

### US-3: As a polyglot developer working across multiple languages
I want a decision tree that helps me identify which LSP servers I need
So that I don't waste time installing servers for languages I don't use.

**Acceptance Criteria:**
- [ ] Index page lists all 22 supported language servers
- [ ] Each entry shows: server name, file extensions handled, installation method
- [ ] Categorized by language family (JavaScript/TypeScript, Python, Systems, etc.)
- [ ] Priority/recommendation indicated when multiple servers exist (e.g., basedpyright vs pyright)
- [ ] Link to detailed per-language documentation

### US-4: As a developer setting up a new project
I want an interactive initialization wizard
So that my project is configured optimally based on its actual tech stack.

**Acceptance Criteria:**
- [ ] Running `/init-project` triggers an interactive flow
- [ ] Tech stack is auto-detected from project files (package.json, pyproject.toml, etc.)
- [ ] User can confirm, modify, or skip detected settings
- [ ] LSP servers are recommended based on detected languages
- [ ] Configuration files are generated with sensible defaults
- [ ] AGENTS.md is created with project-specific context

### US-5: As a developer adding oh-my-opencode to an existing project
I want initialization to respect my existing configuration
So that my customizations aren't overwritten.

**Acceptance Criteria:**
- [ ] Existing `.opencode/` directory is detected
- [ ] Merge mode adds new settings without removing existing ones
- [ ] Conflicts are surfaced with three options: Keep / Merge / Replace
- [ ] Destructive actions (Replace) require explicit confirmation
- [ ] Original config is backed up before modification

### US-6: As a CI/CD pipeline operator
I want non-interactive initialization with explicit flags
So that I can automate project setup without interactive prompts.

**Acceptance Criteria:**
- [ ] `--yes` flag uses smart defaults without prompts
- [ ] `--preset` flag allows specifying common configurations
- [ ] `--fail-on-existing` flag prevents silent overwrites
- [ ] Exit codes indicate success (0) or failure (non-zero)
- [ ] Output is parseable (JSON option) for pipeline integration

### US-7: As an AI agent assisting with project setup
I want structured, machine-readable documentation
So that I can accurately guide users through LSP and initialization configuration.

**Acceptance Criteria:**
- [ ] Documentation includes YAML frontmatter with metadata
- [ ] Commands are in copy-paste format (no "replace with your value" placeholders)
- [ ] Decision trees are explicit (if X, then Y)
- [ ] Error messages include exact fix commands
- [ ] Step-by-step verification confirms each stage

### US-8: As a user experiencing LSP failures
I want actionable error messages
So that I can quickly resolve issues and continue working.

**Acceptance Criteria:**
- [ ] Error message identifies the specific failure (no server, crash, timeout)
- [ ] Suggested fix is provided (installation command, config change)
- [ ] Link to relevant documentation section is included
- [ ] Multiple resolution paths offered when applicable
- [ ] Error format is consistent across all LSP tools

## Requirements

### Functional Requirements

#### FR-1: LSP Quick Start Documentation
A single-page guide that enables users to configure LSP for their primary language within 5 minutes. Must include installation command, verification step, and basic troubleshooting for the most common languages (TypeScript, Python, Rust, Go).

#### FR-2: Per-Language LSP Reference Cards
Dedicated documentation pages for each of the 22 supported language servers. Each card must include: installation command, supported file extensions, verification method, 3 most common issues with solutions, and advanced configuration options.

#### FR-3: LSP Server Index
A master index page listing all supported language servers with categorization, installation status detection, and priority indicators for overlapping language support (e.g., pyright vs basedpyright for Python).

#### FR-4: Interactive Initialization Wizard
A command-driven initialization flow that detects project tech stack, prompts for confirmation/modification, generates configuration files, and recommends LSP servers. Must support TTY detection and graceful degradation.

#### FR-5: Non-Interactive Initialization Mode
A flag-based initialization path (`--yes`, `--preset`, `--fail-on-existing`) for CI/CD and scripted environments. Must provide deterministic behavior with explicit feature flags.

#### FR-6: Existing Project Merge Mode
When initializing in a directory with existing configuration, the system must detect conflicts, offer merge/replace/keep options, and preserve custom settings when merging.

#### FR-7: LSP Validation Command
A verification command (`/lsp-check` or similar) that tests each configured LSP server for installation status, startup health, and responsiveness.

#### FR-8: Actionable LSP Error Messages
When LSP tools fail, error messages must include: failure type, specific fix command, documentation link, and alternative resolution paths.

#### FR-9: Configuration Documentation
A guide explaining the three configuration files (`opencode.json`, `oh-my-opencode.json`, `project-context.yaml`), their purposes, priority order, and which settings belong in each.

#### FR-10: First-Run Detection
On first use in an unconfigured project, display a non-intrusive prompt suggesting initialization. Must be dismissable and remember dismissal per-project.

#### FR-11: Local Usage Metrics
Track initialization and LSP usage metrics locally in `~/.config/opencode/oh-my-opencode-metrics.json`. Metrics include init attempts/completions, LSP check results, and failure patterns. Data never leaves the user's machine. Powers future `/stats` command for users to view their own usage patterns and debug issues.

### Non-Functional Requirements

#### NFR-1: Time to First Success
Users should achieve a working LSP setup within 5 minutes of starting the quick start guide. Initialization wizard should complete in under 30 seconds for typical projects.

#### NFR-2: Cross-Platform Compatibility
All documentation, commands, and initialization flows must work on macOS, Linux, and Windows. Platform-specific variations must be explicitly documented.

#### NFR-3: Offline Resilience
Initialization must complete successfully without network access (except for optional Linear integration). Tech detection and config generation must work fully offline.

#### NFR-4: Backward Compatibility
Existing oh-my-opencode configurations must continue to work. New initialization must not require re-setup of working installations.

#### NFR-5: Documentation Maintainability
LSP server installation commands should be auto-generated from source constants where possible to prevent documentation drift. Version-specific commands should link to official sources.

#### NFR-6: AI Agent Accessibility
Documentation must be structured for consumption by AI agents (YAML frontmatter, explicit decision trees, copy-paste commands) to enable accurate AI-assisted setup.

## Scope

### In Scope

- LSP setup documentation for all 22 built-in servers
- Quick start guide for immediate productivity
- Per-language reference cards with troubleshooting
- `/init-project` command implementation
- Interactive and non-interactive initialization modes
- Existing project detection and merge mode
- LSP validation command
- Enhanced error messages for LSP tools
- Configuration guide explaining file purposes
- First-run detection with initialization prompt
- Local usage metrics (init completion, LSP success rates)
- Cross-platform support (macOS, Linux, Windows)

### Out of Scope

- Adding new LSP servers beyond the existing 22
- LSP completion support (not currently implemented)
- Custom LSP server development guide
- Video tutorials or multimedia documentation
- Localization of documentation (English only for now)
- IDE/editor-specific integration guides
- Authentication provider documentation (separate concern)
- Memory system consolidation (architectural decision to keep separate)

## Assumptions

1. Users have basic command-line familiarity and can run npm/pip/cargo commands
2. OpenCode >= 1.0.132 is installed (earlier versions have config bugs)
3. Package managers (npm, pip, cargo, etc.) are available for respective languages
4. Users have write access to their project directory
5. The 22 built-in LSP servers remain stable (install commands won't change frequently)
6. TTY detection reliably distinguishes interactive from non-interactive environments
7. AI agents reading documentation can follow structured instructions

## Dependencies

### Technical Dependencies
- OpenCode plugin system (existing)
- Existing init-project tool in `.opencode/tool/init-project/` (to be wired to command)
- LSP server binaries (external, per-language)
- Bun runtime for oh-my-opencode execution

### External Dependencies
- Language server maintainers (for installation instructions accuracy)
- Package registry availability (npm, PyPI, crates.io) for server installation
- Platform-specific toolchains (Xcode for Swift, LLVM for C++)

## Success Criteria

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Time to working LSP | < 5 minutes | User testing with stopwatch |
| Init completion rate | > 90% | Track abandonments in wizard |
| LSP setup success rate | > 85% | lsp_servers shows "installed: true" |
| Documentation findability | < 2 clicks from README | Navigation audit |
| Error message helpfulness | > 80% resolution without support | User feedback |
| Cross-platform coverage | 100% of features on all platforms | Test matrix completion |

## Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| LSP installation commands become outdated | High | Medium | Link to official docs, auto-generate from constants |
| Windows users face PATH issues | Medium | High | Document PATH setup, detect and warn |
| Init overwrites user customizations | Medium | High | Backup before modify, require confirmation |
| AI agents misinterpret documentation | Medium | Medium | Test documentation with multiple AI models |
| Too many LSP servers overwhelm users | Low | Medium | Prioritize top 5 languages, show others as advanced |
| Network failures during Linear setup | Medium | Low | Make Linear optional, graceful degradation |

## Design Decisions

### DD-1: Decouple LSP Documentation from Initialization
**Decision**: LSP documentation exists independently as reference material; initialization recommends but doesn't require LSP setup.
**Context**: Users need LSP documentation anytime, not just during initialization.
**Options Considered**: (A) Integrated LSP setup in init flow, (B) Separate documentation with init recommendations
**Rationale**: Option B allows users to configure LSP at their own pace and revisit documentation as needed. Init complexity stays manageable.

### DD-2: Preserve Multi-File Configuration Architecture
**Decision**: Keep three separate configuration files (`opencode.json`, `oh-my-opencode.json`, `project-context.yaml`) rather than consolidating.
**Context**: Each file serves a different tool ecosystem (OpenCode, OmO plugin, project metadata).
**Options Considered**: (A) Consolidate into single file, (B) Keep separate with documentation
**Rationale**: Option B maintains compatibility with each tool's ecosystem and allows `project-context.yaml` to be portable across tools.

### DD-3: OmO Agent Orchestration for Interactive Init
**Decision**: The `/init-project` command delegates to OmO agent for interactive flow, allowing conversational handling of edge cases.
**Context**: Init may encounter complex scenarios (monorepo, existing config conflicts) that benefit from AI judgment.
**Options Considered**: (A) Pure CLI tool, (B) OmO agent orchestration, (C) Hybrid with agent fallback
**Rationale**: Option B provides best UX for complex scenarios while maintaining simplicity for common cases.

### DD-4: Per-Language LSP Cards over Mega-Guide
**Decision**: Create individual documentation pages per language rather than one comprehensive LSP guide.
**Context**: Users typically care about 1-3 languages, not all 22.
**Options Considered**: (A) Single comprehensive guide, (B) Per-language cards with index
**Rationale**: Option B reduces cognitive load, improves searchability, and allows targeted updates.

## Resolved Questions

### DD-5: LSP Server Priority Display
**Decision**: Add `recommended: true` flag in `BUILTIN_SERVERS` constants. Default to `basedpyright` over `pyright`. Allow per-project override in `oh-my-opencode.json`.
**Context**: Python has 3 LSP options (basedpyright, pyright, ruff). Users need clear guidance on which to use.
**Options Considered**: (A) No priority indication, (B) Hardcoded priority in docs, (C) Configurable priority with sensible defaults
**Rationale**: Option C provides clear guidance while respecting user preferences. `basedpyright` is recommended as it's a stricter superset of `pyright`.

### DD-6: Init Command Naming
**Decision**: Use `/init-project` as the primary command name. Matches existing tool directory structure and is explicit about purpose.
**Context**: Shorter `/init` would be more convenient but may conflict with existing OpenCode functionality.
**Options Considered**: (A) `/init` (short), (B) `/init-project` (explicit), (C) Both with alias
**Rationale**: Option B prioritizes consistency with existing `.opencode/tool/init-project/` structure. Alias can be added later if no conflicts exist.

### DD-7: Local Telemetry for Success Metrics
**Decision**: Implement local-only telemetry stored in `~/.config/opencode/oh-my-opencode-metrics.json`. No data leaves the user's machine.
**Context**: Success criteria require measuring init completion rate and LSP setup success, but remote telemetry raises privacy concerns.
**Options Considered**: (A) No telemetry, (B) Opt-in remote telemetry, (C) Local-only telemetry
**Rationale**: Option C provides actionable metrics without privacy concerns. Benefits include:
- User owns their data completely
- Works offline
- Powers future `/stats` or `/health` command for users to view their own metrics
- Useful for debugging ("why does my LSP keep failing?")
- Zero network dependency

**Metrics Schema**:
```json
{
  "init": {
    "attempts": 0,
    "completions": 0,
    "abandonments": 0,
    "last_run": null
  },
  "lsp": {
    "checks": 0,
    "successes": 0,
    "failures_by_server": {}
  }
}
```

**Future Consideration**: Opt-in anonymous aggregate reporting may be added in a later version, but is out of scope for v1.
