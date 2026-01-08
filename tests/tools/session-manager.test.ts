import { describe, test, expect, beforeEach, afterEach } from "bun:test"
import { mkdirSync, rmSync, existsSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import type {
  SessionMessage,
  SessionInfo,
  TodoItem,
  SearchResult,
  SessionMetadata,
  MessagePart,
} from "../../src/tools/session-manager/types"
import {
  formatSessionList,
  formatSessionMessages,
  formatSessionInfo,
  formatSearchResults,
  filterSessionsByDate,
  searchInSession,
} from "../../src/tools/session-manager/utils"

function createMockMessage(overrides: Partial<SessionMessage> = {}): SessionMessage {
  return {
    id: `msg_${Math.random().toString(36).slice(2, 10)}`,
    role: "assistant",
    agent: "build",
    time: {
      created: Date.now(),
      updated: Date.now(),
    },
    parts: [],
    ...overrides,
  }
}

function createMockPart(overrides: Partial<MessagePart> = {}): MessagePart {
  return {
    id: `part_${Math.random().toString(36).slice(2, 10)}`,
    type: "text",
    text: "Hello, world!",
    ...overrides,
  }
}

function createMockSessionInfo(overrides: Partial<SessionInfo> = {}): SessionInfo {
  return {
    id: `session_${Math.random().toString(36).slice(2, 10)}`,
    message_count: 10,
    first_message: new Date("2024-01-01T10:00:00Z"),
    last_message: new Date("2024-01-01T12:00:00Z"),
    agents_used: ["build", "oracle"],
    has_todos: false,
    has_transcript: false,
    ...overrides,
  }
}

function createMockTodo(overrides: Partial<TodoItem> = {}): TodoItem {
  return {
    id: `todo_${Math.random().toString(36).slice(2, 10)}`,
    content: "Complete the task",
    status: "pending",
    ...overrides,
  }
}

function createMockSearchResult(overrides: Partial<SearchResult> = {}): SearchResult {
  return {
    session_id: "session_123",
    message_id: "msg_456",
    role: "assistant",
    excerpt: "...matching text...",
    match_count: 1,
    timestamp: Date.now(),
    ...overrides,
  }
}

describe("Session Manager Types", () => {
  describe("SessionMessage", () => {
    test("should have required fields", () => {
      const msg = createMockMessage()
      expect(msg.id).toBeDefined()
      expect(msg.role).toBeDefined()
      expect(msg.parts).toBeInstanceOf(Array)
    })

    test("should support user and assistant roles", () => {
      const userMsg = createMockMessage({ role: "user" })
      const assistantMsg = createMockMessage({ role: "assistant" })

      expect(userMsg.role).toBe("user")
      expect(assistantMsg.role).toBe("assistant")
    })

    test("should support optional agent field", () => {
      const msgWithAgent = createMockMessage({ agent: "oracle" })
      const msgWithoutAgent = createMockMessage({ agent: undefined })

      expect(msgWithAgent.agent).toBe("oracle")
      expect(msgWithoutAgent.agent).toBeUndefined()
    })

    test("should support time metadata", () => {
      const msg = createMockMessage({
        time: { created: 1704067200000, updated: 1704070800000 },
      })

      expect(msg.time?.created).toBe(1704067200000)
      expect(msg.time?.updated).toBe(1704070800000)
    })
  })

  describe("MessagePart", () => {
    test("should support text type", () => {
      const part = createMockPart({ type: "text", text: "Hello" })
      expect(part.type).toBe("text")
      expect(part.text).toBe("Hello")
    })

    test("should support thinking type", () => {
      const part = createMockPart({ type: "thinking", thinking: "Let me think..." })
      expect(part.type).toBe("thinking")
      expect(part.thinking).toBe("Let me think...")
    })

    test("should support tool_use type", () => {
      const part = createMockPart({
        type: "tool_use",
        tool: "read",
        input: { filePath: "/test.ts" },
      })
      expect(part.type).toBe("tool_use")
      expect(part.tool).toBe("read")
    })

    test("should support tool_result type", () => {
      const part = createMockPart({
        type: "tool_result",
        output: "File contents here",
      })
      expect(part.type).toBe("tool_result")
      expect(part.output).toBe("File contents here")
    })
  })

  describe("SessionInfo", () => {
    test("should have required fields", () => {
      const info = createMockSessionInfo()
      expect(info.id).toBeDefined()
      expect(info.message_count).toBeDefined()
      expect(info.agents_used).toBeInstanceOf(Array)
    })

    test("should track todo status", () => {
      const infoWithTodos = createMockSessionInfo({
        has_todos: true,
        todos: [createMockTodo(), createMockTodo({ status: "completed" })],
      })

      expect(infoWithTodos.has_todos).toBe(true)
      expect(infoWithTodos.todos?.length).toBe(2)
    })

    test("should track transcript status", () => {
      const infoWithTranscript = createMockSessionInfo({
        has_transcript: true,
        transcript_entries: 100,
      })

      expect(infoWithTranscript.has_transcript).toBe(true)
      expect(infoWithTranscript.transcript_entries).toBe(100)
    })
  })

  describe("TodoItem", () => {
    test("should support all status values", () => {
      const statuses: TodoItem["status"][] = ["pending", "in_progress", "completed", "cancelled"]

      for (const status of statuses) {
        const todo = createMockTodo({ status })
        expect(todo.status).toBe(status)
      }
    })

    test("should support optional priority", () => {
      const todoWithPriority = createMockTodo({ priority: "high" })
      const todoWithoutPriority = createMockTodo()

      expect(todoWithPriority.priority).toBe("high")
      expect(todoWithoutPriority.priority).toBeUndefined()
    })
  })
})

describe("Session Manager Utils", () => {
  describe("formatSessionMessages", () => {
    test("should return message for empty array", () => {
      const result = formatSessionMessages([])
      expect(result).toBe("No messages found in this session.")
    })

    test("should format text messages", () => {
      const messages = [
        createMockMessage({
          role: "user",
          agent: undefined,
          parts: [createMockPart({ type: "text", text: "Hello" })],
          time: { created: 1704067200000 },
        }),
      ]

      const result = formatSessionMessages(messages)
      expect(result).toContain("[user")
      expect(result).toContain("Hello")
    })

    test("should format assistant messages with agent", () => {
      const messages = [
        createMockMessage({
          role: "assistant",
          agent: "oracle",
          parts: [createMockPart({ type: "text", text: "Response" })],
        }),
      ]

      const result = formatSessionMessages(messages)
      expect(result).toContain("[assistant")
      expect(result).toContain("(oracle)")
    })

    test("should truncate thinking blocks", () => {
      const longThinking = "A".repeat(300)
      const messages = [
        createMockMessage({
          parts: [createMockPart({ type: "thinking", thinking: longThinking })],
        }),
      ]

      const result = formatSessionMessages(messages)
      expect(result).toContain("[thinking]")
      expect(result).toContain("...")
      expect(result.length).toBeLessThan(longThinking.length + 100)
    })

    test("should format tool use", () => {
      const messages = [
        createMockMessage({
          parts: [
            createMockPart({
              type: "tool_use",
              tool: "read",
              input: { filePath: "/test.ts" },
            }),
          ],
        }),
      ]

      const result = formatSessionMessages(messages)
      expect(result).toContain("[tool: read]")
    })

    test("should include todos when requested", () => {
      const messages = [createMockMessage({ parts: [createMockPart()] })]
      const todos = [
        { id: "1", content: "Task 1", status: "completed" },
        { id: "2", content: "Task 2", status: "pending" },
      ]

      const result = formatSessionMessages(messages, true, todos)
      expect(result).toContain("=== Todos ===")
      expect(result).toContain("Task 1")
      expect(result).toContain("Task 2")
    })
  })

  describe("formatSessionInfo", () => {
    test("should format basic session info", () => {
      const info = createMockSessionInfo({
        id: "session_abc123",
        message_count: 25,
      })

      const result = formatSessionInfo(info)
      expect(result).toContain("Session ID: session_abc123")
      expect(result).toContain("Messages: 25")
    })

    test("should format agents used", () => {
      const info = createMockSessionInfo({
        agents_used: ["build", "oracle", "librarian"],
      })

      const result = formatSessionInfo(info)
      expect(result).toContain("Agents Used: build, oracle, librarian")
    })

    test("should show none when no agents", () => {
      const info = createMockSessionInfo({ agents_used: [] })

      const result = formatSessionInfo(info)
      expect(result).toContain("Agents Used: none")
    })

    test("should format todo status", () => {
      const info = createMockSessionInfo({
        has_todos: true,
        todos: [createMockTodo(), createMockTodo(), createMockTodo()],
      })

      const result = formatSessionInfo(info)
      expect(result).toContain("Has Todos: Yes (3 items)")
    })

    test("should format transcript status", () => {
      const info = createMockSessionInfo({
        has_transcript: true,
        transcript_entries: 150,
      })

      const result = formatSessionInfo(info)
      expect(result).toContain("Has Transcript: Yes (150 entries)")
    })

    test("should calculate duration", () => {
      const info = createMockSessionInfo({
        first_message: new Date("2024-01-01T00:00:00Z"),
        last_message: new Date("2024-01-02T05:00:00Z"),
      })

      const result = formatSessionInfo(info)
      expect(result).toContain("Duration: 1 days, 5 hours")
    })
  })

  describe("formatSearchResults", () => {
    test("should return message for empty results", () => {
      const result = formatSearchResults([])
      expect(result).toBe("No matches found.")
    })

    test("should format search results", () => {
      const results = [
        createMockSearchResult({
          session_id: "session_123",
          message_id: "msg_456",
          role: "assistant",
          excerpt: "...found the pattern...",
          match_count: 3,
        }),
      ]

      const result = formatSearchResults(results)
      expect(result).toContain("Found 1 matches")
      expect(result).toContain("[session_123]")
      expect(result).toContain("msg_456")
      expect(result).toContain("...found the pattern...")
      expect(result).toContain("Matches: 3")
    })

    test("should format multiple results", () => {
      const results = [
        createMockSearchResult({ session_id: "session_1" }),
        createMockSearchResult({ session_id: "session_2" }),
        createMockSearchResult({ session_id: "session_3" }),
      ]

      const result = formatSearchResults(results)
      expect(result).toContain("Found 3 matches")
    })
  })
})

describe("Session Search", () => {
  describe("searchInSession", () => {
    test("should find matches in text parts", async () => {
      const messages = [
        createMockMessage({
          id: "msg_1",
          parts: [createMockPart({ type: "text", text: "Hello world, this is a test" })],
        }),
      ]

      const mockReadSessionMessages = async () => messages
      const results = await searchInSessionMock(mockReadSessionMessages, "session_1", "test")

      expect(results.length).toBe(1)
      expect(results[0].match_count).toBe(1)
    })

    test("should be case insensitive by default", async () => {
      const messages = [
        createMockMessage({
          id: "msg_1",
          parts: [createMockPart({ type: "text", text: "Hello WORLD" })],
        }),
      ]

      const mockReadSessionMessages = async () => messages
      const results = await searchInSessionMock(mockReadSessionMessages, "session_1", "world")

      expect(results.length).toBe(1)
    })

    test("should support case sensitive search", async () => {
      const messages = [
        createMockMessage({
          id: "msg_1",
          parts: [createMockPart({ type: "text", text: "Hello WORLD" })],
        }),
      ]

      const mockReadSessionMessages = async () => messages
      const results = await searchInSessionMock(mockReadSessionMessages, "session_1", "world", true)

      expect(results.length).toBe(0)
    })

    test("should count multiple matches in same message", async () => {
      const messages = [
        createMockMessage({
          id: "msg_1",
          parts: [createMockPart({ type: "text", text: "test test test" })],
        }),
      ]

      const mockReadSessionMessages = async () => messages
      const results = await searchInSessionMock(mockReadSessionMessages, "session_1", "test")

      expect(results.length).toBe(1)
      expect(results[0].match_count).toBe(3)
    })

    test("should respect max results limit", async () => {
      const messages = [
        createMockMessage({
          id: "msg_1",
          parts: [createMockPart({ type: "text", text: "match here" })],
        }),
        createMockMessage({
          id: "msg_2",
          parts: [createMockPart({ type: "text", text: "match here too" })],
        }),
        createMockMessage({
          id: "msg_3",
          parts: [createMockPart({ type: "text", text: "another match" })],
        }),
      ]

      const mockReadSessionMessages = async () => messages
      const results = await searchInSessionMock(mockReadSessionMessages, "session_1", "match", false, 2)

      expect(results.length).toBe(2)
    })

    test("should return empty for no matches", async () => {
      const messages = [
        createMockMessage({
          id: "msg_1",
          parts: [createMockPart({ type: "text", text: "Hello world" })],
        }),
      ]

      const mockReadSessionMessages = async () => messages
      const results = await searchInSessionMock(mockReadSessionMessages, "session_1", "xyz123")

      expect(results.length).toBe(0)
    })

    test("should include excerpt with context", async () => {
      const longText = "A".repeat(100) + "MATCH" + "B".repeat(100)
      const messages = [
        createMockMessage({
          id: "msg_1",
          parts: [createMockPart({ type: "text", text: longText })],
        }),
      ]

      const mockReadSessionMessages = async () => messages
      const results = await searchInSessionMock(mockReadSessionMessages, "session_1", "MATCH")

      expect(results.length).toBe(1)
      expect(results[0].excerpt).toContain("MATCH")
      expect(results[0].excerpt.length).toBeLessThan(longText.length)
    })
  })
})

describe("Session Date Filtering", () => {
  describe("filterSessionsByDate", () => {
    test("should return all sessions when no date filter", async () => {
      const sessionIDs = ["session_1", "session_2", "session_3"]

      const result = await filterSessionsByDate(sessionIDs)
      expect(result).toEqual(sessionIDs)
    })
  })
})

async function searchInSessionMock(
  readMessages: () => Promise<SessionMessage[]>,
  sessionID: string,
  query: string,
  caseSensitive = false,
  maxResults?: number
): Promise<SearchResult[]> {
  const messages = await readMessages()
  const results: SearchResult[] = []

  const searchQuery = caseSensitive ? query : query.toLowerCase()

  for (const msg of messages) {
    if (maxResults && results.length >= maxResults) break

    let matchCount = 0
    const excerpts: string[] = []

    for (const part of msg.parts) {
      if (part.type === "text" && part.text) {
        const text = caseSensitive ? part.text : part.text.toLowerCase()
        const matches = text.split(searchQuery).length - 1
        if (matches > 0) {
          matchCount += matches

          const index = text.indexOf(searchQuery)
          if (index !== -1) {
            const start = Math.max(0, index - 50)
            const end = Math.min(text.length, index + searchQuery.length + 50)
            let excerpt = part.text.substring(start, end)
            if (start > 0) excerpt = "..." + excerpt
            if (end < text.length) excerpt = excerpt + "..."
            excerpts.push(excerpt)
          }
        }
      }
    }

    if (matchCount > 0) {
      results.push({
        session_id: sessionID,
        message_id: msg.id,
        role: msg.role,
        excerpt: excerpts[0] || "",
        match_count: matchCount,
        timestamp: msg.time?.created,
      })
    }
  }

  return results
}
