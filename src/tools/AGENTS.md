# TOOLS KNOWLEDGE BASE

**Generated:** 2026-01-07T22:44:30-04:00
**Commit:** d864af6
**Branch:** hello/lif-111-sync-fork-with-upstream-code-yeongyuoh-my-opencode-397

---

## OVERVIEW
17-tool suite (89 files) bridging local LSP/AST-Grep with cloud services (Linear) and session orchestration.

## STRUCTURE
```
src/tools/
├── [tool-id]/          # Kebab-case (e.g., ast-grep, linear)
│   ├── index.ts        # Barrel export & tool registration
│   ├── types.ts        # Zod schemas & TS interfaces
│   ├── constants.ts    # Enums & config defaults
│   ├── tools.ts        # Core handler logic (snake_case functions)
│   ├── utils.ts        # Domain-specific helpers
│   └── [extra].ts      # client.ts, storage.ts, execution.ts (complex only)
└── index.ts            # Central registry (builtinTools object)
```

## WHERE TO LOOK

| Category | Directory | Key Files |
|----------|-----------|-----------|
| **LSP (11 tools)** | `lsp/` | `client.ts` (JSON-RPC), `tools.ts` (LSP methods) |
| **AST-Grep** | `ast-grep/` | `execution.ts` (CLI wrapper), `tools.ts` (search/replace) |
| **Linear (7 tools)** | `linear/` | `api.ts` (GraphQL client), `tools.ts` (CRUD ops) |
| **Session** | `session-manager/` | `storage.ts` (persistence), `tools.ts` (read/search) |
| **Background** | `background-task/` | Manager in features/, `tools.ts` (output/cancel) |
| **Spec/Workflow** | `spec/` | `tools.ts` (folder creation, workflow state) |

## PATTERNS

- **Registration**: All tools exported via `builtinTools` in `src/tools/index.ts`
- **Naming**: Directory `kebab-case`, functions `snake_case`
- **Validation**: Zod schemas in `types.ts` for parameter validation
- **Error Handling**: Use descriptive errors for agent feedback
- **Client Isolation**: API/CLI clients in separate `client.ts` or `execution.ts`
- **State Persistence**: Tool-specific state in `storage.ts`
- **Concurrency**: Background tools interface with `BackgroundAgentManager`

## HOW TO ADD

1. Create `src/tools/my-tool/`:
   ```
   my-tool/
   ├── index.ts      # Barrel export
   ├── types.ts      # Zod schemas
   ├── constants.ts  # Config defaults
   ├── tools.ts      # Tool implementations
   └── utils.ts      # Helpers (optional)
   ```
2. Define tool in `tools.ts`:
   ```typescript
   export const my_tool = {
     name: "my_tool",
     description: "...",
     parameters: z.object({ ... }),
     execute: async (args) => { ... }
   }
   ```
3. Export from `index.ts`
4. Add to `builtinTools` in `src/tools/index.ts`

## ANTI-PATTERNS

- **Direct CLI calls**: Never use `child_process` directly in `tools.ts`; use `execution.ts`
- **Hardcoded Auth**: Never store tokens in `constants.ts`; use `src/auth/` or config
- **Nested Tools**: Avoid tools calling other tools directly; delegate via orchestrator
- **Fat index.ts**: Keep `index.ts` limited to registration and exports
