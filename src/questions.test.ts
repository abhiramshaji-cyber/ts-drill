import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import { SHARED_COMPILER_OPTIONS, TYPE_PRELUDE } from './compiler-options'
import { runHarness } from './harness'
import { QUESTIONS } from './questions'

const VIRTUAL_FILE = '/drill.ts'
const options: ts.CompilerOptions = {
  ...SHARED_COMPILER_OPTIONS,
  target: ts.ScriptTarget.ES2020,
  module: ts.ModuleKind.None,
}

function typeErrors(source: string): string[] {
  const text = `${TYPE_PRELUDE}\n${source}`
  const host = ts.createCompilerHost(options, true)
  const readOriginal = host.getSourceFile.bind(host)
  host.getSourceFile = (name, version, onError, shouldCreate) =>
    name === VIRTUAL_FILE
      ? ts.createSourceFile(VIRTUAL_FILE, text, version, true)
      : readOriginal(name, version, onError, shouldCreate)
  host.fileExists = (name) => name === VIRTUAL_FILE || ts.sys.fileExists(name)
  host.readFile = (name) => (name === VIRTUAL_FILE ? text : ts.sys.readFile(name))
  host.writeFile = () => {}

  const program = ts.createProgram([VIRTUAL_FILE], options, host)
  const file = program.getSourceFile(VIRTUAL_FILE)
  if (!file) throw new Error('virtual file missing from program')
  return [...program.getSyntacticDiagnostics(file), ...program.getSemanticDiagnostics(file)].map((d) =>
    ts.flattenDiagnosticMessageText(d.messageText, ' '),
  )
}

function toJs(source: string): string {
  return ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.None },
  }).outputText
}

describe('question bank', () => {
  it('has unique ids', () => {
    const ids = QUESTIONS.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gives every question a full hint ladder', () => {
    for (const question of QUESTIONS) {
      expect(question.hints.length, question.id).toBeGreaterThanOrEqual(3)
      expect(question.hints.some((hint) => hint.trim() === ''), question.id).toBe(false)
    }
  })

  it('never lets the final hint be the solution', () => {
    for (const question of QUESTIONS) {
      const lastHint = question.hints[question.hints.length - 1]
      expect(lastHint.includes('\n'), question.id).toBe(false)
      expect(lastHint.length, question.id).toBeLessThan(question.solution.length)
    }
  })

  describe.each(QUESTIONS.map((q) => [q.id, q] as const))('%s', (id, question) => {
    it('starter fails the type gate', () => {
      expect(typeErrors(question.starter), `${id} starter should not type check`).not.toEqual([])
    })

    it('solution passes the type gate', () => {
      expect(typeErrors(question.solution), `${id} solution must type check`).toEqual([])
    })

    it('solution passes every assertion', async () => {
      const outcome = await runHarness(toJs(question.solution), question.assertions)
      expect(outcome.kind, id).toBe('results')
      if (outcome.kind !== 'results') return
      expect(outcome.results.filter((r) => !r.passed), id).toEqual([])
    })
  })
})
