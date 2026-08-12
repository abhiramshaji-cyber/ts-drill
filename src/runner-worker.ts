import { runHarness } from './harness'

const scope = self as unknown as Worker

scope.onmessage = async (event: MessageEvent<{ js: string; assertions: string }>) => {
  const outcome = await runHarness(event.data.js, event.data.assertions)
  scope.postMessage(outcome)
}
