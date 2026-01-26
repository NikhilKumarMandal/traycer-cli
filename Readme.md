# Plan Graph Workflow

This repository implements a **plan → approve → code → verify → retry** workflow using **LangGraph**. The graph is designed to safely orchestrate LLM-driven planning and code execution with explicit human/AI approval checkpoints.

---

## 🧠 High-Level Overview

The graph models a controlled development loop where:

1. The LLM **creates a plan**
2. The plan is **approved or rejected**
3. Approved plans are **executed (coded)**
4. The output is **verified**
5. Failed verification can **retry coding** or **terminate** the flow

This structure prevents uncontrolled execution and makes the system safe, debuggable, and extensible.

---

## 🔁 Graph Flow

```
START
  ↓
planner
  ↓
approve_plan ──┬──▶ coder ─▶ approve_verification ──┬──▶ verifier ─▶ approve_retry ──┬──▶ coder (retry)
                │                                     │                                 └──▶ END
                └──────────────▶ END                  └──────────────▶ END
```

---

## 🧩 Nodes Description

### `planner`

* Generates an **implementation plan** (steps, actions, reasoning)
* Output is usually structured JSON (validated via Zod)

---

### `approve_plan`

* Decides whether the generated plan is acceptable
* Can be:

  * Manual (human-in-the-loop)
  * Automated (rule-based / heuristic)

**Routes:**

* ✅ Approved → `coder`
* ❌ Rejected → `END`

---

### `coder`

* Executes the approved plan
* Typical responsibilities:

  * Create / update files
  * Run commands
  * Apply code changes

---

### `approve_verification`

* Gatekeeper before verification
* Useful for:

  * Manual review of generated code
  * Cost control (skip verification if unnecessary)

**Routes:**

* ✅ Approved → `verifier`
* ❌ Rejected → `END`

---

### `verifier`

* Validates correctness of execution
* Can include:

  * Tests
  * Static analysis
  * Linting
  * Runtime checks

---

### `approve_retry`

* Decides what to do after verification

**Routes:**

* 🔁 Retry → `coder`
* 🛑 Stop → `END`

This enables **self-healing loops** while avoiding infinite retries.

---

## 🧠 Conditional Routing

The graph uses **conditional edges** to dynamically route execution:

* `routeAfterPlanApproval`
* `routeAfterVerificationApproval`
* `routeAfterRetry`

Each routing function returns a string key that determines the next node.

---

## 💾 State & Persistence

```ts
.compile({
  checkpointer: new MemorySaver(),
})
```

* Uses an **in-memory checkpointer**
* Allows:

  * Pausing & resuming execution
  * Debugging intermediate states

---

## ⚙️ Configuration

```ts
.withConfig({ recursionLimit: 70 })
```

* Prevents infinite loops
* Caps retry depth for safety

---

## ✅ Why This Design?

* 🔒 Safe execution with approvals
* 🔁 Built-in retry mechanism
* 🧩 Modular & extensible nodes
* 🤖 LLM-friendly (structured planning)
* 🛠️ Ideal for CLI agents, codegen tools, and autonomous dev systems

---


## 📌 Notes

* Nodes can be swapped with human or AI implementations
* Approval nodes are ideal extension points
* Works well with Zod-validated LLM outputs

---
