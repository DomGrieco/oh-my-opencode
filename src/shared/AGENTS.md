# SHARED UTILITIES KNOWLEDGE BASE

**Generated:** 2026-01-07T22:55:00-04:00
**Commit:** d864af6
**Branch:** hello/lif-111-sync-fork-with-upstream-code-yeongyuoh-my-opencode-397

---

## OVERVIEW

Cross-cutting utilities: path resolution, config management, text processing, permission compatibility.

## STRUCTURE

```
shared/
├── index.ts                  # Barrel export
├── claude-config-dir.ts      # ~/.claude resolution
├── command-executor.ts       # Shell exec with variable expansion
├── command-preflight.ts      # Pre-execution validation
├── data-path.ts              # XDG data directory
├── deep-merge.ts             # Type-safe recursive merge
├── delegation-policy.ts      # Agent delegation rules
├── dynamic-truncator.ts      # Token-aware truncation
├── file-reference-resolver.ts # @filename syntax
├── file-utils.ts             # Symlink, markdown detection
├── frontmatter.ts            # YAML frontmatter parsing
├── hook-disabled.ts          # Check if hook disabled
├── logger.ts                 # File-based logging
├── model-sanitizer.ts        # Normalize model names
├── opencode-version.ts       # Version detection & comparison
├── pattern-matcher.ts        # Tool name matching
├── permission-compat.ts      # Legacy tools→permission migration
└── workflow-context.ts       # Workflow state management
```

## WHEN TO USE

| Task | Utility | Example |
|------|---------|---------|
| Find ~/.claude | `getClaudeConfigDir()` | Config file lookups |
| Merge configs | `deepMerge(base, override)` | User + project config |
| Check hook enabled | `isHookDisabled(name, list)` | Hook skip logic |
| Truncate output | `dynamicTruncate(text, budget)` | Large tool outputs |
| Resolve @file | `resolveFileReferencesInText()` | Command markdown |
| Execute shell | `resolveCommandsInText()` | Command injection |
| Tool restrictions | `createAgentToolRestrictions()` | Agent permission compat |
| Check OpenCode version | `getOpenCodeVersion()` | Feature detection |

## CRITICAL PATTERNS

```typescript
// Dynamic truncation (ALWAYS use for large outputs)
const output = dynamicTruncate(result, remainingTokens, 0.5)

// Deep merge with correct priority (project wins)
const final = deepMerge(deepMerge(defaults, userConfig), projectConfig)

// Permission compatibility (OpenCode 1.1.1+)
const tools = createAgentToolRestrictions(agentConfig, isNewFormat)
```

## ANTI-PATTERNS

- **Hardcoding paths**: Use `getClaudeConfigDir()`, `getDataPath()`
- **Ignoring truncation**: Large outputs MUST use `dynamicTruncate()`
- **Direct string concat**: Use `deepMerge()` for configs
- **Skipping version check**: Use `isOpenCodeVersionAtLeast()` for features
