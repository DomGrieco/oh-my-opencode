# AGENT ARCHITECTURE

**Generated:** 2026-01-07T22:44:30-04:00
**Commit:** d864af6
**Branch:** hello/lif-111-sync-fork-with-upstream-code-yeongyuoh-my-opencode-397

---

## OVERVIEW
31 hierarchical agents (team-lead → manager → specialist → advisor → utility) orchestrating cross-model expertise.

## WHERE TO LOOK
- **Registry**: `index.ts` (builtinAgents, AGENT_ROLE_REGISTRY)
- **Roles**: `types.ts` (AgentRole, GovernanceLevel, ExtendedAgentConfig)
- **Restriction Logic**: `shared/` (createAgentToolRestrictions)
- **Orchestrators**: `omo.ts`, `sisyphus.ts` (Team leads)
- **Managers**: `implementation-specialist.ts`
- **Specialists**: Kebab-case files (e.g., `frontend-react.ts`, `backend-rust.ts`)
- **Utilities**: `explore.ts`, `librarian.ts`, `multimodal-looker.ts`

## PATTERNS
- **Hierarchy Enforcement**: team-lead → manager → specialist (cannot delegate)
- **Subagent Mode**: Terminal specialists use `mode: "subagent"` for focused execution
- **Consistency**: Temperature `0.1` default for deterministic reasoning
- **Tool Shielding**: Use `createAgentToolRestrictions` to block `task`, `background_task`, `call_omo_agent` in subagents
- **Governance Injection**: Auto-injected rules based on `governanceLevel` (full/minimal/none)
- **Model Affinity**: 
  - `anthropic/claude-opus-4-5`: Logical orchestrators (OmO, Sisyphus)
  - `anthropic/claude-sonnet-4-5`: Knowledge/multi-repo analysis (librarian)
  - `google/gemini-3-pro-preview`: UI/Creative/Docs (frontend-ui-ux, document-writer)
  - `opencode/grok-code`: Fast traversal (explore)
  - `openai/gpt-5.2`: Logical advisor (oracle)
- **Response Format**: Specialists return structured JSON (status, summary, files, nextSteps)

## HOW TO ADD

1. Create `src/agents/my-agent.ts`:
   ```typescript
   export const myAgent: AgentConfig = {
     description: "Brief capability summary",
     mode: "subagent",
     model: "provider/model-name",
     temperature: 0.1,
     tools: createAgentToolRestrictions({ exclude: ["task", "background_task"] }),
     prompt: "...",
   }
   ```
2. Add to `builtinAgents` in `index.ts`
3. Add to `AGENT_ROLE_REGISTRY` with role type
4. Update `types.ts` if new config options needed

## ANTI-PATTERNS
- **Manual Prompting**: Don't add path/linear/changelog rules; hook injects them via `governanceLevel`
- **Circular Delegation**: Never allow specialists to call `task` or `call_omo_agent`
- **Model Hardcoding**: Avoid string literals; use `DEFAULT_MODEL` constants with override support
- **Directory Bloat**: Keep utility functions in `utils.ts`, not in agent configs
- **Loose Types**: Always use `AgentConfig` or `ExtendedAgentConfig` interfaces
