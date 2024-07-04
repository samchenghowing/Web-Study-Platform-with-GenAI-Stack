import * as React from 'react';
import { PaletteMode } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import getLPTheme from './getLPTheme';
import Grid from '@mui/material/Unstable_Grid2';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';

import AppAppBar from './components/AppAppBar';
import AIChat from './components/editor/AIChat'
import EditorView from './components/editor/EditorView'
import EditorConfig from './components/editor/editorConfig';

export default () => {
	// theme and css layout
	const [mode, setMode] = React.useState<PaletteMode>('light');
	const LPtheme = createTheme(getLPTheme(mode));
	const toggleColorMode = () => {
		setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
	};

	// code editor
	const [editorMode, setEditorMode] = React.useState("js");
	const [autoRun, setAutoRun] = React.useState(false);
	const [value, setValue] = React.useState("console.log('You can learn anything');");

	// AIChat, TODO: generate the question, task and solution by AIChat
	// Motivation:
	// Instead of asking GenAI to craft a possibliy incorrect question, or 
	// if we can't guarntee the correctness of solution from GenAI, why don't 
	// we create a wrong question and it's corresponing accepted answer pair? 
	const [question, setQuestion] = React.useState("No question assigned yet... Chat with AI to get your tailored task!");
	const [task, setTask] = React.useState("Goodbye world");
	const [solution, setSolution] = React.useState("Hello world!");


	function handleCodeSubmit() {
		console.log('Function ran in EditorConfig');
		// TODO: show loading and send to AI for verification (test cases??)
	}

	function handleTaskAccepted() {
		console.log('Function ran in AIChat');
		setValue(task); // update code in EditorView
	}

	return (
		<ThemeProvider theme={LPtheme}>
			<CssBaseline />
			<Stack sx={{ width: '100%' }} spacing={2}>
				{/* <AppAppBar mode={mode} toggleColorMode={toggleColorMode} /> */}
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
							solution={solution}
							setSolution={setSolution}
							handleTaskAccepted={handleTaskAccepted} />
					</Grid>
					<Grid xs={8}>
						<EditorConfig
							editorMode={editorMode}
							setEditorMode={setEditorMode}
							autoRun={autoRun}
							setAutoRun={setAutoRun}
							handleCodeSubmit={handleCodeSubmit} />
						<EditorView
							value={value}
							onChange={setValue}
							editorMode={''}
							autoRun={false} />
					</Grid>
					<Grid xs={12}>
						{/* <iframe
							srcDoc={`<html><body><script>${value}</script></body></html>`}
							title="Preview"
							width="100%"
							height="100px"
							style={{ border: "1px solid #ccc" }}
						></iframe> */}
					</Grid>
				</Grid>
			</Stack>
		</ThemeProvider>
	);
};
