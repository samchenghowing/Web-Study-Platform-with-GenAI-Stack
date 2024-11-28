import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import { useTheme } from '@mui/material/styles';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { coldarkCold, coldarkDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const CodeBlock = ({ language, value }) => {
    const theme = useTheme().palette.mode === 'light' ? coldarkCold : coldarkDark;
    return (
        <SyntaxHighlighter language={language} style={theme} showLineNumbers={true} wrapLines={true}>
            {value}
        </SyntaxHighlighter>
    );
};

const MarkdownRenderer = ({ content }) => {
    return (
        <ReactMarkdown
            components={{
                code(props) {
                    const { children, className, ...rest } = props;
                    const match = /language-(\w+)/.exec(className || '');
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
