import React, { useState, useEffect } from 'react';
import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    Chip,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    TablePagination,
    Snackbar,
    Alert,
} from '@mui/material';
import { Delete as DeleteIcon, Start as StartICON, DriveFileRenameOutline as RenameIcon, Add as AddIcon, Refresh as ReviseIcon } from '@mui/icons-material';
import { useAuth } from '../../authentication/AuthContext';
import { useNavigate } from 'react-router-dom';
import CreateSessionDialog from './CreateSessionDialog';

const LISTSESSION_API_ENDPOINT = 'http://localhost:8504/list_session';
const CHANGENAME_API_ENDPOINT = 'http://localhost:8504/update_session_name';
const DELETE_API_ENDPOINT = 'http://localhost:8504/delete_session';
const DELETE_CHAT_HISTORY_API_ENDPOINT = 'http://localhost:8504/chat_histories';

interface QuizRecord {
    session_id: string;
    name: string;
    question_count: number;
    timestamp: string;
    progress: number;
    progressstate: 'Done' | 'In Progress' | 'Not Started';
    score: string; // e.g., "8/10"
    topics: string[];
    current_question_count: number; 
}

interface SessionRecordProps {
  searchTerm: string;
  selectedFilters: string[];
  onSearchChange: (value: string) => void;
}

const SessionRecord: React.FC<SessionRecordProps> = ({ 
  searchTerm, 
  selectedFilters, 
  onSearchChange 
}) => {
    const [quizData, setQuizData] = useState<QuizRecord[]>([]);
    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [currentRenameId, setCurrentRenameId] = useState<string | null>(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    // Pagination state
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Snackbar state
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    // Fetch Sessions for a User
    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const response = await fetch(`${LISTSESSION_API_ENDPOINT}/${user?._id}`, {
                    method: 'GET',
                });
                if (response.ok) {
                    const data = await response.json();

                    // Loop through the data and set each quiz record line by line
                    const newQuizData = data.map((item: any) => {
                        // Convert timestamp to a readable format
                        const timestamp = convertTimestamp(item.timestamp);

                        // Return a formatted record
                        return {
                            session_id: item.session_id,
                            name: item.sname,
                            question_count: item.question_count,
                            timestamp: timestamp,
                            progress: item.current_question_count,
                            progressstate: item.current_question_count == (item.question_count+1) ? 'Done' : (item.current_question_count == 1)? 'Not Started' :'In Progress',
                            score: `${item.score}/${item.question_count}`,
                            topics: item.topics,
                            current_question_count: item.current_question_count, // Add this field
                        };
                    });

                    setQuizData(newQuizData); // Set the formatted data to state
                } else {
                    console.error('Failed to fetch sessions');
                }
            } catch (error) {
                console.error('Error fetching sessions:', error);
            }
        };
        fetchSessions();

        // Listen for the custom event
        const handleCustomEvent = () => {
            fetchSessions();
        };

        window.addEventListener('fetchSessionsEvent', handleCustomEvent);

        return () => {
            window.removeEventListener('fetchSessionsEvent', handleCustomEvent);
        };
    }, []);

    // Helper function to format timestamp
    function convertTimestamp(timestamp) {
        const date = timestamp._DateTime__date;
        const time = timestamp._DateTime__time;

        const year = date._Date__year;
        const month = date._Date__month;
        const day = date._Date__day;
        let hour = time._Time__hour;
        const minute = time._Time__minute;
        const second = time._Time__second;

        // Adjust the hour by adding 8 hours and handle overflow
        hour = (hour + 8) % 24;

        // Format the time string, adding leading zeroes where necessary
        const formattedTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;

        // Optionally, you can include the date as well if you want
        const formattedDate = `${day}/${month}/${year} ${formattedTime}`;

        return formattedDate;
    }

    // Add New Record
    const addRecord = (record: QuizRecord) => {
        setQuizData((prev) => [...prev, record]);
    };

    // Delete Record
    const handleDeleteSubmit = async (id: string) => {
        try {
            // 1. First delete chat history
            const chatHistoryResponse = await fetch(`${DELETE_CHAT_HISTORY_API_ENDPOINT}/${id}`, {
                method: 'DELETE'
            });

            if (!chatHistoryResponse.ok) {
                throw new Error('Failed to delete chat history');
            }
            console.log("Chat history deleted successfully");

            // 2. Then delete the session
            const sessionResponse = await fetch(`${DELETE_API_ENDPOINT}/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!sessionResponse.ok) {
                throw new Error('Failed to delete session');
            }

            // 3. Update UI only after both deletions are successful
            setQuizData((prev) => prev.filter((quiz) => quiz.session_id !== id));
            console.log('Delete success');
            
        } catch (error) {
            console.error('Error during deletion:', error);
            alert('Failed to delete. Please try again.');
        }
    };
    
    // Rename Record
    const handleRenameOpen = (id: string, currentName: string) => {
        setRenameDialogOpen(true);
        setNewName(currentName);
        setCurrentRenameId(id);
    };

    const handleRenameSubmit = async () => {
        try {
            const response = await fetch(`${CHANGENAME_API_ENDPOINT}/${currentRenameId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ new_name: newName })
            });
    
            if (!response.ok) {
                throw new Error('Failed to update session name');
            }
    
            setQuizData((prev) =>
                prev.map((quiz) =>
                    quiz.session_id === currentRenameId ? { ...quiz, name: newName } : quiz
                )
            );
            setRenameDialogOpen(false);
            setNewName('');
            setCurrentRenameId(null);
            console.error('rename success');
        } catch (error) {
            console.error('Error updating session name:', error);
            alert('Failed to update session name. Please try again.');
        }
    };

    // Revise Record
    const handleRevise = (id: string) => {
        console.log('Revise quiz with id:', id);
        // Add revise logic here if needed, like opening a form to edit quiz details
    };

    const handleBeginQuiz = (quiz: QuizRecord) => {
        if (quiz.progress == (quiz.question_count +1)) {
            setSnackbarMessage('This quiz is already done.');
            setSnackbarOpen(true);
        } else {
            navigate('/main/editor', { state: { quiz } });
        }
    };

    // Handle Page Change
    const handleChangePage = (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
        setPage(newPage);
    };

    // Handle Rows Per Page Change
    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0); // Reset to first page when changing rows per page
    
    };

    /**
     * <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                        const newQuiz: QuizRecord = {
                            session_id: Date.now().toString(),
                            name: 'New Quiz',
                            question_count: 10,
                            timestamp: new Date().toLocaleString(),
                            state: 'In Progress',
                            score: '0/10',
                            topics: ['Topic1'],
                        };
                        setQuizData((prev) => [...prev, newQuiz]);
                    }}
                    sx={{ mb: 2 }}
                >
                    Demo insert button
                </Button>
     */


    // Slice data for current page
    const currentPageData = quizData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        
        <Box sx={{ p: 1, maxWidth: '95vw', overflowX: 'auto' }}>
            <Box sx={{ py: 2 }}>
                <CreateSessionDialog />
            </Box>
            
            <TableContainer component={Paper} sx={{ borderRadius: 3}}>
                <Table 
                    sx={{ 
                        minWidth: 1000,
                        '& .MuiTableRow-root': {
                            height: '32px', // Reduced from default 56px
                        },
                        '& .MuiTableCell-root': {
                            py: 1, // Reduced vertical padding
                        }
                    }}
                >
                    <TableHead>
                        <TableRow sx={{ 
                            backgroundColor: '#f9fafb',
                            height: '44px' // Even smaller header height
                        }}>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '14px' }}>Quiz Name</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '14px' }}>Q. Count</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '14px' }}>Created At</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '14px' }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '14px' }}>Score</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '14px' }}>Topics</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '14px' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {currentPageData.map((quiz) => (
                            <TableRow
                                key={quiz.session_id}
                                sx={{
                                    position: 'relative',
                                    '&:nth-of-type(odd)': { backgroundColor: '#f4f4f5' },
                                    '&:hover': { backgroundColor: '#eef2ff' },
                                    '&:hover .overlay-button': { display: 'flex' },
                                }}
                            >
                                <TableCell sx={{ fontSize: '14px' }}>{quiz.name}</TableCell>
                                <TableCell sx={{ fontSize: '14px' }}>{quiz.progress-1}/{quiz.question_count}</TableCell>
                                <TableCell sx={{ fontSize: '14px' }}>{quiz.timestamp}</TableCell>
                                <TableCell sx={{ fontSize: '14px' }}>
                                    <Chip
                                        label={quiz.progressstate}
                                        color={quiz.progressstate === 'Done' ? 'success' : quiz.progressstate === 'In Progress' ? 'warning' : 'info'}
                                        variant="outlined"
                                    />
                                </TableCell>
                                <TableCell sx={{ fontSize: '14px' }}>{quiz.score}</TableCell>
                                <TableCell sx={{ fontSize: '14px' }}>
                                    {quiz.topics.map((topic, index) => (
                                        <Chip
                                            key={index}
                                            label={topic}
                                            size="small"
                                            sx={{ mr: 0.5, mb: 0.5 }}
                                        />
                                    ))}
                                </TableCell>
                                <TableCell align="center">
                                    <Box
                                        className="overlay-button"
                                        sx={{
                                            display: 'none',
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                        }}
                                    >
                                        <Button
                                            variant="contained"
                                            startIcon={<StartICON />}
                                            onClick={() => handleBeginQuiz(quiz)}
                                        >
                                            Begin
                                        </Button>
                                    </Box>
                                    <Tooltip title="Rename">
                                        <IconButton
                                            color="secondary"
                                            onClick={() => handleRenameOpen(quiz.session_id, quiz.name)}
                                        >
                                            <RenameIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Revise">
                                        <IconButton
                                            color="primary"
                                            onClick={() => handleRevise(quiz.session_id)}
                                        >
                                            <ReviseIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete">
                                        <IconButton
                                            color="error"
                                            onClick={() => handleDeleteSubmit(quiz.session_id)}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                        {quizData.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    No quiz records found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Pagination */}
            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={quizData.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />

            {/* Rename Dialog */}
            <Dialog open={renameDialogOpen} onClose={() => setRenameDialogOpen(false)}>
                <DialogTitle>Rename Quiz</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="New Quiz Name"
                        fullWidth
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRenameDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleRenameSubmit} variant="contained">
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={() => setSnackbarOpen(false)}
            >
                <Alert onClose={() => setSnackbarOpen(false)} severity="info" sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default SessionRecord;
