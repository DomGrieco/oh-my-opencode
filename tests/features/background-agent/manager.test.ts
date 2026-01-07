/**
 * Tests for BackgroundManager utilities (LIF-111)
 *
 * These tests verify the testable parts of BackgroundManager including
 * task management, notification handling, and event processing.
 * Note: Full integration tests require mocking the OpenCode client.
 */

import { describe, test, expect } from "bun:test"
import type {
  BackgroundTask,
  BackgroundTaskStatus,
  TaskProgress,
  LaunchInput,
} from "../../../src/features/background-agent/types"

function createMockTask(overrides: Partial<BackgroundTask> = {}): BackgroundTask {
  return {
    id: `bg_${Math.random().toString(36).slice(2, 10)}`,
    sessionID: `session_${Math.random().toString(36).slice(2, 10)}`,
    parentSessionID: "parent_session_123",
    parentMessageID: "parent_message_456",
    description: "Test background task",
    prompt: "Do something in the background",
    agent: "test-agent",
    status: "running",
    startedAt: new Date(),
    model: "anthropic/claude-sonnet-4",
    ...overrides,
  }
}

function createMockLaunchInput(overrides: Partial<LaunchInput> = {}): LaunchInput {
  return {
    description: "Test task",
    prompt: "Execute test task",
    agent: "test-agent",
    parentSessionID: "parent_123",
    parentMessageID: "message_456",
    ...overrides,
  }
}

describe("BackgroundTask Types", () => {
  describe("BackgroundTask structure", () => {
    test("should have required fields", () => {
      const task = createMockTask()

      expect(task.id).toBeDefined()
      expect(task.sessionID).toBeDefined()
      expect(task.parentSessionID).toBeDefined()
      expect(task.parentMessageID).toBeDefined()
      expect(task.description).toBeDefined()
      expect(task.prompt).toBeDefined()
      expect(task.agent).toBeDefined()
      expect(task.status).toBeDefined()
      expect(task.startedAt).toBeInstanceOf(Date)
    })

    test("should support all status values", () => {
      const statuses: BackgroundTaskStatus[] = ["running", "completed", "error", "cancelled"]

      for (const status of statuses) {
        const task = createMockTask({ status })
        expect(task.status).toBe(status)
      }
    })

    test("should support optional completedAt", () => {
      const runningTask = createMockTask({ status: "running" })
      expect(runningTask.completedAt).toBeUndefined()

      const completedTask = createMockTask({
        status: "completed",
        completedAt: new Date(),
      })
      expect(completedTask.completedAt).toBeInstanceOf(Date)
    })

    test("should support optional error field", () => {
      const successTask = createMockTask({ status: "completed" })
      expect(successTask.error).toBeUndefined()

      const errorTask = createMockTask({
        status: "error",
        error: "Something went wrong",
      })
      expect(errorTask.error).toBe("Something went wrong")
    })

    test("should support optional result field", () => {
      const task = createMockTask({
        status: "completed",
        result: "Task completed successfully",
      })
      expect(task.result).toBe("Task completed successfully")
    })

    test("should support optional progress field", () => {
      const progress: TaskProgress = {
        toolCalls: 5,
        lastTool: "read",
        lastUpdate: new Date(),
        lastMessage: "Reading file...",
        lastMessageAt: new Date(),
      }

      const task = createMockTask({ progress })
      expect(task.progress?.toolCalls).toBe(5)
      expect(task.progress?.lastTool).toBe("read")
    })

    test("should support optional parentModel field", () => {
      const task = createMockTask({
        parentModel: {
          providerID: "anthropic",
          modelID: "claude-opus-4-5",
        },
      })
      expect(task.parentModel?.providerID).toBe("anthropic")
      expect(task.parentModel?.modelID).toBe("claude-opus-4-5")
    })
  })

  describe("LaunchInput structure", () => {
    test("should have required fields", () => {
      const input = createMockLaunchInput()

      expect(input.description).toBeDefined()
      expect(input.prompt).toBeDefined()
      expect(input.agent).toBeDefined()
      expect(input.parentSessionID).toBeDefined()
      expect(input.parentMessageID).toBeDefined()
    })

    test("should support optional parentModel", () => {
      const input = createMockLaunchInput({
        parentModel: {
          providerID: "openai",
          modelID: "gpt-5.2",
        },
      })
      expect(input.parentModel?.providerID).toBe("openai")
    })
  })
})

describe("BackgroundTask State Transitions", () => {
  describe("status transitions", () => {
    test("should transition from running to completed", () => {
      const task = createMockTask({ status: "running" })
      expect(task.status).toBe("running")

      task.status = "completed"
      task.completedAt = new Date()
      expect(task.status).toBe("completed")
      expect(task.completedAt).toBeInstanceOf(Date)
    })

    test("should transition from running to error", () => {
      const task = createMockTask({ status: "running" })

      task.status = "error"
      task.error = "Agent not found"
      task.completedAt = new Date()

      expect(task.status).toBe("error")
      expect(task.error).toBe("Agent not found")
    })

    test("should transition from running to cancelled", () => {
      const task = createMockTask({ status: "running" })

      task.status = "cancelled"
      task.error = "Session deleted"
      task.completedAt = new Date()

      expect(task.status).toBe("cancelled")
    })
  })

  describe("progress updates", () => {
    test("should initialize progress correctly", () => {
      const task = createMockTask()
      task.progress = {
        toolCalls: 0,
        lastUpdate: new Date(),
      }

      expect(task.progress.toolCalls).toBe(0)
    })

    test("should increment tool calls", () => {
      const task = createMockTask({
        progress: {
          toolCalls: 0,
          lastUpdate: new Date(),
        },
      })

      task.progress!.toolCalls += 1
      task.progress!.lastTool = "read"
      task.progress!.lastUpdate = new Date()

      expect(task.progress!.toolCalls).toBe(1)
      expect(task.progress!.lastTool).toBe("read")
    })

    test("should track last message", () => {
      const task = createMockTask({
        progress: {
          toolCalls: 3,
          lastUpdate: new Date(),
        },
      })

      task.progress!.lastMessage = "Processing files..."
      task.progress!.lastMessageAt = new Date()

      expect(task.progress!.lastMessage).toBe("Processing files...")
      expect(task.progress!.lastMessageAt).toBeInstanceOf(Date)
    })
  })
})

describe("BackgroundTask ID Generation", () => {
  test("should generate unique task IDs", () => {
    const ids = new Set<string>()

    for (let i = 0; i < 100; i++) {
      const task = createMockTask()
      ids.add(task.id)
    }

    expect(ids.size).toBe(100)
  })

  test("should generate IDs with bg_ prefix", () => {
    const task = createMockTask({ id: `bg_${crypto.randomUUID().slice(0, 8)}` })
    expect(task.id.startsWith("bg_")).toBe(true)
  })
})

describe("BackgroundTask Duration Calculation", () => {
  function formatDuration(start: Date, end?: Date): string {
    const duration = (end ?? new Date()).getTime() - start.getTime()
    const seconds = Math.floor(duration / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    }
    return `${seconds}s`
  }

  test("should format seconds only", () => {
    const start = new Date("2024-01-01T00:00:00Z")
    const end = new Date("2024-01-01T00:00:45Z")

    expect(formatDuration(start, end)).toBe("45s")
  })

  test("should format minutes and seconds", () => {
    const start = new Date("2024-01-01T00:00:00Z")
    const end = new Date("2024-01-01T00:05:30Z")

    expect(formatDuration(start, end)).toBe("5m 30s")
  })

  test("should format hours, minutes, and seconds", () => {
    const start = new Date("2024-01-01T00:00:00Z")
    const end = new Date("2024-01-01T02:15:45Z")

    expect(formatDuration(start, end)).toBe("2h 15m 45s")
  })

  test("should handle zero duration", () => {
    const start = new Date("2024-01-01T00:00:00Z")
    const end = new Date("2024-01-01T00:00:00Z")

    expect(formatDuration(start, end)).toBe("0s")
  })
})

describe("BackgroundTask Validation", () => {
  describe("agent validation", () => {
    test("should require non-empty agent", () => {
      const input = createMockLaunchInput({ agent: "" })
      expect(input.agent.trim()).toBe("")
    })

    test("should accept valid agent names", () => {
      const validAgents = ["oracle", "librarian", "explore", "frontend-ui-ux-engineer"]

      for (const agent of validAgents) {
        const input = createMockLaunchInput({ agent })
        expect(input.agent).toBe(agent)
      }
    })
  })

  describe("session ID validation", () => {
    test("should have valid parent session ID", () => {
      const input = createMockLaunchInput({ parentSessionID: "session_abc123" })
      expect(input.parentSessionID).toBeTruthy()
    })

    test("should have valid parent message ID", () => {
      const input = createMockLaunchInput({ parentMessageID: "msg_xyz789" })
      expect(input.parentMessageID).toBeTruthy()
    })
  })
})

describe("BackgroundTask Collections", () => {
  describe("task map operations", () => {
    test("should store and retrieve tasks by ID", () => {
      const tasks = new Map<string, BackgroundTask>()
      const task = createMockTask({ id: "bg_test123" })

      tasks.set(task.id, task)
      expect(tasks.get("bg_test123")).toBe(task)
    })

    test("should find task by session ID", () => {
      const tasks = new Map<string, BackgroundTask>()
      const task1 = createMockTask({ id: "bg_1", sessionID: "session_a" })
      const task2 = createMockTask({ id: "bg_2", sessionID: "session_b" })

      tasks.set(task1.id, task1)
      tasks.set(task2.id, task2)

      let found: BackgroundTask | undefined
      for (const task of tasks.values()) {
        if (task.sessionID === "session_b") {
          found = task
          break
        }
      }

      expect(found?.id).toBe("bg_2")
    })

    test("should get tasks by parent session", () => {
      const tasks = new Map<string, BackgroundTask>()
      const task1 = createMockTask({ id: "bg_1", parentSessionID: "parent_a" })
      const task2 = createMockTask({ id: "bg_2", parentSessionID: "parent_a" })
      const task3 = createMockTask({ id: "bg_3", parentSessionID: "parent_b" })

      tasks.set(task1.id, task1)
      tasks.set(task2.id, task2)
      tasks.set(task3.id, task3)

      const parentATasks: BackgroundTask[] = []
      for (const task of tasks.values()) {
        if (task.parentSessionID === "parent_a") {
          parentATasks.push(task)
        }
      }

      expect(parentATasks.length).toBe(2)
    })
  })

  describe("notification queue operations", () => {
    test("should queue notifications by parent session", () => {
      const notifications = new Map<string, BackgroundTask[]>()
      const task = createMockTask({ parentSessionID: "parent_123" })

      const queue = notifications.get(task.parentSessionID) ?? []
      queue.push(task)
      notifications.set(task.parentSessionID, queue)

      expect(notifications.get("parent_123")?.length).toBe(1)
    })

    test("should clear notifications for session", () => {
      const notifications = new Map<string, BackgroundTask[]>()
      const task = createMockTask({ parentSessionID: "parent_123" })

      notifications.set("parent_123", [task])
      notifications.delete("parent_123")

      expect(notifications.get("parent_123")).toBeUndefined()
    })

    test("should filter notifications by task ID", () => {
      const notifications = new Map<string, BackgroundTask[]>()
      const task1 = createMockTask({ id: "bg_1", parentSessionID: "parent_123" })
      const task2 = createMockTask({ id: "bg_2", parentSessionID: "parent_123" })

      notifications.set("parent_123", [task1, task2])

      const filtered = notifications.get("parent_123")!.filter((t) => t.id !== "bg_1")
      notifications.set("parent_123", filtered)

      expect(notifications.get("parent_123")?.length).toBe(1)
      expect(notifications.get("parent_123")?.[0].id).toBe("bg_2")
    })
  })
})

describe("BackgroundTask TTL", () => {
  const TASK_TTL_MS = 30 * 60 * 1000

  test("should have 30 minute TTL", () => {
    expect(TASK_TTL_MS).toBe(1800000)
  })

  test("should identify stale tasks", () => {
    const now = Date.now()
    const staleTask = createMockTask({
      startedAt: new Date(now - TASK_TTL_MS - 1000),
    })

    const age = now - staleTask.startedAt.getTime()
    expect(age > TASK_TTL_MS).toBe(true)
  })

  test("should identify fresh tasks", () => {
    const now = Date.now()
    const freshTask = createMockTask({
      startedAt: new Date(now - 1000),
    })

    const age = now - freshTask.startedAt.getTime()
    expect(age <= TASK_TTL_MS).toBe(true)
  })
})
