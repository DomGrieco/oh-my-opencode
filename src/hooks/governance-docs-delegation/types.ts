import type { PolicyMode } from "../../shared/delegation-policy"

export interface DocsDelegationConfig {
  enabled: boolean
  mode: PolicyMode
}

export const DEFAULT_DOCS_DELEGATION_CONFIG: DocsDelegationConfig = {
  enabled: true,
  mode: "block",
}

export type DocsCategory = "documentation" | "changelog" | "memory"

export interface PathCategorization {
  category: DocsCategory
  agent: string
  rationale: string
}

interface BaseCategoryConfig {
  agent: string
  rationale: string
}

interface PathBasedCategory extends BaseCategoryConfig {
  paths: string[]
}

interface KeywordBasedCategory extends BaseCategoryConfig {
  keywords: string[]
}

export interface DocsCategoryPatterns {
  documentation: PathBasedCategory
  changelog: KeywordBasedCategory
  memory: PathBasedCategory
}

export const GOVERNANCE_PATTERNS: DocsCategoryPatterns = {
  documentation: {
    paths: ["docs/", "README.md", "README.*.md"],
    agent: "document-writer",
    rationale: "User-facing documentation requires clear writing and examples",
  },
  changelog: {
    keywords: ["changelog"],
    agent: "historian",
    rationale: "Changelog entries require impact analysis and semantic versioning",
  },
  memory: {
    paths: [".cursor/memory/", "context/memory/"],
    agent: "context-steward",
    rationale: "Project memory requires technical precision and ADR format",
  },
}

export const DOCS_PATH_PATTERNS: string[] = [
  "docs/",
  "README.md",
  "README.*.md",
  ".cursor/memory/",
  "context/memory/",
]

export const CHANGELOG_KEYWORDS: string[] = ["changelog"]

export const DOCS_FILE_EXTENSIONS: string[] = [".md", ".mdx"]

export const ALLOWED_AGENTS: string[] = [
  "document-writer",
  "docs-publisher",
  "historian",
  "context-steward",
]

export const EXCEPTED_PATHS: string[] = [".cursor/specs/", "context/specs/"]
