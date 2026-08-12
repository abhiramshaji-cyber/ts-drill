import RunnerWorker from './runner-worker?worker'
import type { RunOutcome } from './harness'

export function runSandboxed(js: string, assertions: string, timeoutMs = 2000): Promise<RunOutcome> {
  return new Promise((resolve) => {
    const worker = new RunnerWorker()
    let settled = false

    const finish = (outcome: RunOutcome) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      worker.terminate()
      resolve(outcome)
    }

    const timer = setTimeout(() => finish({ kind: 'timeout' }), timeoutMs)
    worker.onmessage = (event: MessageEvent<RunOutcome>) => finish(event.data)
    worker.onerror = (event) => finish({ kind: 'error', message: event.message || 'worker crashed' })
    worker.postMessage({ js, assertions })
  })
}
