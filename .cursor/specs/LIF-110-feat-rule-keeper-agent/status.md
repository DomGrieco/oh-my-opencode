# rule-keeper-agent - Status

**Linear Issue**: [LIF-110](https://linear.app/lifelogger/issue/LIF-110)
**Last Updated**: 2026-01-03

## Current Status

- **Phase**: Planning Complete
- **Progress**: 30%
- **Blockers**: None

## Recent Updates

- 2026-01-03: **Two-Agent Architecture** - Split into Rule Keeper + Rule Engineer
  - Rule Keeper: Orchestrator that monitors, discovers, delegates
  - Rule Engineer: Specialist that writes high-quality AGENTS.md with encoded knowledge
  - Added "Encoded Lessons Learned" section with OmO, Oracle, command patterns
  - Added command pattern detection (workflow patterns from /review, /specify, etc.)
  - Clarified Phase 2 scope for `.cursor/rules/*.mdc` support
  - Updated plan with 7 phases (17h total, up from 14h for better separation of concerns)
- 2026-01-03: **Major spec rewrite** - Aligned with upstream oh-my-opencode patterns
  - Analyzed upstream (code-yeongyu/oh-my-opencode dev branch) - found 8 AGENTS.md files
  - Made spec project-agnostic (works with any project, not just oh-my-opencode)
  - Added tiered system (Navigation/Standard/Minimal)
  - Added configuration system for project-specific customization
  - Removed `.cursor/rules/*.mdc` from Phase 1 scope (deferred to Phase 2)
  - Added TDD enforcement as configurable protected section
  - Added agent design section with tool usage patterns
  - Added standard templates for all three tiers
- 2025-12-30: Spec folder created

## Key Decisions Made

| Decision | Rationale |
|----------|-----------|
| Two-agent architecture | Separation of concerns: monitoring vs. writing expertise |
| Rule Engineer first | Build specialist with encoded knowledge, then orchestrator |
| Direct apply (no confirm) | Changes apply directly, human reviews at PR stage (like other agents) |
| Project-agnostic core | Rule-keeper works on any project using OpenCode |
| Tiered AGENTS.md | Navigation/Standard/Minimal based on directory purpose |
| .cursor/rules deferred | Focus Phase 1 on AGENTS.md hierarchy |
| Encoded Lessons Learned | OmO, Oracle, command patterns baked into Rule Engineer |
| Configuration system | Templates, thresholds, protected sections all configurable |
| Archive legacy agent | Old `.opencode/agent/rule-engineer.md` archived, replaced by TypeScript agents |

## Upstream Analysis Summary

Analyzed `code-yeongyu/oh-my-opencode` dev branch:

| File | Lines | Tier |
|------|-------|------|
| `AGENTS.md` (root) | ~150 | Navigation (links to subdirs) |
| `src/agents/AGENTS.md` | ~60 | Standard |
| `src/hooks/AGENTS.md` | ~70 | Standard |
| `src/tools/AGENTS.md` | ~70 | Standard |
| `src/features/AGENTS.md` | ~60 | Standard |
| `src/auth/AGENTS.md` | ~50 | Standard |
| `src/cli/AGENTS.md` | ~60 | Standard |
| `src/shared/AGENTS.md` | ~50 | Minimal |

## Next Steps

1. ~~Create implementation plan (`/plan`)~~ ✅ Done
2. Break down into tasks (`/tasks`)
3. Implement Rule Engineer agent (Phase 1)
4. Implement Rule Keeper agent (Phase 2)
5. Create configuration schema (Phase 3)
6. Create `/update-rules` command (Phase 4)
7. Test on oh-my-opencode (Phase 5)
8. Workflow integration - optional (Phase 6)

## Files Modified

- `spec.md` - Complete rewrite (275 → 450+ lines)
- `status.md` - Updated with analysis summary
