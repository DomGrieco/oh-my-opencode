import type { PluginInput } from "@opencode-ai/plugin"
import { log } from "../../shared"
import { getAgentForSession } from "../../features/claude-code-session-state/agent-registry"
import {
  type DocsDelegationConfig,
  type PathCategorization,
  DEFAULT_DOCS_DELEGATION_CONFIG,
  GOVERNANCE_PATTERNS,
  CHANGELOG_KEYWORDS,
  ALLOWED_AGENTS,
  EXCEPTED_PATHS,
} from "./types"

export * from "./types"

function getRelativePath(filePath: string, projectRoot: string): string {
  let relativePath = filePath
  if (filePath.startsWith(projectRoot)) {
    relativePath = filePath.slice(projectRoot.length)
    if (relativePath.startsWith("/")) {
      relativePath = relativePath.slice(1)
    }
  }
  return relativePath
}

function matchesKeyword(relativePath: string, keywords: string[]): boolean {
  const lowerPath = relativePath.toLowerCase()
  return keywords.some((keyword) => lowerPath.includes(keyword.toLowerCase()))
}

function matchesPathPattern(relativePath: string, pattern: string): boolean {
  if (pattern.endsWith("/") && relativePath.startsWith(pattern)) {
    return true
  }
  if (pattern.includes("*")) {
    const parts = pattern.split("*")
    if (parts.length === 2) {
      const [prefix, suffix] = parts
      if (relativePath.startsWith(prefix) && relativePath.endsWith(suffix)) {
        return true
      }
    }
  }
  if (relativePath === pattern) {
    return true
  }
  if (relativePath.endsWith(".md") || relativePath.endsWith(".mdx")) {
    const filename = relativePath.split("/").pop() ?? ""
    if (filename === pattern) {
      return true
    }
  }
  return false
}

export function categorizeDocsPath(
  filePath: string,
  projectRoot: string
): PathCategorization | null {
  const relativePath = getRelativePath(filePath, projectRoot)

  if (matchesKeyword(relativePath, CHANGELOG_KEYWORDS)) {
    return {
      category: "changelog",
      agent: GOVERNANCE_PATTERNS.changelog.agent,
      rationale: GOVERNANCE_PATTERNS.changelog.rationale,
    }
  }

  for (const pattern of GOVERNANCE_PATTERNS.memory.paths) {
    if (matchesPathPattern(relativePath, pattern)) {
      return {
        category: "memory",
        agent: GOVERNANCE_PATTERNS.memory.agent,
        rationale: GOVERNANCE_PATTERNS.memory.rationale,
      }
    }
  }

  for (const pattern of GOVERNANCE_PATTERNS.documentation.paths) {
    if (matchesPathPattern(relativePath, pattern)) {
      return {
        category: "documentation",
        agent: GOVERNANCE_PATTERNS.documentation.agent,
        rationale: GOVERNANCE_PATTERNS.documentation.rationale,
      }
    }
  }

  return null
}

function isExceptedPath(filePath: string, projectRoot: string): boolean {
  const relativePath = getRelativePath(filePath, projectRoot)

  for (const exceptedPath of EXCEPTED_PATHS) {
    if (relativePath.startsWith(exceptedPath)) {
      return true
    }
  }

  return false
}

function isAllowedAgent(sessionId: string): boolean {
  const currentAgent = getAgentForSession(sessionId)
  if (!currentAgent || currentAgent === "main") return false
  return ALLOWED_AGENTS.includes(currentAgent)
}

export function createGovernanceDocsDelegationHook(
  ctx: PluginInput,
  config?: Partial<DocsDelegationConfig>
) {
  const finalConfig: DocsDelegationConfig = {
    ...DEFAULT_DOCS_DELEGATION_CONFIG,
    ...config,
  }

  if (!finalConfig.enabled || finalConfig.mode === "disabled") {
    log("Governance docs delegation hook disabled")
    return null
  }

  log("Governance docs delegation hook initialized", { mode: finalConfig.mode })

  return {
    "tool.execute.before": async (
      input: {
        tool: string
        sessionID: string
        callID: string
      },
      output: {
        args: Record<string, unknown>
      }
    ): Promise<void> => {
      if (!["write", "edit"].includes(input.tool)) {
        return
      }

      const filePath = (output.args.filePath || output.args.path) as string | undefined
      if (!filePath) {
        return
      }

      const categorization = categorizeDocsPath(filePath, ctx.directory)
      if (!categorization) {
        return
      }

      if (isExceptedPath(filePath, ctx.directory)) {
        return
      }

      if (isAllowedAgent(input.sessionID)) {
        return
      }

      const { category, agent, rationale } = categorization

      const categoryLabel =
        category === "changelog"
          ? "Changelog updates"
          : category === "memory"
            ? "Memory file changes"
            : "Documentation changes"

      const message = [
        `⚠️ [Governance] ${categoryLabel} ${finalConfig.mode === "block" ? "BLOCKED" : "WARNING"}`,
        `Tool: ${input.tool}`,
        `Path: ${filePath}`,
        `${categoryLabel} must be delegated to ${agent}.`,
        `Rationale: ${rationale}`,
        `Use: call_omo_agent(subagent_type="${agent}", run_in_background=true, prompt="...")`,
      ].join("\n")

      log(message)

      if (finalConfig.mode === "block") {
        throw new Error(
          `[Governance] Operation blocked: ${categoryLabel} must be delegated to ${agent}.\n` +
            `Path: ${filePath}\n` +
            `Rationale: ${rationale}\n` +
            `Remediation: call_omo_agent(subagent_type="${agent}", run_in_background=true, prompt="Write/update ${filePath}")\n` +
            `Note: Use run_in_background=false only if you need immediate verification.`
        )
      }
    },
  }
}
