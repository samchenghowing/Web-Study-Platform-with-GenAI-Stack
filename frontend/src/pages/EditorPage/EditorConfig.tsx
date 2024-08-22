import * as React from 'react';
import { SetStateAction, Dispatch } from 'react';

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
import GradingIcon from '@mui/icons-material/Grading';
import Preview from './Preview';

interface EditorConfigProps {
    editorConfig: { language: string; autoRun: boolean };
    editorDoc: { jsDoc: string; htmlDoc: string; cssDoc: string };
    setEditorConfig: Dispatch<SetStateAction<{ language: string; autoRun: boolean }>>;
    handleCodeSubmit: () => void;
    checkSubmissionResult: () => void;
}

type Language = 'js' | 'html' | 'css' | null;

const EditorConfig = React.forwardRef<HTMLDivElement, EditorConfigProps>(function EditorConfig(props, ref) {
    const [alignment, setAlignment] = React.useState<Language>('js');

    const handleAlignment = (
        event: React.MouseEvent<HTMLElement>,
        newAlignment: Language
    ) => {
        setAlignment(newAlignment);
        if (newAlignment) {
            props.setEditorConfig(prevState => ({
                ...prevState,
                language: newAlignment
            }));
        }
    };

    const onDownload = () => {
        // Implement download logic here
    };

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static">
                <Toolbar>
                    <Preview editorDoc={props.editorDoc} />
                    <ToggleButtonGroup
                        value={alignment}
                        exclusive
                        onChange={handleAlignment}
                        aria-label="editor language"
                        color="standard"
                    >
                        <Tooltip title="JavaScript Editor">
                            <ToggleButton value="js">
                                <JavascriptIcon />
                            </ToggleButton>
                        </Tooltip>
                        <Tooltip title="HTML Editor">
                            <ToggleButton value="html">
                                <HtmlIcon />
                            </ToggleButton>
                        </Tooltip>
                        <Tooltip title="CSS Editor">
                            <ToggleButton value="css">
                                <CssIcon />
                            </ToggleButton>
                        </Tooltip>
                    </ToggleButtonGroup>

                    <Tooltip title="Submit Code">
                        <IconButton color="inherit" onClick={props.handleCodeSubmit}>
                            <TaskAltIcon />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Check Submit Result">
                        <IconButton color="inherit" onClick={props.checkSubmissionResult}>
                            <GradingIcon />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Save as HTML file">
                        <IconButton color="inherit" onClick={onDownload}>
                            <SaveAsIcon />
                        </IconButton>
                    </Tooltip>
                </Toolbar>
            </AppBar>
        </Box>
    );
});

export default EditorConfig;