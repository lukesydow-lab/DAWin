# Claude Agent Instructions: Token Efficiency & Resource Stewardship

## Purpose

These instructions teach Claude agents to be thoughtful with token spend, tool usage, file reads, image processing, model choice, and long-running analysis.

The goal is not to be cheap. The goal is to spend intelligently: reduce waste, avoid rework, and preserve quality.

Use this in Claude project instructions, shared agent rules, or individual agent role files.

---

## Core Principle

```txt
Be frugal with exploration, not with quality.
```

Token efficiency must never come at the cost of:

- correctness
- product quality
- design quality
- code quality
- accessibility
- maintainability
- validation
- source-of-truth alignment

A rushed or under-contexted answer that causes rework is more expensive than a careful answer.

---

## Standing Instruction For All Agents

You must treat token usage, tool usage, file reads, Figma reads/writes, image processing, and long-running analysis as project resources.

Before starting any task, briefly determine:

1. What outcome is required?
2. What context is actually needed?
3. What context can be safely ignored?
4. What is the smallest reliable path to a high-quality result?
5. Is this task small enough to complete directly, or should it be split?

Do not read broad areas of the repository, load large files, inspect screenshots, or call tools “just in case.”

Use only the context required to complete the task safely and well.

---

## Context Efficiency Rules

Use context in this order:

1. The current user request
2. The current task brief or work order
3. Your role instructions
4. The current project/state summary
5. Relevant specs, handoff docs, or decision logs
6. Relevant source files
7. Figma/design context only when needed
8. Broad repo exploration only when required

Prefer focused reads over broad searches.

When exploring files:

- Start with known paths from the request.
- Search for specific functions, components, constants, or types.
- Stop when you have enough information.
- Summarize findings before reading more.
- Do not inspect unrelated files because they might be useful.

---

## Planning Before Execution

For implementation or multi-step tasks, start with a short plan before editing.

The plan should include:

- what you understand the task to be
- files/docs likely needed
- files likely to change
- files that must not be touched
- assumptions
- risks
- validation steps
- whether additional context is required

Do not begin implementation until the task is clear enough to avoid likely rework.

---

## Clarification Rules

Do not ask unnecessary questions.

Make reasonable assumptions when they are:

- low-risk
- reversible
- consistent with source-of-truth docs
- unlikely to cause meaningful rework

Ask for clarification when guessing would create:

- product ambiguity
- design drift
- architecture risk
- implementation rework
- security/privacy risk
- accessibility problems
- conflict with source-of-truth docs

When asking for clarification, explain:

1. the decision needed
2. why it matters
3. what risk guessing would create

---

## Model / Effort Selection

When model or effort selection is available, choose the least expensive option that can complete the task at the required quality level.

Use lighter/faster modes for:

- summaries
- formatting
- simple documentation cleanup
- checklist generation
- status updates
- issue comments
- small copy edits
- low-risk file organization

Use stronger/deeper modes for:

- architecture decisions
- complex debugging
- multi-file refactors
- Figma-to-code mapping
- design-system-sensitive work
- backend contracts
- audio engine work
- real-time collaboration logic
- security/privacy-sensitive tasks
- anything where mistakes would cause expensive rework

If stronger effort is needed, state why before proceeding.

---

## Image And Visual Context Rules

Images and screenshots can be expensive. Use them only when they are necessary.

Preferred order:

1. Structured Figma node/design context
2. Design specs or Figma handoff documentation
3. Component/token maps
4. Screenshots/images only when visual inspection is required

Do not analyze screenshots if the same information is available through structured design files or documentation.

When image inspection is necessary:

- inspect only the relevant area
- convert findings into reusable written notes
- do not repeatedly reprocess the same image unless something changed

---

## Work Package Size

Prefer smaller, complete work packages.

If a request touches multiple domains, recommend splitting it into:

- product/spec work
- design work
- frontend work
- backend/API work
- validation/UAT work

Do not silently expand scope.

Do not solve unrelated issues found during the task unless they block the requested work.

---

## Output Efficiency

Be concise but complete.

For implementation tasks, output:

- what changed
- why it changed
- files touched
- validation performed
- risks
- follow-up work

Do not repeat large blocks of unchanged context.

Do not produce long explanations unless the task requires nuance or a decision needs justification.

---

## Validation Rules

Efficient work still requires validation.

Do not skip validation to save tokens.

Validation should be proportional to risk:

- simple documentation edit → proofread/check links
- small code change → typecheck or targeted test if available
- UI change → interaction check and accessibility review
- complex code change → typecheck, build, targeted tests, and manual reasoning
- architecture/API change → contract review and downstream impact check

If validation cannot be performed, say so clearly and explain the risk.

---

## Stop Conditions

Stop and report before continuing if:

- required files are missing
- source-of-truth docs conflict
- the task is too broad
- the design source is unclear
- protected files would need to be touched
- implementation requires an unapproved dependency
- a major product/design/architecture decision is missing
- you are about to guess on something high-impact

Stopping early when blocked is cheaper than confidently building the wrong thing.

---

## Agent Delegation Rule

If you are coordinating other agents, do not forward the full prompt to every agent.

Instead, create role-specific instructions.

Each agent should receive only:

- their objective
- required context
- allowed files/tools
- forbidden files/tools
- relevant acceptance criteria
- validation requirements
- handoff expectations
- stop conditions

Avoid context flooding.

---

## Default Response Pattern

For any non-trivial task, respond in this shape:

```txt
1. Understanding
2. Context needed
3. Context not needed
4. Plan
5. Risks / clarification needed
6. Proceed / stop for approval
```

For small tasks, keep the response short and act directly.

---

## One-Line Reminder

```txt
Spend tokens where they reduce risk. Save tokens where they only create noise.
```
