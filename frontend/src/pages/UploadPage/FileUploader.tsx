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
    const [uploadTaskUID, setUploadTaskUID] = React.useState<string | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [progress, setProgress] = React.useState<string | null>(null);
    const [uploading, setUploading] = React.useState(false);
    const [checkingProgress, setCheckingProgress] = React.useState(false);
    const [thumbnail, setThumbnail] = React.useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
            setError(null);
            await uploadFile(file);
        }
    };

    const uploadFile = async (file: File) => {
        setUploading(true);
        const formData = new FormData();
        formData.append("files", file, file.name);

        try {
            const response = await fetch(`${FILEUPLOAD_API_ENDPOINT}/pdf`, {
                method: "POST",
                body: formData,
            });
            const json = await response.json();
            console.log(json);

            // Set the upload task UID
            setUploadTaskUID(json.task_id);
            setError(null);

            // Assuming the thumbnail is part of the response
            if (json.files && json.files.length > 0) {
                setThumbnail(json.files[0].thumbnail);
            }
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
                disabled={uploading}
            >
                {uploading ? <CircularProgress size={24} color="inherit" /> : 'Select file to Upload'}
                <VisuallyHiddenInput
                    type="file"
                    onChange={handleFileChange}
                />
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
            {thumbnail && (
                <div>
                    <h3>Uploaded File Thumbnail</h3>
                    <img src={thumbnail} alt="PDF Thumbnail" style={{ maxWidth: '100%', height: 'auto' }} />
                </div>
            )}
        </>
    );
}