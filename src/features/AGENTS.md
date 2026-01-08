# FEATURES KNOWLEDGE BASE

**Generated:** 2026-01-07T22:44:30-04:00
**Commit:** d864af6
**Branch:** hello/lif-111-sync-fork-with-upstream-code-yeongyuoh-my-opencode-397

---

## OVERVIEW
Core runtime engines, session state management, and compatibility adapters for Claude Code ecosystem.

## STRUCTURE
```
src/features/
├── background-agent/       # Concurrency engine (manager.ts: 526 lines)
├── claude-code-*-loader/   # Adapters for .claude/ commands, skills, agents, MCPs
├── claude-code-session-state/  # State machine for agent registry and tracking
├── context-learning/       # Meta-learning extraction from session history
├── orchestration/          # Multi-model task delegation and routing
├── hook-message-injector/  # Dynamic context insertion into lifecycle hooks
├── builtin-commands/       # Internal CLI command implementations
└── terminal/               # TTY and output formatting utilities
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Background task logic | `background-agent/manager.ts` | Manages parallel agent execution |
| Concurrency limits | `background-agent/concurrency.ts` | Model-specific rate limiting |
| Agent state tracking | `claude-code-session-state/` | Active subagent lifecycle state |
| Import Claude artifacts | `claude-code-*-loader/` | Markdown/YAML to SDK structures |
| System prompts | `hook-message-injector/` | Hook-based system message logic |
| Builtin CLI logic | `builtin-commands/` | Internal command implementations |

## PATTERNS

- **Loader Adapter**: Scans `.claude/` directories, parses Markdown/YAML, transforms to OpenCode SDK structures
- **State Registry**: Centralized tracking of agent hierarchies (parent-child) and execution status
- **Parallel Concurrency**: Semaphores and model-aware priority queues for API rate limiting
- **Hook Injection**: Intercepts lifecycle events to inject context-aware system messages
- **Event-Driven Completion**: Background tasks detect completion via session.idle, session.deleted events

## LOADER PRIORITY

| Loader | Priority (highest first) |
|--------|--------------------------|
| Commands | `.opencode/command/` > `~/.config/opencode/command/` > `.claude/commands/` > `~/.claude/commands/` |
| Skills | `.opencode/skill/` > `~/.config/opencode/skill/` > `.claude/skills/` > `~/.claude/skills/` |
| Agents | `.claude/agents/` > `~/.claude/agents/` |
| MCPs | `.claude/.mcp.json` > `.mcp.json` > `~/.claude/.mcp.json` |

## CONFIG TOGGLES

```json
{
  "claude_code": {
    "mcp": false,      // Skip .mcp.json
    "commands": false, // Skip commands/*.md
    "skills": false,   // Skip skills/*/SKILL.md
    "agents": false,   // Skip agents/*.md
    "hooks": false     // Skip settings.json hooks
  }
}
```

## ANTI-PATTERNS

- **Blocking on load**: Loaders run at startup; keep them fast
- **No error handling**: Always try/catch in loaders
- **Ignoring priority order**: Higher priority sources override lower
- **Writing to ~/.claude/**: Read-only; user's Claude Code config
