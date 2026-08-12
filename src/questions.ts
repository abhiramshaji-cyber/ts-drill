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
    id: 'chunk',
    title: 'Split an array into chunks',
    prompt:
      'Build chunk(items, size): split items into groups of at most size, in order. The last group can be short. Keep it generic so a string[] gives back a string[][].',
    hints: [
      'Walk the array in steps of size and take a slice at each step.',
      'items.slice(index, index + size) handles the short last group on its own, because slice stops at the end.',
      'Declare it as function chunk<T>(items: T[], size: number): T[][] and collect each slice into an array.',
    ],
    starter: `const letters = ['a', 'b', 'c', 'd', 'e']

type ChunkKeepsElementType = Expect<Equal<ReturnType<typeof chunk<number>>, number[][]>>`,
    solution: `const letters = ['a', 'b', 'c', 'd', 'e']

function chunk<T>(items: T[], size: number): T[][] {
  const groups: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    groups.push(items.slice(index, index + size))
  }
  return groups
}

type ChunkKeepsElementType = Expect<Equal<ReturnType<typeof chunk<number>>, number[][]>>`,
    assertions: `test('splits evenly', () => expect(chunk([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]]))
test('last group can be short', () => expect(chunk(letters, 2)).toEqual([['a', 'b'], ['c', 'd'], ['e']]))
test('empty input gives no groups', () => expect(chunk([], 3)).toEqual([]))
test('size bigger than the array', () => expect(chunk([1, 2], 5)).toEqual([[1, 2]]))
test('size of one', () => expect(chunk([1, 2], 1)).toEqual([[1], [2]]))`,
  },
  {
    id: 'group-by',
    title: 'Group records by a key',
    prompt:
      'Build groupBy(items, key): return an object mapping each distinct value of that key to the array of items carrying it, in input order. Only real keys of the item should be accepted.',
    hints: [
      'Start with an empty object, walk the items once, and drop each one into the bucket named by its key value.',
      'Object keys are strings, so convert the value with String() before using it as a bucket name.',
      'Type it as <T, K extends keyof T>(items: T[], key: K): Record<string, T[]>, creating the bucket array the first time you meet a value.',
    ],
    starter: `const people = [
  { name: 'ada', team: 'core' },
  { name: 'linus', team: 'kernel' },
  { name: 'grace', team: 'core' },
]

type Person = { name: string; team: string }
type GroupByReturnsBuckets = Expect<Equal<ReturnType<typeof groupBy<Person, 'team'>>, Record<string, Person[]>>>`,
    solution: `const people = [
  { name: 'ada', team: 'core' },
  { name: 'linus', team: 'kernel' },
  { name: 'grace', team: 'core' },
]

function groupBy<T, K extends keyof T>(items: T[], key: K): Record<string, T[]> {
  const groups: Record<string, T[]> = {}
  for (const item of items) {
    const bucket = String(item[key])
    if (!groups[bucket]) groups[bucket] = []
    groups[bucket].push(item)
  }
  return groups
}

type Person = { name: string; team: string }
type GroupByReturnsBuckets = Expect<Equal<ReturnType<typeof groupBy<Person, 'team'>>, Record<string, Person[]>>>`,
    assertions: `test('groups by the key', () => {
  expect(groupBy(people, 'team')).toEqual({
    core: [{ name: 'ada', team: 'core' }, { name: 'grace', team: 'core' }],
    kernel: [{ name: 'linus', team: 'kernel' }],
  })
})
test('keeps input order inside a bucket', () => {
  expect(groupBy(people, 'team').core.map((person) => person.name)).toEqual(['ada', 'grace'])
})
test('empty input gives an empty object', () => expect(groupBy([], 'team')).toEqual({}))
test('groups by a different key', () => {
  expect(Object.keys(groupBy(people, 'name')).sort()).toEqual(['ada', 'grace', 'linus'])
})`,
  },
  {
    id: 'attempt',
    title: 'Wrap a risky call in a result',
    prompt:
      'Build attempt(fn): run fn and return { ok: true, value } with whatever it returned, or { ok: false, error } holding an Error if it threw. attempt itself must never throw.',
    hints: [
      'There are exactly two exits: the value came back, or something was thrown. try/catch gives you both.',
      'catch hands you unknown, not Error, so you cannot assume it has a .message.',
      'Check error instanceof Error, and wrap anything else with new Error(String(error)).',
    ],
    starter: `type Result<T> = { ok: true; value: T } | { ok: false; error: Error }

type AttemptReturnsResult = Expect<Equal<ReturnType<typeof attempt<number>>, Result<number>>>`,
    solution: `type Result<T> = { ok: true; value: T } | { ok: false; error: Error }

function attempt<T>(fn: () => T): Result<T> {
  try {
    return { ok: true, value: fn() }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error : new Error(String(error)) }
  }
}

type AttemptReturnsResult = Expect<Equal<ReturnType<typeof attempt<number>>, Result<number>>>`,
    assertions: `test('wraps a returned value', () => expect(attempt(() => 41 + 1)).toEqual({ ok: true, value: 42 }))
test('catches a thrown error', () => {
  const result = attempt(() => {
    throw new Error('nope')
  })
  expect(result.ok).toBe(false)
  expect(result.error.message).toBe('nope')
})
test('wraps a thrown non error', () => {
  const result = attempt(() => {
    throw 'just a string'
  })
  expect(result.ok).toBe(false)
  expect(result.error instanceof Error).toBe(true)
})
test('keeps a falsy value as a success', () => expect(attempt(() => 0)).toEqual({ ok: true, value: 0 }))`,
  },
  {
    id: 'reducer',
    title: 'Build a counter reducer',
    prompt:
      'Build reduceCounter(state, action) for the Action list. add adds its amount, reset returns 0, clamp keeps state between min and max. Add a default branch that makes a forgotten action type a compile error.',
    hints: [
      'Switch on action.type. Inside each case you can read that action’s own fields.',
      'clamp is Math.min and Math.max together: never below min, never above max.',
      'In the default branch assign action to a variable typed never, so adding a new action type stops compiling until you handle it.',
    ],
    starter: `type Action =
  | { type: 'add'; amount: number }
  | { type: 'reset' }
  | { type: 'clamp'; min: number; max: number }`,
    solution: `type Action =
  | { type: 'add'; amount: number }
  | { type: 'reset' }
  | { type: 'clamp'; min: number; max: number }

function reduceCounter(state: number, action: Action): number {
  switch (action.type) {
    case 'add':
      return state + action.amount
    case 'reset':
      return 0
    case 'clamp':
      return Math.min(Math.max(state, action.min), action.max)
    default: {
      const unreachable: never = action
      return unreachable
    }
  }
}`,
    assertions: `test('adds', () => expect(reduceCounter(5, { type: 'add', amount: 3 })).toBe(8))
test('adds a negative amount', () => expect(reduceCounter(5, { type: 'add', amount: -9 })).toBe(-4))
test('resets to zero', () => expect(reduceCounter(99, { type: 'reset' })).toBe(0))
test('clamps down to max', () => expect(reduceCounter(50, { type: 'clamp', min: 0, max: 10 })).toBe(10))
test('clamps up to min', () => expect(reduceCounter(-5, { type: 'clamp', min: 0, max: 10 })).toBe(0))
test('leaves a value inside the range alone', () => expect(reduceCounter(5, { type: 'clamp', min: 0, max: 10 })).toBe(5))`,
  },
  {
    id: 'sort-by',
    title: 'Sort by several keys',
    prompt:
      'Build sortBy(items, ...keys): return a new array sorted by the first key, breaking ties with the next, and so on. The original array must not change.',
    hints: [
      'Copy the array before sorting, because sort rearranges the array you call it on.',
      'The comparator walks the keys in order and returns as soon as two values differ.',
      'Compare with < and > returning -1 or 1, fall through to 0 when every key ties, and type the rest parameter as (keyof T)[].',
    ],
    starter: `const players = [
  { name: 'ada', score: 10, age: 36 },
  { name: 'linus', score: 10, age: 54 },
  { name: 'grace', score: 20, age: 45 },
  { name: 'bob', score: 10, age: 20 },
]`,
    solution: `const players = [
  { name: 'ada', score: 10, age: 36 },
  { name: 'linus', score: 10, age: 54 },
  { name: 'grace', score: 20, age: 45 },
  { name: 'bob', score: 10, age: 20 },
]

function sortBy<T>(items: T[], ...keys: (keyof T)[]): T[] {
  return [...items].sort((left, right) => {
    for (const key of keys) {
      if (left[key] < right[key]) return -1
      if (left[key] > right[key]) return 1
    }
    return 0
  })
}`,
    assertions: `test('sorts by one key', () => {
  expect(sortBy(players, 'score').map((player) => player.name)).toEqual(['ada', 'linus', 'bob', 'grace'])
})
test('breaks ties with the second key', () => {
  expect(sortBy(players, 'score', 'age').map((player) => player.name)).toEqual(['bob', 'ada', 'linus', 'grace'])
})
test('sorts strings alphabetically', () => {
  expect(sortBy(players, 'name').map((player) => player.name)).toEqual(['ada', 'bob', 'grace', 'linus'])
})
test('leaves the original array alone', () => {
  const before = players.map((player) => player.name)
  sortBy(players, 'name')
  expect(players.map((player) => player.name)).toEqual(before)
})
test('empty input', () => expect(sortBy([], 'name')).toEqual([]))`,
  },
  {
    id: 'render-tree',
    title: 'Render a nested document',
    prompt:
      'Build render(node): turn a DocNode tree into a string. text gives its value, bold wraps its child in *stars*, list joins its children with a comma and space and wraps them in [brackets].',
    hints: [
      'Switch on node.kind. Two of the three cases hold more nodes, so render ends up calling itself.',
      'bold holds a single child node, list holds an array of them.',
      'For list, map every child through render and join with ", " before wrapping the result in brackets.',
    ],
    starter: `type DocNode =
  | { kind: 'text'; value: string }
  | { kind: 'bold'; child: DocNode }
  | { kind: 'list'; children: DocNode[] }`,
    solution: `type DocNode =
  | { kind: 'text'; value: string }
  | { kind: 'bold'; child: DocNode }
  | { kind: 'list'; children: DocNode[] }

function render(node: DocNode): string {
  switch (node.kind) {
    case 'text':
      return node.value
    case 'bold':
      return \`*\${render(node.child)}*\`
    case 'list':
      return \`[\${node.children.map(render).join(', ')}]\`
  }
}`,
    assertions: `test('plain text', () => expect(render({ kind: 'text', value: 'hi' })).toBe('hi'))
test('bold wraps its child', () => {
  expect(render({ kind: 'bold', child: { kind: 'text', value: 'hi' } })).toBe('*hi*')
})
test('list joins its children', () => {
  expect(render({ kind: 'list', children: [{ kind: 'text', value: 'a' }, { kind: 'text', value: 'b' }] })).toBe('[a, b]')
})
test('nests to any depth', () => {
  expect(
    render({
      kind: 'list',
      children: [
        { kind: 'bold', child: { kind: 'text', value: 'a' } },
        { kind: 'list', children: [{ kind: 'text', value: 'b' }] },
      ],
    }),
  ).toBe('[*a*, [b]]')
})
test('empty list', () => expect(render({ kind: 'list', children: [] })).toBe('[]'))`,
  },
  {
    id: 'parse-query',
    title: 'Parse a query string',
    prompt:
      'Build parseQuery(input): turn "a=1&b=2" into { a: "1", b: "2" }. A leading ? is optional, a key with no = gets an empty string, a repeated key collects into an array, and an empty input gives {}.',
    hints: [
      'Strip a leading ?, return early on an empty string, then split on &.',
      'Split each pair at the first = only, so a value that itself contains = survives intact.',
      'When a key turns up again, replace the stored string with an array of both; if it is already an array, push onto it.',
    ],
    starter: `type QueryValuesAreStringsOrArrays = Expect<
  Equal<ReturnType<typeof parseQuery>, Record<string, string | string[]>>
>`,
    solution: `function parseQuery(input: string): Record<string, string | string[]> {
  const output: Record<string, string | string[]> = {}
  const body = input.startsWith('?') ? input.slice(1) : input
  if (body === '') return output

  for (const pair of body.split('&')) {
    const separator = pair.indexOf('=')
    const key = separator === -1 ? pair : pair.slice(0, separator)
    const value = separator === -1 ? '' : pair.slice(separator + 1)
    const existing = output[key]
    if (existing === undefined) output[key] = value
    else if (Array.isArray(existing)) existing.push(value)
    else output[key] = [existing, value]
  }

  return output
}

type QueryValuesAreStringsOrArrays = Expect<
  Equal<ReturnType<typeof parseQuery>, Record<string, string | string[]>>
>`,
    assertions: `test('parses pairs', () => expect(parseQuery('a=1&b=2')).toEqual({ a: '1', b: '2' }))
test('ignores a leading question mark', () => expect(parseQuery('?a=1')).toEqual({ a: '1' }))
test('empty input', () => expect(parseQuery('')).toEqual({}))
test('key with no value', () => expect(parseQuery('flag')).toEqual({ flag: '' }))
test('repeated keys collect into an array', () => {
  expect(parseQuery('tag=a&tag=b&tag=c')).toEqual({ tag: ['a', 'b', 'c'] })
})
test('keeps equals signs inside the value', () => expect(parseQuery('q=a=b')).toEqual({ q: 'a=b' }))`,
  },
  {
    id: 'memoize',
    title: 'Build memoize',
    prompt:
      'Build memoize(fn): return a function with the same signature that calls fn once per distinct argument list and serves the cached answer afterwards. Use the JSON of the arguments as the cache key.',
    hints: [
      'Keep a Map from a string key to the result, and return a new function that looks in the map before calling fn.',
      'JSON.stringify(args) turns the whole argument list into one usable key.',
      'Ask cache.has(key) rather than testing the stored value, or a cached 0 or false gets recomputed every time.',
    ],
    starter: `type MemoizedReturnsTheSameType = Expect<
  Equal<ReturnType<ReturnType<typeof memoize<[number], string>>>, string>
>`,
    solution: `function memoize<A extends unknown[], R>(fn: (...args: A) => R): (...args: A) => R {
  const cache = new Map<string, R>()
  return (...args: A): R => {
    const key = JSON.stringify(args)
    const cached = cache.get(key)
    if (cached !== undefined || cache.has(key)) return cached as R
    const value = fn(...args)
    cache.set(key, value)
    return value
  }
}

type MemoizedReturnsTheSameType = Expect<
  Equal<ReturnType<ReturnType<typeof memoize<[number], string>>>, string>
>`,
    assertions: `test('returns the right answer', () => {
  const double = memoize((n) => n * 2)
  expect(double(21)).toBe(42)
  expect(double(21)).toBe(42)
})
test('calls the original once per distinct input', () => {
  let calls = 0
  const double = memoize((n) => {
    calls += 1
    return n * 2
  })
  double(1)
  double(1)
  double(2)
  double(1)
  expect(calls).toBe(2)
})
test('tells different argument lists apart', () => {
  let calls = 0
  const add = memoize((a, b) => {
    calls += 1
    return a + b
  })
  expect(add(1, 2)).toBe(3)
  expect(add(2, 1)).toBe(3)
  expect(calls).toBe(2)
})
test('caches a falsy result', () => {
  let calls = 0
  const zero = memoize(() => {
    calls += 1
    return 0
  })
  zero()
  zero()
  expect(calls).toBe(1)
})`,
  },
  {
    id: 'retry',
    title: 'Build retry',
    prompt:
      'Build async retry(fn, attempts): call fn, and if the promise rejects, call it again until it succeeds or every attempt is used. Return the resolved value, or rethrow the error from the final attempt.',
    hints: [
      'Loop up to attempts times and return the moment a call succeeds.',
      'await inside the try so a rejected promise lands in catch, and store the error rather than rethrowing straight away.',
      'After the loop finishes without returning, throw the error you saved from the last attempt.',
    ],
    starter: `type RetryReturnsAPromise = Expect<Equal<ReturnType<typeof retry<string>>, Promise<string>>>`,
    solution: `async function retry<T>(fn: () => Promise<T>, attempts: number): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
    }
  }
  throw lastError
}

type RetryReturnsAPromise = Expect<Equal<ReturnType<typeof retry<string>>, Promise<string>>>`,
    assertions: `test('returns on the first success', async () => {
  let calls = 0
  const value = await retry(async () => {
    calls += 1
    return 'ok'
  }, 3)
  expect(value).toBe('ok')
  expect(calls).toBe(1)
})
test('keeps trying until it succeeds', async () => {
  let calls = 0
  const value = await retry(async () => {
    calls += 1
    if (calls < 3) throw new Error('flaky')
    return 'ok'
  }, 5)
  expect(value).toBe('ok')
  expect(calls).toBe(3)
})
test('gives up after the last attempt', async () => {
  let calls = 0
  const message = await retry(async () => {
    calls += 1
    throw new Error('always down')
  }, 3).catch((error) => error.message)
  expect(message).toBe('always down')
  expect(calls).toBe(3)
})`,
  },
  {
    id: 'lru-cache',
    title: 'Build an LRU cache',
    prompt:
      'Build a class Lru with a capacity given to the constructor. get(key) returns the value or undefined, set(key, value) stores it. Going over capacity drops the least recently used entry, and reading an entry counts as using it.',
    hints: [
      'A Map remembers insertion order, and map.keys().next().value is the oldest key in it.',
      'To mark an entry as just used, delete it and set it again so it moves to the end of that order.',
      'Do the delete-then-set in both get and set, then evict the oldest key whenever size goes past capacity.',
    ],
    starter: `declare const numbers: Lru<string, number>

type GetReturnsMaybeNumber = Expect<Equal<ReturnType<typeof numbers.get>, number | undefined>>`,
    solution: `class Lru<K, V> {
  private entries = new Map<K, V>()

  constructor(private capacity: number) {}

  get(key: K): V | undefined {
    if (!this.entries.has(key)) return undefined
    const value = this.entries.get(key) as V
    this.entries.delete(key)
    this.entries.set(key, value)
    return value
  }

  set(key: K, value: V): void {
    this.entries.delete(key)
    this.entries.set(key, value)
    if (this.entries.size > this.capacity) {
      const oldest = this.entries.keys().next().value as K
      this.entries.delete(oldest)
    }
  }
}

declare const numbers: Lru<string, number>

type GetReturnsMaybeNumber = Expect<Equal<ReturnType<typeof numbers.get>, number | undefined>>`,
    assertions: `test('stores and reads back', () => {
  const cache = new Lru(2)
  cache.set('a', 1)
  expect(cache.get('a')).toBe(1)
})
test('a missing key is undefined', () => expect(new Lru(2).get('nope')).toBe(undefined))
test('evicts the least recently used entry', () => {
  const cache = new Lru(2)
  cache.set('a', 1)
  cache.set('b', 2)
  cache.set('c', 3)
  expect(cache.get('a')).toBe(undefined)
  expect(cache.get('b')).toBe(2)
  expect(cache.get('c')).toBe(3)
})
test('reading an entry protects it from eviction', () => {
  const cache = new Lru(2)
  cache.set('a', 1)
  cache.set('b', 2)
  cache.get('a')
  cache.set('c', 3)
  expect(cache.get('a')).toBe(1)
  expect(cache.get('b')).toBe(undefined)
})
test('overwriting a key does not grow the cache', () => {
  const cache = new Lru(2)
  cache.set('a', 1)
  cache.set('a', 9)
  cache.set('b', 2)
  expect(cache.get('a')).toBe(9)
  expect(cache.get('b')).toBe(2)
})`,
  },
  {
    id: 'event-emitter',
    title: 'Build a typed event emitter',
    prompt:
      'Build a class Emitter for an event map like Events. on(name, listener) registers, emit(name, payload) calls every listener for that name in registration order, off(name, listener) removes one. The payload type has to follow from the event name.',
    hints: [
      'Keep one plain object mapping each event name to its array of listeners.',
      'Give the class a type parameter for the event map, and give each method its own parameter for the event name so the payload type follows from it.',
      'Type the store as { [K in keyof T]?: ((payload: T[K]) => void)[] } and start on, off and emit with <K extends keyof T>.',
    ],
    starter: `type Events = {
  login: { user: string }
  logout: { reason: string }
}

declare const events: Emitter<Events>

type EmitTakesTheLoginPayload = Expect<Equal<Parameters<typeof events.emit<'login'>>[1], { user: string }>>`,
    solution: `type Events = {
  login: { user: string }
  logout: { reason: string }
}

class Emitter<T> {
  private listeners: { [K in keyof T]?: ((payload: T[K]) => void)[] } = {}

  on<K extends keyof T>(name: K, listener: (payload: T[K]) => void): void {
    const existing = this.listeners[name]
    if (existing) existing.push(listener)
    else this.listeners[name] = [listener]
  }

  off<K extends keyof T>(name: K, listener: (payload: T[K]) => void): void {
    const existing = this.listeners[name]
    if (!existing) return
    this.listeners[name] = existing.filter((entry) => entry !== listener)
  }

  emit<K extends keyof T>(name: K, payload: T[K]): void {
    for (const listener of this.listeners[name] ?? []) listener(payload)
  }
}

declare const events: Emitter<Events>

type EmitTakesTheLoginPayload = Expect<Equal<Parameters<typeof events.emit<'login'>>[1], { user: string }>>`,
    assertions: `test('calls a listener with the payload', () => {
  const seen = []
  const emitter = new Emitter()
  emitter.on('login', (payload) => seen.push(payload.user))
  emitter.emit('login', { user: 'ada' })
  expect(seen).toEqual(['ada'])
})
test('calls listeners in registration order', () => {
  const order = []
  const emitter = new Emitter()
  emitter.on('login', () => order.push('first'))
  emitter.on('login', () => order.push('second'))
  emitter.emit('login', { user: 'ada' })
  expect(order).toEqual(['first', 'second'])
})
test('only calls listeners for that event', () => {
  const seen = []
  const emitter = new Emitter()
  emitter.on('logout', () => seen.push('logout'))
  emitter.emit('login', { user: 'ada' })
  expect(seen).toEqual([])
})
test('off removes just that one listener', () => {
  const seen = []
  const emitter = new Emitter()
  const keep = () => seen.push('keep')
  const drop = () => seen.push('drop')
  emitter.on('login', keep)
  emitter.on('login', drop)
  emitter.off('login', drop)
  emitter.emit('login', { user: 'ada' })
  expect(seen).toEqual(['keep'])
})
test('emitting with no listeners is harmless', () => {
  const emitter = new Emitter()
  emitter.emit('login', { user: 'ada' })
  expect(true).toBe(true)
})`,
  },
  {
    id: 'validator',
    title: 'Build a tiny validator',
    prompt:
      'Build string(), number() and objectOf(shape). Each returns a Validator whose check(value, path) gives { ok: true, value } on a match, or { ok: false, path } naming the first field that failed. objectOf checks every field of the shape, and nested failures report a dotted path like profile.name.',
    hints: [
      'string() and number() are small: test typeof and return one of the two result shapes.',
      'objectOf walks the shape’s own keys, running each field’s validator against the matching field of the value, and stops at the first failure.',
      'Type it as objectOf<T>(shape: { [K in keyof T]: Validator<T[K]> }): Validator<T>, and build each child path as parent plus dot plus key.',
    ],
    starter: `type Check<T> = { ok: true; value: T } | { ok: false; path: string }
type Validator<T> = { check: (value: unknown, path: string) => Check<T> }

declare const user: ReturnType<typeof objectOf<{ name: string }>>

type ObjectOfKeepsTheShape = Expect<Equal<ReturnType<typeof user.check>, Check<{ name: string }>>>`,
    solution: `type Check<T> = { ok: true; value: T } | { ok: false; path: string }
type Validator<T> = { check: (value: unknown, path: string) => Check<T> }

function string(): Validator<string> {
  return {
    check: (value, path) => (typeof value === 'string' ? { ok: true, value } : { ok: false, path }),
  }
}

function number(): Validator<number> {
  return {
    check: (value, path) => (typeof value === 'number' ? { ok: true, value } : { ok: false, path }),
  }
}

function objectOf<T>(shape: { [K in keyof T]: Validator<T[K]> }): Validator<T> {
  return {
    check: (value, path) => {
      if (typeof value !== 'object' || value === null) return { ok: false, path }
      const record = value as Record<string, unknown>
      const output = {} as T
      for (const key of Object.keys(shape) as (keyof T)[]) {
        const childPath = path ? \`\${path}.\${String(key)}\` : String(key)
        const result = shape[key].check(record[String(key)], childPath)
        if (!result.ok) return { ok: false, path: result.path }
        output[key] = result.value
      }
      return { ok: true, value: output }
    },
  }
}

declare const user: ReturnType<typeof objectOf<{ name: string }>>

type ObjectOfKeepsTheShape = Expect<Equal<ReturnType<typeof user.check>, Check<{ name: string }>>>`,
    assertions: `test('a string passes', () => expect(string().check('hi', 'root')).toEqual({ ok: true, value: 'hi' }))
test('a wrong string reports its path', () => expect(string().check(5, 'root')).toEqual({ ok: false, path: 'root' }))
test('a number passes', () => expect(number().check(7, 'root')).toEqual({ ok: true, value: 7 }))
test('an object passes', () => {
  const person = objectOf({ name: string(), age: number() })
  expect(person.check({ name: 'ada', age: 36 }, '')).toEqual({ ok: true, value: { name: 'ada', age: 36 } })
})
test('an object names the failing field', () => {
  const person = objectOf({ name: string(), age: number() })
  expect(person.check({ name: 'ada', age: 'old' }, '')).toEqual({ ok: false, path: 'age' })
})
test('nested objects build a dotted path', () => {
  const person = objectOf({ profile: objectOf({ name: string() }) })
  expect(person.check({ profile: { name: 5 } }, '')).toEqual({ ok: false, path: 'profile.name' })
})
test('rejects something that is not an object', () => {
  const person = objectOf({ name: string() })
  expect(person.check('nope', 'root')).toEqual({ ok: false, path: 'root' })
})`,
  },
]
