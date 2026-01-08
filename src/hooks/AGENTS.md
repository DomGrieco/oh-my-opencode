# HOOKS KNOWLEDGE BASE

**Generated:** 2026-01-07T22:44:30-04:00
**Commit:** d864af6
**Branch:** hello/lif-111-sync-fork-with-upstream-code-yeongyuoh-my-opencode-397

---

## OVERVIEW
40+ lifecycle hooks managing session state, tool execution, and multi-model message transformation.

## STRUCTURE
```
src/hooks/
├── index.ts                # Barrel exports for all hooks
└── [hook-name]/            # Kebab-case directory per hook
    ├── index.ts            # createXXXHook() factory function
    ├── types.ts            # Event payload and option types
    └── constants.ts        # Event namespaces and default configs
```

## WHERE TO LOOK

| Category | Hooks | Primary Event |
|----------|-------|---------------|
| **Session** | session-recovery, preemptive-compaction, anthropic-auto-compact | `session.*` |
| **Tool Enhancement** | tool-output-truncator, grep-output-truncator, edit-error-recovery | `tool.execute.after` |
| **Content Injection** | directory-agents-injector, directory-readme-injector, rules-injector | `tool.execute.after` |
| **Quality** | comment-checker, security-scanner, conflict-detector | `tool.execute.*` |
| **Claude Compat** | claude-code-hooks | `experimental.chat.messages.transform` |
| **Governance** | governance-path-validator, governance-historian, governance-linear-injector | `tool.execute.*` |

## PATTERNS

- **Factory Pattern**: `export function createXXXHook(ctx: PluginInput, options?: Config)`
- **Return Object**: `{ event: async (props) => {...}, "tool.execute.after": async (props) => {...} }`
- **Barrel Exports**: All hooks exported via `src/hooks/index.ts`
- **Async Handlers**: Most handlers are async for model calls or file I/O
- **Immutable Transforms**: Transform hooks return new objects, never mutate

## CATEGORIES

- **Core**: Preemptive compaction (70% threshold), session recovery, empty message sanitizer
- **Tool Enhancement**: Output truncation, error recovery, permission migration
- **Content Injection**: AGENTS.md injection, README injection, conditional rules
- **Quality Assurance**: Comment checking, security scanning, conflict detection
- **Governance**: Path validation, historian tracking, Linear context injection
- **Claude Code Compat**: Native `.claude/settings.json` hook execution

## HOW TO ADD

1. Create `src/hooks/my-hook/`:
   ```
   my-hook/
   ├── index.ts      # createMyHook()
   ├── types.ts      # Options interface
   └── constants.ts  # Event keys
   ```
2. Implement in `index.ts`:
   ```typescript
   export function createMyHook(ctx: PluginInput, options?: MyHookOptions) {
     return {
       "tool.execute.after": async (props) => {
         // Hook logic
         return { messages: [...] }  // or { blocked: true, message: "..." }
       }
     }
   }
   ```
3. Export from `src/hooks/index.ts`
4. Register in `src/index.ts` plugin hooks

## ANTI-PATTERNS

- Heavy computation in PreToolUse (slows every tool call)
- Blocking without actionable message
- Duplicate injection (track what's already injected)
- Missing try/catch (don't crash the session)
