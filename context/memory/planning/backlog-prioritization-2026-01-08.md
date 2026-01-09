---
description: Master backlog prioritization plan for oh-my-opencode, with memory system as critical path
category: planning
confidence: 0.95
source: analysis
tags: [planning, roadmap, backlog, memory-system, prioritization]
createdAt: 2026-01-08
relatedTo:
  - path: planning/memory-system-architecture
    type: implements
---

# Backlog Prioritization Roadmap

## Summary

Memory system (LIF-83 → LIF-115 → LIF-116 → LIF-117) is the **critical path** for sustainable long-term scaling. Total duration: 4-5 weeks.

## Phase Order

| Phase | Focus | Key Issues | Duration |
|-------|-------|------------|----------|
| **1** | Memory Foundation | LIF-83, LIF-98 | 3-4 days |
| **2** | Infrastructure | LIF-109, LIF-85 | 2-3 days |
| **3** | Semantic Search | LIF-115 | 2-3 days |
| **4** | Context Savings | LIF-78, 79, 80, 113 | 1 day |
| **5** | Advanced Memory | LIF-116, LIF-117 | 5-8 days |
| **6** | Quality & Polish | LIF-110, 107, 106 | 4-5 days |

## Critical Path

```
LIF-83 (Metadata) → LIF-115 (Semantic Search) → LIF-116 (Activation) → LIF-117 (Consolidation)
```

## Key Decisions

1. **Memory First**: LIF-83 unblocks all memory work - start immediately
2. **Interleave Infrastructure**: Fix paths (LIF-109) early to prevent debt
3. **Quick Wins**: Serena removal (LIF-80) provides immediate context savings
4. **Defer Research**: DSPy, Web UI, Meta-Orchestrator are future initiatives

## Deferred Items

- LIF-76: DSPy Integration (research)
- LIF-77: DMail (nice-to-have)
- LIF-86: Idle Alerts (polish)
- LIF-87: Meta-Orchestrator (large scope)
- LIF-88: Web UI (separate initiative)

## Linear Reference

- Master Plan: [LIF-84](https://linear.app/lifelogger/issue/LIF-84)
- Memory Parent: [LIF-114](https://linear.app/lifelogger/issue/LIF-114)

## Next Action

Start LIF-83 implementation immediately.
