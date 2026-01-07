# Session Manager

The Session Manager provides a comprehensive set of tools for managing and analyzing historical OpenCode sessions. These tools allow you to list previous interactions, read specific session histories, search for content across all sessions, and retrieve detailed metadata about individual sessions.

## Tools Reference

### session_list

Lists all available OpenCode sessions with optional filtering by date and project path.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | number | No | Maximum number of sessions to return in the list. |
| `from_date` | string | No | Filter sessions updated after this date (ISO 8601 format). |
| `to_date` | string | No | Filter sessions updated before this date (ISO 8601 format). |
| `project_path` | string | No | Filter sessions by their project directory. Defaults to the current working directory. |

**Example Usage:**

```bash
# List the 5 most recent sessions from the current project
session_list(limit=5)

# List sessions updated between specific dates
session_list(from_date="2025-12-01", to_date="2025-12-31")
```

---

### session_read

Reads the message history and associated metadata for a specific session.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `session_id` | string | Yes | The unique identifier of the session to read. |
| `include_todos` | boolean | No | Whether to include the session's todo list in the output (default: false). |
| `include_transcript` | boolean | No | Whether to include the transcript log entries (default: false). |
| `limit` | number | No | Maximum number of messages to return from the session history. |

**Example Usage:**

```bash
# Read a specific session with its todo list
session_read(session_id="ses_abc123", include_todos=true)

# Read only the first 10 messages of a session
session_read(session_id="ses_def456", limit=10)
```

---

### session_search

Performs a full-text search across session messages to find specific patterns or keywords.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | The search query or pattern to find in session messages. |
| `session_id` | string | No | Restricts the search to a specific session. Searches all sessions if omitted. |
| `case_sensitive` | boolean | No | Whether the search should be case-sensitive (default: false). |
| `limit` | number | No | Maximum number of search results to return (default: 20). |

**Example Usage:**

```bash
# Search for "refactor" across all historical sessions
session_search(query="refactor")

# Search for a specific ticket ID within a single session
session_search(query="LIF-111", session_id="ses_abc123", case_sensitive=true)
```

---

### session_info

Retrieves detailed metadata and statistics about a specific OpenCode session.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `session_id` | string | Yes | The unique identifier of the session to inspect. |

**Example Usage:**

```bash
# Get statistics and metadata for a session
session_info(session_id="ses_abc123")
```

---

## Storage and Location

The Session Manager synthesizes data from multiple storage locations to provide a unified view of historical interactions.

### Storage Locations

The following directories are used to store session-related data:

- **Session and Message Data**: Stored in the OpenCode data directory.
  - Path: `~/.local/share/opencode/storage/`
  - Subdirectories:
    - `session/`: Contains session metadata files.
    - `message/`: Contains message history for each session.
    - `part/`: Contains detailed components of messages (text, tool calls, results).

- **Task and Transcript Data**: Stored in the Claude configuration directory.
  - Path: `~/.claude/`
  - Subdirectories:
    - `todos/`: Contains task lists associated with sessions.
    - `transcripts/`: Contains JSONL formatted logs of session activity.

### Data Format

Session data is stored in structured JSON format. A session consists of a chronological series of messages, where each message contains:
- **Metadata**: Timestamps, role (user/assistant), and the agent involved.
- **Parts**: The actual content of the message, which can include plain text, reasoning blocks, tool execution details, and error reports.
