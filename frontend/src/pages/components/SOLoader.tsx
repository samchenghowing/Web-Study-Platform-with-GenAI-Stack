import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

const LOADSO_API_ENDPOINT = "http://localhost:8504/load";
const BACKGROUND_TASK_STATUS_ENDPOINT = "http://localhost:8504/bgtask";

export default function FormDialog() {
    const [open, setOpen] = React.useState(false);
    const [uploadTaskUID, setuploadTaskUID] = React.useState("");

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const checkUploadProgress = function (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) {
        fetch(`${BACKGROUND_TASK_STATUS_ENDPOINT}/${uploadTaskUID}/status`, {
            method: "Get"
        })
            .then(response => response.json())
            .then(json => {
                console.log(json)
            })
            .catch(error => {
                console.error(error);
            });
    };

    return (
        <React.Fragment>
            <Button variant="outlined" onClick={handleClickOpen}>
                Load Data from stack overflow
            </Button>
            <Dialog
                open={open}
                onClose={handleClose}
                PaperProps={{
                    component: 'form',
                    onSubmit: (event: React.FormEvent<HTMLFormElement>) => {
                        event.preventDefault();
                        const formData = new FormData(event.currentTarget);
                        const formJson = Object.fromEntries((formData as any).entries());
                        const tag = formJson.tag;

                        fetch(`${LOADSO_API_ENDPOINT}/stackoverflow`, {
                            method: "POST",
                            body: tag
                        })
                        .then(response => response.json())
                        .then(json => {
                            console.log(json);
                            setuploadTaskUID(json.uid);
                        })
                        .catch(error => {
                            console.error(error);
                        });             

                        console.log(tag);
                        handleClose();
                    },
                }}
            >
                <DialogTitle>Loader</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        To subscribe to this website, please enter the target tag here. We
                        will load the data with given tag to neo4j database.
                    </DialogContentText>
                    <TextField
                        autoFocus
                        required
                        margin="dense"
                        id="tag"
                        name="tag"
                        label="Tag"
                        fullWidth
                        variant="standard"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button type="submit">Import</Button>
                </DialogActions>
            </Dialog>
            <button onClick={checkUploadProgress}>Check upload progress</button>
        </React.Fragment>
    );
}
