---
title: "Sync Fork Tool"
description: "Comprehensive guide for using the sync-fork tool to analyze and sync upstream changes."
---

# Sync Fork Tool

The `sync_fork` tool is an AI-driven utility designed to help maintain forks by intelligently analyzing upstream changes, determining their value, and providing actionable synchronization paths. Unlike a standard `git merge`, it prioritizes changes based on their impact on security, stability, and feature sets.

## Overview

Maintaining a fork can be challenging when the upstream repository moves quickly. The `sync_fork` tool addresses this by:
1.  **Discovering** new commits from the upstream repository.
2.  **Analyzing** each commit for value, risk, and conflict likelihood.
3.  **Categorizing** commits into prioritized groups.
4.  **Recommending** actions, including cherry-pick commands and Linear issue data.

## Workflow

The tool follows a structured four-phase workflow:

1.  **Discovery**: Fetches the latest changes from the upstream remote and identifies commits that are present in upstream but missing from your fork.
2.  **Analysis**: Evaluates each new commit based on its type (feat, fix, perf, etc.), affected files, and commit message content. It looks for security-related keywords and breaking changes.
3.  **Recommendations**: Groups related commits and assigns priority levels (P0-P3). It generates reasoning for each recommendation and assesses the risk of merge conflicts.
4.  **Next Steps**: Provides the necessary data (bash commands, Linear issue fields) for an agent or developer to execute the sync.

## Usage

Run the tool using the `sync_fork` command within your OpenCode session:

```bash
sync_fork [options]
```

### Basic Example

To see all new upstream changes and get recommendations:

```bash
sync_fork
```

### Arguments Reference

| Argument | Type | Description |
| :--- | :--- | :--- |
| `filter` | `string` | Filter commits by type: `all`, `fix`, `perf`, `security`, `feat`. Supports comma-separated values (e.g., `fix,security`). Default is `all`. |
| `since` | `string` | Only analyze commits since a specific date (ISO-8601 format, e.g., `2024-01-01`). |
| `limit` | `number` | Maximum number of commits to analyze. Default is `50`, maximum is `200`. |
| `output` | `string` | Output format: `markdown` (default) or `json`. |
| `scaffold` | `boolean` | If true, generates ready-to-run bash scripts with cherry-pick commands. |
| `resetState` | `boolean` | Clears the local state file and starts the analysis from scratch. |
| `dryRun` | `boolean` | Performs the analysis and generates a report but does not update the local state file. |

## Priority Levels

The tool categorizes recommendations into four priority levels:

-   **P0 (Critical)**: Security fixes, critical stability improvements, or fixes for core infrastructure. These should be synced immediately.
-   **P1 (High)**: Major new features, important bug fixes, or performance optimizations for critical paths.
-   **P2 (Medium)**: Incremental improvements, minor bug fixes, or enhancements to non-critical features.
-   **P3 (Low)**: Documentation updates, style changes, test improvements, or chore tasks.

## State Management

The tool maintains a local state file to track which commits have already been reviewed. This ensures you do not re-analyze the same changes in subsequent runs.

-   **State File Location**: `.opencode/state/sync-fork.json`
-   **Purpose**: Tracks reviewed commits, their assigned priorities, and synchronization status.

Use the `resetState: true` argument if you need to clear this history and re-evaluate all upstream changes.

## Linear Integration

When running the tool, it generates `linearIssuesData` for all P0 and P1 recommendations. This data can be directly consumed by the `linear_create_issue` tool to automate the creation of tracking issues for your sync workflow.

## Examples

### Sync Security Fixes Only
Analyze only security-related commits and generate a scaffolded sync script:

```bash
sync_fork --filter security --scaffold
```

### Deep Analysis of Recent Changes
Analyze the last 100 commits since a specific date, outputting the result in JSON for programmatic processing:

```bash
sync_fork --limit 100 --since 2024-12-01 --output json
```

### Dry Run Exploration
Explore what would be recommended without affecting the tracking state:

```bash
sync_fork --dryRun
```

## Output Formats

### Markdown Report (Default)
The markdown report provides a human-readable summary, including:
-   **Context**: Upstream remote and branch information.
-   **Summary**: Statistics on new commits by priority and type.
-   **Recommendations**: Detailed breakdown of each group of commits with priority, reasoning, and risk assessment.
-   **Next Steps**: Suggested actions for the developer or agent.

### JSON Output
The JSON output includes the full `SyncRecommendation` objects, which contain:
-   `suggestedIssueTitle` and `suggestedIssueDescription` for Linear.
-   `cherryPickCommand` for execution.
-   Full commit metadata and risk assessments.
-   `linearIssuesData` array for automated issue creation.

## Troubleshooting

-   **Upstream Remote Not Found**: Ensure you have a remote named `upstream` pointing to the original repository. Add it with `git remote add upstream <url>`.
-   **Diverged Branches**: If your fork has significant divergent changes, the conflict likelihood will be higher. Review the `riskSummary` in the report before attempting to sync.
-   **State File Corruption**: If the tool behaves unexpectedly, run with `resetState: true` to recreate the state file.
-   **Limit Exceeded**: The tool enforces a maximum limit of 200 commits per run to maintain analysis quality.
