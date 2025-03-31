import * as React from 'react';
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CircularProgress from '@mui/material/CircularProgress';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { useAuth } from '../../authentication/AuthContext';

const FILEUPLOAD_API_ENDPOINT = "http://localhost:8504/upload";
const BACKGROUND_TASK_STATUS_ENDPOINT = "http://localhost:8504/bgtask";
const PDF_API_ENDPOINT = 'http://localhost:8504/pdfs';

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

interface PDFData {
    file_id: string;
    filename: string;
    thumbnail: string;
}

export default function FileUploadAndDisplay() {
    const [uploadTaskUID, setUploadTaskUID] = React.useState<string | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [progress, setProgress] = React.useState<string | null>(null);
    const [uploading, setUploading] = React.useState(false);
    const [checkingProgress, setCheckingProgress] = React.useState(false);
    const [cardContent, setCardContent] = React.useState<PDFData[]>([]); // Initialize as an array
    const [taskType, setTaskType] = React.useState<string>("save");
    const { user } = useAuth();

    const fetchPDFs = async () => {
        const abortController = new AbortController();
        try {
            const response = await fetch(PDF_API_ENDPOINT, {
                signal: abortController.signal
            });
            const json = await response.json();
            if (Array.isArray(json)) {
                setCardContent(json); // Ensure json is an array
            } else {
                setError(json.detail);
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error(error);
            }
        }
        return () => abortController.abort();
    };

    React.useEffect(() => {
        fetchPDFs();
    }, []);

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

    const handleTaskTypeChange = (event: SelectChangeEvent) => {
        setTaskType(event.target.value);
    };

    const uploadFile = async (file: File) => {
        setUploading(true);
        const formData = new FormData();
        formData.append("files", file, file.name);
        formData.append("task_type", taskType);
        if (!user?._id) {
            console.log('No user ID available, using sample ID');
            formData.append("user_id", "sample_user_id");
        }
        else formData.append("user_id", user._id);

        try {
            const response = await fetch(`${FILEUPLOAD_API_ENDPOINT}/pdf`, {
                method: "POST",
                body: formData,
            });
            const json = await response.json();
            setUploadTaskUID(json.task_id);
            setError(null);
            fetchPDFs(); // Refresh the list after upload
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

    const deletePDF = async (file_id: string) => {
        if (!window.confirm('Are you sure you want to delete this PDF?')) return;

        try {
            const response = await fetch(`${PDF_API_ENDPOINT}/${file_id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete PDF');
            fetchPDFs(); // Refresh the list after deletion
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <>
            <Select
                value={taskType}
                onChange={handleTaskTypeChange}
                displayEmpty
                inputProps={{ 'aria-label': 'Select task type' }}
            >
                <MenuItem value="save">Cosine similarity only</MenuItem>
                <MenuItem value="graph">Graph RAG</MenuItem>
            </Select>
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
            <Grid container spacing={2}>
                {cardContent.map((pdf, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card sx={{ maxWidth: 345 }}>
                            <CardMedia
                                component="img"
                                alt={pdf.filename}
                                height="140"
                                image={pdf.thumbnail}
                            />
                            <CardContent>
                                <Typography gutterBottom variant="h5" component="div">
                                    {pdf.filename}
                                </Typography>
                            </CardContent>
                            <CardActions>
                                <Button size="small" onClick={() => deletePDF(pdf.file_id)}>Delete</Button>
                                <Button size="small">Share</Button>
                                <Button size="small">Learn More</Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </>
    );
}