import { describe, test, expect } from "bun:test"
import {
  DEFAULT_THRESHOLD,
  MIN_TOKENS_FOR_COMPACTION,
  COMPACTION_COOLDOWN_MS,
} from "../../src/hooks/preemptive-compaction/constants"
import type {
  PreemptiveCompactionState,
  TokenInfo,
  ModelLimits,
} from "../../src/hooks/preemptive-compaction/types"

function createMockTokenInfo(overrides: Partial<TokenInfo> = {}): TokenInfo {
  return {
    input: 50000,
    output: 10000,
    reasoning: 0,
    cache: { read: 20000, write: 5000 },
    ...overrides,
  }
}

function createMockState(): PreemptiveCompactionState {
  return {
    lastCompactionTime: new Map(),
    compactionInProgress: new Set(),
  }
}

describe("Preemptive Compaction Constants", () => {
  describe("DEFAULT_THRESHOLD", () => {
    test("should be 0.85 (85%)", () => {
      expect(DEFAULT_THRESHOLD).toBe(0.85)
    })

    test("should be between 0 and 1", () => {
      expect(DEFAULT_THRESHOLD).toBeGreaterThan(0)
      expect(DEFAULT_THRESHOLD).toBeLessThanOrEqual(1)
    })
  })

  describe("MIN_TOKENS_FOR_COMPACTION", () => {
    test("should be 50,000 tokens", () => {
      expect(MIN_TOKENS_FOR_COMPACTION).toBe(50_000)
    })

    test("should be a reasonable minimum", () => {
      expect(MIN_TOKENS_FOR_COMPACTION).toBeGreaterThan(10_000)
      expect(MIN_TOKENS_FOR_COMPACTION).toBeLessThan(100_000)
    })
  })

  describe("COMPACTION_COOLDOWN_MS", () => {
    test("should be 60 seconds", () => {
      expect(COMPACTION_COOLDOWN_MS).toBe(60_000)
    })

    test("should be at least 30 seconds", () => {
      expect(COMPACTION_COOLDOWN_MS).toBeGreaterThanOrEqual(30_000)
    })
  })
})

describe("Preemptive Compaction State", () => {
  describe("createMockState", () => {
    test("should create empty lastCompactionTime map", () => {
      const state = createMockState()
      expect(state.lastCompactionTime.size).toBe(0)
    })

    test("should create empty compactionInProgress set", () => {
      const state = createMockState()
      expect(state.compactionInProgress.size).toBe(0)
    })
  })

  describe("lastCompactionTime tracking", () => {
    test("should track compaction time per session", () => {
      const state = createMockState()
      const now = Date.now()

      state.lastCompactionTime.set("session_1", now)
      state.lastCompactionTime.set("session_2", now - 30000)

      expect(state.lastCompactionTime.get("session_1")).toBe(now)
      expect(state.lastCompactionTime.get("session_2")).toBe(now - 30000)
    })

    test("should return undefined for unknown sessions", () => {
      const state = createMockState()
      expect(state.lastCompactionTime.get("unknown")).toBeUndefined()
    })

    test("should allow updating compaction time", () => {
      const state = createMockState()
      const time1 = Date.now() - 60000
      const time2 = Date.now()

      state.lastCompactionTime.set("session_1", time1)
      state.lastCompactionTime.set("session_1", time2)

      expect(state.lastCompactionTime.get("session_1")).toBe(time2)
    })

    test("should allow deleting session entries", () => {
      const state = createMockState()
      state.lastCompactionTime.set("session_1", Date.now())
      state.lastCompactionTime.delete("session_1")

      expect(state.lastCompactionTime.has("session_1")).toBe(false)
    })
  })

  describe("compactionInProgress tracking", () => {
    test("should track sessions with compaction in progress", () => {
      const state = createMockState()

      state.compactionInProgress.add("session_1")
      expect(state.compactionInProgress.has("session_1")).toBe(true)
      expect(state.compactionInProgress.has("session_2")).toBe(false)
    })

    test("should allow removing sessions from in-progress set", () => {
      const state = createMockState()

      state.compactionInProgress.add("session_1")
      state.compactionInProgress.delete("session_1")

      expect(state.compactionInProgress.has("session_1")).toBe(false)
    })

    test("should handle multiple sessions", () => {
      const state = createMockState()

      state.compactionInProgress.add("session_1")
      state.compactionInProgress.add("session_2")
      state.compactionInProgress.add("session_3")

      expect(state.compactionInProgress.size).toBe(3)
    })
  })
})

describe("Token Info", () => {
  describe("TokenInfo structure", () => {
    test("should have input tokens", () => {
      const tokens = createMockTokenInfo({ input: 100000 })
      expect(tokens.input).toBe(100000)
    })

    test("should have output tokens", () => {
      const tokens = createMockTokenInfo({ output: 5000 })
      expect(tokens.output).toBe(5000)
    })

    test("should have reasoning tokens", () => {
      const tokens = createMockTokenInfo({ reasoning: 10000 })
      expect(tokens.reasoning).toBe(10000)
    })

    test("should have cache read and write tokens", () => {
      const tokens = createMockTokenInfo({
        cache: { read: 30000, write: 10000 },
      })
      expect(tokens.cache.read).toBe(30000)
      expect(tokens.cache.write).toBe(10000)
    })
  })

  describe("total token calculation", () => {
    test("should calculate total used tokens correctly", () => {
      const tokens = createMockTokenInfo({
        input: 50000,
        output: 10000,
        cache: { read: 20000, write: 5000 },
      })

      const totalUsed = tokens.input + tokens.cache.read + tokens.output
      expect(totalUsed).toBe(80000)
    })

    test("should handle zero tokens", () => {
      const tokens = createMockTokenInfo({
        input: 0,
        output: 0,
        reasoning: 0,
        cache: { read: 0, write: 0 },
      })

      const totalUsed = tokens.input + tokens.cache.read + tokens.output
      expect(totalUsed).toBe(0)
    })
  })
})

describe("Usage Ratio Calculation", () => {
  const CLAUDE_DEFAULT_CONTEXT_LIMIT = 200_000

  test("should calculate usage ratio correctly", () => {
    const tokens = createMockTokenInfo({
      input: 100000,
      output: 20000,
      cache: { read: 50000, write: 0 },
    })

    const totalUsed = tokens.input + tokens.cache.read + tokens.output
    const usageRatio = totalUsed / CLAUDE_DEFAULT_CONTEXT_LIMIT

    expect(usageRatio).toBe(0.85)
  })

  test("should detect when above threshold", () => {
    const tokens = createMockTokenInfo({
      input: 120000,
      output: 30000,
      cache: { read: 30000, write: 0 },
    })

    const totalUsed = tokens.input + tokens.cache.read + tokens.output
    const usageRatio = totalUsed / CLAUDE_DEFAULT_CONTEXT_LIMIT

    expect(usageRatio).toBeGreaterThan(DEFAULT_THRESHOLD)
  })

  test("should detect when below threshold", () => {
    const tokens = createMockTokenInfo({
      input: 50000,
      output: 10000,
      cache: { read: 20000, write: 0 },
    })

    const totalUsed = tokens.input + tokens.cache.read + tokens.output
    const usageRatio = totalUsed / CLAUDE_DEFAULT_CONTEXT_LIMIT

    expect(usageRatio).toBeLessThan(DEFAULT_THRESHOLD)
  })

  test("should handle 1M context limit", () => {
    const CLAUDE_1M_CONTEXT_LIMIT = 1_000_000
    const tokens = createMockTokenInfo({
      input: 500000,
      output: 100000,
      cache: { read: 200000, write: 0 },
    })

    const totalUsed = tokens.input + tokens.cache.read + tokens.output
    const usageRatio = totalUsed / CLAUDE_1M_CONTEXT_LIMIT

    expect(usageRatio).toBe(0.8)
  })
})

describe("Model Support Detection", () => {
  const CLAUDE_MODEL_PATTERN = /claude-(opus|sonnet|haiku)/i

  function isSupportedModel(modelID: string): boolean {
    return CLAUDE_MODEL_PATTERN.test(modelID)
  }

  describe("supported models", () => {
    test("should support claude-opus models", () => {
      expect(isSupportedModel("claude-opus-4-5")).toBe(true)
      expect(isSupportedModel("claude-opus-4")).toBe(true)
    })

    test("should support claude-sonnet models", () => {
      expect(isSupportedModel("claude-sonnet-4-5")).toBe(true)
      expect(isSupportedModel("claude-sonnet-4")).toBe(true)
      expect(isSupportedModel("claude-sonnet-3-5")).toBe(true)
    })

    test("should support claude-haiku models", () => {
      expect(isSupportedModel("claude-haiku-4-5")).toBe(true)
      expect(isSupportedModel("claude-haiku-3-5")).toBe(true)
    })

    test("should be case insensitive", () => {
      expect(isSupportedModel("Claude-Opus-4-5")).toBe(true)
      expect(isSupportedModel("CLAUDE-SONNET-4")).toBe(true)
    })
  })

  describe("unsupported models", () => {
    test("should not support GPT models", () => {
      expect(isSupportedModel("gpt-5.2")).toBe(false)
      expect(isSupportedModel("gpt-4o")).toBe(false)
    })

    test("should not support Gemini models", () => {
      expect(isSupportedModel("gemini-3-pro-preview")).toBe(false)
      expect(isSupportedModel("gemini-2.5-flash")).toBe(false)
    })

    test("should not support other models", () => {
      expect(isSupportedModel("grok-code")).toBe(false)
      expect(isSupportedModel("llama-3")).toBe(false)
    })

    test("should not match partial claude names", () => {
      expect(isSupportedModel("claude-3")).toBe(false)
      expect(isSupportedModel("claude")).toBe(false)
    })
  })
})

describe("Cooldown Logic", () => {
  test("should be within cooldown period", () => {
    const state = createMockState()
    const now = Date.now()

    state.lastCompactionTime.set("session_1", now - 30000)

    const lastCompaction = state.lastCompactionTime.get("session_1") ?? 0
    const withinCooldown = now - lastCompaction < COMPACTION_COOLDOWN_MS

    expect(withinCooldown).toBe(true)
  })

  test("should be outside cooldown period", () => {
    const state = createMockState()
    const now = Date.now()

    state.lastCompactionTime.set("session_1", now - 90000)

    const lastCompaction = state.lastCompactionTime.get("session_1") ?? 0
    const withinCooldown = now - lastCompaction < COMPACTION_COOLDOWN_MS

    expect(withinCooldown).toBe(false)
  })

  test("should allow compaction for new sessions", () => {
    const state = createMockState()
    const now = Date.now()

    const lastCompaction = state.lastCompactionTime.get("new_session") ?? 0
    const withinCooldown = now - lastCompaction < COMPACTION_COOLDOWN_MS

    expect(withinCooldown).toBe(false)
  })
})

describe("Minimum Token Check", () => {
  test("should skip compaction when below minimum", () => {
    const tokens = createMockTokenInfo({
      input: 20000,
      output: 5000,
      cache: { read: 10000, write: 0 },
    })

    const totalUsed = tokens.input + tokens.cache.read + tokens.output
    expect(totalUsed).toBeLessThan(MIN_TOKENS_FOR_COMPACTION)
  })

  test("should allow compaction when at minimum", () => {
    const tokens = createMockTokenInfo({
      input: 30000,
      output: 10000,
      cache: { read: 10000, write: 0 },
    })

    const totalUsed = tokens.input + tokens.cache.read + tokens.output
    expect(totalUsed).toBeGreaterThanOrEqual(MIN_TOKENS_FOR_COMPACTION)
  })

  test("should allow compaction when above minimum", () => {
    const tokens = createMockTokenInfo({
      input: 100000,
      output: 20000,
      cache: { read: 50000, write: 0 },
    })

    const totalUsed = tokens.input + tokens.cache.read + tokens.output
    expect(totalUsed).toBeGreaterThan(MIN_TOKENS_FOR_COMPACTION)
  })
})

describe("Compaction Trigger Conditions", () => {
  const CLAUDE_DEFAULT_CONTEXT_LIMIT = 200_000

  function shouldTriggerCompaction(
    state: PreemptiveCompactionState,
    sessionID: string,
    tokens: TokenInfo,
    modelID: string,
    threshold: number = DEFAULT_THRESHOLD
  ): { shouldTrigger: boolean; reason?: string } {
    const CLAUDE_MODEL_PATTERN = /claude-(opus|sonnet|haiku)/i

    if (state.compactionInProgress.has(sessionID)) {
      return { shouldTrigger: false, reason: "compaction_in_progress" }
    }

    const lastCompaction = state.lastCompactionTime.get(sessionID) ?? 0
    if (Date.now() - lastCompaction < COMPACTION_COOLDOWN_MS) {
      return { shouldTrigger: false, reason: "within_cooldown" }
    }

    if (!CLAUDE_MODEL_PATTERN.test(modelID)) {
      return { shouldTrigger: false, reason: "unsupported_model" }
    }

    const totalUsed = tokens.input + tokens.cache.read + tokens.output
    if (totalUsed < MIN_TOKENS_FOR_COMPACTION) {
      return { shouldTrigger: false, reason: "below_minimum_tokens" }
    }

    const usageRatio = totalUsed / CLAUDE_DEFAULT_CONTEXT_LIMIT
    if (usageRatio < threshold) {
      return { shouldTrigger: false, reason: "below_threshold" }
    }

    return { shouldTrigger: true }
  }

  test("should trigger when all conditions met", () => {
    const state = createMockState()
    const tokens = createMockTokenInfo({
      input: 120000,
      output: 30000,
      cache: { read: 30000, write: 0 },
    })

    const result = shouldTriggerCompaction(state, "session_1", tokens, "claude-sonnet-4-5")
    expect(result.shouldTrigger).toBe(true)
  })

  test("should not trigger when compaction in progress", () => {
    const state = createMockState()
    state.compactionInProgress.add("session_1")

    const tokens = createMockTokenInfo({
      input: 150000,
      output: 30000,
      cache: { read: 30000, write: 0 },
    })

    const result = shouldTriggerCompaction(state, "session_1", tokens, "claude-sonnet-4-5")
    expect(result.shouldTrigger).toBe(false)
    expect(result.reason).toBe("compaction_in_progress")
  })

  test("should not trigger within cooldown", () => {
    const state = createMockState()
    state.lastCompactionTime.set("session_1", Date.now() - 30000)

    const tokens = createMockTokenInfo({
      input: 150000,
      output: 30000,
      cache: { read: 30000, write: 0 },
    })

    const result = shouldTriggerCompaction(state, "session_1", tokens, "claude-sonnet-4-5")
    expect(result.shouldTrigger).toBe(false)
    expect(result.reason).toBe("within_cooldown")
  })

  test("should not trigger for unsupported model", () => {
    const state = createMockState()
    const tokens = createMockTokenInfo({
      input: 150000,
      output: 30000,
      cache: { read: 30000, write: 0 },
    })

    const result = shouldTriggerCompaction(state, "session_1", tokens, "gpt-5.2")
    expect(result.shouldTrigger).toBe(false)
    expect(result.reason).toBe("unsupported_model")
  })

  test("should not trigger below minimum tokens", () => {
    const state = createMockState()
    const tokens = createMockTokenInfo({
      input: 20000,
      output: 5000,
      cache: { read: 10000, write: 0 },
    })

    const result = shouldTriggerCompaction(state, "session_1", tokens, "claude-sonnet-4-5")
    expect(result.shouldTrigger).toBe(false)
    expect(result.reason).toBe("below_minimum_tokens")
  })

  test("should not trigger below threshold", () => {
    const state = createMockState()
    const tokens = createMockTokenInfo({
      input: 50000,
      output: 10000,
      cache: { read: 20000, write: 0 },
    })

    const result = shouldTriggerCompaction(state, "session_1", tokens, "claude-sonnet-4-5")
    expect(result.shouldTrigger).toBe(false)
    expect(result.reason).toBe("below_threshold")
  })

  test("should respect custom threshold", () => {
    const state = createMockState()
    const tokens = createMockTokenInfo({
      input: 100000,
      output: 20000,
      cache: { read: 30000, write: 0 },
    })

    const resultDefault = shouldTriggerCompaction(state, "session_1", tokens, "claude-sonnet-4-5")
    expect(resultDefault.shouldTrigger).toBe(false)

    const resultLower = shouldTriggerCompaction(state, "session_1", tokens, "claude-sonnet-4-5", 0.7)
    expect(resultLower.shouldTrigger).toBe(true)
  })
})
