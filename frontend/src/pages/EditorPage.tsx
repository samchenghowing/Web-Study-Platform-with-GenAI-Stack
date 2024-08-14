import * as React from 'react';
import Grid from '@mui/material/Unstable_Grid2';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';

import AIChat from './components/editor/AIChat';
import EditorView from './components/editor/EditorView';
import EditorConfig from './components/editor/editorConfig';
import Preview from './components/editor/Preview';
import FileUploader from './components/loader/FileUploader';
import SOLoader from './components/loader/Loader';
import { EditorConfigType, EditorDocType, TaskType } from './components/editor/editorType';

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
	const [task, setTask] = React.useState<TaskType>({
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
		<Stack sx={{ width: '100%' }} spacing={2}>
			<Alert severity="info">
				<AlertTitle>Current task</AlertTitle>
				{question}
			</Alert>
			<Grid container>
				<Grid xs={4}>
					<AIChat
						question={question}
						setQuestion={setQuestion}
						task={task}
						setTask={setTask}
					/>
				</Grid>
				<Grid xs={8}>
					<Preview editorDoc={editorDoc} />
					<EditorConfig
						editorConfig={editorConfig}
						setEditorConfig={setEditorConfig}
						handleCodeSubmit={handleCodeSubmit}
					/>
					<button onClick={checkSubmissionProgress}>Check submit result</button>
					<EditorView
						editorConfig={editorConfig}
						editorDoc={editorDoc}
						setEditorDoc={setEditorDoc}
						colorMode={'light'} // TODO: accept changes from theme
					/>
				</Grid>
				<Grid xs={12}>
					<FileUploader />
					<SOLoader />
				</Grid>
			</Grid>
		</Stack>
	);
}
