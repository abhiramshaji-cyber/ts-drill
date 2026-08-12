import 'monaco-editor/languages/definitions/typescript/register'
import * as monaco from 'monaco-editor/editor/editor.api'
import { ModuleKind, ScriptTarget, typescriptDefaults } from 'monaco-editor/languages/features/typescript/register'
import editorWorker from 'monaco-editor/editor/editor.worker?worker'
import tsWorker from 'monaco-editor/languages/features/typescript/ts.worker?worker'
import { SHARED_COMPILER_OPTIONS, TYPE_PRELUDE } from './compiler-options'

self.MonacoEnvironment = {
  getWorker(_workerId, label) {
    return label === 'typescript' || label === 'javascript' ? new tsWorker() : new editorWorker()
  },
}

typescriptDefaults.setCompilerOptions({
  ...SHARED_COMPILER_OPTIONS,
  target: ScriptTarget.ES2020,
  module: ModuleKind.None,
  lib: ['es2020'],
  allowNonTsExtensions: true,
})

typescriptDefaults.setDiagnosticsOptions({ noSemanticValidation: false, noSyntaxValidation: false })
typescriptDefaults.setEagerModelSync(true)
typescriptDefaults.addExtraLib(TYPE_PRELUDE, 'file:///drill-prelude.d.ts')

monaco.editor.defineTheme('drill', {
  base: 'vs-dark',
  inherit: true,
  colors: { 'editor.background': '#0d0f13', 'editorGutter.background': '#0d0f13' },
  rules: [],
})
