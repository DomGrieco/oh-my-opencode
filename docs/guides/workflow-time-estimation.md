---
title: "AI Workflow Execution Time Estimation Framework"
description: "Comprehensive methodology for estimating and predicting AI agent workflow execution times with formulas, heuristics, and real-world calibration factors."
---

# AI Workflow Execution Time Estimation Framework

This framework provides structured methodologies for estimating the execution time of AI agent workflows, from simple API calls to complex multi-agent orchestrations.

## Table of Contents

- [Core Components](#core-components)
- [Time Estimation Formulas](#time-estimation-formulas)
- [Workflow Patterns](#workflow-patterns)
- [Calibration & Tuning](#calibration--tuning)
- [Practical Examples](#practical-examples)
- [Monitoring & Feedback](#monitoring--feedback)

---

## Core Components

AI workflow execution time consists of five primary components:

### 1. Fixed Overhead (T_fixed)

Fixed costs that occur regardless of task complexity.

| Component | Typical Range | Description |
|-----------|---------------|-------------|
| **API Connection** | 50-200ms | TCP handshake, TLS negotiation |
| **Authentication** | 100-500ms | Token validation, session lookup |
| **Tool Initialization** | 10-100ms per tool | LSP server startup, MCP connection |
| **Session Creation** | 200-800ms | Session metadata, context initialization |
| **Agent Bootstrap** | 100-300ms | Agent loading, prompt template compilation |

**Formula:**
```
T_fixed = T_connection + T_auth + (N_tools × T_tool_init) + T_session + T_bootstrap
```

**Typical Total:** 500ms - 2s for simple workflows, 2s - 5s for complex multi-agent setups.

**Heuristic:**
- First call in session: Add 1-2s overhead
- Subsequent calls: ~500ms overhead
- Background agent launch: Add 800-1200ms per agent

---

### 2. Variable Processing Time (T_variable)

Task-dependent factors that scale with input size and complexity.

#### 2.1 Token Processing

**Input Token Processing:**
```
T_input = (N_input_tokens / tokens_per_second_input) × 1000  [ms]
```

**Output Token Generation:**
```
T_output = (N_output_tokens / tokens_per_second_output) × 1000  [ms]
```

| Model Class | Input Speed | Output Speed | Notes |
|-------------|-------------|--------------|-------|
| **GPT-4.5** | 10,000-20,000 tok/s | 50-100 tok/s | Fast input, moderate output |
| **Claude Opus 4.5** | 8,000-15,000 tok/s | 40-80 tok/s | Extended thinking adds 2-10s |
| **Claude Sonnet 4.5** | 15,000-30,000 tok/s | 60-120 tok/s | Balanced speed |
| **Gemini 3 Pro** | 20,000-40,000 tok/s | 80-150 tok/s | Fast generation |
| **Gemini 2.5 Flash** | 30,000-60,000 tok/s | 100-200 tok/s | Fastest for simple tasks |
| **Grok Code** | 25,000-50,000 tok/s | 90-180 tok/s | Optimized for code |

**Example:**
```
# Claude Opus 4.5 generating 500 tokens with 2000 token input
T_input = 2000 / 12,000 × 1000 = 167ms
T_output = 500 / 60 × 1000 = 8,333ms
T_total_tokens = 167ms + 8,333ms ≈ 8.5s
```

#### 2.2 Tool Execution

Different tools have vastly different execution profiles:

| Tool Category | Typical Time | Scaling Factor |
|---------------|--------------|----------------|
| **LSP (hover, goto)** | 10-100ms | O(1) - file independent |
| **LSP (find_references)** | 100ms-2s | O(n) - grows with codebase size |
| **LSP (rename)** | 500ms-5s | O(n) - modifies multiple files |
| **AST-Grep Search** | 200ms-10s | O(n × m) - files × pattern complexity |
| **Glob** | 10-500ms | O(n) - file count |
| **Grep** | 100ms-30s | O(n × m) - file count × match frequency |
| **File Read** | 5-50ms | O(size) - file size |
| **File Write** | 10-100ms | O(size) + filesystem sync |
| **Bash (simple)** | 50-500ms | Command dependent |
| **Bash (build)** | 5s-5min | Project dependent |
| **MCP (context7)** | 500ms-3s | API latency + doc size |
| **MCP (grep_app)** | 1s-10s | GitHub search complexity |
| **Background Task Launch** | 800ms-1.5s | Session creation overhead |

**Formula for Tool Sequence:**
```
T_tools = Σ(T_tool_i) + (N_tools - 1) × T_tool_overhead

where:
  T_tool_i = base_time + (size_factor × complexity_multiplier)
  T_tool_overhead = 50-200ms (serialization, API roundtrip)
```

#### 2.3 Complexity Multipliers

| Task Type | Multiplier | Reasoning |
|-----------|------------|-----------|
| **Simple query** | 1.0x | Direct answer, minimal reasoning |
| **Code explanation** | 1.2-1.5x | Context retrieval, analysis |
| **Refactoring** | 2.0-3.0x | Multiple file analysis, planning |
| **Debugging** | 2.5-4.0x | Error reproduction, root cause analysis |
| **Architecture design** | 3.0-5.0x | Extended thinking, multi-step planning |
| **Multi-agent orchestration** | 1.5-2.0x per agent | Coordination overhead |

---

### 3. Human Interaction Delays (T_human)

The unpredictable but significant component in interactive workflows.

| Interaction Type | Typical Range | 95th Percentile | Notes |
|------------------|---------------|-----------------|-------|
| **Reading short message** | 2-10s | 15s | ~200 words/min reading speed |
| **Reading code snippet** | 5-30s | 60s | Depends on complexity |
| **Making simple decision** | 3-15s | 30s | Yes/no, select from options |
| **Writing short response** | 10-60s | 120s | 1-2 sentences |
| **Code review** | 30s-5min | 10min | File size and complexity |
| **Context switch** | 5-30s | 60s | Returning to interrupted task |

**Formula for Interactive Workflow:**
```
T_human_total = N_interactions × T_human_median + σ_human

where:
  σ_human = standard deviation (typically 50-100% of median)
```

**Heuristic:**
- Budget 15-30s per required human interaction
- Add 50% buffer for context switches
- Interactive workflows: expect 3-10 interactions per major task

---

### 4. Network Latency (T_network)

Network delays follow statistical distributions rather than fixed values.

#### Latency Distributions

**API Endpoint Latency (roundtrip):**

| Provider | p50 (median) | p90 | p99 | Max Observed |
|----------|--------------|-----|-----|--------------|
| **Anthropic** | 150-300ms | 500ms | 1.2s | 5s |
| **OpenAI** | 200-400ms | 600ms | 1.5s | 8s |
| **Google (Gemini)** | 100-250ms | 400ms | 1.0s | 4s |
| **OpenCode LSP** | 10-50ms | 100ms | 300ms | 1s |
| **MCP Servers** | 200-800ms | 1.5s | 3s | 10s |

**Network Factor Formula:**
```
T_network = N_api_calls × (T_latency_median + k × σ_latency)

where:
  k = confidence factor (1.0 for p68, 1.96 for p95, 2.58 for p99)
  σ_latency = standard deviation of latency
```

**Example for 95% confidence:**
```
T_network = 10 calls × (250ms + 1.96 × 100ms)
          = 10 × 446ms
          = 4.46s
```

#### Connection Pooling Impact

| Scenario | Latency Modifier |
|----------|------------------|
| **First call (cold start)** | 1.5-2.0x baseline |
| **Pooled connection** | 1.0x baseline |
| **Connection timeout/retry** | Add 2-10s per retry |

---

### 5. Retry & Error Handling (T_retry)

Errors and retries add unpredictable overhead.

#### Error Probability & Cost

| Error Type | Probability | Retry Time | Max Retries |
|------------|-------------|------------|-------------|
| **Network timeout** | 0.5-2% | 5-30s | 3 |
| **Rate limiting** | 1-5% | 10-120s | 5 (exponential backoff) |
| **LLM refusal** | 0.1-1% | 0s (fail fast) | 1 |
| **Tool execution failure** | 2-10% | 1-5s | 2 |
| **Session recovery** | 0.1-0.5% | 2-10s | 3 |

**Expected Retry Overhead:**
```
T_retry_expected = Σ(P_error_i × N_retries_i × T_retry_i)

Example:
T_retry = (0.02 × 3 × 10s) + (0.03 × 2 × 3s) + (0.005 × 3 × 5s)
        = 0.6s + 0.18s + 0.075s
        = 0.855s
```

**Conservative Estimate (90th percentile):**
Add 5-10% to total time for retry buffer in production workflows.

---

## Time Estimation Formulas

### Master Formula

```
T_total = T_fixed + T_variable + T_human + T_network + T_retry
```

Expanded:
```
T_total = (T_connection + T_auth + T_session + T_bootstrap)
        + (T_input + T_output + T_tools + T_complexity)
        + (N_interactions × T_human_median)
        + (N_api_calls × T_latency_median)
        + (P_error × N_retries × T_retry)
```

### Parallel Execution Adjustment

When agents run in parallel (background tasks):

```
T_parallel = max(T_agent_1, T_agent_2, ..., T_agent_n) + T_coordination

where:
  T_coordination = 200ms per agent (polling overhead)
```

### Sequential vs Parallel Comparison

| Pattern | Time Formula | Example (3 agents, 10s each) |
|---------|--------------|------------------------------|
| **Sequential** | Σ(T_agent_i) | 30s |
| **Parallel** | max(T_agent_i) + Σ(T_coord) | 10s + 0.6s = 10.6s |
| **Speedup** | Sequential / Parallel | 2.83x |

---

## Workflow Patterns

### Pattern 1: Simple Query

**Description:** Single-agent, single-turn response.

**Components:**
- Fixed overhead: 500ms
- Input processing: 200 tokens @ 15,000 tok/s = 13ms
- Output generation: 300 tokens @ 80 tok/s = 3,750ms
- Network latency: 1 call @ 250ms = 250ms
- Retry buffer: 5% = 220ms

**Total Estimate:**
```
T_simple = 500ms + 13ms + 3,750ms + 250ms + 220ms ≈ 4.7s
```

**Range:** 3-8s (depends on output length)

---

### Pattern 2: Code Exploration

**Description:** Agent uses LSP and grep to explore codebase.

**Components:**
- Fixed overhead: 800ms (LSP initialization)
- Input processing: 1,500 tokens = 100ms
- Tool execution:
  - lsp_document_symbols: 150ms
  - grep search: 2,000ms
  - lsp_find_references: 800ms
  - file reads (3 files): 90ms
- Output generation: 800 tokens = 10,000ms
- Network latency: 8 calls @ 250ms = 2,000ms
- Retry buffer: 8% = 1,280ms

**Total Estimate:**
```
T_explore = 800ms + 100ms + 3,040ms + 10,000ms + 2,000ms + 1,280ms ≈ 17.2s
```

**Range:** 12-30s (highly dependent on codebase size)

---

### Pattern 3: Multi-Agent Orchestration (Parallel)

**Description:** OmO delegates frontend to Gemini, backend to Claude simultaneously.

**Timeline:**

```
T=0s:    OmO receives request
T=0.5s:  OmO analyzes and creates plan (output: 400 tokens = 5s)
T=5.5s:  OmO launches 2 background agents (2 × 1s overhead = 2s)
T=7.5s:  Both agents start working in parallel:
           - Frontend agent: 25s
           - Backend agent: 35s
T=42.5s: Backend agent completes (bottleneck)
T=43.0s: OmO receives notification (500ms delay)
T=43.5s: OmO verifies and responds (500 tokens = 6.25s)
T=49.75s: Task complete
```

**Total Estimate:** 50s (vs 65s if sequential)

**Speedup:** 1.3x (limited by longest agent)

---

### Pattern 4: Interactive Debugging

**Description:** Back-and-forth debugging with human input.

**Estimated Flow:**

1. **Initial analysis** (agent): 15s
2. **Human reviews error** (human): 20s
3. **Clarifying question** (agent): 5s
4. **Human provides context** (human): 30s
5. **Deep investigation** (agent + tools): 45s
6. **Human confirms hypothesis** (human): 15s
7. **Fix implementation** (agent): 25s
8. **Human reviews fix** (human): 60s

**Total Estimate:**
```
T_interactive = 90s (agent) + 125s (human) = 215s ≈ 3.5 minutes
```

**Range:** 2-10 minutes (highly variable based on complexity and human response time)

---

### Pattern 5: Background Research

**Description:** Librarian agent searches docs, examples, and GitHub repos.

**Components:**
- Session creation: 1,000ms
- Input processing: 800 tokens = 53ms
- Tool execution:
  - context7 (3 queries): 3 × 2,000ms = 6,000ms
  - grep_app (2 searches): 2 × 5,000ms = 10,000ms
  - MCP websearch_exa: 3,000ms
- Output synthesis: 1,500 tokens = 18,750ms
- Network latency: 12 calls @ 400ms = 4,800ms
- Retry buffer: 10% = 4,360ms

**Total Estimate:**
```
T_research = 1,000ms + 53ms + 19,000ms + 18,750ms + 4,800ms + 4,360ms ≈ 48s
```

**Range:** 30s - 2 minutes (depends on search complexity)

---

## Calibration & Tuning

### Baseline Calibration

**Step 1: Measure Fixed Overhead**

Run minimal workflows to isolate fixed costs:

```typescript
const start = performance.now()
// Empty session creation
const session = await client.session.create({ body: { title: "Calibration" } })
const T_session = performance.now() - start

// Simple prompt with no output
const prompt_start = performance.now()
await client.session.prompt({
  path: { id: session.id },
  body: { parts: [{ type: "text", text: "Say 'OK'" }] }
})
const T_prompt_overhead = performance.now() - prompt_start
```

**Step 2: Measure Token Processing Speed**

Generate known token counts and measure:

```typescript
const tokens = [100, 500, 1000, 2000, 5000]
const measurements = []

for (const n of tokens) {
  const start = performance.now()
  await generateNTokens(n) // Use specific prompt that generates exactly n tokens
  const elapsed = performance.now() - start
  measurements.push({ tokens: n, time: elapsed })
}

// Calculate tokens/second
const tokensPerSecond = fitLinearRegression(measurements)
```

**Step 3: Measure Tool Latency**

Profile each tool in your environment:

```typescript
const tools = ['lsp_hover', 'grep', 'glob', 'ast_grep_search']
const latencies = {}

for (const tool of tools) {
  const samples = await measureToolLatency(tool, sampleSize: 20)
  latencies[tool] = {
    p50: percentile(samples, 0.50),
    p90: percentile(samples, 0.90),
    p99: percentile(samples, 0.99)
  }
}
```

### Project-Specific Adjustments

| Factor | Adjustment | Example |
|--------|------------|---------|
| **Large codebase** (>100k LOC) | +30-50% on LSP tools | 150ms → 195-225ms |
| **Monorepo** | +20-40% on search tools | 2s grep → 2.4-2.8s |
| **Slow network** (high latency region) | +50-100% on T_network | 250ms → 375-500ms |
| **Rate-limited API** | +20-50% on T_retry | 0.5s → 0.6-0.75s |
| **Low-spec hardware** | +10-30% on tool execution | 100ms → 110-130ms |

### Dynamic Calibration

Continuously update estimates based on actual measurements:

```typescript
class TimeEstimator {
  private measurements: Map<string, number[]> = new Map()
  
  recordActual(operation: string, duration: number) {
    if (!this.measurements.has(operation)) {
      this.measurements.set(operation, [])
    }
    const samples = this.measurements.get(operation)!
    samples.push(duration)
    
    // Keep last 100 samples
    if (samples.length > 100) {
      samples.shift()
    }
  }
  
  estimate(operation: string, confidence: number = 0.90): number {
    const samples = this.measurements.get(operation)
    if (!samples || samples.length < 10) {
      return this.getDefaultEstimate(operation)
    }
    
    return percentile(samples, confidence)
  }
}
```

---

## Practical Examples

### Example 1: "Add Dark Mode Toggle"

**Request:** Add dark mode toggle to application settings.

**Workflow Breakdown:**

1. **Analysis Phase**
   - OmO analyzes request: 8s
   - Searches for existing theme code: 12s
   - Plans implementation: 5s
   - **Subtotal:** 25s

2. **Implementation Phase**
   - Creates toggle component: 15s
   - Updates theme context: 12s
   - Modifies CSS variables: 10s
   - **Subtotal:** 37s

3. **Verification Phase**
   - Reads modified files: 2s
   - Runs LSP diagnostics: 3s
   - Generates summary: 8s
   - **Subtotal:** 13s

**Total Estimate:** 75s (1.25 minutes)

**Actual Range:** 60s - 120s depending on:
- Existing theme infrastructure
- Number of components to update
- LSP diagnostics time

---

### Example 2: "Debug Why Tests Are Failing"

**Request:** Investigate failing test suite.

**Workflow Breakdown:**

1. **Initial Investigation** (Sequential)
   - Run test suite: 30s
   - Read test output: 5s
   - Agent analyzes errors: 20s
   - **Subtotal:** 55s

2. **Root Cause Analysis** (Parallel background agents)
   - **Agent A:** Searches for similar issues (librarian): 35s
   - **Agent B:** Analyzes changed files (explore): 25s
   - **Parallel time:** 35s (limited by slowest)

3. **Human Interaction**
   - Agent proposes hypothesis: 8s
   - Human reviews (reading + thinking): 45s
   - Human confirms: 10s
   - **Subtotal:** 63s

4. **Fix Implementation**
   - Agent writes fix: 20s
   - Runs tests again: 30s
   - Verifies success: 8s
   - **Subtotal:** 58s

**Total Estimate:** 211s (3.5 minutes)

**Actual Range:** 2-10 minutes depending on:
- Test suite runtime
- Complexity of bug
- Number of human interactions needed

---

### Example 3: "Multi-Agent Frontend + Backend Implementation"

**Request:** Build user authentication with frontend and backend.

**Workflow Breakdown:**

1. **Planning Phase** (OmO)
   - Analyzes requirements: 15s
   - Designs architecture: 35s
   - Creates task breakdown: 12s
   - **Subtotal:** 62s

2. **Parallel Implementation**
   - **Launch overhead:** 2 agents × 1.2s = 2.4s
   
   **Frontend Agent (Gemini):**
   - Create login component: 40s
   - Add form validation: 25s
   - Integrate API calls: 30s
   - Style component: 20s
   - **Frontend total:** 115s
   
   **Backend Agent (Claude):**
   - Create auth endpoints: 45s
   - Add JWT middleware: 35s
   - Database integration: 40s
   - Write tests: 50s
   - **Backend total:** 170s
   
   **Parallel time:** max(115s, 170s) = 170s

3. **Integration Phase** (OmO)
   - Notification delay: 1s
   - Review both implementations: 25s
   - Integration testing guidance: 15s
   - **Subtotal:** 41s

**Total Estimate:** 275s (4.6 minutes)

**Sequential Alternative:** 62s + 115s + 170s + 41s = 388s (6.5 minutes)

**Speedup:** 1.41x (parallel execution advantage)

**Actual Range:** 4-12 minutes depending on:
- Authentication complexity
- Database setup required
- Integration issues

---

## Monitoring & Feedback

### Real-Time Estimation

Provide users with live estimates and progress:

```typescript
interface WorkflowEstimate {
  totalEstimated: number      // Total estimated time (ms)
  elapsed: number              // Time elapsed so far (ms)
  remaining: number            // Estimated remaining time (ms)
  confidence: number           // 0-1, confidence in estimate
  phase: string                // Current phase name
  progress: number             // 0-1, completion percentage
}

class WorkflowMonitor {
  private startTime: number
  private phases: Array<{ name: string, estimatedDuration: number }>
  private currentPhase: number = 0
  
  getEstimate(): WorkflowEstimate {
    const elapsed = performance.now() - this.startTime
    const remainingPhases = this.phases.slice(this.currentPhase + 1)
    const remaining = remainingPhases.reduce((sum, p) => sum + p.estimatedDuration, 0)
    
    const total = this.phases.reduce((sum, p) => sum + p.estimatedDuration, 0)
    const progress = elapsed / total
    
    // Adjust confidence based on elapsed time accuracy
    const currentPhaseDuration = performance.now() - this.phaseStartTime
    const expectedDuration = this.phases[this.currentPhase].estimatedDuration
    const accuracy = 1 - Math.abs(currentPhaseDuration - expectedDuration) / expectedDuration
    const confidence = Math.max(0.5, accuracy)
    
    return {
      totalEstimated: total,
      elapsed,
      remaining,
      confidence,
      phase: this.phases[this.currentPhase].name,
      progress: Math.min(1.0, progress)
    }
  }
}
```

### Progress Indicators

Different levels of granularity for user feedback:

| Duration | Indicator Type | Update Frequency | Example |
|----------|---------------|------------------|---------|
| **0-5s** | None | - | "Processing..." |
| **5-30s** | Spinner | - | "Analyzing codebase..." |
| **30s-2min** | Progress bar | Every 5s | "Step 2/5: Searching documentation (45s)" |
| **2-10min** | Detailed progress | Every 10s | "Backend implementation: 60% complete (2m remaining)" |
| **10min+** | Phase breakdown | Every 30s | "Phase 3/4: Integration testing. Agent completed 15 tool calls. Est. 5 minutes remaining." |

### Accuracy Tracking

Measure estimation accuracy over time:

```typescript
interface AccuracyMetrics {
  operation: string
  estimatedTime: number
  actualTime: number
  errorPercent: number
  timestamp: Date
}

class EstimationAccuracy {
  private metrics: AccuracyMetrics[] = []
  
  record(operation: string, estimated: number, actual: number) {
    const errorPercent = ((actual - estimated) / estimated) * 100
    this.metrics.push({
      operation,
      estimatedTime: estimated,
      actualTime: actual,
      errorPercent,
      timestamp: new Date()
    })
  }
  
  getAccuracy(operation?: string): {
    meanError: number
    medianError: number
    p90Error: number
    sampleSize: number
  } {
    const samples = operation 
      ? this.metrics.filter(m => m.operation === operation)
      : this.metrics
    
    const errors = samples.map(m => Math.abs(m.errorPercent))
    
    return {
      meanError: average(errors),
      medianError: percentile(errors, 0.5),
      p90Error: percentile(errors, 0.9),
      sampleSize: samples.length
    }
  }
}
```

---

## Summary Tables

### Quick Reference: Common Operations

| Operation | Best Case | Typical | Worst Case | Key Variables |
|-----------|-----------|---------|------------|---------------|
| Simple query | 3s | 5s | 10s | Output length |
| Code search | 8s | 15s | 45s | Codebase size, pattern complexity |
| File refactor | 12s | 25s | 90s | File count, LSP speed |
| Debug investigation | 30s | 90s | 10min | Bug complexity, human interaction |
| Multi-agent task | 2min | 5min | 15min | Agent count, dependencies |
| Full feature implementation | 5min | 15min | 60min | Scope, existing infrastructure |

### Estimation Confidence Levels

| Confidence | Multiplier | Use Case |
|------------|------------|----------|
| **Optimistic (p50)** | 1.0x | Internal estimates, ideal conditions |
| **Realistic (p75)** | 1.3-1.5x | User-facing estimates, planning |
| **Conservative (p90)** | 1.8-2.2x | SLA commitments, critical tasks |
| **Worst-case (p99)** | 3.0-5.0x | Maximum timeout values |

### Model Speed Comparison (Output Tokens/Second)

| Model | Speed | Best For | Avoid For |
|-------|-------|----------|-----------|
| **Gemini 2.5 Flash** | 100-200 | Quick exploration, simple tasks | Complex reasoning |
| **Grok Code** | 90-180 | Fast file traversal | Architecture design |
| **Claude Sonnet 4.5** | 60-120 | Balanced performance | Maximum speed needs |
| **Gemini 3 Pro** | 80-150 | UI generation, documentation | Cost-sensitive workloads |
| **GPT-4.5** | 50-100 | Deep analysis, strategy | High-volume simple tasks |
| **Claude Opus 4.5** | 40-80 | Complex reasoning, architecture | Speed-critical paths |

---

## Conclusion

Accurate time estimation for AI workflows requires:

1. **Baseline Calibration:** Measure fixed overhead and tool performance in your environment
2. **Component Analysis:** Break down workflows into measurable phases
3. **Statistical Modeling:** Use distributions (p50/p90/p99) rather than single values
4. **Continuous Learning:** Track actual vs. estimated and refine models
5. **Context Awareness:** Adjust for project size, network conditions, and complexity
6. **User Communication:** Provide realistic estimates with appropriate confidence levels

**Remember:** Estimates are probabilistic, not deterministic. Always communicate ranges and confidence levels to users.

For implementation examples and monitoring code, see:
- [Background Task System](./03-background-tasks.md)
- [Hook Health Manager](../../src/hooks/hook-health-manager/)
- [Performance Optimization Agent](../../src/agents/optimization-specialist.ts)
