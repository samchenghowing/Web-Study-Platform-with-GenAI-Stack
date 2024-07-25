import * as React from 'react';
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const FILEUPLOAD_API_ENDPOINT = "http://localhost:8504/upload";

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
    const [fileSelected, setFileSelected] = React.useState<File>();
    const [uploadTaskUID, setuploadTaskUID] = React.useState("");

    const handleFileChange = function (e: React.ChangeEvent<HTMLInputElement>) {
        const fileList = e.target.files;

        if (!fileList) return;

        setFileSelected(fileList[0]);
    };

    const uploadFile = function (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) {
        if (fileSelected) {
            const formData = new FormData();
            formData.append("files", fileSelected, fileSelected.name);

            fetch(`${FILEUPLOAD_API_ENDPOINT}/pdf`, {
                method: "POST",
                body: formData
            })
            .then(response => response.json())
            .then(json => {
                console.log(json);
                setuploadTaskUID(json.uid);
            })
            .catch(error => {
                console.error(error);
            });
        }
    };

    const checkUploadProgress = function (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) {
        fetch(`${FILEUPLOAD_API_ENDPOINT}/${uploadTaskUID}/status`, {
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
        <>
            <Button
                component="label"
                role={undefined}
                variant="contained"
                tabIndex={-1}
                startIcon={<CloudUploadIcon />}
            >
                Select file to upload
                <VisuallyHiddenInput
                    type="file"
                    multiple
                    onChange={handleFileChange} />
            </Button>
            <button onClick={uploadFile}>Upload</button>
            <button onClick={checkUploadProgress}>Check upload progress</button>
        </>
    );
}
