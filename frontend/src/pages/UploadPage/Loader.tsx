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
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';

const LOADSO_API_ENDPOINT = "http://localhost:8504/load";
const BACKGROUND_TASK_STATUS_ENDPOINT = "http://localhost:8504/bgtask";

type FormDataValues = {
    tag?: string;
    url?: string;
};

export default function FormDialog() {
    const [open, setOpen] = React.useState(false);
    const [uploadTaskUID, setUploadTaskUID] = React.useState<string | null>(null);
    const [loadType, setLoadType] = React.useState<'stackoverflow' | 'website'>('stackoverflow');
    const [snackbarOpen, setSnackbarOpen] = React.useState(false);
    const [snackbarMessage, setSnackbarMessage] = React.useState<string | null>(null);
    const [isCheckingProgress, setIsCheckingProgress] = React.useState(false);
    const [uploadProgress, setUploadProgress] = React.useState<string | null>(null);

    const handleClickOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const handleLoadTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setLoadType(event.target.value as 'stackoverflow' | 'website');
    };

    const fetchData = async (url: string, payload: object) => {
        try {
            const response = await fetch(url, {
                method: "POST",
                body: JSON.stringify(payload),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Server error');
            }

            return await response.json();
        } catch (error) {
            console.error('Fetch error:', error);
            setSnackbarMessage('Failed to load data: ' + error.message);
            setSnackbarOpen(true);
            throw error;
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const formJson: FormDataValues = Object.fromEntries(formData.entries()) as FormDataValues;

        const url = loadType === 'stackoverflow'
            ? `${LOADSO_API_ENDPOINT}/stackoverflow`
            : `${LOADSO_API_ENDPOINT}/website`;

        const payload = loadType === 'stackoverflow'
            ? { tag: formJson.tag }
            : { url: formJson.url };

        console.log('Payload:', payload);

        try {
            const json = await fetchData(url, payload);
            console.log('Response JSON:', json);
            setUploadTaskUID(json.uid);
            setSnackbarMessage('Data loaded successfully!');
            setSnackbarOpen(true);
        } catch (error) {
            console.error('Error:', error);
        }

        handleClose();
    };

    const checkUploadProgress = async () => {
        if (uploadTaskUID) {
            setIsCheckingProgress(true);
            setUploadProgress(null);
            try {
                const response = await fetch(`${BACKGROUND_TASK_STATUS_ENDPOINT}/${uploadTaskUID}/status`, {
                    method: "GET"
                });
                const json = await response.json();
                console.log(json);
                setUploadProgress(`Upload Status: ${json.status}`);
            } catch (error) {
                console.error(error);
                setUploadProgress('Failed to retrieve upload status.');
            } finally {
                setIsCheckingProgress(false);
            }
        }
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
                    onSubmit: handleSubmit
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
            {uploadTaskUID && (
                <Button
                    onClick={checkUploadProgress}
                    disabled={isCheckingProgress}
                >
                    {isCheckingProgress ? 'Checking progress...' : 'Check upload progress'}
                </Button>
            )}
            {uploadProgress && (
                <Typography variant="body2" color="textSecondary">
                    {uploadProgress}
                </Typography>
            )}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={() => setSnackbarOpen(false)}
            >
                <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarMessage?.includes('Failed') ? 'error' : 'success'}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </React.Fragment>
    );
}
