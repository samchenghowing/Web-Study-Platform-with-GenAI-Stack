import * as React from 'react';
import { PaletteMode } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import getLPTheme from './getLPTheme';
import Grid from '@mui/material/Unstable_Grid2';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';

import AppAppBar from './components/Header';
import AIChat from './components/editor/AIChat'
import EditorView from './components/editor/EditorView'
import EditorConfig from './components/editor/editorConfig';
import Preview from './components/editor/Preview';
import FileUploader from './components/FileUploader';

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
	// TODO: generate the question, task and solution by AIChat
	// Motivation:
	// Instead of asking GenAI to craft a possibliy incorrect question, or 
	// if we can't guarntee the correctness of solution from GenAI, why don't 
	// we create a wrong question and it's corresponing accepted answer pair? 
	const [question, setQuestion] = React.useState('No question assigned yet... Chat with AI to get your tailored task!');
	const [task, setTask] = React.useState({
		jsDoc: 'console.log(\'You can learn anything\');',
		htmlDoc: 'Hello world',
		cssDoc: '',
	});

	function handleCodeSubmit() {
		console.log('Function ran in EditorConfig');
		// TODO: show loading and send to AI for verification (test cases??)
		// result = getSubmittionResultFromApi()
	}

	const getSubmittionResultFromApi = () => {
		return fetch('http://localhost:8504/submit')
			.then(response => response.json())
			.then(json => {
				return json.result;
			})
			.catch(error => {
				console.error(error);
			});
	}

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
						<EditorConfig
							editorConfig={editorConfig}
							setEditorConfig={setEditorConfig}
							handleCodeSubmit={handleCodeSubmit} />
						<EditorView
							editorConfig={editorConfig}
							editorDoc={editorDoc}
							setEditorDoc={setEditorDoc} />
					</Grid>
					<Grid xs={12}>
						<Preview
							editorDoc={editorDoc} />
						<FileUploader />
					</Grid>
				</Grid>
			</Stack>
		</ThemeProvider>
	);
};
