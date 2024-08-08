import * as React from 'react';
import { PaletteMode } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import getLPTheme from './getLPTheme';
import Grid from '@mui/material/Unstable_Grid2';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';

import AIChat from './components/editor/AIChat'
import EditorView from './components/editor/EditorView'
import EditorConfig from './components/editor/editorConfig';
import Preview from './components/editor/Preview';
import FileUploader from './components/FileUploader';
import SOLoader from './components/SOLoader';

const SUBMIT_API_ENDPOINT = 'http://localhost:8504/submit';
const BACKGROUND_TASK_STATUS_ENDPOINT = "http://localhost:8504/bgtask";

export default () => {
	// theme and css layout
	const [mode, setMode] = React.useState<PaletteMode>('light');
	const LPtheme = createTheme(getLPTheme(mode));
	const toggleColorMode = () => {
		setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
	};

	// code editor
	const [editorConfig, setEditorConfig] = React.useState({
		language: 'js',
		autoRun: false,
	});
	const [editorDoc, setEditorDoc] = React.useState({
		jsDoc: 'Goodbye world',
		htmlDoc: 'Hello world',
		cssDoc: '',
	});

	// AIChat
	const [question, setQuestion] = React.useState('No question assigned yet... Chat with AI to get your tailored task!');
	const [task, setTask] = React.useState({
		jsDoc: 'console.log(\'You can learn anything\');',
		htmlDoc: 'Hello world',
		cssDoc: '',
	});

	const [submissionUID, setsubmissionUID] = React.useState("");
	function handleCodeSubmit() {
		// TODO: show loading and send to AI for verification (test cases??)
		fetch(SUBMIT_API_ENDPOINT, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				'jsDoc': editorDoc.jsDoc,
				'htmlDoc': editorDoc.htmlDoc,
				'cssDoc': editorDoc.cssDoc,
			})
		})
			.then(response => response.json())
			.then(json => {
				console.log(json);
				setsubmissionUID(json.uid);
			})
			.catch(error => {
				console.error(error);
			});
	}
	const checkSubmissionProgress = function (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) {
		fetch(`${BACKGROUND_TASK_STATUS_ENDPOINT}/${submissionUID}/status`, {
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

	React.useEffect(() => {
		// when receive new task from AIChat, update code in EditorView
		setEditorDoc(task);
	}, [task]);

	return (
		<ThemeProvider theme={LPtheme}>
			<CssBaseline />
			<Stack sx={{ width: '100%' }} spacing={2}>
				{/* <AppAppBar mode={mode} toggleColorMode={toggleColorMode} /> */}
				<Alert severity='info'>
					<AlertTitle>Current task</AlertTitle>
					{question}
				</Alert>
				<Grid container>
					<Grid xs={4}>
						<AIChat
							question={question}
							setQuestion={setQuestion}
							task={task}
							setTask={setTask} />
					</Grid>
					<Grid xs={8}>
						<Preview
							editorDoc={editorDoc} />
						<EditorConfig
							editorConfig={editorConfig}
							setEditorConfig={setEditorConfig}
							handleCodeSubmit={handleCodeSubmit} />
						<button onClick={checkSubmissionProgress}>Check submit result</button>
						<EditorView
							editorConfig={editorConfig}
							editorDoc={editorDoc}
							setEditorDoc={setEditorDoc} />
					</Grid>
					<Grid xs={12}>
						<FileUploader />
						<SOLoader />
					</Grid>
				</Grid>
			</Stack>
		</ThemeProvider>
	);
};
