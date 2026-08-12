export type AssertionResult = { name: string; passed: boolean; detail?: string }

export type RunOutcome =
  | { kind: 'results'; results: AssertionResult[] }
  | { kind: 'error'; message: string }
  | { kind: 'timeout' }

function describe(value: unknown): string {
  if (typeof value === 'string') return JSON.stringify(value)
  if (typeof value === 'bigint') return `${value}n`
  if (value instanceof Error) return value.message
  try {
    return JSON.stringify(value) ?? String(value)
  } catch {
    return String(value)
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  const aKeys = Object.keys(a as object)
  const bKeys = Object.keys(b as object)
  if (aKeys.length !== bKeys.length) return false
  return aKeys.every(
    (key) =>
      Object.prototype.hasOwnProperty.call(b, key) &&
      deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]),
  )
}

function createExpect(actual: unknown) {
  return {
    toBe(expected: unknown) {
      if (!Object.is(actual, expected)) {
        throw new Error(`expected ${describe(expected)}, got ${describe(actual)}`)
      }
    },
    toEqual(expected: unknown) {
      if (!deepEqual(actual, expected)) {
        throw new Error(`expected ${describe(expected)}, got ${describe(actual)}`)
      }
    },
  }
}

export async function runHarness(js: string, assertions: string): Promise<RunOutcome> {
  const queue: { name: string; fn: () => unknown }[] = []
  const test = (name: string, fn: () => unknown) => {
    queue.push({ name, fn })
  }

  try {
    new Function('test', 'expect', `${js}\n;\n${assertions}`)(test, createExpect)
  } catch (error) {
    return { kind: 'error', message: messageOf(error) }
  }

  const results: AssertionResult[] = []
  for (const item of queue) {
    try {
      await item.fn()
      results.push({ name: item.name, passed: true })
    } catch (error) {
      results.push({ name: item.name, passed: false, detail: messageOf(error) })
    }
  }
  return { kind: 'results', results }
}
