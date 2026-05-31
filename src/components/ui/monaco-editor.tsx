"use client";

import React, { useRef } from "react";
import Editor, { OnMount, BeforeMount, Monaco } from "@monaco-editor/react";
import { editor } from "monaco-editor";

interface MonacoEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  language?: string;
  readOnly?: boolean;
  onMount?: (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => void;
}

export function MonacoEditor({
  value,
  onChange,
  language = "yaml",
  readOnly = false,
  onMount
}: MonacoEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleEditorWillMount: BeforeMount = (monaco: Monaco) => {
    monaco.editor.defineTheme("mocona-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6272a4' },
        { token: 'keyword', foreground: 'ff79c6' },
        { token: 'string', foreground: 'f1fa8c' },
      ],
      colors: {
        "editor.background": "#05070a", 
        "editor.lineHighlightBackground": "#0a0e14",
        "editorCursor.foreground": "#f8f8f2",
        "editor.selectionBackground": "#2dd4bf30",
        "editor.inactiveSelectionBackground": "#2dd4bf10",
        "editorIndentGuide.background": "#ffffff10",
        "editorIndentGuide.activeBackground": "#ffffff30",
      },
    });
  };

  const handleEditorDidMount: OnMount = (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    editorRef.current = editor;
    if (onMount) {
      onMount(editor, monaco);
    }
  };

  return (
    <div className="h-full w-full overflow-hidden bg-[#05070a]">
      <Editor
        height="100%"
        defaultLanguage={language}
        language={language}
        value={value}
        onChange={onChange}
        theme="mocona-dark"
        loading={<div className="h-full w-full bg-[#05070a] flex items-center justify-center text-teal-500/50 text-sm font-mono tracking-widest animate-pulse">INITIALIZING EDITOR...</div>}
        beforeMount={handleEditorWillMount}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: true, renderCharacters: false, scale: 0.75, autohide: "mouseover" },
          scrollBeyondLastLine: true,
          fontSize: 14,
          fontFamily: "'JetBrains Mono', monospace",
          renderLineHighlight: "all",
          readOnly,
          automaticLayout: true,
          padding: { top: 24, bottom: 24 },
          lineNumbers: "on",
          glyphMargin: false,
          folding: true,
          lineDecorationsWidth: 16,
          lineNumbersMinChars: 3,
          hover: { enabled: true }
        }}
      />
    </div>
  );
}
