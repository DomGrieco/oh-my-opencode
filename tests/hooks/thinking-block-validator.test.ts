import { describe, test, expect } from "bun:test"
import { createThinkingBlockValidatorHook } from "../../src/hooks/thinking-block-validator"

function createMockMessage(
  role: "user" | "assistant",
  parts: any[],
  options: { id?: string; modelID?: string } = {}
): any {
  return {
    info: {
      id: options.id || `msg_${Date.now()}`,
      role,
      sessionID: "test-session",
      modelID: options.modelID,
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

function createThinkingPart(thinking: string, id?: string): any {
  return {
    type: "thinking",
    id: id || `thinking_${Date.now()}`,
    thinking,
  }
}

function createToolPart(toolType: "tool" | "tool_use", id?: string): any {
  return {
    type: toolType,
    id: id || `tool_${Date.now()}`,
  }
}

describe("Thinking Block Validator Hook", () => {
  describe("createThinkingBlockValidatorHook", () => {
    test("should return an object with experimental.chat.messages.transform handler", () => {
      const hook = createThinkingBlockValidatorHook()
      expect(hook["experimental.chat.messages.transform"]).toBeDefined()
      expect(typeof hook["experimental.chat.messages.transform"]).toBe("function")
    })
  })

  describe("isExtendedThinkingModel behavior (tested through hook)", () => {
    describe("Claude models with extended thinking", () => {
      test("should detect claude-sonnet-4 as extended thinking model", async () => {
        const hook = createThinkingBlockValidatorHook()
        const handler = hook["experimental.chat.messages.transform"]!

        const messages = [
          createMockMessage("user", [createTextPart("Hello")], { modelID: "claude-sonnet-4" }),
          createMockMessage("assistant", [createTextPart("Response")]),
        ]
        const output = { messages }

        await handler({} as any, output as any)

        expect(messages[1].parts[0].type).toBe("thinking")
      })

      test("should detect claude-opus-4 as extended thinking model", async () => {
        const hook = createThinkingBlockValidatorHook()
        const handler = hook["experimental.chat.messages.transform"]!

        const messages = [
          createMockMessage("user", [createTextPart("Hello")], { modelID: "claude-opus-4" }),
          createMockMessage("assistant", [createTextPart("Response")]),
        ]
        const output = { messages }

        await handler({} as any, output as any)

        expect(messages[1].parts[0].type).toBe("thinking")
      })

      test("should detect claude-3 variants as extended thinking model", async () => {
        const hook = createThinkingBlockValidatorHook()
        const handler = hook["experimental.chat.messages.transform"]!

        const messages = [
          createMockMessage("user", [createTextPart("Hello")], { modelID: "claude-3-opus" }),
          createMockMessage("assistant", [createTextPart("Response")]),
        ]
        const output = { messages }

        await handler({} as any, output as any)

        expect(messages[1].parts[0].type).toBe("thinking")
      })
    })

    describe("models with thinking/high suffix", () => {
      test("should detect models with 'thinking' in name", async () => {
        const hook = createThinkingBlockValidatorHook()
        const handler = hook["experimental.chat.messages.transform"]!

        const messages = [
          createMockMessage("user", [createTextPart("Hello")], { modelID: "gpt-5-thinking" }),
          createMockMessage("assistant", [createTextPart("Response")]),
        ]
        const output = { messages }

        await handler({} as any, output as any)

        expect(messages[1].parts[0].type).toBe("thinking")
      })

      test("should detect models ending with '-high'", async () => {
        const hook = createThinkingBlockValidatorHook()
        const handler = hook["experimental.chat.messages.transform"]!

        const messages = [
          createMockMessage("user", [createTextPart("Hello")], { modelID: "gemini-2-high" }),
          createMockMessage("assistant", [createTextPart("Response")]),
        ]
        const output = { messages }

        await handler({} as any, output as any)

        expect(messages[1].parts[0].type).toBe("thinking")
      })
    })

    describe("non-thinking models", () => {
      test("should not process gpt-4 (non-thinking model)", async () => {
        const hook = createThinkingBlockValidatorHook()
        const handler = hook["experimental.chat.messages.transform"]!

        const messages = [
          createMockMessage("user", [createTextPart("Hello")], { modelID: "gpt-4" }),
          createMockMessage("assistant", [createTextPart("Response")]),
        ]
        const output = { messages }

        await handler({} as any, output as any)

        expect(messages[1].parts.length).toBe(1)
        expect(messages[1].parts[0].type).toBe("text")
      })

      test("should not process gemini-flash (non-thinking model)", async () => {
        const hook = createThinkingBlockValidatorHook()
        const handler = hook["experimental.chat.messages.transform"]!

        const messages = [
          createMockMessage("user", [createTextPart("Hello")], { modelID: "gemini-2.5-flash" }),
          createMockMessage("assistant", [createTextPart("Response")]),
        ]
        const output = { messages }

        await handler({} as any, output as any)

        expect(messages[1].parts.length).toBe(1)
        expect(messages[1].parts[0].type).toBe("text")
      })

      test("should not process when modelID is empty", async () => {
        const hook = createThinkingBlockValidatorHook()
        const handler = hook["experimental.chat.messages.transform"]!

        const messages = [
          createMockMessage("user", [createTextPart("Hello")], { modelID: "" }),
          createMockMessage("assistant", [createTextPart("Response")]),
        ]
        const output = { messages }

        await handler({} as any, output as any)

        expect(messages[1].parts.length).toBe(1)
        expect(messages[1].parts[0].type).toBe("text")
      })

      test("should not process when modelID is undefined", async () => {
        const hook = createThinkingBlockValidatorHook()
        const handler = hook["experimental.chat.messages.transform"]!

        const messages = [
          createMockMessage("user", [createTextPart("Hello")]),
          createMockMessage("assistant", [createTextPart("Response")]),
        ]
        const output = { messages }

        await handler({} as any, output as any)

        expect(messages[1].parts.length).toBe(1)
        expect(messages[1].parts[0].type).toBe("text")
      })
    })

    describe("case insensitivity", () => {
      test("should detect CLAUDE-SONNET-4 (uppercase)", async () => {
        const hook = createThinkingBlockValidatorHook()
        const handler = hook["experimental.chat.messages.transform"]!

        const messages = [
          createMockMessage("user", [createTextPart("Hello")], { modelID: "CLAUDE-SONNET-4" }),
          createMockMessage("assistant", [createTextPart("Response")]),
        ]
        const output = { messages }

        await handler({} as any, output as any)

        expect(messages[1].parts[0].type).toBe("thinking")
      })

      test("should detect Claude-Opus-4 (mixed case)", async () => {
        const hook = createThinkingBlockValidatorHook()
        const handler = hook["experimental.chat.messages.transform"]!

        const messages = [
          createMockMessage("user", [createTextPart("Hello")], { modelID: "Claude-Opus-4" }),
          createMockMessage("assistant", [createTextPart("Response")]),
        ]
        const output = { messages }

        await handler({} as any, output as any)

        expect(messages[1].parts[0].type).toBe("thinking")
      })
    })
  })

  describe("hasContentParts behavior (tested through hook)", () => {
    test("should detect tool parts as content", async () => {
      const hook = createThinkingBlockValidatorHook()
      const handler = hook["experimental.chat.messages.transform"]!

      const messages = [
        createMockMessage("user", [createTextPart("Hello")], { modelID: "claude-sonnet-4" }),
        createMockMessage("assistant", [createToolPart("tool_use")]),
      ]
      const output = { messages }

      await handler({} as any, output as any)

      expect(messages[1].parts[0].type).toBe("thinking")
      expect(messages[1].parts[1].type).toBe("tool_use")
    })

    test("should detect text parts as content", async () => {
      const hook = createThinkingBlockValidatorHook()
      const handler = hook["experimental.chat.messages.transform"]!

      const messages = [
        createMockMessage("user", [createTextPart("Hello")], { modelID: "claude-sonnet-4" }),
        createMockMessage("assistant", [createTextPart("Response")]),
      ]
      const output = { messages }

      await handler({} as any, output as any)

      expect(messages[1].parts[0].type).toBe("thinking")
      expect(messages[1].parts[1].type).toBe("text")
    })

    test("should not process empty parts array", async () => {
      const hook = createThinkingBlockValidatorHook()
      const handler = hook["experimental.chat.messages.transform"]!

      const messages = [
        createMockMessage("user", [createTextPart("Hello")], { modelID: "claude-sonnet-4" }),
        createMockMessage("assistant", []),
      ]
      const output = { messages }

      await handler({} as any, output as any)

      expect(messages[1].parts.length).toBe(0)
    })
  })

  describe("startsWithThinkingBlock behavior (tested through hook)", () => {
    test("should not add thinking if message already starts with thinking", async () => {
      const hook = createThinkingBlockValidatorHook()
      const handler = hook["experimental.chat.messages.transform"]!

      const messages = [
        createMockMessage("user", [createTextPart("Hello")], { modelID: "claude-sonnet-4" }),
        createMockMessage("assistant", [
          createThinkingPart("Let me think..."),
          createTextPart("Response"),
        ]),
      ]
      const output = { messages }

      await handler({} as any, output as any)

      expect(messages[1].parts.length).toBe(2)
      expect(messages[1].parts[0].type).toBe("thinking")
      expect(messages[1].parts[0].thinking).toBe("Let me think...")
    })

    test("should not add thinking if message starts with reasoning type", async () => {
      const hook = createThinkingBlockValidatorHook()
      const handler = hook["experimental.chat.messages.transform"]!

      const messages = [
        createMockMessage("user", [createTextPart("Hello")], { modelID: "claude-sonnet-4" }),
        createMockMessage("assistant", [
          { type: "reasoning", id: "r1", text: "Reasoning..." },
          createTextPart("Response"),
        ]),
      ]
      const output = { messages }

      await handler({} as any, output as any)

      expect(messages[1].parts.length).toBe(2)
      expect(messages[1].parts[0].type).toBe("reasoning")
    })
  })

  describe("findPreviousThinkingContent behavior (tested through hook)", () => {
    test("should use previous thinking content when available", async () => {
      const hook = createThinkingBlockValidatorHook()
      const handler = hook["experimental.chat.messages.transform"]!

      const messages = [
        createMockMessage("user", [createTextPart("Hello")], { modelID: "claude-sonnet-4" }),
        createMockMessage("assistant", [
          createThinkingPart("Previous thinking content"),
          createTextPart("First response"),
        ]),
        createMockMessage("user", [createTextPart("Follow up")], { modelID: "claude-sonnet-4" }),
        createMockMessage("assistant", [createTextPart("Second response")]),
      ]
      const output = { messages }

      await handler({} as any, output as any)

      expect(messages[3].parts[0].type).toBe("thinking")
      expect(messages[3].parts[0].thinking).toBe("Previous thinking content")
    })

    test("should use default text when no previous thinking found", async () => {
      const hook = createThinkingBlockValidatorHook()
      const handler = hook["experimental.chat.messages.transform"]!

      const messages = [
        createMockMessage("user", [createTextPart("Hello")], { modelID: "claude-sonnet-4" }),
        createMockMessage("assistant", [createTextPart("Response without thinking")]),
      ]
      const output = { messages }

      await handler({} as any, output as any)

      expect(messages[1].parts[0].type).toBe("thinking")
      expect(messages[1].parts[0].thinking).toBe("[Continuing from previous reasoning]")
    })

    test("should skip user messages when searching for previous thinking", async () => {
      const hook = createThinkingBlockValidatorHook()
      const handler = hook["experimental.chat.messages.transform"]!

      const messages = [
        createMockMessage("user", [createTextPart("Hello")], { modelID: "claude-sonnet-4" }),
        createMockMessage("assistant", [
          createThinkingPart("First thinking"),
          createTextPart("First response"),
        ]),
        createMockMessage("user", [createTextPart("Question 1")]),
        createMockMessage("user", [createTextPart("Question 2")], { modelID: "claude-sonnet-4" }),
        createMockMessage("assistant", [createTextPart("Second response")]),
      ]
      const output = { messages }

      await handler({} as any, output as any)

      expect(messages[4].parts[0].type).toBe("thinking")
      expect(messages[4].parts[0].thinking).toBe("First thinking")
    })
  })

  describe("prependThinkingBlock behavior (tested through hook)", () => {
    test("should prepend thinking block to assistant message", async () => {
      const hook = createThinkingBlockValidatorHook()
      const handler = hook["experimental.chat.messages.transform"]!

      const messages = [
        createMockMessage("user", [createTextPart("Hello")], { modelID: "claude-sonnet-4" }),
        createMockMessage("assistant", [createTextPart("Response")]),
      ]
      const output = { messages }

      await handler({} as any, output as any)

      expect(messages[1].parts.length).toBe(2)
      expect(messages[1].parts[0].type).toBe("thinking")
      expect(messages[1].parts[1].type).toBe("text")
    })

    test("should mark synthetic thinking blocks", async () => {
      const hook = createThinkingBlockValidatorHook()
      const handler = hook["experimental.chat.messages.transform"]!

      const messages = [
        createMockMessage("user", [createTextPart("Hello")], { modelID: "claude-sonnet-4" }),
        createMockMessage("assistant", [createTextPart("Response")]),
      ]
      const output = { messages }

      await handler({} as any, output as any)

      expect(messages[1].parts[0].synthetic).toBe(true)
    })

    test("should generate correct ID for synthetic thinking", async () => {
      const hook = createThinkingBlockValidatorHook()
      const handler = hook["experimental.chat.messages.transform"]!

      const messages = [
        createMockMessage("user", [createTextPart("Hello")], { modelID: "claude-sonnet-4" }),
        createMockMessage("assistant", [createTextPart("Response")]),
      ]
      const output = { messages }

      await handler({} as any, output as any)

      expect(messages[1].parts[0].id).toBe("prt_0000000000_synthetic_thinking")
    })
  })

  describe("validator only runs for extended thinking models", () => {
    test("should process all assistant messages for thinking model", async () => {
      const hook = createThinkingBlockValidatorHook()
      const handler = hook["experimental.chat.messages.transform"]!

      const messages = [
        createMockMessage("user", [createTextPart("Hello")], { modelID: "claude-opus-4" }),
        createMockMessage("assistant", [createTextPart("Response 1")]),
        createMockMessage("user", [createTextPart("Follow up")], { modelID: "claude-opus-4" }),
        createMockMessage("assistant", [createTextPart("Response 2")]),
      ]
      const output = { messages }

      await handler({} as any, output as any)

      expect(messages[1].parts[0].type).toBe("thinking")
      expect(messages[3].parts[0].type).toBe("thinking")
    })

    test("should not process any messages for non-thinking model", async () => {
      const hook = createThinkingBlockValidatorHook()
      const handler = hook["experimental.chat.messages.transform"]!

      const messages = [
        createMockMessage("user", [createTextPart("Hello")], { modelID: "gpt-4o" }),
        createMockMessage("assistant", [createTextPart("Response 1")]),
        createMockMessage("user", [createTextPart("Follow up")]),
        createMockMessage("assistant", [createTextPart("Response 2")]),
      ]
      const output = { messages }

      await handler({} as any, output as any)

      expect(messages[1].parts.length).toBe(1)
      expect(messages[1].parts[0].type).toBe("text")
      expect(messages[3].parts.length).toBe(1)
      expect(messages[3].parts[0].type).toBe("text")
    })
  })

  describe("edge cases", () => {
    test("should handle empty messages array", async () => {
      const hook = createThinkingBlockValidatorHook()
      const handler = hook["experimental.chat.messages.transform"]!

      const messages: any[] = []
      const output = { messages }

      await handler({} as any, output as any)

      expect(messages.length).toBe(0)
    })

    test("should handle messages with null parts", async () => {
      const hook = createThinkingBlockValidatorHook()
      const handler = hook["experimental.chat.messages.transform"]!

      const messages = [
        createMockMessage("user", [createTextPart("Hello")], { modelID: "claude-sonnet-4" }),
        {
          info: { id: "msg_1", role: "assistant", sessionID: "test" },
          parts: null as any,
        },
      ]
      const output = { messages }

      await handler({} as any, output as any)

      expect(messages[1].parts).toBeDefined()
    })

    test("should skip user messages", async () => {
      const hook = createThinkingBlockValidatorHook()
      const handler = hook["experimental.chat.messages.transform"]!

      const messages = [
        createMockMessage("user", [createTextPart("Hello")], { modelID: "claude-sonnet-4" }),
        createMockMessage("user", [createTextPart("Another question")]),
      ]
      const output = { messages }

      await handler({} as any, output as any)

      expect(messages[0].parts.length).toBe(1)
      expect(messages[0].parts[0].type).toBe("text")
      expect(messages[1].parts.length).toBe(1)
      expect(messages[1].parts[0].type).toBe("text")
    })

    test("should use modelID from last user message", async () => {
      const hook = createThinkingBlockValidatorHook()
      const handler = hook["experimental.chat.messages.transform"]!

      const messages = [
        createMockMessage("user", [createTextPart("Hello")], { modelID: "gpt-4" }),
        createMockMessage("assistant", [createTextPart("Response 1")]),
        createMockMessage("user", [createTextPart("Follow up")], { modelID: "claude-sonnet-4" }),
        createMockMessage("assistant", [createTextPart("Response 2")]),
      ]
      const output = { messages }

      await handler({} as any, output as any)

      expect(messages[1].parts[0].type).toBe("thinking")
      expect(messages[3].parts[0].type).toBe("thinking")
    })
  })
})
