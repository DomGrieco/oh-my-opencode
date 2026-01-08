/**
 * Tests for ConcurrencyManager (LIF-111)
 *
 * These tests verify the concurrency management for background agents,
 * including model-based limits, provider-based limits, and queue management.
 */

import { describe, test, expect, beforeEach } from "bun:test"
import { ConcurrencyManager } from "../../../src/features/background-agent/concurrency"
import type { BackgroundTaskConfig } from "../../../src/config/schema"

// --------------------------------------------------------
// HELPER FUNCTIONS
// --------------------------------------------------------

function createConfig(overrides: Partial<BackgroundTaskConfig> = {}): BackgroundTaskConfig {
  return {
    defaultConcurrency: 5,
    modelConcurrency: {},
    providerConcurrency: {},
    ...overrides,
  }
}

// --------------------------------------------------------
// CONCURRENCY LIMIT TESTS
// --------------------------------------------------------

describe("ConcurrencyManager", () => {
  describe("getConcurrencyLimit", () => {
    describe("default behavior", () => {
      test("should return 5 when no config is provided", () => {
        const manager = new ConcurrencyManager()
        expect(manager.getConcurrencyLimit("anthropic/claude-sonnet-4")).toBe(5)
      })

      test("should return default limit from config", () => {
        const config = createConfig({ defaultConcurrency: 10 })
        const manager = new ConcurrencyManager(config)
        expect(manager.getConcurrencyLimit("anthropic/claude-sonnet-4")).toBe(10)
      })

      test("should return Infinity when default is 0", () => {
        const config = createConfig({ defaultConcurrency: 0 })
        const manager = new ConcurrencyManager(config)
        expect(manager.getConcurrencyLimit("anthropic/claude-sonnet-4")).toBe(Infinity)
      })
    })

    describe("model-specific limits", () => {
      test("should return model-specific limit when configured", () => {
        const config = createConfig({
          modelConcurrency: {
            "anthropic/claude-opus-4-5": 2,
          },
        })
        const manager = new ConcurrencyManager(config)
        expect(manager.getConcurrencyLimit("anthropic/claude-opus-4-5")).toBe(2)
      })

      test("should return Infinity when model limit is 0", () => {
        const config = createConfig({
          modelConcurrency: {
            "anthropic/claude-opus-4-5": 0,
          },
        })
        const manager = new ConcurrencyManager(config)
        expect(manager.getConcurrencyLimit("anthropic/claude-opus-4-5")).toBe(Infinity)
      })

      test("should prioritize model limit over provider limit", () => {
        const config = createConfig({
          modelConcurrency: {
            "anthropic/claude-opus-4-5": 3,
          },
          providerConcurrency: {
            anthropic: 10,
          },
        })
        const manager = new ConcurrencyManager(config)
        expect(manager.getConcurrencyLimit("anthropic/claude-opus-4-5")).toBe(3)
      })
    })

    describe("provider-specific limits", () => {
      test("should return provider-specific limit when configured", () => {
        const config = createConfig({
          providerConcurrency: {
            anthropic: 8,
          },
        })
        const manager = new ConcurrencyManager(config)
        expect(manager.getConcurrencyLimit("anthropic/claude-sonnet-4")).toBe(8)
      })

      test("should return Infinity when provider limit is 0", () => {
        const config = createConfig({
          providerConcurrency: {
            openai: 0,
          },
        })
        const manager = new ConcurrencyManager(config)
        expect(manager.getConcurrencyLimit("openai/gpt-5.2")).toBe(Infinity)
      })

      test("should extract provider from model string correctly", () => {
        const config = createConfig({
          providerConcurrency: {
            google: 4,
          },
        })
        const manager = new ConcurrencyManager(config)
        expect(manager.getConcurrencyLimit("google/gemini-3-pro-preview")).toBe(4)
      })

      test("should fall back to default when provider not configured", () => {
        const config = createConfig({
          defaultConcurrency: 7,
          providerConcurrency: {
            anthropic: 3,
          },
        })
        const manager = new ConcurrencyManager(config)
        expect(manager.getConcurrencyLimit("openai/gpt-5.2")).toBe(7)
      })
    })

    describe("priority order", () => {
      test("should check model -> provider -> default in order", () => {
        const config = createConfig({
          defaultConcurrency: 5,
          providerConcurrency: {
            anthropic: 10,
          },
          modelConcurrency: {
            "anthropic/claude-opus-4-5": 2,
          },
        })
        const manager = new ConcurrencyManager(config)

        // Model-specific should win
        expect(manager.getConcurrencyLimit("anthropic/claude-opus-4-5")).toBe(2)
        // Provider should be used for other models
        expect(manager.getConcurrencyLimit("anthropic/claude-sonnet-4")).toBe(10)
        // Default for unconfigured providers
        expect(manager.getConcurrencyLimit("openai/gpt-5.2")).toBe(5)
      })
    })
  })

  // --------------------------------------------------------
  // ACQUIRE TESTS
  // --------------------------------------------------------

  describe("acquire", () => {
    test("should resolve immediately when under limit", async () => {
      const config = createConfig({ defaultConcurrency: 3 })
      const manager = new ConcurrencyManager(config)

      const start = Date.now()
      await manager.acquire("anthropic/claude-sonnet-4")
      const elapsed = Date.now() - start

      expect(elapsed).toBeLessThan(50) // Should be nearly instant
    })

    test("should resolve immediately when limit is Infinity", async () => {
      const config = createConfig({ defaultConcurrency: 0 })
      const manager = new ConcurrencyManager(config)

      const start = Date.now()
      await manager.acquire("anthropic/claude-sonnet-4")
      await manager.acquire("anthropic/claude-sonnet-4")
      await manager.acquire("anthropic/claude-sonnet-4")
      const elapsed = Date.now() - start

      expect(elapsed).toBeLessThan(50)
    })

    test("should increment count when acquiring", async () => {
      const config = createConfig({ defaultConcurrency: 3 })
      const manager = new ConcurrencyManager(config)

      await manager.acquire("anthropic/claude-sonnet-4")
      await manager.acquire("anthropic/claude-sonnet-4")

      // Third acquire should still work (under limit)
      const start = Date.now()
      await manager.acquire("anthropic/claude-sonnet-4")
      const elapsed = Date.now() - start

      expect(elapsed).toBeLessThan(50)
    })

    test("should queue when at limit", async () => {
      const config = createConfig({ defaultConcurrency: 2 })
      const manager = new ConcurrencyManager(config)

      // Fill up the limit
      await manager.acquire("anthropic/claude-sonnet-4")
      await manager.acquire("anthropic/claude-sonnet-4")

      // Third should queue
      let resolved = false
      const acquirePromise = manager.acquire("anthropic/claude-sonnet-4").then(() => {
        resolved = true
      })

      // Give it a moment to potentially resolve (it shouldn't)
      await new Promise((r) => setTimeout(r, 10))
      expect(resolved).toBe(false)

      // Release one and the queued should resolve
      manager.release("anthropic/claude-sonnet-4")
      await acquirePromise
      expect(resolved).toBe(true)
    })

    test("should track counts per model independently", async () => {
      const config = createConfig({ defaultConcurrency: 1 })
      const manager = new ConcurrencyManager(config)

      // Acquire for one model
      await manager.acquire("anthropic/claude-sonnet-4")

      // Should still be able to acquire for different model
      const start = Date.now()
      await manager.acquire("openai/gpt-5.2")
      const elapsed = Date.now() - start

      expect(elapsed).toBeLessThan(50)
    })
  })

  // --------------------------------------------------------
  // RELEASE TESTS
  // --------------------------------------------------------

  describe("release", () => {
    test("should decrement count when releasing", async () => {
      const config = createConfig({ defaultConcurrency: 1 })
      const manager = new ConcurrencyManager(config)

      await manager.acquire("anthropic/claude-sonnet-4")
      manager.release("anthropic/claude-sonnet-4")

      // Should be able to acquire again
      const start = Date.now()
      await manager.acquire("anthropic/claude-sonnet-4")
      const elapsed = Date.now() - start

      expect(elapsed).toBeLessThan(50)
    })

    test("should not decrement below zero", async () => {
      const config = createConfig({ defaultConcurrency: 2 })
      const manager = new ConcurrencyManager(config)

      // Release without acquiring
      manager.release("anthropic/claude-sonnet-4")
      manager.release("anthropic/claude-sonnet-4")

      // Should still work normally
      await manager.acquire("anthropic/claude-sonnet-4")
      await manager.acquire("anthropic/claude-sonnet-4")

      // Third should queue (limit is 2)
      let resolved = false
      const acquirePromise = manager.acquire("anthropic/claude-sonnet-4").then(() => {
        resolved = true
      })

      await new Promise((r) => setTimeout(r, 10))
      expect(resolved).toBe(false)

      manager.release("anthropic/claude-sonnet-4")
      await acquirePromise
    })

    test("should resolve queued acquires in FIFO order", async () => {
      const config = createConfig({ defaultConcurrency: 1 })
      const manager = new ConcurrencyManager(config)

      await manager.acquire("anthropic/claude-sonnet-4")

      const order: number[] = []

      const promise1 = manager.acquire("anthropic/claude-sonnet-4").then(() => {
        order.push(1)
      })
      const promise2 = manager.acquire("anthropic/claude-sonnet-4").then(() => {
        order.push(2)
      })
      const promise3 = manager.acquire("anthropic/claude-sonnet-4").then(() => {
        order.push(3)
      })

      // Release three times
      manager.release("anthropic/claude-sonnet-4")
      await promise1
      manager.release("anthropic/claude-sonnet-4")
      await promise2
      manager.release("anthropic/claude-sonnet-4")
      await promise3

      expect(order).toEqual([1, 2, 3])
    })

    test("should do nothing when limit is Infinity", async () => {
      const config = createConfig({ defaultConcurrency: 0 })
      const manager = new ConcurrencyManager(config)

      // These should all be no-ops
      manager.release("anthropic/claude-sonnet-4")
      manager.release("anthropic/claude-sonnet-4")

      // Should still work
      await manager.acquire("anthropic/claude-sonnet-4")
    })

    test("should handle release for model with queued requests", async () => {
      const config = createConfig({ defaultConcurrency: 1 })
      const manager = new ConcurrencyManager(config)

      await manager.acquire("anthropic/claude-sonnet-4")

      let resolved = false
      const acquirePromise = manager.acquire("anthropic/claude-sonnet-4").then(() => {
        resolved = true
      })

      // Release should trigger the queued request
      manager.release("anthropic/claude-sonnet-4")
      await acquirePromise

      expect(resolved).toBe(true)
    })
  })

  // --------------------------------------------------------
  // EDGE CASES
  // --------------------------------------------------------

  describe("edge cases", () => {
    test("should handle undefined config gracefully", () => {
      const manager = new ConcurrencyManager(undefined)
      expect(manager.getConcurrencyLimit("any/model")).toBe(5)
    })

    test("should handle empty config gracefully", () => {
      const manager = new ConcurrencyManager({})
      expect(manager.getConcurrencyLimit("any/model")).toBe(5)
    })

    test("should handle model string without provider", () => {
      const config = createConfig({
        providerConcurrency: {
          "standalone-model": 3,
        },
      })
      const manager = new ConcurrencyManager(config)
      expect(manager.getConcurrencyLimit("standalone-model")).toBe(3)
    })

    test("should handle concurrent acquire/release operations", async () => {
      const config = createConfig({ defaultConcurrency: 2 })
      const manager = new ConcurrencyManager(config)

      const operations: Promise<void>[] = []

      // Simulate concurrent operations
      for (let i = 0; i < 10; i++) {
        operations.push(
          manager.acquire("anthropic/claude-sonnet-4").then(() => {
            // Simulate some work
            return new Promise<void>((resolve) => {
              setTimeout(() => {
                manager.release("anthropic/claude-sonnet-4")
                resolve()
              }, 5)
            })
          })
        )
      }

      // All operations should complete
      await Promise.all(operations)
    })
  })
})
