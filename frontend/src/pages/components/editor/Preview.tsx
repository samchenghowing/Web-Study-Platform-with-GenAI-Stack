import * as React from 'react';
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
    editorDoc: { jsDoc: string; htmlDoc: string; cssDoc: string };
}

export default function Preview(props: PreviewProps) {
    const [open, setOpen] = React.useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const html = `<html><body><h1>${props.editorDoc.htmlDoc}<h1/><script>${props.editorDoc.jsDoc}</script></body></html>`;

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
                <iframe
                    srcDoc={html}
                    title="Preview"
                    width="100%"
                    height="100px"
                ></iframe>
            </Dialog>
        </React.Fragment>

    )
}