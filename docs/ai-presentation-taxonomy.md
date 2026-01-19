# AI Presentation Patterns: Industry Taxonomy

**Version:** 1.0  
**Date:** December 30, 2025  
**Scope:** Common AI assistants and agents in consumer and developer markets

---

## Executive Summary

This taxonomy categorizes AI presentation patterns across three primary dimensions:
1. **Framing** - How the AI presents its identity and capabilities
2. **Interaction Style** - Communication patterns and behavioral norms
3. **Target Mental Model** - What conceptual framework users are meant to adopt

Analysis covers: Siri, Alexa, Google Assistant, Claude, ChatGPT, GitHub Copilot, Cursor, Anthropic Claude Code, OpenCode agents, and specialized domain agents.

---

## Dimension 1: Framing (Identity & Capabilities)

### 1.1 Assistant Framing
**Core Metaphor:** Personal helper who responds to requests

**Examples:**
- **Siri** (Apple)
  - Identity: "Your personal assistant"
  - Capability framing: Task executor (timers, reminders, searches)
  - Personality: Witty, conversational, consumer-friendly
  
- **Alexa** (Amazon)
  - Identity: Ambient household helper
  - Capability framing: Skills-based (extensible via third-party)
  - Personality: Neutral, accommodating, retail-oriented

- **Google Assistant**
  - Identity: Knowledge companion
  - Capability framing: Search-first, information retrieval expert
  - Personality: Informative, minimal personality injection

**Characteristics:**
- Request-response pattern
- Limited autonomy (waits for commands)
- Consumer-facing language
- Emphasis on convenience

---

### 1.2 Conversational Partner Framing
**Core Metaphor:** Collaborative thinking partner

**Examples:**
- **Claude** (Anthropic)
  - Identity: "I'm Claude, an AI assistant created by Anthropic"
  - Capability framing: Thoughtful collaborator, analysis partner
  - Personality: Measured, ethical, detail-oriented
  - Distinguishing trait: Explicit about limitations and uncertainty

- **ChatGPT** (OpenAI)
  - Identity: "I'm ChatGPT, a large language model by OpenAI"
  - Capability framing: Conversational generalist
  - Personality: Helpful, creative, adaptable tone
  - Distinguishing trait: Versatile across domains

**Characteristics:**
- Extended dialogue capability
- Back-and-forth refinement
- Acknowledgment of uncertainty
- More "peer-like" than assistant framing

---

### 1.3 Specialist Agent Framing
**Core Metaphor:** Domain expert with specific expertise

**Examples:**
- **GitHub Copilot**
  - Identity: AI pair programmer
  - Capability framing: Code completion and generation
  - Personality: Silent, unobtrusive (inline suggestions)
  - Interaction: Context-aware, predictive

- **Cursor AI**
  - Identity: AI-powered code editor intelligence
  - Capability framing: Codebase understanding + editing
  - Personality: Developer-focused, technical
  - Interaction: Chat + inline + command palette

- **Anthropic Claude Code**
  - Identity: "Claude Code, Anthropic's official CLI for Claude"
  - Capability framing: Technical execution agent (file ops, bash, git)
  - Personality: Precise, verification-driven, engineering-focused
  - Interaction: Multi-tool orchestration

**Characteristics:**
- Narrow domain expertise
- Higher autonomy within domain
- Technical/professional language
- Workflow integration focus

---

### 1.4 Role-Based Ensemble Framing
**Core Metaphor:** Team of specialists with distinct roles

**Examples:**
- **OpenCode Agent System** (oh-my-opencode)
  - `OmO`: Orchestrator, team leader
  - `oracle`: Strategic advisor (GPT-5.2)
  - `librarian`: Multi-repo research (big-pickle)
  - `explore`: Fast codebase exploration (grok)
  - `frontend-ui-ux-engineer`: UI generation (Gemini)
  - `document-writer`: Technical writing (Gemini)
  
**Characteristics:**
- Multiple personas with specialized roles
- Explicit delegation patterns
- Meta-orchestration layer
- Model-specific capability matching

---

## Dimension 2: Interaction Style

### 2.1 Command-Driven
**Pattern:** User issues discrete commands, AI executes

| AI | Command Style | Response Pattern |
|----|---------------|------------------|
| Siri | Voice commands ("Set timer for 5 minutes") | Confirmation + action |
| Alexa | Wake word + utterance | Skill routing |
| GitHub Copilot | Tab-completion | Silent suggestion |

**Characteristics:**
- Low conversational depth
- High predictability
- Fast task completion
- Minimal context retention

---

### 2.2 Conversational Iterative
**Pattern:** Multi-turn dialogue with refinement

| AI | Conversation Depth | Context Window | Refinement Style |
|----|-------------------|----------------|------------------|
| ChatGPT | Deep (30+ turns) | Large (128k tokens) | "Can you make it more concise?" |
| Claude | Deep (30+ turns) | Very large (200k tokens) | "Actually, let me clarify..." |
| Google Assistant | Shallow (3-5 turns) | Limited | Follow-up questions |

**Characteristics:**
- High context retention
- Iterative improvement
- Clarification loops
- Nuanced understanding

---

### 2.3 Proactive Suggestion
**Pattern:** AI anticipates needs and offers options

| AI | Proactivity Level | Suggestion Timing | User Control |
|----|------------------|-------------------|--------------|
| GitHub Copilot | High | Keystroke-triggered | Accept/reject/ignore |
| Cursor AI | Medium | Context-aware | Tab to accept |
| Google Assistant | Low | Scheduled/location | Notification-based |

**Characteristics:**
- Predictive behavior
- Reduced cognitive load
- Risk of over-intrusion
- Requires trust in AI judgment

---

### 2.4 Tool-Orchestrated Execution
**Pattern:** AI uses multiple tools to complete complex tasks

| AI | Tool Count | Autonomy | Verification |
|----|-----------|----------|--------------|
| Claude Code | 40+ tools | High (file ops, bash, git) | Mandatory for code |
| OpenCode agents | 11 LSP + AST + MCP | High (multi-agent) | Context-dependent |
| ChatGPT (with plugins) | Variable | Medium (user approval) | Optional |

**Characteristics:**
- Multi-step workflows
- Environment interaction
- Higher failure modes
- Requires safety rails

---

## Dimension 3: Target Mental Model

### 3.1 Appliance Model
**User thinks:** "This is a smart device that does specific things"

**Examples:**
- Siri, Alexa, Google Assistant
- Smart home devices
- Voice-activated car systems

**User Expectations:**
- Reliability over flexibility
- Clear capabilities ("Can it do X?")
- Binary success/failure
- No learning curve

**Design Implications:**
- Limit scope aggressively
- Predictable responses
- Clear error messages
- Discoverability features (e.g., "What can you do?")

---

### 3.2 Copilot Model
**User thinks:** "This is a smart collaborator who helps me do my job better"

**Examples:**
- GitHub Copilot
- Cursor AI
- Microsoft Copilot (Office)

**User Expectations:**
- Augments existing workflow
- User retains control and responsibility
- Suggestions, not commands
- Learning curve acceptable

**Design Implications:**
- Inline, non-blocking UI
- Easy accept/reject
- Transparency in suggestions
- Adaptation to user style

---

### 3.3 Agent Model
**User thinks:** "This is an autonomous entity that can complete tasks independently"

**Examples:**
- Claude Code (file operations, git, bash)
- AutoGPT / BabyAGI (research agents)
- OpenCode background agents

**User Expectations:**
- Goal-oriented behavior
- Multi-step autonomy
- Progress reporting
- Delegation of work

**Design Implications:**
- Goal specification interfaces
- Progress visibility
- Interrupt/cancel mechanisms
- Safety guardrails (especially for destructive actions)

---

### 3.4 Consultant Model
**User thinks:** "This is an expert advisor who provides insights and recommendations"

**Examples:**
- Claude (analysis, strategy)
- ChatGPT (research, brainstorming)
- `oracle` agent (architecture decisions)

**User Expectations:**
- Explanation-rich responses
- Multiple perspectives
- Reasoning transparency
- Advisory, not prescriptive

**Design Implications:**
- Show reasoning process
- Acknowledge uncertainty
- Offer alternatives
- Educational tone

---

### 3.5 Ensemble/Team Model
**User thinks:** "This is a team of specialists I can delegate to"

**Examples:**
- OpenCode multi-agent system
- Microsoft AutoGen framework
- LangChain agent orchestration

**User Expectations:**
- Right specialist for each task
- Coordination between agents
- Meta-level control
- Clear role boundaries

**Design Implications:**
- Role transparency (who's doing what)
- Orchestration visibility
- Unified vs. fragmented UX trade-offs
- Handoff clarity

---

## Cross-Cutting Patterns

### Personality Spectrum

| Dimension | Low End | High End |
|-----------|---------|----------|
| **Warmth** | Technical/neutral (Copilot) | Friendly/conversational (Alexa) |
| **Proactivity** | Reactive (Siri) | Anticipatory (Cursor) |
| **Verbosity** | Terse (Copilot) | Explanatory (Claude) |
| **Confidence** | Uncertain/hedging (Claude) | Assertive (Siri) |
| **Formality** | Casual (ChatGPT) | Professional (Claude Code) |

---

### Trust-Building Mechanisms

| AI | Primary Trust Mechanism | Example |
|----|------------------------|---------|
| Claude | Transparency about limitations | "I may have made a mistake..." |
| GitHub Copilot | User retains final control | Tab to accept, ignore to reject |
| Claude Code | Verification-driven workflow | "ALWAYS verify code examples" |
| Siri | Familiar brand + Apple ecosystem | Privacy-first messaging |

---

### Error Handling Philosophies

**Silent Failure:**
- GitHub Copilot: Bad suggestions simply ignored
- Risk: User may not notice errors

**Explicit Acknowledgment:**
- Claude: "I don't have access to real-time information"
- ChatGPT: "I apologize for the confusion"
- Risk: Over-apologizing erodes confidence

**Verification Requirement:**
- Claude Code: Mandatory testing of code examples
- OpenCode: Multi-step validation
- Risk: Workflow friction

**Graceful Degradation:**
- Google Assistant: Falls back to web search
- Alexa: "I don't know that, but I found this..."
- Risk: Inconsistent capability perception

---

## Industry Trends (2024-2025)

### Shift Toward Agentic Behavior
- **From:** Request-response (ChatGPT 2022)
- **To:** Multi-step autonomous execution (Claude Code, OpenCode)
- **Implication:** Higher stakes, more safety requirements

### Specialization vs. Generalization
- **Generalists:** ChatGPT, Claude (broad capabilities)
- **Specialists:** Copilot (code), Perplexity (search), Cursor (IDE)
- **Trend:** Hybrid models (general LLM + specialized tools)

### Multi-Agent Orchestration
- **Emerging pattern:** OmO delegates to oracle, librarian, explore
- **Advantage:** Model-specific strengths (GPT-5.2 strategy, Grok speed)
- **Challenge:** Coordination complexity, cost management

### Transparency as Differentiation
- **Claude's approach:** Explicit uncertainty, reasoning steps
- **Impact:** Higher user trust in critical domains
- **Trade-off:** Slower, wordier responses

---

## Design Implications Summary

### For Consumer AI (Siri, Alexa)
1. **Framing:** Assistant/appliance
2. **Interaction:** Command-driven, predictable
3. **Mental model:** Appliance (clear capabilities)
4. **Key metric:** Task completion rate

### For Developer Tools (Copilot, Cursor)
1. **Framing:** Specialist agent
2. **Interaction:** Proactive suggestion + tool execution
3. **Mental model:** Copilot (augmentation, not replacement)
4. **Key metric:** Acceptance rate, time saved

### For General AI (ChatGPT, Claude)
1. **Framing:** Conversational partner
2. **Interaction:** Iterative dialogue
3. **Mental model:** Consultant (advisor, not oracle)
4. **Key metric:** Conversation depth, user satisfaction

### For Agentic Systems (Claude Code, OpenCode)
1. **Framing:** Role-based ensemble
2. **Interaction:** Tool-orchestrated execution
3. **Mental model:** Agent/team (autonomous task completion)
4. **Key metric:** Goal achievement, safety adherence

---

## Antipatterns Observed

### Mismatched Framing & Capability
- **Example:** Chatbot framed as "expert" but gives generic advice
- **Impact:** Trust erosion

### Overconfident Uncertainty
- **Example:** Siri answering with web results for ambiguous questions
- **Better approach:** "I'm not sure, here's what I found"

### Hidden Autonomy
- **Example:** Agent making changes without clear user intent
- **Risk:** Destructive actions, loss of control

### Personality Inconsistency
- **Example:** Formal tone in help docs, casual in chat
- **Impact:** Fragmented user experience

### Capability Creep Without Safety
- **Example:** Adding file deletion without confirmation
- **Necessary:** Graduated autonomy with safety rails

---

## Future Directions

### Emerging Patterns
1. **Contextual Shape-Shifting:** AI adapts framing based on task (assistant for simple, agent for complex)
2. **Transparent Delegation:** User sees which sub-agent is working (e.g., "Asking oracle for architectural advice...")
3. **Confidence Calibration:** Explicit uncertainty scores ("I'm 70% confident this is correct")
4. **Progressive Autonomy:** User grants permissions incrementally (sandbox → write files → git operations)

### Open Questions
- **Optimal personality for technical domains?** (Claude Code's formality vs. GitHub Copilot's silence)
- **How much transparency is too much?** (Showing all tool calls vs. abstraction)
- **Multi-agent UX:** Single conversational interface vs. visible team?
- **Error attribution:** In a multi-agent system, who is responsible for failures?

---

## References

### Analyzed Systems
- **Apple Siri** (2011-present)
- **Amazon Alexa** (2014-present)
- **Google Assistant** (2016-present)
- **OpenAI ChatGPT** (2022-present)
- **Anthropic Claude** (2023-present)
- **GitHub Copilot** (2021-present)
- **Cursor AI** (2023-present)
- **Anthropic Claude Code** (2024-present)
- **OpenCode / oh-my-opencode** (2024-present)

### Frameworks Referenced
- LangChain agent patterns
- Microsoft AutoGen
- AutoGPT / BabyAGI architectures

---

## Appendix: Pattern Decision Matrix

Use this matrix to choose appropriate patterns for new AI products:

| Your AI is... | Recommended Framing | Interaction Style | Mental Model |
|--------------|---------------------|-------------------|--------------|
| Consumer voice assistant | Assistant | Command-driven | Appliance |
| Code completion tool | Specialist agent | Proactive suggestion | Copilot |
| Research/analysis tool | Conversational partner | Iterative dialogue | Consultant |
| Autonomous task executor | Agent | Tool-orchestrated | Agent |
| Multi-model orchestrator | Ensemble | Delegated execution | Team |
| Domain expert (medical, legal) | Specialist + Consultant | Iterative + verification | Consultant (advisory) |

---

**End of Taxonomy**

*This document is a living taxonomy and should be updated as new AI presentation patterns emerge.*
