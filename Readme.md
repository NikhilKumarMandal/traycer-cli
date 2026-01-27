# 🧠 Traycer – Agentic Execution Modes

Traycer is an **agent-powered CLI system** built using **LangGraph** that transforms user ideas into **structured plans, executable code, and verified output**.

It mimics how a real engineering team thinks:
👉 clarify → plan → code → review → iterate.

This repository implements **three execution modes**, each optimized for a different workflow.

---

## 🚀 Phase Mode – End-to-End Autonomous Execution

**Use when:**  
You have an idea (clear or vague) and want Traycer to fully execute it step by step.

### 🧩 Flow Overview

```md
## 🔄 Phase Mode – Execution Flow

1. **User Query**  
   User provides a goal or task.

2. **Classify Intent**  
   Determines whether the request is clear.

3. **Clarify Intent (if needed)**  
   Asks follow-up questions when details are missing.

4. **Phase Generation**  
   Breaks the task into logical phases.

5. **Phase Planning**  
   Creates a detailed plan for the current phase.

6. **Coding**  
   Implements the planned solution.

7. **Verification**  
   Reviews the generated code.

8. **Re-Verification Loop**  
   - If issues are found → return to Coding  
   - If approved → continue

9. **Next Phase / End**  
   Moves to the next phase or completes execution.

```



---

## 🧩 Plan Mode – Controlled, Approval-Based Workflow

**Use when:**  
You want **human or agent approval** between major steps.

### 🧩 Flow Overview

```md
## 🔄 Plan Mode – Execution Flow
1. **Planner**  
   Generates a technical plan.

2. **Approve Plan**  
   - Approved → move to Coding  
   - Rejected → End

3. **Coder**  
   Implements the approved plan.

4. **Approve Verification**  
   - Approved → Verifier  
   - Skipped → End

5. **Verifier**  
   Reviews the code output.

6. **Approve Retry**  
   - Retry → return to Coding  
   - End → finish execution

```


---

## 🔍 Review Mode – Code Review & Improvement

**Use when:**  
You already have code and want **deep analysis and fixes**.

### 🧩 Flow Overview

```md
## 🔍 Review Mode – Execution Flow
1. **Analysis**  
   Reviews the existing codebase.

2. **Find Issues**  
   Identifies bugs, smells, and improvements.

3. **Generate Review Report**  
   Produces a structured review summary.

4. **Approve Coding**  
   - Approved → Apply Fixes  
   - Rejected → End
```

---

## 🧠 Architecture Highlights

- Built on **LangGraph**
- Stateful execution with **MemorySaver**
- Conditional routing & retry loops
- Recursion-safe with configurable limits
- Designed for **CLI-first AI agents**

---

## 🎯 When to Use Which Mode

| Mode       | Best For |
|------------|----------|
| Phase Mode | Full autonomous execution |
| Plan Mode  | Approval-based development |
| Review Mode| Code analysis & refactoring |

---

🚀 **Turn ideas into execution. One graph at a time.**
