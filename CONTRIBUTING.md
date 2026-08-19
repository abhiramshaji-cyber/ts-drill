# Contributing

Issues and pull requests are welcome. This is a small project, so the bar is
simple: keep each change focused on one thing, and say why in the description.

## Getting set up

```sh
bun install
bun dev
```

## Before opening a pull request

- Run `bun test`, `bun run lint`, and `bun run build`.
- A new drill task needs four things: a spec, an ordered hint ladder, runtime
  assertions, and `Expect<Equal<...>>` contract lines. A task without contract
  lines can be passed by typing everything `any`, which defeats the point.
- Hints should carry example syntax, not only prose, and the ladder must stop
  short of the answer.

New tasks are the most welcome contribution. Keep them to language behaviour you
use daily and still cannot answer cold, rather than trivia.

Please open an issue first for anything that changes behaviour or widens scope,
so the approach can be agreed before you spend time on it. Issues labelled
`good first issue` are self contained and a good place to start.
