import * as React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';

interface EditorViewProps {
    editorDoc: string;
    editorConfig: { language: string; autoRun: boolean };

    onChange: (mode: string) => void;
}

export default function EditorView(props: EditorViewProps) {

    return (
        <CodeMirror
            value={props.editorDoc}
            height="200px"
            extensions={[javascript({ jsx: true })]}
            onChange={props.onChange} />
    )
}