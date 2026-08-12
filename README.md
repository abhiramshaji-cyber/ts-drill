# ts drill

A TypeScript practice pad with a real IDE inside it. Fourteen exercises, genuine type aware autocomplete, and hints that surface on their own when you stall.

## Why

Reaching for AI on every line erodes the muscle memory. This is a place to write TypeScript by hand and get honest feedback in milliseconds.

## How it works

Monaco runs the real TypeScript language service in a web worker. That one service does four jobs: it powers the completion you see, the hover types, the red squiggles, and the diagnostics used for grading. Because grading and IntelliSense come from the same compiler instance, the editor and the grader can never disagree.

An answer counts as correct when both gates pass:

1. The TypeScript service reports zero diagnostics.
2. The emitted JavaScript passes every assertion for that question.

Assertions execute in a disposable web worker with a hard 2 second timeout, so an accidental infinite loop is terminated rather than freezing the tab.

Some questions are graded purely on types. Those carry `Expect<Equal<...>>` lines in the buffer, which fail to compile until the type is right.

## Hints

Every 10 seconds of no typing reveals the next hint in an ordered ladder, from conceptual to nearly explicit. The ladder deliberately stops short of the answer. The timer resets on every keystroke and pauses when the tab is hidden. The full solution is behind a button you have to press yourself.

## Progress

Solved questions and your streak live in localStorage, so you resume where you left off. Taking the solution resets the streak. There is no backend, no account, and no database.

## Commands

```
bun install
bun dev        # local dev server
bun test       # harness units and question bank invariants
bun run build  # typecheck and production build
```

## Adding a question

Append to `src/questions.ts`. Each entry needs a starter that fails, a solution that passes, at least three hints, and either runtime assertions or `Expect` lines. The test suite enforces all of that: it type checks every starter and solution with the real compiler and runs every solution against its assertions, so a broken exercise fails CI rather than reaching you mid drill.
