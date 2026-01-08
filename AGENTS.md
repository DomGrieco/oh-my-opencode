# PROJECT KNOWLEDGE BASE

**Generated:** 2026-01-07T22:34:23-04:00
**Commit:** d864af6
**Branch:** hello/lif-111-sync-fork-with-upstream-code-yeongyuoh-my-opencode-397

---

## OVERVIEW

OpenCode plugin ("oh-my-zsh for OpenCode"). Multi-model agent orchestration (Claude, GPT, Gemini, Grok), 11 LSP tools, AST-Grep, 40+ lifecycle hooks, MCP integrations (context7, websearch_exa, grep_app). Full Claude Code compatibility layer.

## STRUCTURE

```
oh-my-opencode/
├── src/
│   ├── agents/        # 31 AI agents (OmO, Sisyphus, oracle, librarian, explore, 20+ specialists)
│   ├── hooks/         # 30 hook directories, 40+ lifecycle hooks
│   ├── tools/         # 17 tool directories (LSP, AST-Grep, Linear, session-manager, etc.)
│   ├── features/      # Claude Code loaders, background agent, session state
│   ├── mcp/           # MCP server configs (context7, websearch_exa, grep_app)
│   ├── config/        # Zod schema (532 lines), TypeScript types
│   ├── auth/          # Google Antigravity OAuth (PKCE flow)
│   ├── shared/        # Utilities (deep-merge, pattern-matcher, logger)
│   └── index.ts       # Main plugin entry (792 lines)
├── tests/             # 23 test files using Bun test runner
├── script/            # build-schema.ts, publish.ts
├── assets/            # JSON schema for config autocomplete
├── docs/              # Architecture decisions, guides
├── changelog/         # Release changelogs
└── dist/              # Build output (ESM + .d.ts)
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add new agent | `src/agents/` | Create .ts file, add to builtinAgents, update types.ts |
| Add new hook | `src/hooks/` | Create dir with createXXXHook(), export from index.ts |
| Add new tool | `src/tools/` | Dir with index/types/constants/tools.ts pattern |
| Add MCP server | `src/mcp/` | Create config file, add to index.ts |
| Modify LSP | `src/tools/lsp/` | client.ts (574 lines) for connection, tools.ts for handlers |
| Config schema | `src/config/schema.ts` | Zod schema, run `bun run build:schema` after changes |
| Claude Code compat | `src/features/claude-code-*-loader/` | Command, skill, agent, mcp loaders |
| Background agents | `src/features/background-agent/manager.ts` | 526 lines, concurrency management |
| Google OAuth | `src/auth/antigravity/` | PKCE flow, token management |

## CODE MAP

| File | Lines | Role |
|------|-------|------|
| `src/index.ts` | 792 | Main plugin hub - wires 40+ hooks, tools, agents, MCPs |
| `src/config/schema.ts` | 532 | Zod config schema - all plugin capabilities |
| `src/tools/linear/tools.ts` | 810 | Linear CRUD - issues, status, comments |
| `src/tools/linear/api.ts` | 664 | Linear GraphQL client |
| `src/tools/lsp/client.ts` | 574 | LSP infrastructure |
| `src/features/background-agent/manager.ts` | 526 | Background task orchestration |
| `src/agents/sisyphus.ts` | 504 | Senior orchestrator agent |

## CONVENTIONS

- **Package manager**: Bun only (`bun run`, `bun build`, `bunx`)
- **Types**: bun-types (not @types/node)
- **Build**: Dual output - `bun build` (ESM) + `tsc --emitDeclarationOnly`
- **Exports**: Barrel pattern - `export * from "./module"` in index.ts
- **Directory naming**: kebab-case (`ast-grep/`, `claude-code-hooks/`)
- **Tool structure**: Each tool has index.ts, types.ts, constants.ts, tools.ts, utils.ts
- **Hook pattern**: `createXXXHook(ctx: PluginInput)` returning event handlers
- **Agent temperature**: Most use `0.1` for consistency

## ANTI-PATTERNS (THIS PROJECT)

- **npm/yarn**: Use bun exclusively
- **@types/node**: Use bun-types
- **Bash file ops**: Never mkdir/touch/rm/cp/mv for file creation in code
- **Generic AI aesthetics**: No Space Grotesk, avoid typical AI-generated UI patterns
- **Direct bun publish**: Use GitHub Actions workflow_dispatch only (OIDC provenance)
- **Local version bump**: Version managed by CI workflow, never modify locally
- **Skip git hooks**: Never use --no-verify, --no-gpg-sign
- **Force push main**: Never force push to main/master
- **Type suppression**: Never use `as any`, `@ts-ignore`, `@ts-expect-error`
- **Empty catch blocks**: Always handle errors properly
- **Sequential tool calls**: ALWAYS use 3+ parallel tool calls when possible

## UNIQUE STYLES

- **Platform handling**: Union type `"darwin" | "linux" | "win32" | "unsupported"`
- **Optional props**: Extensive use of `?` for optional interface properties
- **Flexible objects**: `Record<string, unknown>` for dynamic configs
- **Error handling**: Consistent try/catch with async/await
- **Agent tool restrictions**: `tools: { include: [...] }` or `tools: { exclude: [...] }`
- **Permission compat**: Auto-migrates legacy `tools` to OpenCode 1.1.1 `permission` format
- **Hook naming**: `createXXXHook` function naming convention

## AGENT MODELS

| Agent | Model | Role |
|-------|-------|------|
| OmO | anthropic/claude-opus-4-5 | Primary orchestrator (team-lead) |
| Sisyphus | anthropic/claude-opus-4-5 | Senior orchestrator (team-lead) |
| oracle | openai/gpt-5.2 | Strategic advisor (advisor) |
| librarian | anthropic/claude-sonnet-4-5 | Multi-repo analysis (utility) |
| explore | opencode/grok-code | Fast codebase exploration (utility) |
| frontend-ui-ux-engineer | google/gemini-3-pro-preview | UI generation (specialist) |
| document-writer | google/gemini-3-pro-preview | Technical docs (specialist) |
| multimodal-looker | google/gemini-2.5-flash | PDF/image analysis (utility) |
| context-learner | google/gemini-2.5-flash | Meta-learning extraction (specialist) |

**Role Hierarchy**: team-lead → manager → specialist → advisor → utility

## CORE CAPABILITIES

- **Preemptive Compaction**: Auto-triggers at 70%+ context usage
- **Session Recovery**: Multi-layered recovery (empty messages, thinking blocks, errors)
- **Background Concurrency**: Model-based limits, parallel agent execution
- **Claude Code Compat**: Commands, skills, agents, MCPs, hooks from `.claude/` dirs
- **Session History**: Search, read, analyze historical sessions

## COMMANDS

```bash
bun run typecheck     # Type check
bun run build         # ESM + declarations + schema
bun run rebuild       # Clean + build
bun run build:schema  # Schema only
bun test              # Run tests (23 test files)
```

## DEPLOYMENT

**GitHub Actions workflow_dispatch only**

```bash
gh workflow run publish -f bump=patch
gh run list --workflow=publish
```

**Critical**: Never `bun publish` directly. Never bump version locally.

## PROJECT MEMORY

| File | Purpose |
|------|---------|
| `.opencode/project-context.yaml` | Structured project config |
| `.cursor/memory/constitution.md` | Core principles |
| `.cursor/memory/architecture.md` | System design |
| `.cursor/memory/tech-stack.md` | Technologies |
| `.cursor/memory/glossary.md` | Domain terms |

## NOTES

- **Tests**: 23 test files using Bun test runner (`bun test`)
- **OpenCode version**: Requires >= 1.1.1 for permission compatibility
- **Multi-language docs**: README.md (EN), README.ko.md (KO), README.ja.md (JA)
- **Config locations**: `~/.config/opencode/oh-my-opencode.json` (user), `.opencode/oh-my-opencode.json` (project)
- **Schema autocomplete**: Add `$schema` field in config for IDE support
- **Trusted deps**: @ast-grep/cli, @ast-grep/napi, @code-yeongyu/comment-checker
