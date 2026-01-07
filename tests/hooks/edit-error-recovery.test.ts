import { describe, test, expect } from "bun:test"
import {
  EDIT_ERROR_PATTERNS,
  EDIT_ERROR_REMINDER,
  createEditErrorRecoveryHook,
} from "../../src/hooks/edit-error-recovery"
import type { PluginInput } from "@opencode-ai/plugin"

function createMockPluginInput(): PluginInput {
  return {} as PluginInput
}

function createMockToolInput(tool: string) {
  return {
    tool,
    sessionID: "test-session-123",
    callID: "call-456",
  }
}

function createMockToolOutput(output: string) {
  return {
    title: "Edit Result",
    output,
    metadata: {},
  }
}

describe("Edit Error Recovery Hook", () => {
  describe("EDIT_ERROR_PATTERNS", () => {
    test("should contain 'oldString and newString must be different' pattern", () => {
      expect(EDIT_ERROR_PATTERNS).toContain("oldString and newString must be different")
    })

    test("should contain 'oldString not found' pattern", () => {
      expect(EDIT_ERROR_PATTERNS).toContain("oldString not found")
    })

    test("should contain 'oldString found multiple times' pattern", () => {
      expect(EDIT_ERROR_PATTERNS).toContain("oldString found multiple times")
    })

    test("should have exactly 3 patterns", () => {
      expect(EDIT_ERROR_PATTERNS.length).toBe(3)
    })

    test("should be a readonly array of strings", () => {
      EDIT_ERROR_PATTERNS.forEach((pattern) => {
        expect(typeof pattern).toBe("string")
      })
    })
  })

  describe("EDIT_ERROR_REMINDER", () => {
    test("should contain 'EDIT ERROR' header", () => {
      expect(EDIT_ERROR_REMINDER).toContain("EDIT ERROR")
    })

    test("should contain 'IMMEDIATE ACTION REQUIRED' text", () => {
      expect(EDIT_ERROR_REMINDER).toContain("IMMEDIATE ACTION REQUIRED")
    })

    test("should instruct to READ the file", () => {
      expect(EDIT_ERROR_REMINDER).toContain("READ the file")
    })

    test("should instruct to VERIFY content", () => {
      expect(EDIT_ERROR_REMINDER).toContain("VERIFY")
    })

    test("should instruct to APOLOGIZE", () => {
      expect(EDIT_ERROR_REMINDER).toContain("APOLOGIZE")
    })

    test("should warn not to attempt another edit without reading", () => {
      expect(EDIT_ERROR_REMINDER).toContain("DO NOT attempt another edit")
    })

    test("should be a non-empty string", () => {
      expect(typeof EDIT_ERROR_REMINDER).toBe("string")
      expect(EDIT_ERROR_REMINDER.trim().length).toBeGreaterThan(0)
    })
  })

  describe("createEditErrorRecoveryHook", () => {
    test("should return an object with tool.execute.after handler", () => {
      const hook = createEditErrorRecoveryHook(createMockPluginInput())
      expect(hook["tool.execute.after"]).toBeDefined()
      expect(typeof hook["tool.execute.after"]).toBe("function")
    })
  })

  describe("tool.execute.after handler", () => {
    describe("tool filtering", () => {
      test("should ignore non-edit tools", async () => {
        const hook = createEditErrorRecoveryHook(createMockPluginInput())
        const handler = hook["tool.execute.after"]!

        const input = createMockToolInput("read")
        const output = createMockToolOutput("oldString not found in content")

        await handler(input, output)

        expect(output.output).toBe("oldString not found in content")
        expect(output.output).not.toContain(EDIT_ERROR_REMINDER)
      })

      test("should process edit tool (lowercase)", async () => {
        const hook = createEditErrorRecoveryHook(createMockPluginInput())
        const handler = hook["tool.execute.after"]!

        const input = createMockToolInput("edit")
        const output = createMockToolOutput("Error: oldString not found in content")

        await handler(input, output)

        expect(output.output).toContain(EDIT_ERROR_REMINDER)
      })

      test("should process Edit tool (mixed case)", async () => {
        const hook = createEditErrorRecoveryHook(createMockPluginInput())
        const handler = hook["tool.execute.after"]!

        const input = createMockToolInput("Edit")
        const output = createMockToolOutput("Error: oldString not found in content")

        await handler(input, output)

        expect(output.output).toContain(EDIT_ERROR_REMINDER)
      })

      test("should process EDIT tool (uppercase)", async () => {
        const hook = createEditErrorRecoveryHook(createMockPluginInput())
        const handler = hook["tool.execute.after"]!

        const input = createMockToolInput("EDIT")
        const output = createMockToolOutput("Error: oldString not found in content")

        await handler(input, output)

        expect(output.output).toContain(EDIT_ERROR_REMINDER)
      })

      test("should ignore tools with 'edit' in name but not exact match", async () => {
        const hook = createEditErrorRecoveryHook(createMockPluginInput())
        const handler = hook["tool.execute.after"]!

        const input = createMockToolInput("edit_file")
        const output = createMockToolOutput("oldString not found")

        await handler(input, output)

        expect(output.output).toBe("oldString not found")
      })
    })

    describe("error pattern detection", () => {
      test("should detect 'oldString not found' error", async () => {
        const hook = createEditErrorRecoveryHook(createMockPluginInput())
        const handler = hook["tool.execute.after"]!

        const input = createMockToolInput("edit")
        const output = createMockToolOutput("Error: oldString not found in the file content")

        await handler(input, output)

        expect(output.output).toContain(EDIT_ERROR_REMINDER)
      })

      test("should detect 'oldString found multiple times' error", async () => {
        const hook = createEditErrorRecoveryHook(createMockPluginInput())
        const handler = hook["tool.execute.after"]!

        const input = createMockToolInput("edit")
        const output = createMockToolOutput("Error: oldString found multiple times in content")

        await handler(input, output)

        expect(output.output).toContain(EDIT_ERROR_REMINDER)
      })

      test("should detect 'oldString and newString must be different' error", async () => {
        const hook = createEditErrorRecoveryHook(createMockPluginInput())
        const handler = hook["tool.execute.after"]!

        const input = createMockToolInput("edit")
        const output = createMockToolOutput("Error: oldString and newString must be different")

        await handler(input, output)

        expect(output.output).toContain(EDIT_ERROR_REMINDER)
      })
    })

    describe("case insensitivity", () => {
      test("should detect error pattern in lowercase output", async () => {
        const hook = createEditErrorRecoveryHook(createMockPluginInput())
        const handler = hook["tool.execute.after"]!

        const input = createMockToolInput("edit")
        const output = createMockToolOutput("error: oldstring not found in content")

        await handler(input, output)

        expect(output.output).toContain(EDIT_ERROR_REMINDER)
      })

      test("should detect error pattern in uppercase output", async () => {
        const hook = createEditErrorRecoveryHook(createMockPluginInput())
        const handler = hook["tool.execute.after"]!

        const input = createMockToolInput("edit")
        const output = createMockToolOutput("ERROR: OLDSTRING NOT FOUND IN CONTENT")

        await handler(input, output)

        expect(output.output).toContain(EDIT_ERROR_REMINDER)
      })

      test("should detect error pattern in mixed case output", async () => {
        const hook = createEditErrorRecoveryHook(createMockPluginInput())
        const handler = hook["tool.execute.after"]!

        const input = createMockToolInput("edit")
        const output = createMockToolOutput("Error: OldString Found Multiple Times")

        await handler(input, output)

        expect(output.output).toContain(EDIT_ERROR_REMINDER)
      })
    })

    describe("successful edit handling", () => {
      test("should not modify output for successful edit", async () => {
        const hook = createEditErrorRecoveryHook(createMockPluginInput())
        const handler = hook["tool.execute.after"]!

        const input = createMockToolInput("edit")
        const originalOutput = "Successfully edited file.ts"
        const output = createMockToolOutput(originalOutput)

        await handler(input, output)

        expect(output.output).toBe(originalOutput)
        expect(output.output).not.toContain(EDIT_ERROR_REMINDER)
      })

      test("should not modify output when no error patterns match", async () => {
        const hook = createEditErrorRecoveryHook(createMockPluginInput())
        const handler = hook["tool.execute.after"]!

        const input = createMockToolInput("edit")
        const originalOutput = "File edited: 5 lines changed"
        const output = createMockToolOutput(originalOutput)

        await handler(input, output)

        expect(output.output).toBe(originalOutput)
      })

      test("should not modify output with partial pattern match", async () => {
        const hook = createEditErrorRecoveryHook(createMockPluginInput())
        const handler = hook["tool.execute.after"]!

        const input = createMockToolInput("edit")
        const originalOutput = "Replaced oldString with newString successfully"
        const output = createMockToolOutput(originalOutput)

        await handler(input, output)

        expect(output.output).toBe(originalOutput)
        expect(output.output).not.toContain(EDIT_ERROR_REMINDER)
      })
    })

    describe("output modification", () => {
      test("should append reminder with newline separator", async () => {
        const hook = createEditErrorRecoveryHook(createMockPluginInput())
        const handler = hook["tool.execute.after"]!

        const input = createMockToolInput("edit")
        const originalOutput = "Error: oldString not found"
        const output = createMockToolOutput(originalOutput)

        await handler(input, output)

        expect(output.output).toBe(`${originalOutput}\n${EDIT_ERROR_REMINDER}`)
      })

      test("should only append reminder once even with multiple error patterns", async () => {
        const hook = createEditErrorRecoveryHook(createMockPluginInput())
        const handler = hook["tool.execute.after"]!

        const input = createMockToolInput("edit")
        const output = createMockToolOutput(
          "oldString not found. Also oldString found multiple times in other file."
        )

        await handler(input, output)

        const reminderCount = (output.output.match(/EDIT ERROR/g) || []).length
        expect(reminderCount).toBe(1)
      })
    })
  })
})
