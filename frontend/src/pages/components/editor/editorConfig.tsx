import * as React from 'react';
import { SetStateAction, Dispatch } from 'react';

import { saveAs } from "file-saver"

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import HtmlIcon from '@mui/icons-material/Html';
import CssIcon from '@mui/icons-material/Css';
import JavascriptIcon from '@mui/icons-material/Javascript';
import SaveAsIcon from '@mui/icons-material/SaveAs';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import Switch from '@mui/material/Switch';


interface EditorConfigProps {
    editorConfig: { language: string; autoRun: boolean };
    setEditorConfig: Dispatch<SetStateAction<{ language: string; autoRun: boolean }>>;

    handleCodeSubmit: () => void;
}

const EditorConfig = React.forwardRef(function EditorConfig(props: EditorConfigProps, ref) {
    const [alignment, setAlignment] = React.useState<string | null>('js');

    const handleAlignment = (
        event: React.MouseEvent<HTMLElement>,
        newAlignment: string | null,
    ) => {
        setAlignment(newAlignment);
    };

    const onDownload = React.useCallback(() => {
        let lib = ``;
        // ref.current.lib.map((item) => {
        //     lib += `<script src="${item}"></script>`;
        // });
        // let reset = ``;
        // var html = `
        // 		<!DOCTYPE html>
        // <html lang="en">
        // 	<head><style>${reset}</style><style>${ref.current.css.getValue()}</style></head>
        // 	<body>${ref.current.html.getValue()}${lib}<script type="text/babel" data-presets="react">${ref.current.js.getValue()}</script></body>
        // </html>`;
        // var blob = new Blob([html], { type: "text/html; charset=utf-8" });
        // saveAs(blob, `PenEditor-${new Date().getTime()}.html`);
    }, []);

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static">
                <Toolbar>

                    <ToggleButtonGroup
                        value={alignment}
                        exclusive
                        onChange={handleAlignment}
                        aria-label="text alignment"
                    >
                        <Tooltip title="JS Editor">
                            <ToggleButton value="js" onClick={() => props.setEditorConfig(previousState => {
                                return { ...previousState, language: "js" }
                            })}>
                                <JavascriptIcon />
                            </ToggleButton>
                        </Tooltip>
                        <Tooltip title="Html Editor">
                            <ToggleButton value="html" onClick={() => props.setEditorConfig(previousState => {
                                return { ...previousState, language: "html" }
                            })}>
                                <HtmlIcon />
                            </ToggleButton>
                        </Tooltip>
                        <Tooltip title="Css Editor">
                            <ToggleButton value="css" onClick={() => props.setEditorConfig(previousState => {
                                return { ...previousState, language: "css" }
                            })}>
                                <CssIcon />
                            </ToggleButton>
                        </Tooltip>
                    </ToggleButtonGroup>

                    <Tooltip title="Submit">
                        <IconButton color="inherit" onClick={props.handleCodeSubmit}>
                            <TaskAltIcon />
                        </IconButton>
                    </Tooltip>

                    {/* <Switch
                        checked={autoRun}
                        onChange={(e) => {
                            ref.current.isAuto = e.currentTarget.checked;
                            setAutoRun(e.currentTarget.checked);
                        }} /> */}

                    <Tooltip title="Save as html file">
                        <IconButton onClick={onDownload}>
                            <SaveAsIcon></SaveAsIcon>
                        </IconButton>
                    </Tooltip>

                </Toolbar>
            </AppBar>
        </Box>
    );
});

export default EditorConfig;