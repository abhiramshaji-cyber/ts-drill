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
  lib: ['lib.es2020.d.ts'],
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

  it('gives every question a full hint ladder with example syntax', () => {
    for (const question of QUESTIONS) {
      expect(question.hints.length, question.id).toBeGreaterThanOrEqual(3)
      for (const hint of question.hints) {
        expect(hint.text.trim(), question.id).not.toBe('')
        expect(hint.code.trim(), question.id).not.toBe('')
      }
    }
  })

  it('never lets a hint hand over the whole solution', () => {
    for (const question of QUESTIONS) {
      for (const hint of question.hints) {
        expect(hint.code.trim(), question.id).not.toBe(question.solution.trim())
        expect(hint.code.length, question.id).toBeLessThan(question.solution.length)
      }
    }
  })

  it('starts every question from a genuinely empty editor', () => {
    for (const question of QUESTIONS) {
      expect(question.starter, question.id).toBe('')
    }
  })

  it('gives every question runtime assertions', () => {
    for (const question of QUESTIONS) {
      expect(question.assertions.trim(), question.id).not.toBe('')
    }
  })

  describe.each(QUESTIONS.map((q) => [q.id, q] as const))('%s', (id, question) => {
    it('starter does not already pass', async () => {
      if (typeErrors(question.starter).length > 0) return
      const outcome = await runHarness(toJs(question.starter), question.assertions)
      const alreadyPasses = outcome.kind === 'results' && outcome.results.every((r) => r.passed)
      expect(alreadyPasses, `${id} starter must not already pass both gates`).toBe(false)
    })

    it('solution passes the type gate', () => {
      expect(typeErrors(question.solution), `${id} solution must type check`).toEqual([])
    })

    it('solution satisfies the hidden signature contract', () => {
      const withContract = `${question.solution}\n${question.typeChecks}`
      expect(typeErrors(withContract), `${id} solution must satisfy its own contract`).toEqual([])
    })

    it('contract rejects the empty editor', () => {
      const withContract = `${question.starter}\n${question.typeChecks}`
      expect(typeErrors(withContract), `${id} contract must not pass on an empty file`).not.toEqual([])
    })

    it('solution passes every assertion', async () => {
      const outcome = await runHarness(toJs(question.solution), question.assertions)
      expect(outcome.kind, id).toBe('results')
      if (outcome.kind !== 'results') return
      expect(outcome.results.filter((r) => !r.passed), id).toEqual([])
    })
  })
})
