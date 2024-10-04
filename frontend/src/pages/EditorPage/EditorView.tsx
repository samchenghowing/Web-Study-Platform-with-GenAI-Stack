import * as React from 'react';
import { SetStateAction, Dispatch } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { useTheme } from '@mui/material/styles';
import { EditorConfigType, EditorDocType } from './utils';

interface EditorViewProps {
    editorDoc: EditorDocType;
    editorConfig: EditorConfigType;
    setEditorDoc: Dispatch<SetStateAction<EditorDocType>>;
}

const EditorView: React.FC<EditorViewProps> = (props) => {
    const { editorDoc, editorConfig, setEditorDoc } = props;
    const editorRef = React.useRef(null);

    const getValue = React.useMemo(() => {
        switch (editorConfig.language) {
            case 'js':
                return editorDoc.jsDoc;
            case 'html':
                return editorDoc.htmlDoc;
            case 'css':
                return editorDoc.cssDoc;
            default:
                return '';
        }
    }, [editorConfig.language, editorDoc]);

    const handleChange = (value: string) => {
        const updatedDoc = { ...editorDoc };

        switch (editorConfig.language) {
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

        setEditorDoc(updatedDoc);
    };

    return (
        <CodeMirror
            ref={editorRef}
            value={getValue}
            extensions={[javascript({ jsx: true }), html(), css()]}
            onChange={handleChange}
            height="500px"
            theme={useTheme().palette.mode}
        />
    );
}

export default EditorView;
