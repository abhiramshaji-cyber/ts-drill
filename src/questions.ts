export type Question = {
  id: string
  title: string
  prompt: string
  starter: string
  solution: string
  hints: string[]
  assertions: string
}

export const QUESTIONS: Question[] = [
  {
    id: 'narrow-union',
    title: 'Narrow a discriminated union',
    prompt: 'area() reads .radius off a union that does not always have one. Narrow on the kind field so both shapes compute correctly.',
    hints: [
      'A union member only exposes properties that exist on every member. You have to prove which member you hold.',
      'Every member carries a literal kind field. Branch on it and TypeScript narrows the rest of the object for you.',
      'A switch (shape.kind) with a case per member gives you a fully narrowed shape inside each branch.',
    ],
    starter: `type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'rect'; width: number; height: number }

function area(shape: Shape): number {
  return shape.radius * shape.radius * Math.PI
}`,
    solution: `type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'rect'; width: number; height: number }

function area(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return shape.radius * shape.radius * Math.PI
    case 'rect':
      return shape.width * shape.height
  }
}`,
    assertions: `test('circle area', () => expect(Math.round(area({ kind: 'circle', radius: 2 }))).toBe(13))
test('rect area', () => expect(area({ kind: 'rect', width: 3, height: 4 })).toBe(12))`,
  },
  {
    id: 'exhaustive-never',
    title: 'Make a switch exhaustive',
    prompt: 'The never assignment at the bottom is an exhaustiveness check, and right now it fails. Handle every event type so the check passes.',
    hints: [
      'Assigning to never only compiles when the value has been narrowed away to nothing. The error message names what is left over.',
      'One event type has no case, so it survives the switch and reaches the never assignment.',
      "Add the missing case for 'key' and return a label for it.",
    ],
    starter: `type AppEvent = { type: 'click' } | { type: 'scroll' } | { type: 'key' }

function label(event: AppEvent): string {
  switch (event.type) {
    case 'click':
      return 'clicked'
    case 'scroll':
      return 'scrolled'
  }
  const unreachable: never = event
  return unreachable
}`,
    solution: `type AppEvent = { type: 'click' } | { type: 'scroll' } | { type: 'key' }

function label(event: AppEvent): string {
  switch (event.type) {
    case 'click':
      return 'clicked'
    case 'scroll':
      return 'scrolled'
    case 'key':
      return 'typed'
  }
  const unreachable: never = event
  return unreachable
}`,
    assertions: `test('click', () => expect(label({ type: 'click' })).toBe('clicked'))
test('scroll', () => expect(label({ type: 'scroll' })).toBe('scrolled'))
test('key', () => expect(label({ type: 'key' })).toBe('typed'))`,
  },
  {
    id: 'type-predicate',
    title: 'Write a type predicate',
    prompt: 'isUser validates an unknown value at runtime, but it only returns boolean, so value.email still fails. Make the guard carry type information.',
    hints: [
      'A function returning boolean tells the compiler nothing about the argument once it returns.',
      'TypeScript has a return type form that says "if this is true, the argument is that type".',
      'Annotate the return type as `value is User` instead of leaving it inferred.',
    ],
    starter: `type User = { id: string; email: string }

function isUser(value: unknown) {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as User).id === 'string' &&
    typeof (value as User).email === 'string'
  )
}

function greet(value: unknown): string {
  if (isUser(value)) return value.email
  return 'anonymous'
}`,
    solution: `type User = { id: string; email: string }

function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as User).id === 'string' &&
    typeof (value as User).email === 'string'
  )
}

function greet(value: unknown): string {
  if (isUser(value)) return value.email
  return 'anonymous'
}`,
    assertions: `test('accepts a user', () => expect(greet({ id: '1', email: 'ada@lovelace.dev' })).toBe('ada@lovelace.dev'))
test('rejects a number', () => expect(greet(42)).toBe('anonymous'))
test('rejects null', () => expect(greet(null)).toBe('anonymous'))
test('rejects a partial user', () => expect(greet({ id: '1' })).toBe('anonymous'))`,
  },
  {
    id: 'generic-pluck',
    title: 'Type a generic pluck',
    prompt: 'pluck is typed with any, so names and ages both come back as any[]. The Expect lines demand string[] and number[]. Make it generic.',
    hints: [
      'Two things vary here: the element type of the array, and which key is being read.',
      'Give the function two type parameters and constrain the key one to the keys of the element type.',
      'The signature shape is <T, K extends keyof T>(items: T[], key: K) returning an array of the indexed type.',
    ],
    starter: `function pluck(items: any[], key: any) {
  return items.map((item) => item[key])
}

const users = [
  { name: 'ada', age: 36 },
  { name: 'linus', age: 54 },
]

const names = pluck(users, 'name')
const ages = pluck(users, 'age')

type NamesAreStrings = Expect<Equal<typeof names, string[]>>
type AgesAreNumbers = Expect<Equal<typeof ages, number[]>>`,
    solution: `function pluck<T, K extends keyof T>(items: T[], key: K): T[K][] {
  return items.map((item) => item[key])
}

const users = [
  { name: 'ada', age: 36 },
  { name: 'linus', age: 54 },
]

const names = pluck(users, 'name')
const ages = pluck(users, 'age')

type NamesAreStrings = Expect<Equal<typeof names, string[]>>
type AgesAreNumbers = Expect<Equal<typeof ages, number[]>>`,
    assertions: `test('plucks names', () => expect(names).toEqual(['ada', 'linus']))
test('plucks ages', () => expect(ages).toEqual([36, 54]))`,
  },
  {
    id: 'satisfies-config',
    title: 'Keep literal types with satisfies',
    prompt: "config.env widens to string, so it is not assignable to Config and the Expect line fails. Validate against Config without losing the literal 'prod'.",
    hints: [
      'Annotating `const config: Config` would check the shape but widen env to the full union. You need checking without widening.',
      'There is an operator that verifies a value matches a type while keeping the value\'s own inferred type.',
      'Use the satisfies operator on the object literal.',
    ],
    starter: `type Config = { env: 'dev' | 'prod'; retries: number }

const config = {
  env: 'prod',
  retries: 3,
}

type EnvStaysLiteral = Expect<Equal<typeof config.env, 'prod'>>`,
    solution: `type Config = { env: 'dev' | 'prod'; retries: number }

const config = {
  env: 'prod',
  retries: 3,
} satisfies Config

type EnvStaysLiteral = Expect<Equal<typeof config.env, 'prod'>>`,
    assertions: `test('keeps retries', () => expect(config.retries).toBe(3))
test('keeps env', () => expect(config.env).toBe('prod'))`,
  },
  {
    id: 'as-const-routes',
    title: 'Derive a union from an array',
    prompt: 'Route should be the union of the three route strings, derived from the routes array rather than typed by hand.',
    hints: [
      'A plain array literal infers as string[], which throws away the individual literals.',
      'Freeze the literal so the elements keep their exact types, then index the resulting tuple.',
      'Add `as const` to the array and write `typeof routes[number]`.',
    ],
    starter: `const routes = ['/', '/about', '/contact']

type Route = string

type RouteIsUnion = Expect<Equal<Route, '/' | '/about' | '/contact'>>`,
    solution: `const routes = ['/', '/about', '/contact'] as const

type Route = (typeof routes)[number]

type RouteIsUnion = Expect<Equal<Route, '/' | '/about' | '/contact'>>`,
    assertions: `test('routes intact', () => expect(routes.length).toBe(3))
test('first route', () => expect(routes[0]).toBe('/'))`,
  },
  {
    id: 'generic-store',
    title: 'Make a store generic',
    prompt: 'createStore takes any, so the store forgets what it holds. Thread the value type through so get returns number here.',
    hints: [
      'The store should be typed by whatever it was initialised with, not by a fixed type.',
      'Introduce a type parameter inferred from the initial argument and use it for both get and set.',
      'The signature is createStore<T>(initial: T), and set takes a T.',
    ],
    starter: `function createStore(initial: any) {
  let value = initial
  return {
    get: () => value,
    set: (next: any) => {
      value = next
    },
  }
}

const counter = createStore(0)

type GetReturnsNumber = Expect<Equal<ReturnType<typeof counter.get>, number>>`,
    solution: `function createStore<T>(initial: T) {
  let value = initial
  return {
    get: (): T => value,
    set: (next: T) => {
      value = next
    },
  }
}

const counter = createStore(0)

type GetReturnsNumber = Expect<Equal<ReturnType<typeof counter.get>, number>>`,
    assertions: `test('reads initial', () => expect(counter.get()).toBe(0))
test('writes then reads', () => {
  counter.set(7)
  expect(counter.get()).toBe(7)
})`,
  },
  {
    id: 'fetch-state',
    title: 'Render a state machine',
    prompt: 'render reaches for .data on a union where most members do not have it. Handle each status and return the right string.',
    hints: [
      'Only the success member has data, and only the error member has message.',
      'Check the discriminant before touching a member specific field.',
      "Return data.join(', ') for success, message for error, and the status itself for idle and loading.",
    ],
    starter: `type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: string[] }
  | { status: 'error'; message: string }

function render(state: State): string {
  return state.data.join(', ')
}`,
    solution: `type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: string[] }
  | { status: 'error'; message: string }

function render(state: State): string {
  if (state.status === 'success') return state.data.join(', ')
  if (state.status === 'error') return state.message
  return state.status
}`,
    assertions: `test('idle', () => expect(render({ status: 'idle' })).toBe('idle'))
test('loading', () => expect(render({ status: 'loading' })).toBe('loading'))
test('success', () => expect(render({ status: 'success', data: ['a', 'b'] })).toBe('a, b'))
test('error', () => expect(render({ status: 'error', message: 'boom' })).toBe('boom'))`,
  },
  {
    id: 'result-union',
    title: 'Return a result instead of throwing',
    prompt: 'parseJson must never throw. Return the Result union: ok true with the parsed value, or ok false with an error string.',
    hints: [
      'The parsed value is unknown and the parse throws on bad input, so neither path currently matches Result.',
      'Wrap the parse in try/catch and build the matching object literal in each branch.',
      'Success is { ok: true, value }, failure is { ok: false, error: String(error) }.',
    ],
    starter: `type Result<T> = { ok: true; value: T } | { ok: false; error: string }

async function parseJson(input: string): Promise<Result<unknown>> {
  const value: unknown = JSON.parse(input)
  return value
}`,
    solution: `type Result<T> = { ok: true; value: T } | { ok: false; error: string }

async function parseJson(input: string): Promise<Result<unknown>> {
  try {
    const value: unknown = JSON.parse(input)
    return { ok: true, value }
  } catch (error) {
    return { ok: false, error: String(error) }
  }
}`,
    assertions: `test('parses valid json', async () => {
  expect(await parseJson('{"a":1}')).toEqual({ ok: true, value: { a: 1 } })
})
test('does not throw on garbage', async () => {
  const result = await parseJson('not json')
  expect(result.ok).toBe(false)
})`,
  },
  {
    id: 'unwrap-promise',
    title: 'Unwrap a promise type',
    prompt: 'Unwrap should strip Promise from a type, however deeply it is nested, and leave non promise types alone.',
    hints: [
      'You need a type that behaves differently depending on the type it receives.',
      'A conditional type can test T against Promise<something> and capture that something.',
      'Use `T extends Promise<infer U> ? ... : T`, and recurse on U to handle nesting.',
    ],
    starter: `type Unwrap<T> = T

type FromString = Expect<Equal<Unwrap<Promise<string>>, string>>
type FromPlain = Expect<Equal<Unwrap<number>, number>>
type FromNested = Expect<Equal<Unwrap<Promise<Promise<boolean>>>, boolean>>`,
    solution: `type Unwrap<T> = T extends Promise<infer U> ? Unwrap<U> : T

type FromString = Expect<Equal<Unwrap<Promise<string>>, string>>
type FromPlain = Expect<Equal<Unwrap<number>, number>>
type FromNested = Expect<Equal<Unwrap<Promise<Promise<boolean>>>, boolean>>`,
    assertions: '',
  },
  {
    id: 'my-return-type',
    title: 'Implement ReturnType',
    prompt: 'Build MyReturnType from scratch. It should extract what a function type returns.',
    hints: [
      'This is the same conditional plus infer shape as unwrapping a promise, applied to a function signature.',
      'The pattern you match against is a function type whose return position is inferred.',
      'Match `(...args: any[]) => infer R` and fall back to never.',
    ],
    starter: `type MyReturnType<T> = T

type FromThunk = Expect<Equal<MyReturnType<() => string>, string>>
type FromArgs = Expect<Equal<MyReturnType<(a: number, b: number) => boolean>, boolean>>
type FromVoid = Expect<Equal<MyReturnType<() => void>, void>>`,
    solution: `type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : never

type FromThunk = Expect<Equal<MyReturnType<() => string>, string>>
type FromArgs = Expect<Equal<MyReturnType<(a: number, b: number) => boolean>, boolean>>
type FromVoid = Expect<Equal<MyReturnType<() => void>, void>>`,
    assertions: '',
  },
  {
    id: 'solid-mapped',
    title: 'Strip readonly and optional',
    prompt: 'Solid should take an object type and produce one where every property is required and mutable.',
    hints: [
      'A mapped type can rewrite every property of T, and it can also add or remove modifiers.',
      'Modifiers can be subtracted, not just added.',
      'Write a mapped type using `-readonly` on the key and `-?` after it.',
    ],
    starter: `type Loose = { readonly a?: string; readonly b?: number }

type Solid<T> = T

type IsSolid = Expect<Equal<Solid<Loose>, { a: string; b: number }>>`,
    solution: `type Loose = { readonly a?: string; readonly b?: number }

type Solid<T> = { -readonly [K in keyof T]-?: T[K] }

type IsSolid = Expect<Equal<Solid<Loose>, { a: string; b: number }>>`,
    assertions: '',
  },
  {
    id: 'my-omit',
    title: 'Implement Omit',
    prompt: 'Build MyOmit without using the built in Omit, Exclude or Pick. It should drop the named keys from the object type.',
    hints: [
      'Start from a mapped type over keyof T, then find a way to discard some of the keys.',
      'Key remapping lets you rename a key while mapping, and mapping a key to never removes it.',
      'Use `[P in keyof T as P extends K ? never : P]` with K constrained to keyof T.',
    ],
    starter: `type MyOmit<T, K> = T

type DropsOne = Expect<Equal<MyOmit<{ a: string; b: number; c: boolean }, 'b'>, { a: string; c: boolean }>>
type DropsMany = Expect<Equal<MyOmit<{ a: string; b: number; c: boolean }, 'a' | 'b'>, { c: boolean }>>`,
    solution: `type MyOmit<T, K extends keyof T> = { [P in keyof T as P extends K ? never : P]: T[P] }

type DropsOne = Expect<Equal<MyOmit<{ a: string; b: number; c: boolean }, 'b'>, { a: string; c: boolean }>>
type DropsMany = Expect<Equal<MyOmit<{ a: string; b: number; c: boolean }, 'a' | 'b'>, { c: boolean }>>`,
    assertions: '',
  },
  {
    id: 'event-handlers',
    title: 'Build handler names with template literals',
    prompt: 'Handlers should turn an object of event payloads into an object of on-prefixed handler functions.',
    hints: [
      'Two things change per key: the key name gains a prefix, and the value becomes a function of the old value.',
      'Key remapping in a mapped type can compute a new key using a template literal type.',
      'Remap to `on${Capitalize<K & string>}` and give it the value type (payload: T[K]) => void.',
    ],
    starter: `type Events = { click: { x: number }; focus: { id: string } }

type Handlers<T> = T

type BuildsHandlers = Expect<
  Equal<
    Handlers<Events>,
    { onClick: (payload: { x: number }) => void; onFocus: (payload: { id: string }) => void }
  >
>`,
    solution: `type Events = { click: { x: number }; focus: { id: string } }

type Handlers<T> = {
  [K in keyof T as \`on\${Capitalize<K & string>}\`]: (payload: T[K]) => void
}

type BuildsHandlers = Expect<
  Equal<
    Handlers<Events>,
    { onClick: (payload: { x: number }) => void; onFocus: (payload: { id: string }) => void }
  >
>`,
    assertions: '',
  },
]
