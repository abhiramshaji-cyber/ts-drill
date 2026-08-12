# ts drill

A TypeScript practice pad with a real IDE inside it. Twelve things to build from scratch, genuine type aware autocomplete, and hints that surface on their own when you stall.

## Why

Reaching for AI on every line erodes the muscle memory. This is a place to write TypeScript by hand and get honest feedback in milliseconds.

Every task gives you a spec and an almost empty file. You write the whole thing: `chunk`, `groupBy`, `memoize`, `retry`, an LRU cache, a typed event emitter, a small validator. Nothing is a fill in the blank, and nothing asks you to patch someone else's code.

## How it works

Monaco runs the real TypeScript language service in a web worker. That one service does four jobs: it powers the completion you see, the hover types, the red squiggles, and the diagnostics used for grading. Because grading and IntelliSense come from the same compiler instance, the editor and the grader can never disagree.

An answer counts as correct when both gates pass:

1. The TypeScript service reports zero diagnostics.
2. The emitted JavaScript passes every assertion for that question.

Assertions execute in a disposable web worker with a hard 2 second timeout, so an accidental infinite loop is terminated rather than freezing the tab.

Where the shape of the type is part of the exercise, the starter carries `Expect<Equal<...>>` lines that stay red until your signature is right. A working implementation with a lazy signature does not count as done.

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

Append to `src/questions.ts`. Each entry needs a starter that does not already pass, a solution that does, at least three hints, and runtime assertions. The test suite enforces all of that with the real compiler: it proves every starter fails at least one gate and every solution clears both, so a broken exercise surfaces in `bun test` rather than mid drill.
