import './monaco-contributions'
import './monaco-setup'
import { useEffect, useRef, type RefObject } from 'react'
import * as monaco from 'monaco-editor/editor/editor.api'

type Props = {
  questionId: string
  starter: string
  editorRef: RefObject<monaco.editor.IStandaloneCodeEditor | null>
  onModel: (model: monaco.editor.ITextModel | null) => void
  onContentChange: () => void
}

export function Editor({ questionId, starter, editorRef, onModel, onContentChange }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const callbacks = useRef({ onModel, onContentChange })
  callbacks.current = { onModel, onContentChange }

  useEffect(() => {
    if (!host.current) return
    const editor = monaco.editor.create(host.current, {
      theme: 'drill',
      language: 'typescript',
      automaticLayout: true,
      fontSize: 14,
      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
      fontLigatures: true,
      lineHeight: 1.7,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      padding: { top: 24, bottom: 24 },
      renderLineHighlight: 'none',
      overviewRulerLanes: 0,
      hideCursorInOverviewRuler: true,
      scrollbar: { vertical: 'auto', horizontalSliderSize: 8, verticalSliderSize: 8 },
      lineNumbersMinChars: 3,
      glyphMargin: false,
      folding: false,
      tabSize: 2,
      cursorBlinking: 'phase',
      smoothScrolling: true,
      suggestSelection: 'first',
      quickSuggestions: { other: true, comments: false, strings: false },
      parameterHints: { enabled: true },
      bracketPairColorization: { enabled: true },
    })
    editorRef.current = editor
    return () => {
      editorRef.current = null
      editor.dispose()
    }
  }, [editorRef])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    const uri = monaco.Uri.parse(`file:///${questionId}.ts`)
    monaco.editor.getModel(uri)?.dispose()
    const model = monaco.editor.createModel(starter, 'typescript', uri)
    editor.setModel(model)
    editor.focus()
    callbacks.current.onModel(model)
    const subscription = model.onDidChangeContent(() => callbacks.current.onContentChange())
    return () => {
      subscription.dispose()
      callbacks.current.onModel(null)
      model.dispose()
    }
  }, [questionId, starter, editorRef])

  return <div className="editor" ref={host} />
}
