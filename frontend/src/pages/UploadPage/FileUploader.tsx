import * as React from 'react';
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CircularProgress from '@mui/material/CircularProgress';

const FILEUPLOAD_API_ENDPOINT = "http://localhost:8504/upload";
const BACKGROUND_TASK_STATUS_ENDPOINT = "http://localhost:8504/bgtask";

const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
});

export default function InputFileUpload() {
    const [fileSelected, setFileSelected] = React.useState<File | null>(null);
    const [uploadTaskUID, setUploadTaskUID] = React.useState<string | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [progress, setProgress] = React.useState<string | null>(null);
    const [uploading, setUploading] = React.useState(false);
    const [checkingProgress, setCheckingProgress] = React.useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = e.target.files;
        if (fileList && fileList.length > 0) {
            const file = fileList[0];
            if (file.type !== 'application/pdf') {
                setError('Please upload a PDF file.');
                return;
            }
            if (file.size > 10485760) { // 10MB size limit
                setError('File size exceeds 10MB limit.');
                return;
            }
            setFileSelected(file);
            setError(null);
        }
    };

    const uploadFile = async () => {
        if (!fileSelected) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("files", fileSelected, fileSelected.name);

        try {
            const response = await fetch(`${FILEUPLOAD_API_ENDPOINT}/pdf`, {
                method: "POST",
                body: formData,
            });
            if (!response.ok) throw new Error('Failed to upload file');
            const json = await response.json();
            setUploadTaskUID(json.uid);
            setError(null);
        } catch (error) {
            setError(error.message);
        } finally {
            setUploading(false);
        }
    };

    const checkUploadProgress = async () => {
        if (!uploadTaskUID) return;

        setCheckingProgress(true);

        try {
            const response = await fetch(`${BACKGROUND_TASK_STATUS_ENDPOINT}/${uploadTaskUID}/status`, {
                method: "GET",
            });
            if (!response.ok) throw new Error('Failed to fetch status');
            const json = await response.json();
            setProgress(json.status);
            setError(null);
        } catch (error) {
            setError(error.message);
        } finally {
            setCheckingProgress(false);
        }
    };

    return (
        <>
            <Button
                component="label"
                variant="contained"
                startIcon={<CloudUploadIcon />}
            >
                Select file to upload
                <VisuallyHiddenInput
                    type="file"
                    onChange={handleFileChange}
                />
            </Button>
            <Button
                variant="contained"
                color="primary"
                onClick={uploadFile}
                disabled={!fileSelected || uploading}
            >
                {uploading ? <CircularProgress size={24} color="inherit" /> : 'Upload'}
            </Button>
            <Button
                variant="contained"
                color="secondary"
                onClick={checkUploadProgress}
                disabled={!uploadTaskUID || checkingProgress}
            >
                {checkingProgress ? <CircularProgress size={24} color="inherit" /> : 'Check upload progress'}
            </Button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {progress && <p>{progress}</p>}
        </>
    );
}
