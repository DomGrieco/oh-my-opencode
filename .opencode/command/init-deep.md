---
description: Initialize hierarchical AGENTS.md knowledge base with git metadata
argument-hint: "[--create-new] [--max-depth=N]"
category: project
---

# /init-deep

Generate hierarchical AGENTS.md files. Root + complexity-scored subdirectories.

## Usage

```
/init-deep                      # Update mode: check git changes, update only stale files
/init-deep --create-new         # Read existing → remove all → regenerate from scratch
/init-deep --max-depth=2        # Limit directory depth (default: 3)
/init-deep --force              # Force regenerate all, ignore change detection
```

---

## Git Metadata (CRITICAL)

**ALL AGENTS.md files MUST have git metadata header:**

```markdown
# {TITLE} KNOWLEDGE BASE

**Generated:** {ISO-8601 timestamp}
**Commit:** {short SHA}
**Branch:** {branch name}

---

## OVERVIEW
...
```

This enables **incremental updates** - only regenerate files where directory contents changed.

---

## Workflow (High-Level)

1. **Change Detection** - Parse existing AGENTS.md headers, git diff to find stale files
2. **Discovery + Analysis** (concurrent) - Only for stale directories
3. **Score & Decide** - Determine new AGENTS.md locations
4. **Generate** - Root first, then subdirs in parallel
5. **Review** - Deduplicate, trim, validate

<critical>
**TodoWrite ALL phases. Mark in_progress → completed in real-time.**
```
TodoWrite([
  { id: "change-detection", content: "Parse git metadata, detect stale AGENTS.md files", status: "pending", priority: "high" },
  { id: "discovery", content: "Fire explore agents + LSP codemap for stale dirs", status: "pending", priority: "high" },
  { id: "scoring", content: "Score directories, determine locations", status: "pending", priority: "high" },
  { id: "generate", content: "Generate AGENTS.md files (root + subdirs)", status: "pending", priority: "high" },
  { id: "review", content: "Deduplicate, validate, trim", status: "pending", priority: "medium" }
])
```
</critical>

---

## Phase 0: Change Detection (NEW - Incremental Updates)

**Mark "change-detection" as in_progress.**

### 1. Find All Existing AGENTS.md Files

```bash
find . -type f -name "AGENTS.md" -not -path '*/node_modules/*' -not -path '*/dist/*' 2>/dev/null
```

### 2. Parse Git Metadata from Each File

For each AGENTS.md, extract the `**Commit:**` line:

```bash
# Extract commit hash from AGENTS.md
grep -oP '(?<=\*\*Commit:\*\* )[a-f0-9]+' ./path/to/AGENTS.md
```

### 3. Check for Changes Since Recorded Commit

For each AGENTS.md with a recorded commit:

```bash
# Get directory path (parent of AGENTS.md)
DIR_PATH=$(dirname "./path/to/AGENTS.md")

# Get recorded commit
RECORDED_COMMIT=$(grep -oP '(?<=\*\*Commit:\*\* )[a-f0-9]+' "./path/to/AGENTS.md")

# Check if directory has changes since that commit
CHANGES=$(git diff --stat ${RECORDED_COMMIT}..HEAD -- "${DIR_PATH}" 2>/dev/null | wc -l)

if [ "$CHANGES" -gt 0 ]; then
  echo "STALE: ${DIR_PATH} (${CHANGES} changes since ${RECORDED_COMMIT})"
else
  echo "FRESH: ${DIR_PATH} (no changes since ${RECORDED_COMMIT})"
fi
```

### 4. Build Update List

```
STALE_FILES = []
FRESH_FILES = []
NEW_LOCATIONS = []  # Dirs that need AGENTS.md but don't have one

For each existing AGENTS.md:
  IF no commit metadata OR commit not found in git history:
    → Add to STALE_FILES (treat as outdated)
  ELIF git diff shows changes:
    → Add to STALE_FILES
  ELSE:
    → Add to FRESH_FILES (skip regeneration)

# Also identify new directories that warrant AGENTS.md (see Phase 2 scoring)
```

### 5. Early Exit Optimization

```
IF STALE_FILES is empty AND NEW_LOCATIONS is empty:
  Report: "All AGENTS.md files are up to date. No changes needed."
  EXIT early (skip remaining phases)
```

**Mark "change-detection" as completed.**

---

## Phase 1: Discovery + Analysis (Concurrent)

**Mark "discovery" as in_progress.**

**SCOPE**: Only analyze directories in `STALE_FILES` or `NEW_LOCATIONS`. Skip `FRESH_FILES`.

### Fire Background Explore Agents IMMEDIATELY

Don't wait—these run async while main session works.

```
// Fire all at once, collect results later
// Focus on STALE directories identified in Phase 0
background_task(agent="explore", prompt="Project structure: PREDICT standard patterns for detected language → REPORT deviations only")
background_task(agent="explore", prompt="Entry points: FIND main files → REPORT non-standard organization")
background_task(agent="explore", prompt="Conventions: FIND config files (.eslintrc, pyproject.toml, .editorconfig) → REPORT project-specific rules")
background_task(agent="explore", prompt="Anti-patterns: FIND 'DO NOT', 'NEVER', 'ALWAYS', 'DEPRECATED' comments → LIST forbidden patterns")
background_task(agent="explore", prompt="Build/CI: FIND .github/workflows, Makefile → REPORT non-standard patterns")
background_task(agent="explore", prompt="Test patterns: FIND test configs, test structure → REPORT unique conventions")
```

<dynamic-agents>
**DYNAMIC AGENT SPAWNING**: After bash analysis, spawn ADDITIONAL explore agents based on project scale:

| Factor | Threshold | Additional Agents |
|--------|-----------|-------------------|
| **Total files** | >100 | +1 per 100 files |
| **Total lines** | >10k | +1 per 10k lines |
| **Directory depth** | ≥4 | +2 for deep exploration |
| **Large files (>500 lines)** | >10 files | +1 for complexity hotspots |
| **Monorepo** | detected | +1 per package/workspace |
| **Multiple languages** | >1 | +1 per language |

```bash
# Measure project scale first
total_files=$(find . -type f -not -path '*/node_modules/*' -not -path '*/.git/*' | wc -l)
total_lines=$(find . -type f \( -name "*.ts" -o -name "*.py" -o -name "*.go" \) -not -path '*/node_modules/*' -exec wc -l {} + 2>/dev/null | tail -1 | awk '{print $1}')
large_files=$(find . -type f \( -name "*.ts" -o -name "*.py" \) -not -path '*/node_modules/*' -exec wc -l {} + 2>/dev/null | awk '$1 > 500 {count++} END {print count+0}')
max_depth=$(find . -type d -not -path '*/node_modules/*' -not -path '*/.git/*' | awk -F/ '{print NF}' | sort -rn | head -1)
```

Example spawning:
```
// 500 files, 50k lines, depth 6, 15 large files → spawn 5+5+2+1 = 13 additional agents
background_task(agent="explore", prompt="Large file analysis: FIND files >500 lines, REPORT complexity hotspots")
background_task(agent="explore", prompt="Deep modules at depth 4+: FIND hidden patterns, internal conventions")
background_task(agent="explore", prompt="Cross-cutting concerns: FIND shared utilities across directories")
// ... more based on calculation
```
</dynamic-agents>

### Main Session: Concurrent Analysis

**While background agents run**, main session does:

#### 1. Bash Structural Analysis
```bash
# Directory depth + file counts
find . -type d -not -path '*/\.*' -not -path '*/node_modules/*' -not -path '*/venv/*' -not -path '*/dist/*' -not -path '*/build/*' | awk -F/ '{print NF-1}' | sort -n | uniq -c

# Files per directory (top 30)
find . -type f -not -path '*/\.*' -not -path '*/node_modules/*' | sed 's|/[^/]*$||' | sort | uniq -c | sort -rn | head -30

# Code concentration by extension
find . -type f \( -name "*.py" -o -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.go" -o -name "*.rs" \) -not -path '*/node_modules/*' | sed 's|/[^/]*$||' | sort | uniq -c | sort -rn | head -20

# Existing AGENTS.md / CLAUDE.md
find . -type f \( -name "AGENTS.md" -o -name "CLAUDE.md" \) -not -path '*/node_modules/*' 2>/dev/null
```

#### 2. Read Existing AGENTS.md
```
For each existing file found:
  Read(filePath=file)
  Extract: key insights, conventions, anti-patterns
  Store in EXISTING_AGENTS map
```

If `--create-new`: Read all existing first (preserve context) → then delete all → regenerate.

#### 3. LSP Codemap (if available)
```
lsp_servers()  # Check availability

# Entry points (parallel)
lsp_document_symbols(filePath="src/index.ts")
lsp_document_symbols(filePath="main.py")

# Key symbols (parallel)
lsp_workspace_symbols(filePath=".", query="class")
lsp_workspace_symbols(filePath=".", query="interface")
lsp_workspace_symbols(filePath=".", query="function")

# Centrality for top exports
lsp_find_references(filePath="...", line=X, character=Y)
```

**LSP Fallback**: If unavailable, rely on explore agents + AST-grep.

### Collect Background Results

```
// After main session analysis done, collect all task results
for each task_id: background_output(task_id="...")
```

**Merge: bash + LSP + existing + explore findings. Mark "discovery" as completed.**

---

## Phase 2: Scoring & Location Decision

**Mark "scoring" as in_progress.**

### Scoring Matrix

| Factor | Weight | High Threshold | Source |
|--------|--------|----------------|--------|
| File count | 3x | >20 | bash |
| Subdir count | 2x | >5 | bash |
| Code ratio | 2x | >70% | bash |
| Unique patterns | 1x | Has own config | explore |
| Module boundary | 2x | Has index.ts/__init__.py | bash |
| Symbol density | 2x | >30 symbols | LSP |
| Export count | 2x | >10 exports | LSP |
| Reference centrality | 3x | >20 refs | LSP |

### Decision Rules

| Score | Action |
|-------|--------|
| **Root (.)** | ALWAYS create |
| **>15** | Create AGENTS.md |
| **8-15** | Create if distinct domain |
| **<8** | Skip (parent covers) |

### Output
```
AGENTS_LOCATIONS = [
  { path: ".", type: "root" },
  { path: "src/hooks", score: 18, reason: "high complexity" },
  { path: "src/api", score: 12, reason: "distinct domain" }
]
```

**Mark "scoring" as completed.**

---

## Phase 3: Generate AGENTS.md

**Mark "generate" as in_progress.**

### Root AGENTS.md (Full Treatment)

**CRITICAL: Get git metadata first:**
```bash
# Get current git info
SHORT_SHA=$(git rev-parse --short HEAD)
BRANCH=$(git rev-parse --abbrev-ref HEAD)
TIMESTAMP=$(date -Iseconds)
```

```markdown
# PROJECT KNOWLEDGE BASE

**Generated:** {TIMESTAMP}
**Commit:** {SHORT_SHA}
**Branch:** {BRANCH}

## OVERVIEW
{1-2 sentences: what + core stack}

## STRUCTURE
\`\`\`
{root}/
├── {dir}/    # {non-obvious purpose only}
└── {entry}
\`\`\`

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|

## CODE MAP
{From LSP - skip if unavailable or project <10 files}

| Symbol | Type | Location | Refs | Role |
|--------|------|----------|------|------|

## CONVENTIONS
{ONLY deviations from standard}

## ANTI-PATTERNS (THIS PROJECT)
{Explicitly forbidden here}

## UNIQUE STYLES
{Project-specific}

## COMMANDS
\`\`\`bash
{dev/test/build}
\`\`\`

## NOTES
{Gotchas}
```

**Quality gates**: 50-150 lines, no generic advice, no obvious info.

### Subdirectory AGENTS.md (Parallel)

**ONLY regenerate STALE or NEW locations. Skip FRESH files.**

Launch document-writer agents for each stale/new location:

```
for loc in STALE_FILES + NEW_LOCATIONS:
  background_task(agent="document-writer", prompt=`
    Generate AGENTS.md for: ${loc.path}
    
    REQUIRED HEADER (git metadata):
    # {DIRECTORY_NAME} KNOWLEDGE BASE
    
    **Generated:** ${TIMESTAMP}
    **Commit:** ${SHORT_SHA}
    **Branch:** ${BRANCH}
    
    ---
    
    SECTION ORDER (use applicable ones):
    1. OVERVIEW - 1 line, what this directory provides
    2. STRUCTURE - Tree view if >5 subdirs, include line counts for complex files
    3. WHERE TO LOOK / WHEN TO USE - Table format: Task | Location | Notes
    4. HOW TO ADD - Step-by-step for extensible dirs (hooks, agents, tools)
    5. KEY COMPONENTS - Table: File | Purpose (for complex dirs)
    6. PATTERNS / CRITICAL PATTERNS - Include code examples
    7. ANTI-PATTERNS - What NOT to do
    
    CONTENT REQUIREMENTS:
    - 30-80 lines max
    - NEVER repeat parent content
    - Prefer tables over prose
    - Include code examples in PATTERNS section
    - For utility dirs: use WHEN TO USE table (Task → Utility → Example)
    - For extensible dirs: include HOW TO ADD section
    
    Context: ${loc.reason}
  `)
```

**Wait for all. Mark "generate" as completed.**

---

## Phase 4: Review & Deduplicate

**Mark "review" as in_progress.**

For each generated file:
- Remove generic advice
- Remove parent duplicates
- Trim to size limits
- Verify telegraphic style

**Mark "review" as completed.**

---

## Final Report

```
=== init-deep Complete ===

Mode: {update | create-new | force}
Current Commit: {SHORT_SHA}
Branch: {BRANCH}

Change Detection:
  Fresh (skipped): {N} files
  Stale (updated): {N} files
  New (created): {N} files

Files:
  ✓ ./AGENTS.md (root, {N} lines) [UPDATED]
  ✓ ./src/hooks/AGENTS.md ({N} lines) [UPDATED]
  ○ ./src/tools/AGENTS.md ({N} lines) [FRESH - skipped]

Dirs Analyzed: {N}
AGENTS.md Created: {N}
AGENTS.md Updated: {N}
AGENTS.md Skipped: {N} (no changes)

Hierarchy:
  ./AGENTS.md (d864af6 → {NEW_SHA})
  ├── src/agents/AGENTS.md [UPDATED]
  ├── src/hooks/AGENTS.md [FRESH]
  ├── src/tools/AGENTS.md [FRESH]
  ├── src/features/AGENTS.md [UPDATED]
  └── src/auth/AGENTS.md [FRESH]
```

---

## Anti-Patterns

- **Static agent count**: MUST vary agents based on project size/depth
- **Sequential execution**: MUST parallel (explore + LSP concurrent)
- **Ignoring existing**: ALWAYS read existing first, even with --create-new
- **Over-documenting**: Not every dir needs AGENTS.md
- **Redundancy**: Child never repeats parent
- **Generic content**: Remove anything that applies to ALL projects
- **Verbose style**: Telegraphic or die
- **Missing git metadata**: ALWAYS include Commit, Branch, and Generated timestamp in ALL AGENTS.md headers
- **Regenerating fresh files**: NEVER regenerate files where directory hasn't changed since recorded commit
- **Skipping change detection**: ALWAYS parse existing AGENTS.md headers and use git diff first
- **Root-only metadata**: ALL AGENTS.md files (root AND subdirs) must have git metadata header
