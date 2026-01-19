# OpenCode Native Skills Support - Implementation Plan

**Linear Issue**: [LIF-108](https://linear.app/lifelogger/issue/LIF-108/add-opencode-native-skills-support)
**Created**: 2025-12-30
**Author**: Strategic Planner (OmO)

## Summary

Extend the existing skill loader and skill tool to discover and load skills from OpenCode-native directories (`.opencode/skill/` and `~/.config/opencode/skill/`) in addition to Claude Code directories. This follows the existing pattern established by the command loader, which already supports both OpenCode and Claude Code paths.

## Technical Context

| Aspect | Details |
|--------|---------|
| **Language** | TypeScript 5.7+ |
| **Runtime** | Bun (1.0+) |
| **Package Manager** | Bun exclusively |
| **Framework** | @opencode-ai/plugin SDK |
| **Target Files** | `src/features/claude-code-skill-loader/`, `src/tools/skill/`, `src/config/schema.ts`, `src/index.ts` |
| **Testing** | Manual dogfooding (no test framework) |

## Constitution Check

| Principle | Compliance |
|-----------|------------|
| **I. Plugin-First Architecture** | ✅ All changes through plugin SDK, extending existing loaders |
| **II. Multi-Model Excellence** | ✅ N/A - no model changes |
| **III. Multi-Layered Agent Orchestration** | ✅ N/A - infrastructure change |
| **IV. Bun-Native Development** | ✅ Bun only for package management/runtime |
| **V. Hook-Driven Enhancement** | ✅ Skill loading follows existing hook pattern |
| **VI. Dogfooding** | ✅ Can test with our own skills in `.opencode/skill/` |
| **VII. GitHub Actions Publishing Only** | ✅ N/A - no publishing changes |

## Architecture

### Context-Optimized Design Philosophy

This implementation follows a **context-first architecture** that minimizes token usage while maximizing agent capability:

| Design Principle | Implementation |
|------------------|----------------|
| **Lazy Loading** | Full skill content loaded only when invoked |
| **Compact Metadata** | Tool description contains names only (~15 tokens/skill) |
| **Shared Discovery** | Single discovery layer for loader and tool (DRY) |
| **Smart Caching** | In-memory cache with mtime invalidation |
| **Efficient Search** | Filter by scope, search by name (no embeddings needed) |

### Token Budget Analysis

| Scenario | Old Approach | New Approach | Savings |
|----------|--------------|--------------|---------|
| 10 skills | ~750 tokens | ~150 tokens | 80% |
| 50 skills | ~3,750 tokens | ~750 tokens | 80% |
| 100 skills | ~7,500 tokens | ~1,500 tokens | 80% |
| 200 skills | ~15,000 tokens | ~3,000 tokens | 80% |

### Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              src/index.ts                               │
│                         (Plugin Entry Point)                            │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      Command Loading                             │   │
│  │                                                                  │   │
│  │  Priority (lowest to highest):                                  │   │
│  │  1. userCommands (claude_code.commands)                         │   │
│  │  2. userSkills (claude_code.skills)        ← EXISTING           │   │
│  │  3. opencodeGlobalCommands                                      │   │
│  │  4. systemCommands                                              │   │
│  │  5. projectCommands (claude_code.commands)                      │   │
│  │  6. projectSkills (claude_code.skills)     ← EXISTING           │   │
│  │  7. opencodeProjectCommands                                     │   │
│  │                                                                  │   │
│  │  NEW ADDITIONS (2a & 5a):                                       │   │
│  │  2a. opencodeGlobalSkills (opencode.skills)  ← NEW              │   │
│  │  5a. opencodeProjectSkills (opencode.skills) ← NEW              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│           src/features/claude-code-skill-loader/                        │
│                                                                         │
│  loader.ts                                                             │
│  ├── loadSkillsFromDir(dir, scope) → LoadedSkillAsCommand[]            │
│  ├── loadUserSkillsAsCommands()    → Record<string, CommandDefinition> │
│  ├── loadProjectSkillsAsCommands() → Record<string, CommandDefinition> │
│  ├── loadOpencodeGlobalSkills()    → Record<string, CommandDefinition> │ ← NEW
│  └── loadOpencodeProjectSkills()   → Record<string, CommandDefinition> │ ← NEW
│                                                                         │
│  types.ts                                                              │
│  ├── SkillScope = "user" | "project"                                   │
│  │   → "user" | "project" | "opencode-user" | "opencode-project"       │ ← MODIFIED
│  └── ...                                                               │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                      src/tools/skill/                                   │
│                                                                         │
│  tools.ts                                                              │
│  ├── discoverSkillsFromDir(dir, scope)                                 │
│  │   → (unchanged logic, new scope values)                             │
│  ├── discoverSkillsSync()                                              │
│  │   → Add OpenCode directories to discovery                           │ ← MODIFY
│  ├── discoverSkills()                                                  │
│  │   → Add OpenCode directories to async discovery                     │ ← MODIFY
│  └── formatSkillList()                                                 │
│      → Update "No skills found" message                                │ ← MODIFY
│                                                                         │
│  types.ts                                                              │
│  └── SkillScope = "user" | "project"                                   │
│      → "user" | "project" | "opencode-user" | "opencode-project"       │ ← MODIFY
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│           src/shared/skill-discovery.ts (NEW)                           │
│                                                                         │
│  Shared Layer (DRY between loader and tool)                             │
│  ├── getSkillDirectories(config) → SkillDirectory[]                     │
│  │   Returns prioritized list of directories to scan                    │
│  │                                                                       │
│  ├── discoverSkillMetadata(dirs) → SkillMetadata[]                      │
│  │   Discovers skills, returns metadata only (no body content)          │
│  │   Uses cache with mtime invalidation                                 │
│  │                                                                       │
│  ├── loadSkillContent(path) → SkillContent                              │
│  │   On-demand loading of full skill body + references                  │
│  │                                                                       │
│  └── SkillCache (singleton)                                             │
│      In-memory cache with mtime-based invalidation                      │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                      src/config/schema.ts                               │
│                                                                         │
│  NEW: OpencodeConfigSchema                                             │
│  ├── skills: z.boolean().optional()                                    │
│  └── (future: commands, mcp, etc.)                                     │
│                                                                         │
│  MODIFY: OhMyOpenCodeConfigSchema                                      │
│  └── opencode: OpencodeConfigSchema.optional()                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    TWO-TIER LOADING ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  TIER 1: Metadata Discovery (at startup and tool init)                  │
│  ─────────────────────────────────────────────────────                  │
│  ┌─────────────────┐      ┌──────────────────┐                          │
│  │ getSkillDirs()  │ ──▶  │ discoverMetadata │ ──▶ SkillCache           │
│  │ (config-based)  │      │ (frontmatter)    │     (in-memory)          │
│  └─────────────────┘      └──────────────────┘         │                │
│                                                         │                │
│                           ┌─────────────────────────────┘                │
│                           ▼                                              │
│  Tool Description: "- skill-name (scope)" (~15 tokens/skill)            │
│                                                                         │
│  TIER 2: Content Loading (on skill invocation only)                     │
│  ─────────────────────────────────────────────────                      │
│  ┌─────────────────┐      ┌──────────────────┐                          │
│  │ skill({ name }) │ ──▶  │ loadSkillContent │ ──▶ Full SKILL.md body   │
│  │ (agent call)    │      │ (on-demand)      │     + references         │
│  └─────────────────┘      └──────────────────┘                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                         CACHING STRATEGY                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  SkillCache (Singleton, In-Memory)                                      │
│  ├── metadata: Map<path, { skill: SkillMetadata, mtime: number }>       │
│  ├── content: Map<path, { content: string, mtime: number }>             │
│  │                                                                       │
│  │  Invalidation Triggers:                                              │
│  │  ├── File mtime changed → Entry invalidated on next access           │
│  │  ├── session.compacted event → Full cache clear                      │
│  │  └── Manual refresh → Cache cleared for specific skill               │
│  │                                                                       │
│  │  Performance:                                                         │
│  │  ├── First discovery: ~500ms (100 skills)                            │
│  │  ├── Cached discovery: <10ms (100 skills)                            │
│  │  ├── Invalidation: Directory-level mtime check (not per-skill)       │
│  │  └── Full revalidation on directory change only                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

Plugin Initialization (config hook)
           │
           ├─────────────────────────────────────────────────────────────┐
           │                                                             │
           ▼                                                             ▼
  Check claude_code.skills              Check opencode.skills (NEW)
  (default: true)                       (default: true)
           │                                                             │
           ├──────────► loadUserSkillsAsCommands()                       │
           │            (~/.claude/skills/)                              │
           │                                                             │
           ├──────────► loadProjectSkillsAsCommands()                    │
           │            (./.claude/skills/)                              │
           │                                                             │
           │                               ├──────► loadOpencodeGlobalSkills() (NEW)
           │                               │        (~/.config/opencode/skill/)
           │                               │
           │                               └──────► loadOpencodeProjectSkills() (NEW)
           │                                        (./.opencode/skill/)
           │                                                             │
           ▼                                                             ▼
     Merge all skills (highest priority wins for duplicates)
           │
           │  Priority order (highest to lowest):
           │  1. .opencode/skill/        (opencode-project)
           │  2. .claude/skills/         (project)
           │  3. ~/.config/opencode/skill/ (opencode-user)
           │  4. ~/.claude/skills/       (user)
           │
           ▼
     config.command = merged record
```

## Data Models

### Shared Discovery Layer Types (NEW)

```typescript
// src/shared/skill-discovery.ts

export interface SkillDirectory {
  path: string
  scope: SkillScope
  priority: number  // 1 = highest (opencode-project), 4 = lowest (user)
  enabled: boolean  // Based on config toggles
}

export interface SkillMetadata {
  name: string
  description: string
  scope: SkillScope
  path: string          // Full path to skill directory
  mtime: number         // File modification time for cache invalidation
}

export interface SkillContent {
  metadata: SkillMetadata
  body: string          // Full SKILL.md body content
  references: string[]  // List of reference file names
  scripts: string[]     // List of script file names
  assets: string[]      // List of asset file names
}

export interface SkillCacheEntry<T> {
  data: T
  mtime: number
  cachedAt: number
}

export class SkillCache {
  private static instance: SkillCache
  private metadata: Map<string, SkillCacheEntry<SkillMetadata>>
  private content: Map<string, SkillCacheEntry<SkillContent>>
  
  static getInstance(): SkillCache
  getMetadata(path: string): SkillMetadata | null
  getContent(path: string): SkillContent | null
  setMetadata(path: string, metadata: SkillMetadata, mtime: number): void
  setContent(path: string, content: SkillContent, mtime: number): void
  invalidateIfStale(path: string): boolean
  clear(): void
}
```

### Skill Scope (Modified)

```typescript
// src/features/claude-code-skill-loader/types.ts
export type SkillScope = "user" | "project" | "opencode-user" | "opencode-project"

// src/tools/skill/types.ts  
export type SkillScope = "user" | "project" | "opencode-user" | "opencode-project"
```

### Configuration Schema Addition

```typescript
// src/config/schema.ts

// NEW: OpenCode-specific configuration
export const OpencodeConfigSchema = z.object({
  skills: z.boolean().optional(), // default: true
})

// MODIFIED: Add to main config
export const OhMyOpenCodeConfigSchema = z.object({
  // ... existing fields ...
  opencode: OpencodeConfigSchema.optional(),
})

// Export new type
export type OpencodeConfig = z.infer<typeof OpencodeConfigSchema>
```

### Skill Discovery Priority

| Priority | Directory | Scope | Toggle |
|----------|-----------|-------|--------|
| 1 (highest) | `.opencode/skill/` | `opencode-project` | `opencode.skills` |
| 2 | `.claude/skills/` | `project` | `claude_code.skills` |
| 3 | `~/.config/opencode/skill/` | `opencode-user` | `opencode.skills` |
| 4 (lowest) | `~/.claude/skills/` | `user` | `claude_code.skills` |

## Implementation Steps

### Phase 0: Shared Discovery Layer (45min) - NEW

| Step | Task | Files | Estimate |
|------|------|-------|----------|
| 0.1 | Create `SkillDirectory` and `SkillMetadata` interfaces | `src/shared/skill-discovery.ts` | 10min |
| 0.2 | Implement `SkillCache` singleton with mtime invalidation | `src/shared/skill-discovery.ts` | 15min |
| 0.3 | Implement `getSkillDirectories(config)` function | `src/shared/skill-discovery.ts` | 10min |
| 0.4 | Implement `discoverSkillMetadata(dirs)` with caching | `src/shared/skill-discovery.ts` | 10min |
| 0.5 | Export from `src/shared/index.ts` | `src/shared/index.ts` | 5min |

### Phase 1: Schema & Types (30min)

| Step | Task | Files | Estimate |
|------|------|-------|----------|
| 1.1 | Add `OpencodeConfigSchema` with `skills` boolean | `src/config/schema.ts` | 10min |
| 1.2 | Export `OpencodeConfig` type | `src/config/schema.ts` | 5min |
| 1.3 | Add `opencode` field to `OhMyOpenCodeConfigSchema` | `src/config/schema.ts` | 5min |
| 1.4 | Update `SkillScope` type in loader types | `src/features/claude-code-skill-loader/types.ts` | 5min |
| 1.5 | Update `SkillScope` type in tool types | `src/tools/skill/types.ts` | 5min |

### Phase 2: Skill Loader Extension (45min)

| Step | Task | Files | Estimate |
|------|------|-------|----------|
| 2.1 | Add `loadOpencodeGlobalSkills()` function | `src/features/claude-code-skill-loader/loader.ts` | 15min |
| 2.2 | Add `loadOpencodeProjectSkills()` function | `src/features/claude-code-skill-loader/loader.ts` | 15min |
| 2.3 | Export new functions from index.ts | `src/features/claude-code-skill-loader/index.ts` | 5min |
| 2.4 | Verify `loadSkillsFromDir` handles new scopes | `src/features/claude-code-skill-loader/loader.ts` | 10min |

### Phase 3: Skill Tool Extension (45min)

| Step | Task | Files | Estimate |
|------|------|-------|----------|
| 3.1 | Add OpenCode directories to `discoverSkillsSync()` | `src/tools/skill/tools.ts` | 10min |
| 3.2 | Add OpenCode directories to `discoverSkills()` | `src/tools/skill/tools.ts` | 10min |
| 3.3 | Update `formatSkillList()` "no skills" message | `src/tools/skill/tools.ts` | 10min |
| 3.4 | Update skill description to include scope source | `src/tools/skill/tools.ts` | 10min |
| 3.5 | Ensure priority order in skill deduplication | `src/tools/skill/tools.ts` | 5min |

### Phase 4: Plugin Integration (30min)

| Step | Task | Files | Estimate |
|------|------|-------|----------|
| 4.1 | Import new skill loader functions | `src/index.ts` | 5min |
| 4.2 | Add `opencode.skills` config check | `src/index.ts` | 10min |
| 4.3 | Integrate OpenCode skills into command merging with correct priority | `src/index.ts` | 15min |

### Phase 5: Context-Optimized Tool Description (30min) - NEW

| Step | Task | Files | Estimate |
|------|------|-------|----------|
| 5.1 | Refactor `skillListForDescription` to use compact format | `src/tools/skill/tools.ts` | 10min |
| 5.2 | Replace sync discovery with cached metadata access | `src/tools/skill/tools.ts` | 10min |
| 5.3 | Add scope filtering parameter to skill tool | `src/tools/skill/tools.ts` | 10min |

### Phase 6: Cache Integration & Hooks (20min) - NEW

| Step | Task | Files | Estimate |
|------|------|-------|----------|
| 6.1 | Wire loader to use shared discovery layer | `src/features/claude-code-skill-loader/loader.ts` | 10min |
| 6.2 | Add cache clear on `session.compacted` event | `src/index.ts` | 10min |

### Phase 7: Documentation & Schema (15min)

| Step | Task | Files | Estimate |
|------|------|-------|----------|
| 7.1 | Run `bun run build:schema` to update JSON schema | `assets/oh-my-opencode.schema.json` | 5min |
| 7.2 | Add documentation for OpenCode skills toggle | `README.md` | 10min |

## File-by-File Changes

### `src/shared/skill-discovery.ts` (NEW)

```typescript
// NEW FILE: Shared skill discovery layer

import { existsSync, statSync, readFileSync } from "fs"
import { homedir } from "os"
import { join, relative, dirname } from "path"
import { Glob } from "bun"
import { parseFrontmatter } from "./frontmatter"
import { resolveSymlink } from "./file-utils"

export type SkillScope = "user" | "project" | "opencode-user" | "opencode-project"

// Glob patterns for skill discovery (supports nested directories)
const OPENCODE_SKILL_GLOB = new Glob("{skill,skills}/**/SKILL.md")
const CLAUDE_SKILL_GLOB = new Glob("skills/**/SKILL.md")

export interface SkillDirectory {
  path: string
  scope: SkillScope
  priority: number
  enabled: boolean
}

export interface SkillMetadata {
  name: string
  description: string
  scope: SkillScope
  path: string
  mtime: number
}

interface CacheEntry<T> {
  data: T
  mtime: number
}

class SkillCache {
  private static instance: SkillCache
  private metadata = new Map<string, CacheEntry<SkillMetadata>>()
  
  static getInstance(): SkillCache {
    if (!SkillCache.instance) {
      SkillCache.instance = new SkillCache()
    }
    return SkillCache.instance
  }
  
  getMetadata(path: string): SkillMetadata | null {
    const entry = this.metadata.get(path)
    if (!entry) return null
    
    // Check if file changed
    try {
      const currentMtime = statSync(join(path, "SKILL.md")).mtimeMs
      if (currentMtime !== entry.mtime) {
        this.metadata.delete(path)
        return null
      }
    } catch {
      this.metadata.delete(path)
      return null
    }
    
    return entry.data
  }
  
  setMetadata(path: string, metadata: SkillMetadata): void {
    this.metadata.set(path, { data: metadata, mtime: metadata.mtime })
  }
  
  clear(): void {
    this.metadata.clear()
  }
}

export function getSkillDirectories(config: {
  claude_code?: { skills?: boolean }
  opencode?: { skills?: boolean }
}, projectDir: string): SkillDirectory[] {
  const dirs: SkillDirectory[] = []
  
  // Priority order (highest first): opencode-project > project > opencode-user > user
  if (config.opencode?.skills ?? true) {
    dirs.push({
      path: join(projectDir, ".opencode", "skill"),
      scope: "opencode-project",
      priority: 1,
      enabled: true,
    })
  }
  
  if (config.claude_code?.skills ?? true) {
    dirs.push({
      path: join(projectDir, ".claude", "skills"),
      scope: "project",
      priority: 2,
      enabled: true,
    })
  }
  
  if (config.opencode?.skills ?? true) {
    dirs.push({
      path: join(homedir(), ".config", "opencode", "skill"),
      scope: "opencode-user",
      priority: 3,
      enabled: true,
    })
  }
  
  if (config.claude_code?.skills ?? true) {
    dirs.push({
      path: join(homedir(), ".claude", "skills"),
      scope: "user",
      priority: 4,
      enabled: true,
    })
  }
  
  return dirs.filter(d => d.enabled).sort((a, b) => a.priority - b.priority)
}

// Derive skill name from path (for nested skills)
function deriveSkillName(skillMdPath: string, baseDir: string): string {
  // Get the relative path from base dir to SKILL.md's parent
  const skillDir = dirname(skillMdPath)
  const relativePath = relative(baseDir, skillDir)
  
  // Remove leading "skill/" or "skills/" prefix if present
  const cleaned = relativePath.replace(/^(skill|skills)[\/\\]/, "")
  
  // Normalize path separators to forward slashes
  return cleaned.replace(/\\/g, "/")
}

export async function discoverSkillMetadata(
  directories: SkillDirectory[]
): Promise<SkillMetadata[]> {
  const cache = SkillCache.getInstance()
  const seen = new Set<string>()
  const result: SkillMetadata[] = []
  
  for (const dir of directories) {
    if (!existsSync(dir.path)) continue
    
    // Use glob pattern for recursive discovery (supports nested skills)
    const glob = dir.scope.startsWith("opencode") ? OPENCODE_SKILL_GLOB : CLAUDE_SKILL_GLOB
    const baseDir = dirname(dir.path)  // Parent of skill/skills directory
    
    for await (const match of glob.scan({
      cwd: baseDir,
      absolute: true,
      onlyFiles: true,
      followSymlinks: true,
    })) {
      const skillMdPath = match
      const skillPath = dirname(skillMdPath)
      
      // Check cache first
      let metadata = cache.getMetadata(skillPath)
      
      if (!metadata) {
        try {
          const stat = statSync(skillMdPath)
          const content = readFileSync(skillMdPath, "utf-8")
          const { data } = parseFrontmatter(content)
          
          // Use frontmatter name if present, otherwise derive from path
          const derivedName = deriveSkillName(skillMdPath, baseDir)
          
          metadata = {
            name: (data.name as string) || derivedName,
            description: (data.description as string) || "",
            scope: dir.scope,
            path: skillPath,
            mtime: stat.mtimeMs,
          }
          
          cache.setMetadata(skillPath, metadata)
        } catch {
          continue
        }
      }
      
      // Deduplicate by name (first seen wins due to priority order)
      if (!seen.has(metadata.name)) {
        seen.add(metadata.name)
        result.push(metadata)
      }
    }
  }
  
  return result
}

export function clearSkillCache(): void {
  SkillCache.getInstance().clear()
}

// Compact format for tool description (~15 tokens per skill)
export function formatCompactSkillList(skills: SkillMetadata[]): string {
  if (skills.length === 0) return ""
  return skills.map(s => `- ${s.name} (${s.scope})`).join("\n")
}
```

### `src/config/schema.ts`

```typescript
// ADD after ClaudeCodeConfigSchema (around line 176)
export const OpencodeConfigSchema = z.object({
  skills: z.boolean().optional(), // Controls ~/.config/opencode/skill/ and .opencode/skill/
})

// MODIFY OhMyOpenCodeConfigSchema (around line 327)
export const OhMyOpenCodeConfigSchema = z.object({
  // ... existing fields ...
  opencode: OpencodeConfigSchema.optional(), // NEW
})

// ADD export (at bottom)
export type OpencodeConfig = z.infer<typeof OpencodeConfigSchema>
```

### `src/features/claude-code-skill-loader/types.ts`

```typescript
// MODIFY line 3
export type SkillScope = "user" | "project" | "opencode-user" | "opencode-project"
```

### `src/features/claude-code-skill-loader/loader.ts`

```typescript
// ADD after line 83

export function loadOpencodeGlobalSkills(): Record<string, CommandDefinition> {
  const opencodeSkillsDir = join(homedir(), ".config", "opencode", "skill")
  const skills = loadSkillsFromDir(opencodeSkillsDir, "opencode-user")
  return skills.reduce((acc, skill) => {
    acc[skill.name] = skill.definition
    return acc
  }, {} as Record<string, CommandDefinition>)
}

export function loadOpencodeProjectSkills(directory?: string): Record<string, CommandDefinition> {
  const opencodeProjectDir = join(directory ?? process.cwd(), ".opencode", "skill")
  const skills = loadSkillsFromDir(opencodeProjectDir, "opencode-project")
  return skills.reduce((acc, skill) => {
    acc[skill.name] = skill.definition
    return acc
  }, {} as Record<string, CommandDefinition>)
}
```

### `src/features/claude-code-skill-loader/index.ts`

```typescript
// MODIFY to export new functions
export * from "./types"
export * from "./loader"
// Exports: loadUserSkillsAsCommands, loadProjectSkillsAsCommands, 
//          loadOpencodeGlobalSkills, loadOpencodeProjectSkills
```

### `src/tools/skill/types.ts`

```typescript
// MODIFY line 3
export type SkillScope = "user" | "project" | "opencode-user" | "opencode-project"
```

### `src/tools/skill/tools.ts`

```typescript
// MODIFY discoverSkillsSync() (around line 65)
function discoverSkillsSync(): Array<{ name: string; description: string; scope: SkillScope }> {
  // User-level directories (lowest priority)
  const userSkillsDir = join(homedir(), ".claude", "skills")
  const opencodeUserSkillsDir = join(homedir(), ".config", "opencode", "skill")
  
  // Project-level directories (highest priority)
  const projectSkillsDir = join(process.cwd(), ".claude", "skills")
  const opencodeProjectSkillsDir = join(process.cwd(), ".opencode", "skill")

  // Discovery in priority order (highest first for deduplication)
  const opencodeProjectSkills = discoverSkillsFromDir(opencodeProjectSkillsDir, "opencode-project")
  const projectSkills = discoverSkillsFromDir(projectSkillsDir, "project")
  const opencodeUserSkills = discoverSkillsFromDir(opencodeUserSkillsDir, "opencode-user")
  const userSkills = discoverSkillsFromDir(userSkillsDir, "user")

  // Deduplicate by name, keeping highest priority
  const seen = new Set<string>()
  const result: Array<{ name: string; description: string; scope: SkillScope }> = []
  
  for (const skills of [opencodeProjectSkills, projectSkills, opencodeUserSkills, userSkills]) {
    for (const skill of skills) {
      if (!seen.has(skill.name)) {
        seen.add(skill.name)
        result.push(skill)
      }
    }
  }
  
  return result
}

// MODIFY discoverSkills() (around line 158)
async function discoverSkills(): Promise<SkillInfo[]> {
  // User-level directories
  const userSkillsDir = join(homedir(), ".claude", "skills")
  const opencodeUserSkillsDir = join(homedir(), ".config", "opencode", "skill")
  
  // Project-level directories  
  const projectSkillsDir = join(process.cwd(), ".claude", "skills")
  const opencodeProjectSkillsDir = join(process.cwd(), ".opencode", "skill")

  // Discovery in priority order
  const opencodeProjectSkills = await discoverSkillsFromDirAsync(opencodeProjectSkillsDir)
  const projectSkills = await discoverSkillsFromDirAsync(projectSkillsDir)
  const opencodeUserSkills = await discoverSkillsFromDirAsync(opencodeUserSkillsDir)
  const userSkills = await discoverSkillsFromDirAsync(userSkillsDir)

  // Deduplicate by name, keeping highest priority
  const seen = new Set<string>()
  const result: SkillInfo[] = []
  
  for (const skills of [opencodeProjectSkills, projectSkills, opencodeUserSkills, userSkills]) {
    for (const skill of skills) {
      if (!seen.has(skill.name)) {
        seen.add(skill.name)
        result.push(skill)
      }
    }
  }
  
  return result
}

// MODIFY formatSkillList() (around line 221)
function formatSkillList(skills: SkillInfo[]): string {
  if (skills.length === 0) {
    return `No skills found in:
- ~/.config/opencode/skill/ (opencode-user)
- ~/.claude/skills/ (user)
- .opencode/skill/ (opencode-project)
- .claude/skills/ (project)`
  }
  // ... rest unchanged
}
```

### `src/index.ts`

```typescript
// MODIFY imports (around line 42-43)
import {
  loadUserSkillsAsCommands,
  loadProjectSkillsAsCommands,
  loadOpencodeGlobalSkills,  // NEW
  loadOpencodeProjectSkills, // NEW
} from "./features/claude-code-skill-loader"

// MODIFY config hook (around line 516-527)
// Claude Code skills (controlled by claude_code.skills)
const userSkills = (pluginConfig.claude_code?.skills ?? true) ? loadUserSkillsAsCommands() : {};
const projectSkills = (pluginConfig.claude_code?.skills ?? true) ? loadProjectSkillsAsCommands(ctx.directory) : {};

// OpenCode skills (controlled by opencode.skills) - NEW
const opencodeGlobalSkills = (pluginConfig.opencode?.skills ?? true) ? loadOpencodeGlobalSkills() : {};
const opencodeProjectSkills = (pluginConfig.opencode?.skills ?? true) ? loadOpencodeProjectSkills(ctx.directory) : {};

// Merge with priority (later entries override earlier for same key)
// Priority order: user < opencode-user < project < opencode-project
config.command = {
  ...userCommands,
  ...userSkills,                 // 4th priority: ~/.claude/skills/
  ...opencodeGlobalSkills,       // 3rd priority: ~/.config/opencode/skill/  (NEW)
  ...opencodeGlobalCommands,
  ...systemCommands,
  ...projectCommands,
  ...projectSkills,              // 2nd priority: .claude/skills/
  ...opencodeProjectSkills,      // 1st priority: .opencode/skill/  (NEW)
  ...opencodeProjectCommands,
};
```

## Dependencies

### Internal (This Repo)

| Dependency | Status | Notes |
|------------|--------|-------|
| `src/shared/frontmatter.ts` | Exists | Reuse `parseFrontmatter` |
| `src/shared/file-utils.ts` | Exists | Reuse `resolveSymlink` |
| `src/shared/model-sanitizer.ts` | Exists | Reuse `sanitizeModelField` |
| `src/features/claude-code-command-loader/types.ts` | Exists | Reuse `CommandDefinition` |

### External

| Dependency | Status | Notes |
|------------|--------|-------|
| `zod` | Installed | Schema validation |
| `fs` | Built-in | File system operations |
| `os` | Built-in | `homedir()` for user paths |
| `path` | Built-in | Path manipulation |

## Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| SKILL.md format differences between ecosystems | Low | Medium | Support superset of both formats, ignore unknown fields (existing behavior) |
| Breaking existing Claude Code skills | Low | High | No changes to existing load functions, only additions |
| Duplicate skill confusion | Medium | Low | Clear scope labels, documented priority, deduplication keeps highest-priority only |
| Performance with 4 directories | Low | Low | Sequential directory scanning (not parallel), negligible overhead |
| Config validation breaking | Low | Medium | New field is optional with default `true`, backward compatible |

## Testing Strategy

### Manual Testing Checklist

| Test Case | Steps | Expected |
|-----------|-------|----------|
| OpenCode user skill discovered | Create `~/.config/opencode/skill/test-skill/SKILL.md`, run skill tool | Skill appears with `(opencode-user)` scope |
| OpenCode project skill discovered | Create `.opencode/skill/test-skill/SKILL.md`, run skill tool | Skill appears with `(opencode-project)` scope |
| Priority: OpenCode project > Claude project | Create same-name skill in both `.opencode/skill/` and `.claude/skills/` | OpenCode version loads, Claude version skipped |
| Priority: OpenCode user > Claude user | Create same-name skill in both `~/.config/opencode/skill/` and `~/.claude/skills/` | OpenCode version loads |
| Config toggle: disable opencode.skills | Set `{"opencode": {"skills": false}}` | OpenCode skill directories not scanned |
| Config toggle: disable claude_code.skills | Set `{"claude_code": {"skills": false}}` | Claude skill directories not scanned |
| Backward compatibility | Existing `.claude/skills/` unchanged | All existing skills continue to work |
| No skills message | Remove all skill directories | Error message lists all 4 directories |
| Skill execution | Invoke skill from OpenCode directory | Skill prompt expanded correctly |

### Dogfooding Test

1. Create `.opencode/skill/test-skill/SKILL.md` in oh-my-opencode project
2. Verify skill appears in `/skill` command output
3. Execute skill and verify behavior
4. Test with duplicate in `.claude/skills/` to verify priority

## Success Metrics

| Metric | Target |
|--------|--------|
| Skills from `~/.config/opencode/skill/` discovered | 100% |
| Skills from `.opencode/skill/` discovered | 100% |
| Existing Claude Code skills continue working | 100% |
| `opencode.skills` toggle works correctly | All combinations |
| Priority ordering correct | Verified via duplicate test |
| Build passes | `bun run build` succeeds |
| Type check passes | `bun run typecheck` succeeds |

## Time Summary

| Phase | Estimate |
|-------|----------|
| Phase 0: Shared Discovery Layer (NEW) | 45min |
| Phase 1: Schema & Types | 30min |
| Phase 2: Skill Loader Extension | 45min |
| Phase 3: Skill Tool Extension | 45min |
| Phase 4: Plugin Integration | 30min |
| Phase 5: Context-Optimized Tool Description (NEW) | 30min |
| Phase 6: Cache Integration & Hooks (NEW) | 20min |
| Phase 7: Documentation & Schema | 15min |
| **Total** | **4h 20min** |

### Complexity Justification

The additional 1h 35min of work provides:
- **80% token reduction** in skill tool description (from ~75 to ~15 tokens/skill)
- **10-50x faster** skill discovery (cached vs uncached)
- **DRY architecture** eliminates duplicate discovery code
- **Future-proof** for scaling to 100+ skills without context issues

## Next Steps

After plan approval:
1. Run `/tasks` to create task breakdown
2. Run `/implement` to start Phase 1
3. Test via dogfooding after each phase
4. Run `bun run build && bun run typecheck` for validation
