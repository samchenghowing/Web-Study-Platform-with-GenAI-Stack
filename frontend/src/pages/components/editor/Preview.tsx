import * as React from 'react';
import parse from 'html-react-parser';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import Slide from '@mui/material/Slide';
import { TransitionProps } from '@mui/material/transitions';

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
        children: React.ReactElement;
    },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

interface PreviewProps {
    editorDoc: string;
}

export default function Preview(props: PreviewProps) {
    const [open, setOpen] = React.useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const html = `<html><body><h1>Hello world<h1/><script>${props.editorDoc}</script></body></html>`;
    const reactElement = parse(html);

    return (
        <React.Fragment>
            <Button variant="outlined" onClick={handleClickOpen}>
                Show Preview
            </Button>
            <Dialog
                fullScreen
                open={open}
                onClose={handleClose}
                TransitionComponent={Transition}
            >
                <AppBar sx={{ position: 'relative' }}>
                    <Toolbar>
                        <IconButton
                            edge="start"
                            color="inherit"
                            onClick={handleClose}
                            aria-label="close"
                        >
                            <CloseIcon />
                        </IconButton>
                        <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
                            Preview
                        </Typography>
                    </Toolbar>
                </AppBar>
                {/* <iframe
                    srcDoc={`<html><body><script>${editorDoc}</script></body></html>`}
                    title="Preview"
                    width="100%"
                    height="100px"
                    style={{ border: "1px solid #ccc" }}
                ></iframe> */}
                {reactElement}
            </Dialog>
        </React.Fragment>

    )
}