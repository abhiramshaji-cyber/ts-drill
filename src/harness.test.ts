import { describe, expect as vitestExpect, it } from 'vitest'
import { runHarness } from './harness'

describe('runHarness', () => {
  it('reports passing assertions', async () => {
    const outcome = await runHarness('const two = 2', "test('adds', () => expect(two + 2).toBe(4))")
    vitestExpect(outcome).toEqual({ kind: 'results', results: [{ name: 'adds', passed: true }] })
  })

  it('reports a failing assertion with detail instead of throwing', async () => {
    const outcome = await runHarness('const two = 2', "test('adds', () => expect(two + 2).toBe(5))")
    vitestExpect(outcome.kind).toBe('results')
    if (outcome.kind !== 'results') return
    vitestExpect(outcome.results[0].passed).toBe(false)
    vitestExpect(outcome.results[0].detail).toContain('expected 5, got 4')
  })

  it('deep equals structures', async () => {
    const outcome = await runHarness(
      'const rows = [{ a: 1 }]',
      "test('rows', () => expect(rows).toEqual([{ a: 1 }]))",
    )
    vitestExpect(outcome).toEqual({ kind: 'results', results: [{ name: 'rows', passed: true }] })
  })

  it('distinguishes shallow-equal-looking structures', async () => {
    const outcome = await runHarness(
      'const rows = [{ a: 1, b: 2 }]',
      "test('rows', () => expect(rows).toEqual([{ a: 1 }]))",
    )
    if (outcome.kind !== 'results') throw new Error('expected results')
    vitestExpect(outcome.results[0].passed).toBe(false)
  })

  it('awaits async assertions', async () => {
    const outcome = await runHarness(
      'const later = async () => 9',
      "test('later', async () => expect(await later()).toBe(9))",
    )
    vitestExpect(outcome).toEqual({ kind: 'results', results: [{ name: 'later', passed: true }] })
  })

  it('surfaces a throw in the code body as an error, not a crash', async () => {
    const outcome = await runHarness('throw new Error("boom")', "test('never', () => expect(1).toBe(1))")
    vitestExpect(outcome).toEqual({ kind: 'error', message: 'boom' })
  })

  it('surfaces a syntax error as an error', async () => {
    const outcome = await runHarness('const = = =', '')
    vitestExpect(outcome.kind).toBe('error')
  })

  it('returns no results when there are no assertions', async () => {
    const outcome = await runHarness('const a = 1', '')
    vitestExpect(outcome).toEqual({ kind: 'results', results: [] })
  })
})
