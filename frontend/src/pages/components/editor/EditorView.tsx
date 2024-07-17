import * as React from 'react';
import { SetStateAction, Dispatch } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';

interface EditorViewProps {
    editorDoc: { jsDoc: string; htmlDoc: string; cssDoc: string };
    editorConfig: { language: string; autoRun: boolean };
    setEditorDoc: Dispatch<SetStateAction<{ jsDoc: string; htmlDoc: string; cssDoc: string }>>;
}

export default function EditorView(props: EditorViewProps) {
    const editorRef = React.useRef(null);

    const getExtensions = (language) => {
        switch (language) {
            case 'js':
                return [javascript({ jsx: true })];
            case 'html':
                return [html()];
            case 'css':
                return [css()];
            default:
                return [];
        }
    };

    const getValue = (language, editorDoc) => {
        switch (language) {
            case 'js':
                return editorDoc.jsDoc;
            case 'html':
                return editorDoc.htmlDoc;
            case 'css':
                return editorDoc.cssDoc;
            default:
                return '';
        }
    };

    // This function is called whenever the content of the editor changes. It updates the corresponding document in the state based on the current language.
    // It first creates a copy of the current editorDoc state.
    // It then updates the appropriate document (jsDoc, htmlDoc, or cssDoc) based on the current language.
    // Finally, it calls props.setEditorDoc to update the state with the modified document.
    const handleChange = (value) => {
        const { language } = props.editorConfig;
        const updatedDoc = { ...props.editorDoc };

        switch (language) {
            case 'js':
                updatedDoc.jsDoc = value;
                break;
            case 'html':
                updatedDoc.htmlDoc = value;
                break;
            case 'css':
                updatedDoc.cssDoc = value;
                break;
            default:
                break;
        }

        props.setEditorDoc(updatedDoc);
    };

    return (
        <CodeMirror
            ref={editorRef}
            value={getValue(props.editorConfig.language, props.editorDoc)}
            extensions={getExtensions(props.editorConfig.language)}
            options={{
                lineNumbers: true,
            }}
            onChange={(value) => handleChange(value)}
            height="200px"
        />
    );
}