import React, { useState } from 'react';
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
    Typography,
    Chip,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, DriveFileRenameOutline as RenameIcon, Add as AddIcon, Refresh as ReviseIcon } from '@mui/icons-material';

interface QuizRecord {
    id: number;
    name: string;
    questionNumber: number;
    timestamp: string;
    state: 'Done' | 'In Progress';
    score: string; // e.g., "8/10"
    topics: string[];
}

const QuizTable = () => {
    const [quizData, setQuizData] = useState<QuizRecord[]>([]);
    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [currentRenameId, setCurrentRenameId] = useState<number | null>(null);

    // Add New Record
    const addRecord = (record: QuizRecord) => {
        setQuizData((prev) => [...prev, record]);
    };

    // Delete Record
    const handleDelete = (id: number) => {
        setQuizData(quizData.filter((quiz) => quiz.id !== id));
    };

    // Rename Record
    const handleRenameOpen = (id: number, currentName: string) => {
        setRenameDialogOpen(true);
        setNewName(currentName);
        setCurrentRenameId(id);
    };

    const handleRenameSubmit = () => {
        setQuizData((prev) =>
            prev.map((quiz) =>
                quiz.id === currentRenameId ? { ...quiz, name: newName } : quiz
            )
        );
        setRenameDialogOpen(false);
        setNewName('');
        setCurrentRenameId(null);
    };

    // Revise Record
    const handleRevise = (id: number) => {
        console.log('Revise quiz with id:', id);
        // Add revise logic here if needed, like opening a form to edit quiz details
    };

    return (
        <Box sx={{ p: 4, maxWidth: '95vw', overflowX: 'auto' }}>

            <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => addRecord({
                    id: Date.now(),
                    name: 'New Quiz',
                    questionNumber: 10,
                    timestamp: new Date().toLocaleString(),
                    state: 'In Progress',
                    score: '-',
                    topics: ['Topic1'],
                })}
                sx={{ mb: 2 }} // a function for later fe update session.
            >
                Demo Insert Button
            </Button>
            <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 3 }}>
                <Table sx={{ minWidth: 1000 }}>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#f9fafb' }}>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '14px' }}>Quiz Name</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '14px' }}>Questions</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '14px' }}>Created At</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '14px' }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '14px' }}>Score</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', fontSize: '14px' }}>Topics</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '14px' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {quizData.map((quiz) => (
                            <TableRow
                                key={quiz.id}
                                sx={{
                                    '&:nth-of-type(odd)': { backgroundColor: '#f4f4f5' },
                                    '&:hover': { backgroundColor: '#eef2ff' },
                                }}
                            >
                                <TableCell sx={{ fontSize: '14px' }}>{quiz.name}</TableCell>
                                <TableCell sx={{ fontSize: '14px' }}>{quiz.questionNumber}</TableCell>
                                <TableCell sx={{ fontSize: '14px' }}>{quiz.timestamp}</TableCell>
                                <TableCell sx={{ fontSize: '14px' }}>
                                    <Chip
                                        label={quiz.state}
                                        color={quiz.state === 'Done' ? 'success' : 'warning'}
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
                                    <Tooltip title="Rename">
                                        <IconButton
                                            color="secondary"
                                            onClick={() => handleRenameOpen(quiz.id, quiz.name)}
                                        >
                                            <RenameIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Revise">
                                        <IconButton
                                            color="primary"
                                            onClick={() => handleRevise(quiz.id)}
                                        >
                                            <ReviseIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete">
                                        <IconButton
                                            color="error"
                                            onClick={() => handleDelete(quiz.id)}
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
        </Box>
    );
};

export default QuizTable;
