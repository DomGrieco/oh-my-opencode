# LIF-107: LSP Setup Documentation & Project Initialization Modernization - Task Breakdown

**Linear Issue**: [LIF-107](https://linear.app/lifelogger/issue/LIF-107/lsp-setup-documentation-and-project-initialization-modernization)
**Created**: 2025-12-29
**Total Estimate**: 19.5h (includes 20% buffer)

---

## Phase 1: LSP Documentation Foundation (5h)

> **Analysis Update (2025-12-30)**: Added T1.0 (BUILTIN_SERVERS enhancement). Changed path to `docs/guides/lsp/`. Time increased from 4.5h to 5h.

**Goal**: Create the documentation structure and core reference materials for LSP setup.

| ID | Task | Status | Estimate | Files | Dependencies |
|----|------|--------|----------|-------|--------------|
| T1.0 | **Enhance BUILTIN_SERVERS** with installation, verification, category metadata | Not Started | 30min | `src/tools/lsp/constants.ts` | None |
| T1.1 | Create `docs/guides/lsp/` directory structure | Not Started | 10min | `docs/guides/lsp/`, `docs/guides/lsp/servers/` | None |
| T1.2 | Write `quick-start.md` (TypeScript, Python, Rust, Go) | Not Started | 45min | `docs/guides/lsp/quick-start.md` | T1.1 |
| T1.3 | Write `index.md` (master server index with categories) | Not Started | 30min | `docs/guides/lsp/index.md` | T1.1, T1.0 |
| T1.4 | Write `configuration.md` (3-file config explanation) | Not Started | 30min | `docs/guides/lsp/configuration.md` | T1.1 |
| T1.5 | Create server card template | Not Started | 15min | `docs/guides/lsp/servers/_template.md` | T1.1 |
| T1.6 | Write TypeScript server card | Not Started | 18min | `docs/guides/lsp/servers/typescript.md` | T1.5, T1.0 |
| T1.7 | Write basedpyright server card | Not Started | 18min | `docs/guides/lsp/servers/basedpyright.md` | T1.5, T1.0 |
| T1.8 | Write gopls server card | Not Started | 18min | `docs/guides/lsp/servers/gopls.md` | T1.5, T1.0 |
| T1.9 | Write rust-analyzer server card | Not Started | 18min | `docs/guides/lsp/servers/rust-analyzer.md` | T1.5, T1.0 |
| T1.10 | Write clangd server card | Not Started | 18min | `docs/guides/lsp/servers/clangd.md` | T1.5, T1.0 |

**Checkpoint**: All 5 priority server cards exist with installation commands, verification steps, and troubleshooting. BUILTIN_SERVERS enhanced with metadata.

### Task Details

**T1.2: Quick Start Guide**
- Cover 4 languages: TypeScript, Python, Rust, Go
- Each section: 1-command install, verify command, basic usage
- Include "What's Next" section linking to full docs
- Target: 5-minute time-to-working-LSP

**T1.3: Master Index**
- Table format with: Server ID, Languages, Extensions, Install Command, Status
- Categories: JavaScript/TypeScript, Python, Systems, Go, JVM, Mobile, Ruby, Elixir, C#/.NET, Scripting, Config
- Link each server to its detailed card

**T1.5: Server Card Template**
- YAML frontmatter: title, server_id, languages, extensions, installation (per-platform), binary, verification, recommended, priority, category
- Sections: Overview, Installation, Verification, Configuration, Troubleshooting, Related Servers

---

## Phase 2: Complete LSP Server Documentation (3.5h)

**Goal**: Document all remaining 17 LSP servers with consistent quality.

| ID | Task | Status | Estimate | Files | Dependencies |
|----|------|--------|----------|-------|--------------|
| T2.1 | Write deno server card | Not Started | 8min | `docs/lsp/servers/deno.md` | T1.5 |
| T2.2 | Write vue server card | Not Started | 8min | `docs/lsp/servers/vue.md` | T1.5 |
| T2.3 | Write eslint server card | Not Started | 8min | `docs/lsp/servers/eslint.md` | T1.5 |
| T2.4 | Write svelte server card | Not Started | 8min | `docs/lsp/servers/svelte.md` | T1.5 |
| T2.5 | Write astro server card | Not Started | 8min | `docs/lsp/servers/astro.md` | T1.5 |
| T2.6 | Write pyright server card | Not Started | 8min | `docs/lsp/servers/pyright.md` | T1.5 |
| T2.7 | Write ruff server card | Not Started | 8min | `docs/lsp/servers/ruff.md` | T1.5 |
| T2.8 | Write ruby-lsp server card | Not Started | 8min | `docs/lsp/servers/ruby-lsp.md` | T1.5 |
| T2.9 | Write elixir-ls server card | Not Started | 8min | `docs/lsp/servers/elixir-ls.md` | T1.5 |
| T2.10 | Write zls server card | Not Started | 8min | `docs/lsp/servers/zls.md` | T1.5 |
| T2.11 | Write csharp server card | Not Started | 8min | `docs/lsp/servers/csharp.md` | T1.5 |
| T2.12 | Write sourcekit-lsp server card | Not Started | 8min | `docs/lsp/servers/sourcekit-lsp.md` | T1.5 |
| T2.13 | Write jdtls server card | Not Started | 8min | `docs/lsp/servers/jdtls.md` | T1.5 |
| T2.14 | Write yaml-ls server card | Not Started | 8min | `docs/lsp/servers/yaml-ls.md` | T1.5 |
| T2.15 | Write lua-ls server card | Not Started | 8min | `docs/lsp/servers/lua-ls.md` | T1.5 |
| T2.16 | Write php server card | Not Started | 8min | `docs/lsp/servers/php.md` | T1.5 |
| T2.17 | Write dart server card | Not Started | 8min | `docs/lsp/servers/dart.md` | T1.5 |
| T2.18 | Write `troubleshooting.md` | Not Started | 30min | `docs/lsp/troubleshooting.md` | T1.1 |

**Checkpoint**: All 22 server cards complete. `troubleshooting.md` covers common issues across all servers.

### Task Details

**T2.18: Troubleshooting Guide**
- Common issues: Server not found, PATH issues, permission errors, timeout errors
- Platform-specific sections: macOS, Linux, Windows
- Debug commands: How to check if server is running, log locations
- "Still stuck?" section with support channels

---

## Phase 3: Migrate init-project to Bun (3.5h)

**Goal**: Migrate existing `.opencode/tool/init-project/` code to `src/tools/init-project/` with Bun-compatible imports.

| ID | Task | Status | Estimate | Files | Dependencies |
|----|------|--------|----------|-------|--------------|
| T3.1 | Create `src/tools/init-project/` directory structure | Not Started | 15min | `src/tools/init-project/` | None |
| T3.2 | Migrate `types.ts` (minimal changes) | Not Started | 15min | `src/tools/init-project/types.ts` | T3.1 |
| T3.3 | Migrate `tech-detection.ts` (Node fs -> Bun fs) | Not Started | 35min | `src/tools/init-project/tech-detection.ts` | T3.2 |
| T3.4 | Migrate `config-generator.ts` (update package.json generation) | Not Started | 35min | `src/tools/init-project/config-generator.ts` | T3.2 |
| T3.5 | Migrate `agents-generator.ts` | Not Started | 25min | `src/tools/init-project/agents-generator.ts` | T3.2 |
| T3.6 | Migrate `edge-cases.ts` | Not Started | 25min | `src/tools/init-project/edge-cases.ts` | T3.2 |
| T3.7 | Migrate `linear-setup.ts` | Not Started | 20min | `src/tools/init-project/linear-setup.ts` | T3.2 |
| T3.8 | Create `constants.ts` (presets, defaults) | Not Started | 25min | `src/tools/init-project/constants.ts` | T3.2 |
| T3.9 | Create `tools.ts` (init_project tool definition) | Not Started | 35min | `src/tools/init-project/tools.ts` | T3.3, T3.4, T3.5, T3.6, T3.7, T3.8 |
| T3.10 | Create `index.ts` (exports) | Not Started | 10min | `src/tools/init-project/index.ts` | T3.9 |
| T3.11 | Wire to builtinTools in main index.ts | Not Started | 15min | `src/tools/index.ts`, `src/index.ts` | T3.10 |

**Checkpoint**: `bun run typecheck` passes. init_project tool is exported and callable.

### Task Details

**T3.3: Tech Detection Migration**
Key changes:
- `import * as fs from "fs"` -> `import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs"`
- `require.main === module` -> Remove CLI entry point (tool handles this)
- `path.join` -> Keep as-is (Bun compatible)
- Add proper error handling with try/catch

**T3.4: Config Generator Migration**
Key changes:
- Same fs import changes
- Update `generateOpencodeJson` to use `bun` as default package manager when detected
- Add `recommendedLspServers` field to output

**T3.8: Constants**
Define:
- `PRESETS`: web-app, api-ts, api-python, cli, library
- `DEFAULT_CONFIG`: sensible defaults for all fields
- `LSP_RECOMMENDATIONS`: mapping of tech stack to recommended LSP servers

---

## Phase 4: Metrics & Non-Interactive Mode (2.5h)

**Goal**: Add local telemetry and CLI flags for automation.

| ID | Task | Status | Estimate | Files | Dependencies |
|----|------|--------|----------|-------|--------------|
| T4.1 | Create `metrics.ts` (read/write metrics file) | Not Started | 45min | `src/tools/init-project/metrics.ts` | T3.10 |
| T4.2 | Add `--yes` flag handling | Not Started | 30min | `src/tools/init-project/tools.ts` | T4.1 |
| T4.3 | Add `--preset` flag handling | Not Started | 25min | `src/tools/init-project/tools.ts` | T4.2 |
| T4.4 | Add `--fail-on-existing` flag | Not Started | 20min | `src/tools/init-project/tools.ts` | T4.2 |
| T4.5 | Add `--json` output format | Not Started | 20min | `src/tools/init-project/tools.ts` | T4.2 |

**Checkpoint**: Non-interactive mode works: `init_project({ yes: true, preset: "web-app" })` completes without prompts.

### Task Details

**T4.1: Metrics Implementation**
- File location: `~/.config/opencode/oh-my-opencode-metrics.json`
- Schema: `{ version, init: { attempts, completions, abandonments, lastRun, byPreset }, lsp: { checks, lastCheck, successes, failuresByServer }, projects: [] }`
- Functions: `readMetrics()`, `writeMetrics()`, `recordInitAttempt()`, `recordInitCompletion()`, `recordLspCheck()`
- Handle file not existing (create with defaults)

**T4.2-T4.5: CLI Flags**
- `--yes`: Skip all prompts, use detected values + smart defaults
- `--preset=<name>`: Apply preset configuration (web-app, api-ts, api-python, cli, library)
- `--fail-on-existing`: Exit with error code 1 if `.opencode/` exists
- `--json`: Output result as JSON instead of human-readable text

---

## Phase 5: LSP Validation Tool & Command (3h)

> **Analysis Update (2025-12-30)**: Changed from separate directory to adding `lsp_check` tool to existing `src/tools/lsp/tools.ts`. This matches existing patterns where all LSP tools are co-located. Time increased from 2.5h to 3h. Tool must be callable by agents programmatically.

**Goal**: Create `lsp_check` tool (for agents) AND `/lsp-check` command (for users) to validate LSP server installations.

| ID | Task | Status | Estimate | Files | Dependencies |
|----|------|--------|----------|-------|--------------|
| T5.1 | Add LSP check types to existing types.ts | Not Started | 15min | `src/tools/lsp/types.ts` | T1.0 |
| T5.2 | Add status message constants | Not Started | 15min | `src/tools/lsp/constants.ts` | T1.0 |
| T5.3 | Implement `lsp_check` tool in existing tools.ts | Not Started | 60min | `src/tools/lsp/tools.ts` | T5.1, T5.2 |
| T5.4 | Add `lsp_check` to builtinTools export | Not Started | 10min | `src/tools/lsp/index.ts` | T5.3 |
| T5.5 | Create `/lsp-check` command file | Not Started | 20min | `.opencode/command/lsp-check.md` | T5.4 |
| T5.6 | Test tool invocation by agents | Not Started | 20min | - | T5.4 |
| T5.7 | Test command invocation by users | Not Started | 20min | - | T5.5 |

**Checkpoint**: `lsp_check` tool callable by agents AND `/lsp-check` command works for users. Both output server status table.

### Task Details

**T5.4: lsp_check Tool**
- Input: `{ language?: string }` (optional filter)
- Logic:
  1. Get all configured servers from `getAllServers()`
  2. For each server: check binary exists, attempt connection, measure response time
  3. Return structured result with status, version, install command if missing
- Output format:
```
| Server           | Status     | Notes                               |
|------------------|------------|-------------------------------------|
| typescript       | OK         | v4.9.5                              |
| basedpyright     | Missing    | Install: npm i -g basedpyright      |
| rust-analyzer    | Error      | Failed to start (check rustup)      |
```

---

## Phase 6: LSP Error Enhancement Hook (2.5h)

**Goal**: Enhance LSP error messages with actionable guidance.

| ID | Task | Status | Estimate | Files | Dependencies |
|----|------|--------|----------|-------|--------------|
| T6.1 | Create `src/hooks/lsp-error-enhancer/` directory | Not Started | 10min | `src/hooks/lsp-error-enhancer/` | None |
| T6.2 | Create `types.ts` | Not Started | 15min | `src/hooks/lsp-error-enhancer/types.ts` | T6.1 |
| T6.3 | Create `constants.ts` (error message templates) | Not Started | 20min | `src/hooks/lsp-error-enhancer/constants.ts` | T6.1 |
| T6.4 | Create `hook.ts` (PostToolUse hook) | Not Started | 60min | `src/hooks/lsp-error-enhancer/hook.ts` | T6.2, T6.3 |
| T6.5 | Create `index.ts` | Not Started | 10min | `src/hooks/lsp-error-enhancer/index.ts` | T6.4 |
| T6.6 | Wire to hook system | Not Started | 15min | `src/hooks/index.ts`, `src/index.ts` | T6.5 |

**Checkpoint**: LSP tool errors include installation commands and doc links.

### Task Details

**T6.4: PostToolUse Hook**
- Trigger: After any `lsp_*` tool execution
- Condition: Tool result contains error
- Enhancement:
  1. Parse error to identify failure type (not_installed, startup_failed, timeout, crash)
  2. Look up server from tool input
  3. Generate enhanced message with:
     - Clear error description
     - Platform-specific fix command
     - Link to `docs/lsp/servers/{server}.md`
     - Alternative servers if applicable
- Output format:
```
LSP Error: TypeScript language server not installed

To fix:
  npm i -g typescript-language-server typescript

Documentation: docs/lsp/servers/typescript.md
Alternative: Consider 'deno lsp' for Deno projects
```

---

## Phase 7: First-Run Detection & Command Wiring (2h)

> **Analysis Update (2025-12-30)**: Time increased from 1.5h to 2h due to hook conflict resolution. `session.created` is already used by `auto-update-checker`, `startup-toast`, `rules-injector`. Strategy: Either integrate into existing hook OR use debounced notifications.

**Goal**: Detect unconfigured projects and prompt for initialization (without notification overload).

| ID | Task | Status | Estimate | Files | Dependencies |
|----|------|--------|----------|-------|--------------|
| T7.1 | Analyze existing session.created hooks for integration points | Not Started | 15min | `src/hooks/auto-update-checker/`, `src/hooks/startup-toast/` | None |
| T7.2 | Create `src/hooks/first-run-detector/` directory OR integrate into existing hook | Not Started | 10min | `src/hooks/first-run-detector/` | T7.1 |
| T7.3 | Create `types.ts` | Not Started | 10min | `src/hooks/first-run-detector/types.ts` | T7.2 |
| T7.4 | Create `hook.ts` (SessionStart hook with debounce/priority) | Not Started | 40min | `src/hooks/first-run-detector/hook.ts` | T7.3 |
| T7.5 | Create `index.ts` | Not Started | 10min | `src/hooks/first-run-detector/index.ts` | T7.4 |
| T7.6 | Wire to hook system (coordinate with existing hooks) | Not Started | 15min | `src/hooks/index.ts` | T7.5 |
| T7.7 | Update `/init-project` command file | Not Started | 15min | `.opencode/command/init-project.md` | T3.11 |
| T7.8 | Add dismissal persistence via `.opencode/.init-dismissed` | Not Started | 15min | `src/hooks/first-run-detector/hook.ts` | T7.4 |
| T7.9 | Test hook interaction - verify no notification overload | Not Started | 10min | - | T7.6 |

**Checkpoint**: New projects show ONE init prompt (not multiple). Dismissed projects don't show again.

### Task Details

**T7.3: First-Run Detection Hook**
- Trigger: SessionStart event
- Logic:
  1. Check if `.opencode/` directory exists
  2. Check if `.opencode/.init-dismissed` marker exists
  3. If neither: inject message suggesting `/init-project`
- Message format:
```
Welcome to oh-my-opencode!

This project hasn't been initialized yet. Run /init-project to:
- Configure LSP servers for your languages
- Set up project context for AI agents
- Enable Linear integration (optional)

Type /init-project to start, or dismiss this message.
```

**T7.7: Dismissal Persistence**
- Create `.opencode/.init-dismissed` file when user dismisses
- Check for this file before showing prompt
- Include timestamp in file for potential future "remind me later" feature

---

## Phase 8: Testing & Documentation (3.5h)

> **Analysis Update (2025-12-30)**: Time increased from 2.5h to 3.5h to include unit tests for new modules. Added T8.0a-c for unit test coverage.

**Goal**: Validate all features work correctly, add unit tests, and update user-facing documentation.

| ID | Task | Status | Estimate | Files | Dependencies |
|----|------|--------|----------|-------|--------------|
| T8.0a | **Unit tests for metrics module** | Not Started | 20min | `tests/tools/init-project-metrics.test.ts` | T4.1 |
| T8.0b | **Unit tests for lsp_check tool** | Not Started | 25min | `tests/tools/lsp-check.test.ts` | T5.3 |
| T8.0c | **Unit tests for lsp-error-enhancer hook** | Not Started | 20min | `tests/hooks/lsp-error-enhancer.test.ts` | T6.4 |
| T8.1 | Test init-project on fresh TypeScript project | Not Started | 20min | - | T3.11, T4.5 |
| T8.2 | Test init-project on existing Python project | Not Started | 15min | - | T3.11 |
| T8.3 | Test init-project on Go project | Not Started | 15min | - | T3.11 |
| T8.4 | Test init-project on Rust project | Not Started | 15min | - | T3.11 |
| T8.5 | Test lsp_check tool with various servers | Not Started | 20min | - | T5.6 |
| T8.6 | Verify LSP docs accuracy (spot check 5 servers) | Not Started | 20min | - | T2.18 |
| T8.7 | Update README.md with new features | Not Started | 25min | `README.md` | T8.1-T8.6 |
| T8.8 | Test cross-platform (Linux VM) | Not Started | 30min | - | T8.1-T8.6 |
| T8.9 | Run full typecheck and build | Not Started | 10min | - | All |

**Checkpoint**: All tests pass (including unit tests). README updated. Build succeeds.

### Task Details

**T8.7: README Updates**
Add sections for:
- `/init-project` command with examples
- `/lsp-check` command with example output
- Link to `docs/lsp/` documentation
- Update Features section with new capabilities

**T8.8: Cross-Platform Testing**
Test on Linux (Docker or VM):
- LSP server installation commands work
- PATH detection works
- File operations work correctly
- No platform-specific bugs

---

## Summary

> **Analysis Update (2025-12-30)**: Updated estimates based on deep analysis. Total changed from 19.5h to 24.5h (+25% for robustness).

| Phase | Tasks | Estimate | Status | Change |
|-------|-------|----------|--------|--------|
| Phase 1: LSP Documentation Foundation | 11 tasks | 5h | Not Started | +0.5h (T1.0 added) |
| Phase 2: Complete LSP Server Docs | 18 tasks | 3.5h | Not Started | - |
| Phase 3: Migrate init-project to Bun | 11 tasks | 2.5h | Not Started | -1h (simpler) |
| Phase 4: Metrics & Non-Interactive | 5 tasks | 2.5h | Not Started | - |
| Phase 5: LSP Validation Tool & Command | 7 tasks | 3h | Not Started | +0.5h (tool + command) |
| Phase 6: LSP Error Enhancement Hook | 6 tasks | 2.5h | Not Started | - |
| Phase 7: First-Run Detection | 9 tasks | 2h | Not Started | +0.5h (hook conflicts) |
| Phase 8: Testing & Documentation | 12 tasks | 3.5h | Not Started | +1h (unit tests) |
| **Total** | **79 tasks** | **24.5h** | - | **+5h** |

---

## Dependency Graph

```
Phase 1 (Documentation Foundation)
├── T1.1 (create dirs)
│   ├── T1.2 (quick-start.md)
│   ├── T1.3 (index.md)
│   ├── T1.4 (configuration.md)
│   └── T1.5 (template)
│       ├── T1.6-T1.10 (top 5 server cards)
│       └── T2.1-T2.17 (remaining 17 server cards)
└── T2.18 (troubleshooting.md)

Phase 3 (Migration) - BLOCKING for Phases 4-7
├── T3.1 (create dirs)
│   └── T3.2 (types.ts)
│       ├── T3.3 (tech-detection.ts)
│       ├── T3.4 (config-generator.ts)
│       ├── T3.5 (agents-generator.ts)
│       ├── T3.6 (edge-cases.ts)
│       ├── T3.7 (linear-setup.ts)
│       └── T3.8 (constants.ts)
│           └── T3.9 (tools.ts)
│               └── T3.10 (index.ts)
│                   └── T3.11 (wire to builtinTools)

Phase 4 (Metrics & Flags)
└── T4.1 (metrics.ts)
    └── T4.2-T4.5 (CLI flags)

Phase 5 (LSP Check) - Can run parallel to Phase 4
├── T5.1-T5.6 (tool creation)
└── T5.7 (command file)

Phase 6 (Error Hook) - Can run parallel to Phase 4-5
├── T6.1-T6.5 (hook creation)
└── T6.6 (wire to system)

Phase 7 (First-Run) - Depends on Phase 3
├── T7.1-T7.5 (hook creation)
├── T7.6 (update command)
└── T7.7 (dismissal)

Phase 8 (Testing) - Depends on ALL
└── T8.1-T8.9 (all tests)
```

---

## Recommended Execution Order

### Day 1 (8h)
1. **T1.1-T1.5** - Documentation structure and template (1.5h)
2. **T1.6-T1.10** - Top 5 server cards (1.5h)
3. **T3.1-T3.2** - Init-project structure and types (30min)
4. **T3.3-T3.4** - Core migration (tech-detection, config-generator) (1h)
5. **T3.5-T3.8** - Remaining migrations (1.5h)
6. **T3.9-T3.11** - Tool creation and wiring (1h)
7. Commit Phase 1 partial + Phase 3

### Day 2 (6h)
1. **T2.1-T2.17** - Remaining 17 server cards (2.5h)
2. **T2.18** - Troubleshooting guide (30min)
3. **T4.1-T4.5** - Metrics and CLI flags (2.5h)
4. Commit Phase 2 + Phase 4

### Day 3 (5.5h)
1. **T5.1-T5.7** - LSP check tool and command (2.5h)
2. **T6.1-T6.6** - LSP error enhancer hook (2.5h)
3. Commit Phase 5 + Phase 6

### Day 4 (4h)
1. **T7.1-T7.7** - First-run detection (1.5h)
2. **T8.1-T8.9** - Testing and documentation (2.5h)
3. Final commit and PR

---

## Parallelization Opportunities

These task groups can be worked on in parallel by different agents:

| Group A (Documentation) | Group B (Code) |
|------------------------|----------------|
| T1.1-T1.10, T2.1-T2.18 | T3.1-T3.11, T4.1-T4.5 |
| ~8h | ~6h |

After Phase 3 completes, these can run in parallel:
| Group C (LSP Check) | Group D (Error Hook) | Group E (First-Run) |
|---------------------|---------------------|---------------------|
| T5.1-T5.7 | T6.1-T6.6 | T7.1-T7.7 |
| ~2.5h | ~2.5h | ~1.5h |

---

## Notes

### Migration Considerations
- The existing `.opencode/tool/init-project/` code uses `import * as fs from "fs"` which needs to change to named imports for Bun compatibility
- The `require.main === module` pattern for CLI entry points should be removed (tool handles invocation)
- All `npm` references in generated configs should check for `bun` package manager first

### LSP Documentation Accuracy
- Installation commands should link to official documentation where possible
- Version-specific commands should be avoided (use `@latest` or no version)
- Platform-specific variations must be documented for macOS, Linux, Windows

### Testing Priority
- TypeScript project is highest priority (most common use case)
- Cross-platform testing is critical for Windows users (PATH issues common)
- LSP check should gracefully handle missing servers (not crash)

### Risk Mitigation
- Backup existing config before overwrite (already implemented in edge-cases.ts)
- Non-interactive mode should never prompt (fail fast if required info missing)
- Metrics file should handle corruption gracefully (reset to defaults)
