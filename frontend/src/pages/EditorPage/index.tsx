import * as React from 'react';
import Grid from '@mui/material/Unstable_Grid2';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Snackbar, { SnackbarCloseReason } from '@mui/material/Snackbar';

import AIChat from './AIChat';
import EditorView from './EditorView';
import EditorConfig from './EditorConfig';
import ResizablePanel from './ResizablePanel';
import { EditorConfigType, EditorDocType } from './utils';

const SUBMIT_API_ENDPOINT = 'http://localhost:8504/submit';
const BACKGROUND_TASK_STATUS_ENDPOINT = 'http://localhost:8504/bgtask';

export default function MainComponent() {
	const [editorConfig, setEditorConfig] = React.useState<EditorConfigType>({
		language: 'js',
		autoRun: false,
	});
	const [editorDoc, setEditorDoc] = React.useState<EditorDocType>({
		jsDoc: 'Goodbye world',
		htmlDoc: 'Hello world',
		cssDoc: '',
	});
	const [question, setQuestion] = React.useState('No question assigned yet... Chat with AI to get your tailored task!');
	const [task, setTask] = React.useState<EditorDocType>({
		jsDoc: 'console.log(\'You can learn anything\');',
		htmlDoc: 'Hello world',
		cssDoc: '',
	});
	const [aiChatWidth, setAiChatWidth] = React.useState<number>(600); // Initial width in pixels

	const [submissionUID, setSubmissionUID] = React.useState<string>('');
	const [snackbarOpen, setSnackbarOpen] = React.useState(false);
	const [snackbarText, setSnackbarText] = React.useState<string>('');


	const handleClose = (
		event: React.SyntheticEvent | Event,
		reason?: SnackbarCloseReason,
	) => {
		if (reason === 'clickaway') {
			return;
		}
		setSnackbarOpen(false);
	};

	const handleCodeSubmit = async () => {
		try {
			const response = await fetch(SUBMIT_API_ENDPOINT, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(editorDoc),
			});
			const json = await response.json();
			setSubmissionUID(json.uid);
		} catch (error) {
			console.error(error);
			setSnackbarText("Quiz submission error");
			setSnackbarOpen(true);
		} finally {
			setSnackbarText("Quiz submitted and waiting for process");
			setSnackbarOpen(true);
		}
	};

	const checkSubmissionResult = async () => {
		if (!submissionUID) return;
		try {
			const response = await fetch(`${BACKGROUND_TASK_STATUS_ENDPOINT}/${submissionUID}/status`);
			const json = await response.json();
			console.log(json);
			setSnackbarText(json.status);
			setSnackbarOpen(true);
		} catch (error) {
			console.error(error);
		}
	};

	React.useEffect(() => {
		setEditorDoc(task);
	}, [task]);

	return (
		<Stack>
			<Grid container spacing={1}>
				<Grid>
					<ResizablePanel
						width={aiChatWidth}
						onWidthChange={setAiChatWidth}
						minWidth={300} // Minimum width in pixels
						maxWidth={600} // Maximum width in pixels
					>
						<Alert severity="info">
							<AlertTitle>Current task</AlertTitle>
							{question}
						</Alert>
						<AIChat
							question={question}
							setQuestion={setQuestion}
							task={task}
							setTask={setTask}
						/>
					</ResizablePanel>
				</Grid>
				<Grid xs>
					<EditorConfig
						editorConfig={editorConfig}
						editorDoc={editorDoc}
						setEditorConfig={setEditorConfig}
						handleCodeSubmit={handleCodeSubmit}
						checkSubmissionResult={checkSubmissionResult}
					/>
					<EditorView
						editorConfig={editorConfig}
						editorDoc={editorDoc}
						setEditorDoc={setEditorDoc}
					/>
				</Grid>
			</Grid>

			<Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleClose}>
				<Alert
					onClose={handleClose}
					severity="success"
					variant="filled"
					sx={{ width: '100%' }}
				>
					{snackbarText}
				</Alert>
			</Snackbar>

		</Stack>
	);
}
