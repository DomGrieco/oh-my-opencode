# Upstream Sync Migration Guide (January 2026)

This guide documents the changes and new features introduced in the January 2026 upstream sync (LIF-111). This sync brings the latest features and stability improvements from the upstream \`code-yeongyu/oh-my-opencode\` repository.

## New Features

### 1. Sisyphus Agent
Sisyphus is a new senior orchestrator agent designed for complex, multi-phase projects. It features a modular architecture that separates base capabilities from fork-specific extensions using a dynamic builder pattern.

**Architecture Details:**
- **Dynamic Builder Pattern**: Sisyphus uses `sisyphus-prompt-builder.ts` to programmatically construct its system prompt. This modular approach separates identity, capability classification, planning logic, and delegation rules into independent, maintainable components.
- **Resource Priority Order**: Implements a strict execution hierarchy: **Skills → Direct Tools → Specialized Agents**. This ensures the most efficient resource is used for every task.
- **Fork-specific Extensions**: Our implementation includes unique extensions for Linear integration, spec folder management, and path validation, injected seamlessly into the core Sisyphus logic.
- **Strategic Delegation**: Uses specialized delegation tables to determine when to spawn background experts (oracle, librarian, explore) versus handling tasks directly.

**When to use Sisyphus vs OmO:**
- Use **OmO** for standard development tasks and daily driving.
- Use **Sisyphus** for large-scale feature implementation, complex refactoring, or when you need a highly structured, todo-driven planning approach.

**How to enable:**
Add the following to your `oh-my-opencode.json`:
```json
{
  "sisyphus_agent": {
    "enabled": true,
    "model": "anthropic/claude-opus-4-5"
  },
  "primary_orchestrator": "Sisyphus"
}
```

### 2. OpenCode 1.1.1 Permissions
This sync introduces full compatibility with OpenCode 1.1.1's new granular permission system. We've implemented a permission compatibility layer (`src/shared/permission-compat.ts`) that handles the transition between legacy and new formats.

**Permission Formats:**
- **Legacy (< 1.1.1)**: `tools: { "tool-name": true | false }`
- **New (>= 1.1.1)**: `permission: { "tool-name": "allow" | "deny" | "ask" }`

**Auto-Migration Behavior:**
The plugin automatically detects the installed OpenCode version using `src/shared/opencode-version.ts`. At runtime, it converts your existing configuration to the appropriate format, ensuring your `tools` restrictions continue to work regardless of the OpenCode version.

### 3. Session Manager Tools
A new set of tools for managing and analyzing historical sessions. These tools leverage the centralized storage in `~/.claude/` for cross-session awareness.

- **`session_list`**: Lists available sessions.
  - `limit`: Max sessions to return.
  - `from_date` / `to_date`: Filter by ISO 8601 date range.
  - `project_path`: Filter by specific project directory.
- **`session_read`**: Reads detailed content from a session.
  - `session_id`: Unique session identifier.
  - `include_todos`: Include the task list from that session.
  - `include_transcript`: Include the full JSONL activity log.
  - `limit`: Max number of messages to retrieve.
- **`session_search`**: Full-text search across historical data.
  - `query`: Search string (supports regex).
  - `session_id`: Limit search to one session.
  - `case_sensitive`: Toggle case sensitivity.
  - `limit`: Max results (default 20, scans up to 50 sessions).
- **`session_info`**: Detailed metadata and statistics.
  - `session_id`: Target session. Returns message count, date range, duration, and agents used.

**Use Cases:**
- Reviewing architectural decisions made in previous months.
- Searching for where a specific utility or pattern was first implemented.
- Analyzing past agent performance and token consumption patterns.

### 4. Background Agent Concurrency
Advanced task management with model-based concurrency limits to prevent provider rate limiting (429 errors) during parallel execution.

**How it works:**
The `ConcurrencyManager` tracks active background tasks per model and provider. If the configured limit is reached, new tasks are placed in a priority queue and executed as slots become available.

**Configuration:**
Tune limits per model in your `oh-my-opencode.json`:
```json
{
  "background_agent": {
    "concurrency": {
      "limits": {
        "anthropic/claude-3-5-sonnet": 5,
        "google/gemini-1.5-pro": 3,
        "default": 5
      }
    }
  }
}
```

### 5. Builtin Commands
New powerful commands for complex workflows:

- **`/init-deep`**: Hierarchical project initialization.
  - Analyzes project structure using parallel explore agents.
  - Calculates "complexity scores" for directories.
  - Generates nested `AGENTS.md` files that provide local context without repeating parent information.
  - Supports `--create-new` and `--max-depth` flags.
- **`/ralph-loop`**: Self-referential development loop.
  - Continues execution automatically until a "completion promise" (e.g., `<promise>DONE</promise>`) is detected.
  - Ideal for long-running, autonomous tasks that require multiple iterations.
  - Supports `--max-iterations` (default 100) and `--completion-promise` custom text.
- **`/refactor`**: Deterministic refactoring engine.
  - Uses a multi-phase approach: Intent Gate → Codebase Mapping → Test Assessment → Plan Generation → Precise Execution.
  - Leverages LSP (`lsp_rename`, `lsp_diagnostics`) and AST-grep for safe transformations.
  - Automatically verifies after every step; stops and fixes if tests fail.

### 6. Preemptive Compaction
Automatically triggers session compaction before hitting hard context limits. By default, it triggers when context usage exceeds 70%.

**Configuration:**
```json
{
  "experimental": {
    "preemptive_compaction": true,
    "threshold": 0.7,
    "dcp": "enabled"
  }
}
```
*Note: `dcp` (Deep Context Preservation) can be enabled to use advanced summarization during compaction.*

### 7. Compaction Context Injector
Works alongside preemptive compaction to preserve critical session state. When a session is compacted, this hook injects a structured summary:
- **Original Requests**: What the user initially asked for.
- **Current Goals**: What we are trying to achieve right now.
- **Work Completed**: Summary of changes already made.
- **Remaining Tasks**: What still needs to be done.

### 8. Session Recovery Enhancements
Improved resilience against common LLM session failures:
- **Empty Message Sanitizer**: Detects and fixes cases where the assistant returns an empty message, preventing API errors.
- **Thinking Block Validator**: Ensures thinking blocks (for Claude 4.5/Opus) are correctly opened, closed, and content-rich, preventing reasoning continuity issues.

### 9. Edit Error Recovery
Automatically attempts to recover from common `edit` tool errors. If a replacement fails (e.g., `oldString` not found), this hook analyzes the file content to find the closest match and suggests or applies a fix, significantly reducing "stuck" sessions during file editing.

### 10. Bug Fixes Applied
Stability and performance improvements included in this sync:

- **Context Duplication Fix**: Resolved a logic error where project context was being injected multiple times per message. This reduced baseline token usage from ~22k to ~11k for established projects.
- **Session Notification GC Crash Fix**: Migrated OS notification calls from Bun's built-in shell to `node:child_process`. This resolved a periodic crash occurring during garbage collection of shell handles.
- **Recursive Subagent Prevention**: Added depth guards to `call_omo_agent` and `background_task` to prevent accidental infinite recursion when agents spawn themselves.
- **TTL Pruning for Memory Leaks**: Implemented time-to-live (TTL) pruning for background agent state files, ensuring that stale task data is cleared from memory in long-running sessions.

## New Hooks

The following hooks have been added to improve session stability and performance:

- \`preemptive-compaction\`: Monitors token usage and triggers proactive compaction at 70% usage.
- \`compaction-context-injector\`: Preserves critical state (goals, tasks, requests) during compaction events.
- \`empty-message-sanitizer\`: Validates and fixes empty assistant messages to prevent API errors.
- \`thinking-block-validator\`: Ensures thinking blocks for reasoning models are correctly formatted and completed.
- \`edit-error-recovery\`: Auto-recovers from file editing tool failures by suggesting context-aware fixes.

## Breaking Changes

There are no expected breaking changes in this update. Existing configurations and fork-specific tools (Linear, Spec, Memory) remain fully compatible.

## Configuration Changes

New configuration options are available in \`oh-my-opencode.json\`:

\`\`\`json
{
  "sisyphus_agent": {
    "enabled": false,
    "model": "anthropic/claude-opus-4-5"
  },
  "primary_orchestrator": "OmO",
  "experimental": {
    "preemptive_compaction": false,
    "threshold": 0.7,
    "dcp": "enabled",
    "auto_resume": false
  },
  "background_agent": {
    "concurrency": {
      "limits": {
        "anthropic/claude-3-5-sonnet": 5,
        "google/gemini-1.5-pro": 3
      }
    }
  }
}
\`\`\`
