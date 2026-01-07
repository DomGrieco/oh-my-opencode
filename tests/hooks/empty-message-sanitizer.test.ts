import { describe, test, expect } from "bun:test"
import { createEmptyMessageSanitizerHook } from "../../src/hooks/empty-message-sanitizer"

function createMockMessage(
  role: "user" | "assistant",
  parts: any[],
  id: string = `msg_${Date.now()}`
): any {
  return {
    info: {
      id,
      role,
      sessionID: "test-session",
    },
    parts,
  }
}

function createTextPart(text: string, id?: string): any {
  return {
    type: "text",
    id: id || `part_${Date.now()}`,
    text,
  }
}

function createToolPart(toolType: "tool" | "tool_use" | "tool_result", id?: string): any {
  return {
    type: toolType,
    id: id || `tool_${Date.now()}`,
  }
}

describe("Empty Message Sanitizer Hook", () => {
  describe("createEmptyMessageSanitizerHook", () => {
    test("should return an object with experimental.chat.messages.transform handler", () => {
      const hook = createEmptyMessageSanitizerHook()
      expect(hook["experimental.chat.messages.transform"]).toBeDefined()
      expect(typeof hook["experimental.chat.messages.transform"]).toBe("function")
    })
  })

  describe("hasTextContent behavior (tested through hook)", () => {
    test("should recognize text parts with content as valid", async () => {
      const hook = createEmptyMessageSanitizerHook()
      const handler = hook["experimental.chat.messages.transform"]!

      const messages = [createMockMessage("user", [createTextPart("Hello, world!")])]
      const output = { messages }

      await handler({} as any, output as any)

      expect(messages[0].parts[0].text).toBe("Hello, world!")
      expect(messages[0].parts[0].synthetic).toBeUndefined()
    })

    test("should treat empty text parts as invalid", async () => {
      const hook = createEmptyMessageSanitizerHook()
      const handler = hook["experimental.chat.messages.transform"]!

      const messages = [createMockMessage("user", [createTextPart("")])]
      const output = { messages }

      await handler({} as any, output as any)

      expect(messages[0].parts[0].text).toBe("[user interrupted]")
      expect(messages[0].parts[0].synthetic).toBe(true)
    })

    test("should treat whitespace-only text parts as invalid", async () => {
      const hook = createEmptyMessageSanitizerHook()
      const handler = hook["experimental.chat.messages.transform"]!

      const messages = [createMockMessage("user", [createTextPart("   \n\t  ")])]
      const output = { messages }

      await handler({} as any, output as any)

      expect(messages[0].parts[0].text).toBe("[user interrupted]")
    })
  })

  describe("isToolPart behavior (tested through hook)", () => {
    test("should recognize 'tool' type as valid content", async () => {
      const hook = createEmptyMessageSanitizerHook()
      const handler = hook["experimental.chat.messages.transform"]!

      const messages = [createMockMessage("assistant", [createToolPart("tool")])]
      const output = { messages }

      await handler({} as any, output as any)

      expect(messages[0].parts.length).toBe(1)
      expect(messages[0].parts[0].type).toBe("tool")
    })

    test("should recognize 'tool_use' type as valid content", async () => {
      const hook = createEmptyMessageSanitizerHook()
      const handler = hook["experimental.chat.messages.transform"]!

      const messages = [createMockMessage("assistant", [createToolPart("tool_use")])]
      const output = { messages }

      await handler({} as any, output as any)

      expect(messages[0].parts.length).toBe(1)
      expect(messages[0].parts[0].type).toBe("tool_use")
    })

    test("should recognize 'tool_result' type as valid content", async () => {
      const hook = createEmptyMessageSanitizerHook()
      const handler = hook["experimental.chat.messages.transform"]!

      const messages = [createMockMessage("user", [createToolPart("tool_result")])]
      const output = { messages }

      await handler({} as any, output as any)

      expect(messages[0].parts.length).toBe(1)
      expect(messages[0].parts[0].type).toBe("tool_result")
    })
  })

  describe("hasValidContent behavior (tested through hook)", () => {
    test("should detect valid content with text", async () => {
      const hook = createEmptyMessageSanitizerHook()
      const handler = hook["experimental.chat.messages.transform"]!

      const messages = [createMockMessage("user", [createTextPart("Valid content")])]
      const output = { messages }

      await handler({} as any, output as any)

      expect(messages[0].parts[0].text).toBe("Valid content")
    })

    test("should detect valid content with tool parts", async () => {
      const hook = createEmptyMessageSanitizerHook()
      const handler = hook["experimental.chat.messages.transform"]!

      const messages = [createMockMessage("assistant", [createToolPart("tool_use")])]
      const output = { messages }

      await handler({} as any, output as any)

      expect(messages[0].parts.length).toBe(1)
    })

    test("should detect invalid content with empty parts array", async () => {
      const hook = createEmptyMessageSanitizerHook()
      const handler = hook["experimental.chat.messages.transform"]!

      const messages = [createMockMessage("user", [])]
      const output = { messages }

      await handler({} as any, output as any)

      expect(messages[0].parts.length).toBe(1)
      expect(messages[0].parts[0].text).toBe("[user interrupted]")
    })
  })

  describe("sanitizer placeholder insertion", () => {
    test("should add placeholder to empty user messages", async () => {
      const hook = createEmptyMessageSanitizerHook()
      const handler = hook["experimental.chat.messages.transform"]!

      const messages = [createMockMessage("user", [])]
      const output = { messages }

      await handler({} as any, output as any)

      expect(messages[0].parts.length).toBe(1)
      expect(messages[0].parts[0].type).toBe("text")
      expect(messages[0].parts[0].text).toBe("[user interrupted]")
      expect(messages[0].parts[0].synthetic).toBe(true)
    })

    test("should add placeholder to empty assistant messages (non-final)", async () => {
      const hook = createEmptyMessageSanitizerHook()
      const handler = hook["experimental.chat.messages.transform"]!

      const messages = [
        createMockMessage("assistant", []),
        createMockMessage("user", [createTextPart("Follow up")]),
      ]
      const output = { messages }

      await handler({} as any, output as any)

      expect(messages[0].parts.length).toBe(1)
      expect(messages[0].parts[0].text).toBe("[user interrupted]")
    })

    test("should skip final assistant message", async () => {
      const hook = createEmptyMessageSanitizerHook()
      const handler = hook["experimental.chat.messages.transform"]!

      const messages = [
        createMockMessage("user", [createTextPart("Hello")]),
        createMockMessage("assistant", []),
      ]
      const output = { messages }

      await handler({} as any, output as any)

      expect(messages[1].parts.length).toBe(0)
    })

    test("should handle empty parts array by adding new part", async () => {
      const hook = createEmptyMessageSanitizerHook()
      const handler = hook["experimental.chat.messages.transform"]!

      const messages = [createMockMessage("user", [])]
      const output = { messages }

      await handler({} as any, output as any)

      expect(messages[0].parts.length).toBe(1)
      expect(messages[0].parts[0].type).toBe("text")
    })

    test("should insert placeholder before tool parts when no valid content", async () => {
      const hook = createEmptyMessageSanitizerHook()
      const handler = hook["experimental.chat.messages.transform"]!

      const messages = [
        createMockMessage("user", [
          { type: "image", id: "img_1" },
        ]),
      ]
      const output = { messages }

      await handler({} as any, output as any)

      expect(messages[0].parts.length).toBe(2)
      expect(messages[0].parts[1].type).toBe("text")
      expect(messages[0].parts[1].text).toBe("[user interrupted]")
    })

    test("should replace empty text part instead of adding new one", async () => {
      const hook = createEmptyMessageSanitizerHook()
      const handler = hook["experimental.chat.messages.transform"]!

      const messages = [createMockMessage("user", [createTextPart("")])]
      const output = { messages }

      await handler({} as any, output as any)

      expect(messages[0].parts.length).toBe(1)
      expect(messages[0].parts[0].text).toBe("[user interrupted]")
    })
  })

  describe("multiple messages handling", () => {
    test("should process all messages in sequence", async () => {
      const hook = createEmptyMessageSanitizerHook()
      const handler = hook["experimental.chat.messages.transform"]!

      const messages = [
        createMockMessage("user", [createTextPart("")]),
        createMockMessage("assistant", [createTextPart("Response")]),
        createMockMessage("user", [createTextPart("")]),
        createMockMessage("assistant", [createTextPart("")]),
        createMockMessage("user", [createTextPart("Final")]),
      ]
      const output = { messages }

      await handler({} as any, output as any)

      expect(messages[0].parts[0].text).toBe("[user interrupted]")
      expect(messages[1].parts[0].text).toBe("Response")
      expect(messages[2].parts[0].text).toBe("[user interrupted]")
      expect(messages[3].parts[0].text).toBe("[user interrupted]")
      expect(messages[4].parts[0].text).toBe("Final")
    })

    test("should handle conversation with mixed content", async () => {
      const hook = createEmptyMessageSanitizerHook()
      const handler = hook["experimental.chat.messages.transform"]!

      const messages = [
        createMockMessage("user", [createTextPart("Hello")]),
        createMockMessage("assistant", [createTextPart("Hi!"), createToolPart("tool_use")]),
        createMockMessage("user", [createToolPart("tool_result")]),
        createMockMessage("assistant", [createTextPart("Done")]),
      ]
      const output = { messages }

      await handler({} as any, output as any)

      expect(messages[0].parts[0].text).toBe("Hello")
      expect(messages[1].parts[0].text).toBe("Hi!")
      expect(messages[2].parts[0].type).toBe("tool_result")
      expect(messages[3].parts[0].text).toBe("Done")
    })
  })

  describe("edge cases", () => {
    test("should handle empty messages array", async () => {
      const hook = createEmptyMessageSanitizerHook()
      const handler = hook["experimental.chat.messages.transform"]!

      const messages: any[] = []
      const output = { messages }

      await handler({} as any, output as any)

      expect(messages.length).toBe(0)
    })

    test("should handle single empty user message", async () => {
      const hook = createEmptyMessageSanitizerHook()
      const handler = hook["experimental.chat.messages.transform"]!

      const messages = [createMockMessage("user", [])]
      const output = { messages }

      await handler({} as any, output as any)

      expect(messages[0].parts.length).toBe(1)
      expect(messages[0].parts[0].text).toBe("[user interrupted]")
    })

    test("should handle message with only whitespace text", async () => {
      const hook = createEmptyMessageSanitizerHook()
      const handler = hook["experimental.chat.messages.transform"]!

      const messages = [createMockMessage("user", [createTextPart("   ")])]
      const output = { messages }

      await handler({} as any, output as any)

      expect(messages[0].parts[0].text).toBe("[user interrupted]")
    })

    test("should mark synthetic parts correctly", async () => {
      const hook = createEmptyMessageSanitizerHook()
      const handler = hook["experimental.chat.messages.transform"]!

      const messages = [createMockMessage("user", [])]
      const output = { messages }

      await handler({} as any, output as any)

      expect(messages[0].parts[0].synthetic).toBe(true)
    })

    test("should generate unique IDs for synthetic parts", async () => {
      const hook = createEmptyMessageSanitizerHook()
      const handler = hook["experimental.chat.messages.transform"]!

      const messages = [
        createMockMessage("user", [], "msg_1"),
        createMockMessage("assistant", [createTextPart("Response")]),
        createMockMessage("user", [], "msg_2"),
      ]
      const output = { messages }

      await handler({} as any, output as any)

      expect(messages[0].parts[0].id).toMatch(/^synthetic_/)
      expect(messages[2].parts[0].id).toMatch(/^synthetic_/)
    })
  })
})
