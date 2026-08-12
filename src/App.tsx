import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import type * as monaco from 'monaco-editor/editor/editor.api'
import { QUESTIONS } from './questions'
import { checkTypes, emitJs, type TypeIssue } from './ts-service'
import { runSandboxed } from './runner'
import type { AssertionResult } from './harness'
import { loadProgress, saveProgress, type Progress } from './progress'
import { useIdleHints } from './useIdleHints'

const Editor = lazy(() => import('./Editor').then((module) => ({ default: module.Editor })))

function firstUnsolved(progress: Progress): number {
  const index = QUESTIONS.findIndex((question) => !progress.solved.includes(question.id))
  return index === -1 ? 0 : index
}

export default function App() {
  const [progress, setProgress] = useState<Progress>(loadProgress)
  const [index, setIndex] = useState(() => firstUnsolved(loadProgress()))
  const [issues, setIssues] = useState<TypeIssue[] | null>(null)
  const [results, setResults] = useState<AssertionResult[] | null>(null)
  const [fault, setFault] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [usedSolution, setUsedSolution] = useState(false)

  const modelRef = useRef<monaco.editor.ITextModel | null>(null)
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const checkTimer = useRef(0)

  const question = QUESTIONS[index]
  const isSolved = progress.solved.includes(question.id)
  const { revealed, noteActivity, revealNext } = useIdleHints(question.hints.length, !isSolved, question.id)

  useEffect(() => {
    setIssues(null)
    setResults(null)
    setFault(null)
    setUsedSolution(false)
  }, [question.id])

  const scheduleCheck = useCallback(() => {
    window.clearTimeout(checkTimer.current)
    checkTimer.current = window.setTimeout(async () => {
      const model = modelRef.current
      if (model) setIssues(await checkTypes(model))
    }, 400)
  }, [])

  useEffect(() => () => window.clearTimeout(checkTimer.current), [])

  const onContentChange = useCallback(() => {
    noteActivity()
    setResults(null)
    setFault(null)
    scheduleCheck()
  }, [noteActivity, scheduleCheck])

  const markSolved = useCallback(() => {
    const current = loadProgress()
    if (current.solved.includes(question.id)) return
    const next: Progress = {
      solved: [...current.solved, question.id],
      streak: usedSolution ? 0 : current.streak + 1,
    }
    saveProgress(next)
    setProgress(next)
  }, [question.id, usedSolution])

  const run = useCallback(async () => {
    const model = modelRef.current
    if (!model || running) return
    setRunning(true)
    setFault(null)
    try {
      const found = await checkTypes(model)
      setIssues(found)
      if (found.length > 0) {
        setResults(null)
        return
      }
      const outcome = await runSandboxed(await emitJs(model), question.assertions)
      if (outcome.kind === 'timeout') {
        setResults(null)
        setFault('Stopped after 2 seconds. Look for a loop that never finishes.')
        return
      }
      if (outcome.kind === 'error') {
        setResults(null)
        setFault(outcome.message)
        return
      }
      setResults(outcome.results)
      if (outcome.results.every((result) => result.passed)) markSolved()
    } finally {
      setRunning(false)
    }
  }, [markSolved, question.assertions, running])

  const goNext = useCallback(() => setIndex((current) => (current + 1) % QUESTIONS.length), [])
  const goPrev = useCallback(() => setIndex((current) => (current - 1 + QUESTIONS.length) % QUESTIONS.length), [])

  const showSolution = useCallback(() => {
    setUsedSolution(true)
    editorRef.current?.setValue(question.solution)
    editorRef.current?.focus()
  }, [question.solution])

  const reset = useCallback(() => {
    editorRef.current?.setValue(question.starter)
    editorRef.current?.focus()
  }, [question.starter])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key !== 'Enter') return
      event.preventDefault()
      if (isSolved) goNext()
      else void run()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [goNext, isSolved, run])

  const typesClean = issues !== null && issues.length === 0
  const graded = results !== null
  const allPassed = graded && results.every((result) => result.passed)

  return (
    <div className="app">
      <header className="bar">
        <span className="mark">ts drill</span>
        <nav className="stepper">
          <button onClick={goPrev} aria-label="previous question">←</button>
          <span>
            {index + 1} / {QUESTIONS.length}
          </span>
          <button onClick={goNext} aria-label="next question">→</button>
        </nav>
        <span className="score">
          {progress.solved.length} solved
          {progress.streak > 0 && <em> · {progress.streak} streak</em>}
        </span>
      </header>

      <main className="body">
        <Suspense fallback={<div className="editor booting">starting editor</div>}>
          <Editor
            questionId={question.id}
            starter={question.starter}
            editorRef={editorRef}
            onModel={(model) => {
              modelRef.current = model
              if (model) scheduleCheck()
            }}
            onContentChange={onContentChange}
          />
        </Suspense>

        <aside className="rail">
          <section>
            <h1>{question.title}</h1>
            <p className="prompt">{question.prompt}</p>
          </section>

          <section className="actions">
            <button className="primary" onClick={() => void run()} disabled={running}>
              {running ? 'checking' : isSolved ? 'run again' : 'run'} <kbd>⌘↵</kbd>
            </button>
            <button onClick={reset}>reset</button>
            <button onClick={showSolution}>solution</button>
          </section>

          {isSolved && (
            <p className="solved">
              Solved. <button className="link" onClick={goNext}>next question →</button>
            </p>
          )}

          <section>
            <h2>
              Types
              <i className={issues === null ? 'dot' : typesClean ? 'dot ok' : 'dot bad'} />
            </h2>
            {issues === null && <p className="muted">Checking.</p>}
            {typesClean && <p className="muted">No type errors.</p>}
            {issues !== null && issues.length > 0 && (
              <ul className="issues">
                {issues.map((issue, position) => (
                  <li key={`${issue.line}-${position}`}>
                    <span className="line">L{issue.line}</span> {issue.message}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2>
              Tests
              {graded && <i className={allPassed ? 'dot ok' : 'dot bad'} />}
            </h2>
            {fault && <p className="fault">{fault}</p>}
            {!fault && !graded && <p className="muted">Run to check it works.</p>}
            {!fault && graded && (
              <ul className="results">
                {results.map((result) => (
                  <li key={result.name} className={result.passed ? 'pass' : 'fail'}>
                    <span>{result.passed ? '✓' : '✕'}</span>
                    <div>
                      {result.name}
                      {result.detail && <em>{result.detail}</em>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="hints">
            <h2>Hints</h2>
            {revealed === 0 ? (
              <p className="muted">Pause for 10 seconds and the first hint appears.</p>
            ) : (
              <ol>
                {question.hints.slice(0, revealed).map((hint) => (
                  <li key={hint}>{hint}</li>
                ))}
              </ol>
            )}
            {revealed < question.hints.length && (
              <button className="link" onClick={revealNext}>
                reveal hint {revealed + 1} of {question.hints.length}
              </button>
            )}
          </section>
        </aside>
      </main>
    </div>
  )
}
