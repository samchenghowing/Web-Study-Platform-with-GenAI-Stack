import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import { useTheme } from '@mui/material/styles';
import CodeMirror from '@uiw/react-codemirror';
import { githubLight, githubDark } from '@uiw/codemirror-theme-github';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';

const CodeBlock = ({ language, value }) => {
    return (
        <CodeMirror
            value={value}
            extensions={[markdown({ base: markdownLanguage, codeLanguages: languages })]}
            readOnly={true}
            theme={useTheme().palette.mode === 'light' ? githubLight : githubDark}
        />
    );
};

const MarkdownRenderer = ({ content }) => {
    return (
        <ReactMarkdown
            components={{
                code(props) {
                    const { children, className, node, ...rest } = props
                    const match = /language-(\w+)/.exec(className || '')
                    return match ? (
                        <CodeBlock language={match[1]} value={String(children).replace(/\n$/, '')} />
                    ) : (
                        <code className={className} {...props}>
                            {children}
                        </code>
                    );
                },
            }}
        >
            {content}
        </ReactMarkdown>
    );
};
export default MarkdownRenderer;
