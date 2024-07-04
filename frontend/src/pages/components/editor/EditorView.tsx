import * as React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';

interface EditorViewProps {
    value: string;
    editorMode: string;
    autoRun: boolean;
    onChange: (mode: string) => void;
}

export default function EditorView(props: EditorViewProps) {

    return (
        <CodeMirror
            value={props.value}
            height="200px"
            extensions={[javascript({ jsx: true })]}
            onChange={props.onChange} />
    )
}