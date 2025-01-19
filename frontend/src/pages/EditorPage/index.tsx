import * as React from 'react';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import Snackbar, { SnackbarCloseReason } from '@mui/material/Snackbar';
import { useLocation } from 'react-router-dom';
import { Chip, Typography, Dialog, DialogContent, DialogTitle, Tabs, Tab } from '@mui/material';
import MarkdownRenderer from '../../components/MarkdownRenderer';
import { useAuth } from '../../authentication/AuthContext';
import { extract_task } from './utils';

import AIChat from './AIChat';
import EditorView from './EditorView';
import EditorConfig from './EditorConfig';
import ResizablePanel from './ResizablePanel';
import { EditorConfigType, EditorDocType } from './utils';

const SUBMIT_API_ENDPOINT = 'http://localhost:8504/submit';
const BACKGROUND_TASK_STATUS_ENDPOINT = 'http://localhost:8504/bgtask';
const TASK_API_ENDPOINT = 'http://localhost:8504/generate-task';

export default function MainComponent() {
	const [editorConfig, setEditorConfig] = React.useState<EditorConfigType>({
		language: 'combined',
		autoRun: false,
	});
	const [editorDoc, setEditorDoc] = React.useState<EditorDocType>({
		jsDoc: 'Goodbye world',
		htmlDoc: 'Hello world',
		cssDoc: '',
	});
	const [question, setQuestion] = React.useState('Generating question...');
	const [task, setTask] = React.useState<EditorDocType>({
		jsDoc: 'console.log(\'You can learn anything\');',
		htmlDoc: 'Hello world',
		cssDoc: 'h1 {color: black;text-align: center;}',
	});
	const [aiChatWidth, setAiChatWidth] = React.useState<number>(600); // Initial width in pixels
	const [submissionUID, setSubmissionUID] = React.useState<string>('');
	const [snackbarOpen, setSnackbarOpen] = React.useState(false);
	const [snackbarText, setSnackbarText] = React.useState<string>('');
	const [countdown, setCountdown] = React.useState(0);
	const [showEditor, setShowEditor] = React.useState(false);
	const [tabIndex, setTabIndex] = React.useState(0);

	const location = useLocation();
	const quiz = location.state?.quiz;

	const { user } = useAuth(); // Accessing user from AuthContext

	React.useEffect(() => {
		if (quiz) {
			setCountdown(3);
		}
	}, [quiz]);

	React.useEffect(() => {
		if (countdown > 0) {
			const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
			return () => clearTimeout(timer);
		} else {
			setShowEditor(true);
			generateQuestion();
		}
	}, [countdown]);

	const generateQuestion = async () => {
		try {
			if (!quiz) {
				throw new Error('Quiz object is not available');
			}
			const response = await fetch(TASK_API_ENDPOINT, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ user: user?._id, session: JSON.stringify(quiz) }) // Serialize the session field
			});

			setQuestion("");

			const reader = response.body?.getReader();
			if (!reader) {
				throw new Error('Stream reader is not available');
			}

			const readStream = async () => {
				let { done, value } = await reader.read();
				if (done) return;

				const chunk = new TextDecoder('utf-8').decode(value);
				const jsonStrings = chunk.split('\n').filter(Boolean);

				jsonStrings.forEach(jsonString => {
					try {
						const jsonChunk = JSON.parse(jsonString);
						setQuestion(prev => prev + jsonChunk.token);
					} catch (error) {
						console.error('Error parsing JSON chunk', error);
					}
				});
				await readStream();
			};

			await readStream();
		} catch (error) {
			console.error('Error during stream', error);
		}
	};

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

	const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
		setTabIndex(newValue);
	};

	if (!showEditor) {
		return (
			<Dialog open>
				<DialogTitle>Are you ready?</DialogTitle>
				<DialogContent>
					<Typography variant="h1" align="center">{countdown}</Typography>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Stack>
			<Grid container spacing={2}>
				<Grid>
					<ResizablePanel
						width={aiChatWidth}
						onWidthChange={setAiChatWidth}
						minWidth={300} // Minimum width in pixels
						maxWidth={600} // Maximum width in pixels
					>
						<Alert severity="info">
							<AlertTitle>{quiz?.name}</AlertTitle>
							<Typography variant="body1">Question Count: 1 of {quiz?.question_count}</Typography>
							<Typography variant="body1">Current Score: {quiz?.score}</Typography>
						</Alert>

						<Tabs value={tabIndex} onChange={handleTabChange} aria-label="simple tabs example">
							<Tab label="Question" />
							<Tab label="AI Chat" />
						</Tabs>

						{tabIndex === 0 && (
							<Card variant="outlined">
								<CardContent>
									<Typography gutterBottom sx={{ color: 'text.secondary', fontSize: 14 }}>
										Question number {quiz?.question_no}
									</Typography>
									<Typography sx={{ color: 'text.secondary', mb: 1.5 }}>Topics:
										{quiz?.topics.map((topic: string, index: number) => (
											<Chip key={index} label={topic} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
										))}</Typography>
									<Typography variant="body2">
										<MarkdownRenderer content={question} />
									</Typography>
								</CardContent>
								<CardActions>
									<Button size="small" onClick={() => {
										const [jsCode, htmlCode, cssCode] = extract_task(question);
										var task = { jsDoc: jsCode, htmlDoc: htmlCode, cssDoc: cssCode };
										setTask(task);
										setEditorConfig(prevState => ({
											...prevState,
											language: 'combined' // Ensure default is 'combined'
										}));
									}}>
										Click to Begin
									</Button>
								</CardActions>
							</Card>
						)}

						{tabIndex === 1 && (
							<AIChat
								question={question}
								setQuestion={setQuestion}
								task={task}
								setTask={setTask}
								quiz={quiz} // Pass the quiz object to AIChat
							/>
						)}

					</ResizablePanel>
				</Grid>
				<Grid>
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
