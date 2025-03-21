import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import Slide from '@mui/material/Slide';
import { TransitionProps } from '@mui/material/transitions';
import { iframeStyles, consoleOutputStyles } from './styles';

const Transition = React.forwardRef<HTMLDivElement, TransitionProps & { children: React.ReactElement<any> }>(
    function Transition(props, ref) {
        return <Slide direction="up" ref={ref} {...props} />;
    }
);

interface PreviewProps {
    editorDoc: { jsDoc: string; htmlDoc: string; cssDoc: string };
}

export default function Preview({ editorDoc }: PreviewProps) {
    const [open, setOpen] = React.useState(false);
    const [consoleOutput, setConsoleOutput] = React.useState<string[]>([]);

    const handleClickOpen = () => {
        setOpen(true);
        setConsoleOutput([]); // Clear console output when opening
    };

    const handleClose = () => {
        setOpen(false);
    };

    const html = `
        <!DOCTYPE html>
        <html>
            <head>
                <style>${editorDoc.cssDoc}</style>
            </head>
            <body>
                <h1>${editorDoc.htmlDoc}</h1>
                <script>
                    (function() {
                        const originalConsoleLog = console.log;
                        console.log = function(...args) {
                            window.parent.postMessage({ type: 'console-log', args: args }, '*');
                            originalConsoleLog.apply(console, args);
                        };
                    })();
                    ${editorDoc.jsDoc}
                </script>
            </body>
        </html>
    `;

    React.useEffect(() => {
        const handleMessage = (event: MessageEvent<any>) => {
            if (event.data.type === 'console-log') {
                setConsoleOutput(prev => [...prev, ...event.data.args.map(arg => arg.toString())]);
            }
        };

        window.addEventListener('message', handleMessage);

        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    return (
        <React.Fragment>
            <IconButton
                edge="start"
                color="inherit"
                onClick={handleClickOpen}
                aria-label="run preview"
            >
                <PlayArrowIcon />
            </IconButton>
            <Dialog
                fullScreen
                open={open}
                onClose={handleClose}
                TransitionComponent={Transition}
            >
                <AppBar position="relative">
                    <Toolbar>
                        <IconButton
                            edge="start"
                            color="inherit"
                            onClick={handleClose}
                            aria-label="close"
                        >
                            <CloseIcon />
                        </IconButton>
                        <Typography variant="h6" component="div" sx={{ ml: 2, flex: 1 }}>
                            Preview
                        </Typography>
                    </Toolbar>
                </AppBar>
                <iframe
                    srcDoc={html}
                    title="Preview"
                    width="100%"
                    height="80%"
                    style={iframeStyles}
                ></iframe>
                <div style={consoleOutputStyles}>
                    <strong>Console Output:</strong>
                    <pre>{consoleOutput.join('\n')}</pre>
                </div>
            </Dialog>
        </React.Fragment>
    );
}
