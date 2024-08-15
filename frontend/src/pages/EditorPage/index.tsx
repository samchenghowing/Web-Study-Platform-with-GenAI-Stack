import * as React from 'react';
import Grid from '@mui/material/Unstable_Grid2';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';

import AIChat from './AIChat';
import EditorView from './EditorView';
import EditorConfig from './EditorConfig';
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
	const [submissionUID, setSubmissionUID] = React.useState<string>('');
	const [loading, setLoading] = React.useState<boolean>(false);

	const handleCodeSubmit = async () => {
		setLoading(true);
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
		} finally {
			setLoading(false);
		}
	};

	const checkSubmissionProgress = async () => {
		if (!submissionUID) return;
		try {
			const response = await fetch(`${BACKGROUND_TASK_STATUS_ENDPOINT}/${submissionUID}/status`);
			const json = await response.json();
			console.log(json);
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
				<Grid xs={4}>
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
				</Grid>
				<Grid xs={8}>
					<EditorConfig
						editorConfig={editorConfig}
						editorDoc={editorDoc}
						setEditorConfig={setEditorConfig}
						handleCodeSubmit={handleCodeSubmit}
					/>
					<button onClick={checkSubmissionProgress}>Check submit result</button>
					<EditorView
						editorConfig={editorConfig}
						editorDoc={editorDoc}
						setEditorDoc={setEditorDoc}
					/>
				</Grid>
			</Grid>
		</Stack>
	);
}
