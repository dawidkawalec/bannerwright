'use client';

import { Editor, type OnMount } from '@monaco-editor/react';
import { useCallback, useRef } from 'react';

type Props = {
  value: string;
  onChange: (next: string) => void;
  onSave?: () => void;
  language?: 'html' | 'css';
  className?: string;
};

export function MonacoHtmlEditor({ value, onChange, onSave, language = 'html', className }: Props) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  const handleMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;
      if (onSave) {
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => onSave());
      }
    },
    [onSave],
  );

  return (
    <div className={className}>
      <Editor
        height="100%"
        defaultLanguage={language}
        language={language}
        value={value}
        onChange={(v) => onChange(v ?? '')}
        onMount={handleMount}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          wordWrap: 'on',
          tabSize: 2,
          scrollBeyondLastLine: false,
          renderWhitespace: 'selection',
          automaticLayout: true,
          padding: { top: 8, bottom: 8 },
        }}
        theme="vs-dark"
      />
    </div>
  );
}
