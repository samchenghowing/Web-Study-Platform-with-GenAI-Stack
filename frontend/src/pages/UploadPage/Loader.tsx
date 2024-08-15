import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';

const LOADSO_API_ENDPOINT = "http://localhost:8504/load";
const BACKGROUND_TASK_STATUS_ENDPOINT = "http://localhost:8504/bgtask";

export default function FormDialog() {
    const [open, setOpen] = React.useState(false);
    const [uploadTaskUID, setuploadTaskUID] = React.useState("");
    const [loadType, setLoadType] = React.useState('stackoverflow'); // 'stackoverflow' or 'website'

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleLoadTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setLoadType(event.target.value);
    };

    const checkUploadProgress = () => {
        fetch(`${BACKGROUND_TASK_STATUS_ENDPOINT}/${uploadTaskUID}/status`, {
            method: "GET"
        })
            .then(response => response.json())
            .then(json => {
                console.log(json);
            })
            .catch(error => {
                console.error(error);
            });
    };

    return (
        <React.Fragment>
            <Button variant="outlined" onClick={handleClickOpen}>
                Load Data
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

                        const url = loadType === 'stackoverflow'
                            ? `${LOADSO_API_ENDPOINT}/stackoverflow`
                            : `${LOADSO_API_ENDPOINT}/website`;

                        fetch(url, {
                            method: "POST",
                            body: JSON.stringify(loadType === 'stackoverflow' ? { tag: formJson.tag } : { url: formJson.url }),
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        })
                            .then(response => response.json())
                            .then(json => {
                                console.log(json);
                                setuploadTaskUID(json.uid);
                            })
                            .catch(error => {
                                console.error(error);
                            });

                        handleClose();
                    }
                }}
            >
                <DialogTitle>Loader</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        To load data, please select the source and provide the necessary information.
                    </DialogContentText>
                    <FormControl component="fieldset">
                        <FormLabel component="legend">Source</FormLabel>
                        <RadioGroup
                            aria-label="load-type"
                            name="loadType"
                            value={loadType}
                            onChange={handleLoadTypeChange}
                        >
                            <FormControlLabel value="stackoverflow" control={<Radio />} label="Stack Overflow" />
                            <FormControlLabel value="website" control={<Radio />} label="Website" />
                        </RadioGroup>
                    </FormControl>
                    {loadType === 'stackoverflow' && (
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
                    )}
                    {loadType === 'website' && (
                        <TextField
                            autoFocus
                            required
                            margin="dense"
                            id="url"
                            name="url"
                            label="URL"
                            fullWidth
                            variant="standard"
                        />
                    )}
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
