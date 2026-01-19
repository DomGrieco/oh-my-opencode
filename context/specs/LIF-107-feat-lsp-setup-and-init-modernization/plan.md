# LSP Setup Documentation & Project Initialization Modernization - Implementation Plan

**Linear Issue**: [LIF-107](https://linear.app/lifelogger/issue/LIF-107/lsp-setup-documentation-and-project-initialization-modernization)
**Created**: 2025-12-29
**Author**: Strategic Planner (OmO)

## Summary

This plan outlines the implementation of comprehensive LSP server setup documentation and modernization of the project initialization experience. The work involves:
1. Creating structured LSP documentation in `docs/lsp/` (22 language servers)
2. Migrating existing `.opencode/tool/init-project/` from npm/Node.js to Bun
3. Wiring `/init-project` as a proper command with interactive/non-interactive modes
4. Adding `/lsp-check` validation command
5. Implementing local-only usage metrics
6. Enhancing LSP error messages with actionable guidance

## Technical Context

| Aspect | Details |
|--------|---------|
| **Language** | TypeScript 5.7+ |
| **Runtime** | Bun >= 1.0.0 (NEVER npm/yarn) |
| **Types** | bun-types (NOT @types/node) |
| **Framework** | @opencode-ai/plugin SDK |
| **Build** | bun build + tsc --emitDeclarationOnly |
| **Target Files** | `docs/lsp/`, `src/tools/init-project/`, `src/tools/lsp-check/`, `~/.config/opencode/command/` |
| **Platform** | macOS (primary), Linux, Windows |

## Constitution Compliance

| Principle | Compliance |
|-----------|------------|
| **I. Plugin-First Architecture** | ✅ All features via @opencode-ai/plugin SDK |
| **II. Multi-Model Excellence** | ✅ OmO orchestrates init flow |
| **III. Multi-Layered Orchestration** | ✅ Init delegates to specialists when needed |
| **IV. Bun-Native Development** | ⚠️ Existing code uses npm - MUST MIGRATE |
| **V. Hook-Driven Enhancement** | ✅ LSP error enhancement via hook |
| **VI. Dogfooding** | ✅ Uses `.opencode/command/` structure |
| **VII. GitHub Actions Publishing** | ✅ No local publish changes |

### Migration Requirements (Constitution Gate IV)

The existing `.opencode/tool/init-project/` code has these violations that MUST be fixed:

| Current (Violating) | Required (Compliant) |
|---------------------|----------------------|
| `import * as fs from "fs"` | `import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs"` (Bun compatible) |
| `npm install` | `bun install` |
| `npx ts-node` | Direct Bun execution |
| Node.js `path` | Bun-compatible path operations |
| `require.main === module` | Bun entry point pattern |

## Architecture

### Component Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              User Interface                               │
├──────────────────────────────────────────────────────────────────────────┤
│  /init-project command           │  /lsp-check command                   │
│  (interactive + non-interactive) │  (validation tool)                    │
└────────────┬─────────────────────┴────────────────┬──────────────────────┘
             │                                       │
             ▼                                       ▼
┌────────────────────────────────┐   ┌─────────────────────────────────────┐
│  src/tools/init-project/       │   │  src/tools/lsp-check/               │
│  ├── index.ts (tool entry)     │   │  ├── index.ts (tool entry)          │
│  ├── types.ts                  │   │  ├── types.ts                       │
│  ├── tech-detection.ts         │   │  └── tools.ts (lsp_check tool)      │
│  ├── config-generator.ts       │   └─────────────────────────────────────┘
│  ├── agents-generator.ts       │                    │
│  ├── edge-cases.ts             │                    ▼
│  ├── metrics.ts (NEW)          │   ┌─────────────────────────────────────┐
│  └── tools.ts                  │   │  src/tools/lsp/ (existing)          │
└────────────┬───────────────────┘   │  ├── client.ts                      │
             │                       │  ├── config.ts                      │
             ▼                       │  └── getAllServers()                │
┌────────────────────────────────┐   └─────────────────────────────────────┘
│  ~/.config/opencode/           │
│  oh-my-opencode-metrics.json   │   ┌─────────────────────────────────────┐
│  (local telemetry)             │   │  docs/lsp/ (NEW)                    │
└────────────────────────────────┘   │  ├── index.md (server index)        │
                                     │  ├── quick-start.md                 │
                                     │  ├── configuration.md               │
                                     │  └── servers/                       │
                                     │      ├── typescript.md              │
                                     │      ├── basedpyright.md            │
                                     │      └── ... (22 server docs)       │
                                     └─────────────────────────────────────┘
```

### Data Flow

```
1. User runs `/init-project`
   └─> Command loader detects command in ~/.config/opencode/command/
       └─> OmO agent orchestrates interactive flow
           ├─> Tech detection scans project
           ├─> User confirms/modifies settings
           ├─> Config files generated
           ├─> LSP servers recommended
           ├─> Metrics updated locally
           └─> Summary displayed

2. User runs `/init-project --yes`
   └─> Non-interactive mode
       ├─> Auto-detect everything
       ├─> Apply smart defaults
       └─> Generate files without prompts

3. User runs `/lsp-check`
   └─> For each configured LSP server:
       ├─> Check binary exists in PATH
       ├─> Attempt connection
       ├─> Report status (installed/not found/error)
       └─> Provide installation instructions for missing
```

## Data Models

### Metrics Schema (`~/.config/opencode/oh-my-opencode-metrics.json`)

```typescript
interface OhMyOpenCodeMetrics {
  version: "1.0.0"
  init: {
    attempts: number
    completions: number
    abandonments: number
    lastRun: string | null  // ISO timestamp
    byPreset: Record<string, number>  // preset -> count
  }
  lsp: {
    checks: number
    lastCheck: string | null
    successes: number
    failuresByServer: Record<string, number>
  }
  projects: Array<{
    path: string
    initializedAt: string
    techStack: string[]  // e.g. ["TypeScript", "React", "PostgreSQL"]
  }>
}
```

### LSP Server Card Frontmatter

```yaml
---
title: TypeScript Language Server
server_id: typescript
languages: [TypeScript, JavaScript, TSX, JSX]
extensions: [.ts, .tsx, .js, .jsx, .mjs, .cjs, .mts, .cts]
installation:
  macos: npm i -g typescript-language-server typescript
  linux: npm i -g typescript-language-server typescript
  windows: npm i -g typescript-language-server typescript
binary: typescript-language-server
verification: typescript-language-server --version
recommended: true
priority: 10
category: JavaScript/TypeScript
---
```

### InitProjectConfig (Updated)

```typescript
interface InitProjectConfig {
  projectInfo: ProjectInfo
  projectType: string
  techStack: TechStack
  architecture: ArchitecturePattern
  linear: LinearConfig
  mintlify: MintlifyConfig
  isExisting: boolean
  // NEW fields
  recommendedLspServers: string[]
  metricsConsent: boolean  // For future opt-in remote metrics
}

interface InitProjectOptions {
  projectPath: string
  nonInteractive?: boolean
  preset?: Partial<InitProjectConfig>
  // NEW flags
  yes?: boolean           // --yes: use all defaults
  presetName?: string     // --preset=<name>: use named preset
  failOnExisting?: boolean // --fail-on-existing: exit if config exists
  json?: boolean          // --json: output as JSON
}
```

## API Contracts

### /init-project Command

**Interactive Mode (default)**:
```
/init-project [path]

1. Detects tech stack
2. Confirms project type
3. Selects architecture pattern
4. Configures integrations (Linear, etc.)
5. Recommends LSP servers
6. Generates configuration files
```

**Non-Interactive Mode**:
```
/init-project --yes [path]
/init-project --preset=web-app [path]
/init-project --fail-on-existing [path]
```

### /lsp-check Command

```
/lsp-check [language]

Output format:
┌──────────────────┬────────────┬─────────────────────────────────────┐
│ Server           │ Status     │ Notes                               │
├──────────────────┼────────────┼─────────────────────────────────────┤
│ typescript       │ ✅ OK      │ v4.9.5                              │
│ basedpyright     │ ❌ Missing │ Install: npm i -g basedpyright      │
│ rust-analyzer    │ ⚠️ Error   │ Failed to start (check rustup)      │
└──────────────────┴────────────┴─────────────────────────────────────┘
```

### LSP Error Message Format

```typescript
interface LSPErrorMessage {
  type: "not_installed" | "startup_failed" | "timeout" | "crash"
  server: string
  language: string
  message: string
  fix: {
    command: string
    platform: "macos" | "linux" | "windows" | "all"
  }
  docLink: string
  alternatives?: string[]
}

// Example output:
// ❌ LSP Error: TypeScript language server not installed
//
// To fix:
//   npm i -g typescript-language-server typescript
//
// Documentation: docs/lsp/servers/typescript.md
// Alternative: Consider 'deno lsp' for Deno projects
```

## Project Structure

### Documentation Structure (`docs/guides/lsp/`)

> **Analysis Update (2025-12-30)**: Changed from `docs/lsp/` to `docs/guides/lsp/` to match existing documentation structure pattern (`docs/guides/agent-configuration.md`, `docs/guides/workflow-commands.md`).

```
docs/guides/lsp/
├── index.md                    # LSP Server Index (master list)
├── quick-start.md              # 5-minute setup guide
├── configuration.md            # Config file explanations
├── troubleshooting.md          # Common issues and solutions
└── servers/                    # Per-language reference cards
    ├── typescript.md
    ├── deno.md
    ├── vue.md
    ├── eslint.md
    ├── gopls.md
    ├── ruby-lsp.md
    ├── basedpyright.md
    ├── pyright.md
    ├── ruff.md
    ├── elixir-ls.md
    ├── zls.md
    ├── csharp.md
    ├── sourcekit-lsp.md
    ├── rust-analyzer.md
    ├── clangd.md
    ├── svelte.md
    ├── astro.md
    ├── jdtls.md
    ├── yaml-ls.md
    ├── lua-ls.md
    ├── php.md
    └── dart.md
```

### Source Code Changes

```
src/tools/init-project/              # MIGRATED from .opencode/tool/init-project/
├── index.ts                         # Tool exports
├── types.ts                         # Type definitions
├── constants.ts                     # Presets, defaults
├── tools.ts                         # init_project tool
├── tech-detection.ts                # MIGRATED + updated
├── config-generator.ts              # MIGRATED + updated
├── agents-generator.ts              # MIGRATED + updated
├── edge-cases.ts                    # MIGRATED + updated
├── linear-setup.ts                  # MIGRATED
└── metrics.ts                       # NEW: local telemetry

src/tools/lsp/                       # ENHANCED (add lsp_check to existing LSP tools)
├── tools.ts                         # Add lsp_check tool here (alongside lsp_hover, etc.)
└── constants.ts                     # Add installation metadata to BUILTIN_SERVERS

> **Analysis Update (2025-12-30)**: Changed from separate `src/tools/lsp-check/` directory to adding `lsp_check` tool directly to `src/tools/lsp/tools.ts`. This follows existing patterns where all LSP tools are in one file. The tool must be a proper tool (not just command) so agents can call it programmatically.

src/hooks/lsp-error-enhancer/        # NEW
├── index.ts                         # Hook exports
├── types.ts                         # Type definitions
└── hook.ts                          # createLspErrorEnhancerHook
```

### Command Files

```
~/.config/opencode/command/
├── init-project.md                  # UPDATED: wired to new tool
└── lsp-check.md                     # NEW: validation command
```

## Implementation Phases

### Phase 1: LSP Documentation Foundation (5h)

> **Analysis Update (2025-12-30)**: Time increased from 4h to 5h to include BUILTIN_SERVERS enhancement (T1.0). Path changed to `docs/guides/lsp/`.

| Step | Task | Files | Estimate |
|------|------|-------|----------|
| 1.0 | **Enhance BUILTIN_SERVERS** with installation metadata | src/tools/lsp/constants.ts | 30min |
| 1.1 | Create `docs/guides/lsp/` directory structure | docs/guides/lsp/ | 10min |
| 1.2 | Write `quick-start.md` (TypeScript, Python, Rust, Go) | docs/guides/lsp/quick-start.md | 45min |
| 1.3 | Write `index.md` (master server index with categories) | docs/guides/lsp/index.md | 30min |
| 1.4 | Write `configuration.md` (3-file config explanation) | docs/guides/lsp/configuration.md | 30min |
| 1.5 | Create template for server cards | docs/guides/lsp/servers/_template.md | 15min |
| 1.6 | Write top 5 server cards (TypeScript, basedpyright, gopls, rust-analyzer, clangd) | docs/guides/lsp/servers/*.md | 90min |

### Phase 2: Complete LSP Server Documentation (3h)

| Step | Task | Files | Estimate |
|------|------|-------|----------|
| 2.1 | Write remaining 17 server cards | docs/guides/lsp/servers/*.md | 150min |
| 2.2 | Write `troubleshooting.md` | docs/guides/lsp/troubleshooting.md | 30min |

### Phase 3: Migrate init-project to Bun (2.5h)

> **Analysis Update (2025-12-30)**: Time reduced from 3h to 2.5h. Existing code is mostly Bun-compatible; only import style changes needed (`import * as fs` → named imports, `require.main === module` → `import.meta.main`).

| Step | Task | Files | Estimate |
|------|------|-------|----------|
| 3.1 | Create `src/tools/init-project/` directory structure | src/tools/init-project/ | 15min |
| 3.2 | Migrate `types.ts` (no changes needed) | src/tools/init-project/types.ts | 15min |
| 3.3 | Migrate `tech-detection.ts` (Node fs -> Bun fs) | src/tools/init-project/tech-detection.ts | 30min |
| 3.4 | Migrate `config-generator.ts` (update package.json generation) | src/tools/init-project/config-generator.ts | 30min |
| 3.5 | Migrate `agents-generator.ts` | src/tools/init-project/agents-generator.ts | 20min |
| 3.6 | Migrate `edge-cases.ts` | src/tools/init-project/edge-cases.ts | 20min |
| 3.7 | Migrate `linear-setup.ts` | src/tools/init-project/linear-setup.ts | 15min |
| 3.8 | Create `constants.ts` (presets, defaults) | src/tools/init-project/constants.ts | 20min |
| 3.9 | Create `tools.ts` (init_project tool) | src/tools/init-project/tools.ts | 30min |
| 3.10 | Create `index.ts` (exports) | src/tools/init-project/index.ts | 10min |
| 3.11 | Wire to builtinTools in main index.ts | src/index.ts | 10min |

### Phase 4: Metrics & Non-Interactive Mode (2h)

| Step | Task | Files | Estimate |
|------|------|-------|----------|
| 4.1 | Create `metrics.ts` (read/write metrics file) | src/tools/init-project/metrics.ts | 40min |
| 4.2 | Add --yes flag handling | src/tools/init-project/tools.ts | 30min |
| 4.3 | Add --preset flag handling | src/tools/init-project/tools.ts | 20min |
| 4.4 | Add --fail-on-existing flag | src/tools/init-project/tools.ts | 15min |
| 4.5 | Add --json output format | src/tools/init-project/tools.ts | 15min |

### Phase 5: LSP Validation Command (2h)

| Step | Task | Files | Estimate |
|------|------|-------|----------|
| 5.1 | Create `src/tools/lsp-check/` directory | src/tools/lsp-check/ | 10min |
| 5.2 | Create `types.ts` | src/tools/lsp-check/types.ts | 15min |
| 5.3 | Create `constants.ts` (status messages) | src/tools/lsp-check/constants.ts | 15min |
| 5.4 | Create `tools.ts` (lsp_check tool) | src/tools/lsp-check/tools.ts | 45min |
| 5.5 | Create `index.ts` | src/tools/lsp-check/index.ts | 10min |
| 5.6 | Wire to builtinTools | src/index.ts | 10min |
| 5.7 | Create `/lsp-check` command file | ~/.config/opencode/command/lsp-check.md | 15min |

### Phase 6: LSP Error Enhancement Hook (2h)

| Step | Task | Files | Estimate |
|------|------|-------|----------|
| 6.1 | Create `src/hooks/lsp-error-enhancer/` | src/hooks/lsp-error-enhancer/ | 10min |
| 6.2 | Create `types.ts` | src/hooks/lsp-error-enhancer/types.ts | 15min |
| 6.3 | Create `hook.ts` (PostToolUse hook) | src/hooks/lsp-error-enhancer/hook.ts | 60min |
| 6.4 | Create `index.ts` | src/hooks/lsp-error-enhancer/index.ts | 10min |
| 6.5 | Wire to hook system | src/hooks/index.ts | 10min |
| 6.6 | Add error message templates | src/hooks/lsp-error-enhancer/constants.ts | 15min |

### Phase 7: First-Run Detection & Command Wiring (2h)

> **Analysis Update (2025-12-30)**: Time increased from 1h to 2h due to hook conflict resolution. The `session.created` event is already used by `auto-update-checker`, `startup-toast`, and `rules-injector`. Strategy: Integrate into existing `auto-update-checker` hook or use debounced notification system to prevent notification overload.

| Step | Task | Files | Estimate |
|------|------|-------|----------|
| 7.1 | Create first-run detection hook (or integrate into auto-update-checker) | src/hooks/first-run-detector/ OR src/hooks/auto-update-checker/ | 45min |
| 7.2 | Update `/init-project` command file | ~/.config/opencode/command/init-project.md | 20min |
| 7.3 | Add dismissal persistence per-project | src/tools/init-project/first-run.ts | 15min |
| 7.4 | Test hook interaction with existing session hooks | - | 20min |

### Phase 8: Testing & Documentation (2h)

| Step | Task | Files | Estimate |
|------|------|-------|----------|
| 8.1 | Test init-project on real projects (macOS) | - | 30min |
| 8.2 | Test lsp-check with various servers | - | 20min |
| 8.3 | Verify LSP docs accuracy | docs/lsp/ | 20min |
| 8.4 | Update README.md with new features | README.md | 20min |
| 8.5 | Test cross-platform (Linux VM) | - | 30min |

## Dependencies

### Internal (This Repo)

| Dependency | Status | Notes |
|------------|--------|-------|
| `src/tools/lsp/` | Exists | Use getAllServers(), LSPClient |
| `src/features/claude-code-command-loader/` | Exists | Command loading infrastructure |
| `src/shared/` | Exists | Utilities (file-utils, frontmatter, etc.) |
| `src/config/schema.ts` | Exists | May need metrics schema addition |
| `.opencode/tool/init-project/` | Exists | Source for migration |

### External

| Dependency | Status | Notes |
|------------|--------|-------|
| `@opencode-ai/plugin` | Required | Core plugin SDK |
| `bun-types` | Required | TypeScript types for Bun |
| LSP server binaries | User-installed | Per-language (npm, pip, cargo, etc.) |

## Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| LSP installation commands outdated | High | Medium | Link to official docs, version-agnostic commands |
| Windows PATH issues | Medium | High | Document PATH setup, detect and warn |
| Init overwrites customizations | Medium | High | Backup before modify, merge mode |
| Bun fs API differences | Low | Medium | Test thoroughly, fallback patterns |
| Large codebase detection slow | Low | Medium | Add timeout, sampling for large projects |

## Testing Strategy

### Unit Testing
- Test tech-detection with mock file systems
- Test config-generator output formats
- Test metrics read/write operations

### Integration Testing
- Test /init-project on:
  - Fresh directory
  - Existing project with package.json
  - Monorepo structure
  - Python project (pyproject.toml)
  - Go project (go.mod)
  - Rust project (Cargo.toml)

### Cross-Platform Testing
- macOS (primary): All features
- Linux: Docker container tests
- Windows: WSL2 + native (if available)

### LSP Validation Testing
- Test with installed servers
- Test with missing servers
- Test with broken server configs

## Success Metrics

| Metric | Target |
|--------|--------|
| Time to working LSP | < 5 minutes |
| Init completion rate | > 90% |
| LSP setup success rate | > 85% |
| Documentation findability | < 2 clicks from README |
| Error message helpfulness | > 80% resolution without support |
| Cross-platform coverage | 100% features on macOS/Linux/Windows |

## Time Summary

| Phase | Estimate |
|-------|----------|
| Phase 1: LSP Documentation Foundation | 4h |
| Phase 2: Complete LSP Server Docs | 3h |
| Phase 3: Migrate init-project to Bun | 3h |
| Phase 4: Metrics & Non-Interactive | 2h |
| Phase 5: LSP Validation Command | 2h |
| Phase 6: LSP Error Enhancement Hook | 2h |
| Phase 7: First-Run Detection | 1h |
| Phase 8: Testing & Documentation | 2h |
| **Total** | **19h** |

## Next Steps

After plan approval:
1. Run `/tasks` to create detailed task breakdown
2. Run `/implement` to start Phase 1 (LSP Documentation)
3. Prioritize documentation first (enables user onboarding while code is being migrated)

## Appendix A: LSP Server Categories

| Category | Servers |
|----------|---------|
| **JavaScript/TypeScript** | typescript, deno, vue, eslint, svelte, astro |
| **Python** | basedpyright (recommended), pyright, ruff |
| **Systems** | rust-analyzer, clangd, zls |
| **Go** | gopls |
| **JVM** | jdtls (Java) |
| **Mobile** | sourcekit-lsp (Swift), dart |
| **Ruby** | ruby-lsp |
| **Elixir** | elixir-ls |
| **C#/.NET** | csharp |
| **Scripting** | lua-ls, php |
| **Config** | yaml-ls |

## Appendix B: Preset Definitions

```typescript
const PRESETS: Record<string, Partial<InitProjectConfig>> = {
  "web-app": {
    projectType: "web-app",
    architecture: ARCHITECTURE_PATTERNS.find(p => p.id === "layered"),
    recommendedLspServers: ["typescript", "eslint"]
  },
  "api-ts": {
    projectType: "api",
    architecture: ARCHITECTURE_PATTERNS.find(p => p.id === "layered"),
    recommendedLspServers: ["typescript", "eslint"]
  },
  "api-python": {
    projectType: "api",
    architecture: ARCHITECTURE_PATTERNS.find(p => p.id === "layered"),
    recommendedLspServers: ["basedpyright", "ruff"]
  },
  "cli": {
    projectType: "cli",
    architecture: ARCHITECTURE_PATTERNS.find(p => p.id === "layered"),
    recommendedLspServers: ["typescript"]
  },
  "library": {
    projectType: "library",
    architecture: ARCHITECTURE_PATTERNS.find(p => p.id === "hexagonal"),
    recommendedLspServers: ["typescript"]
  }
}
```
