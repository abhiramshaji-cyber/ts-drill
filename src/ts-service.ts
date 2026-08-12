import type * as monaco from 'monaco-editor/editor/editor.api'

export type TypeIssue = { line: number; message: string }

type MessageChain = { messageText: string; next?: MessageChain[] }

function flatten(message: string | MessageChain | undefined): string {
  if (typeof message === 'string') return message
  if (!message) return 'unknown type error'
  return [message.messageText, ...(message.next ?? []).map(flatten)].join(' ')
}

async function clientFor(model: monaco.editor.ITextModel) {
  const { getTypeScriptWorker } = await import('monaco-editor/languages/features/typescript/register')
  const getWorker = await getTypeScriptWorker()
  return getWorker(model.uri)
}

async function whileUnchanged<T>(model: monaco.editor.ITextModel, run: () => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const version = model.getVersionId()
    const value = await run()
    if (model.getVersionId() === version) return value
  }
  return run()
}

export function checkTypes(model: monaco.editor.ITextModel): Promise<TypeIssue[]> {
  return whileUnchanged(model, async () => {
    const client = await clientFor(model)
    const uri = model.uri.toString()
    const [syntactic, semantic] = await Promise.all([
      client.getSyntacticDiagnostics(uri),
      client.getSemanticDiagnostics(uri),
    ])
    return [...syntactic, ...semantic]
      .map((diagnostic) => ({
        line: typeof diagnostic.start === 'number' ? model.getPositionAt(diagnostic.start).lineNumber : 1,
        message: flatten(diagnostic.messageText as string | MessageChain),
      }))
      .sort((a, b) => a.line - b.line)
  })
}

export function emitJs(model: monaco.editor.ITextModel): Promise<string> {
  return whileUnchanged(model, async () => {
    const client = await clientFor(model)
    const output = await client.getEmitOutput(model.uri.toString())
    return output.outputFiles.find((file) => file.name.endsWith('.js'))?.text ?? ''
  })
}
