import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import { Divider } from '@mui/material';
import { useAuth } from '../../authentication/AuthContext';
import SessionRecord from './SessionRecord';


const PDF_API_ENDPOINT = 'http://localhost:8504/pdfs';
const CREATESESSION_API_ENDPOINT = 'http://localhost:8504/create_session';

interface PDFData {
    file_id: string;
    filename: string;
    thumbnail: string;
}

export default function FormDialog() {
    const [open, setOpen] = React.useState(false);
    const [QuestionNum, setQuestionNum] = React.useState('');
    const [selectedTopics, setSelectedTopics] = React.useState<string[]>([]);
    const [cardContent, setCardContent] = React.useState<PDFData[]>([]);
    const [selectedPDFs, setSelectedPDFs] = React.useState<string[]>([]);

    const { user } = useAuth();

    React.useEffect(() => {
        fetchPDFs();
    }, []);

    // PDF
    const fetchPDFs = async () => {
        const abortController = new AbortController();
        try {
            const response = await fetch(PDF_API_ENDPOINT, {
                signal: abortController.signal
            });
            const json = await response.json();
            if (Array.isArray(json)) {
                setCardContent(json);
            } else {
                alert(json.detail);
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error(error);
            }
        }
        return () => abortController.abort();
    };

    const deletePDF = async (file_id: string) => {
        if (!window.confirm('Are you sure you want to delete this PDF?')) return;

        try {
            const response = await fetch(`${PDF_API_ENDPOINT}/${file_id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete PDF');
            fetchPDFs();
        } catch (error) {
            alert(error.message);
        }
    };

    const handleChange = (event: SelectChangeEvent) => {
        setQuestionNum(event.target.value as string);
    };

    const handlePDFSelect = (file_id: string) => {
        setSelectedPDFs((prev) => {
            if (prev.includes(file_id)) {
                return prev.filter(id => id !== file_id); // Deselect if already selected
            }
            return [...prev, file_id]; // Add to selected PDFs
        });
    };

    // Create session based on user preference
    const handleContinue = async () => {
        try {
            const payload = {
                question_count: Number(QuestionNum),
                topics: selectedTopics, 
                selected_pdfs: selectedPDFs
            };
    
            const response = await fetch(`http://localhost:8504/create_session/${user?._id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                    
                },
                body: JSON.stringify(payload)
            });
    
            if (!response.ok) {
                throw new Error('Failed to create session');
            }
    
            const data = await response.json();
            window.dispatchEvent(new Event('fetchSessionsEvent'));
            handleClose(); // Close the dialog after success
        } catch (error) {
            console.error('Error creating session:', error);
            alert('Failed to create session. Please try again.');
        }
    };

    // Diaglog open/close
    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedPDFs([]);
    };


    return (
        <React.Fragment>
            <Button variant="outlined" onClick={handleClickOpen}>
                Create New session
            </Button>
            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="md"
                fullWidth
                sx={{
                    '& .MuiDialog-paper': {
                        borderRadius: '12px',
                        overflow: 'hidden',
                        maxHeight: '100vh'
                    }
                }}
            >
                <DialogTitle variant="h5">+ Create New Session</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        To let AI tutor design the most suitable tasks for you, please enter your preferences for this session.
                    </DialogContentText>

                    <Box
                        component="form"
                        sx={{ p: 2 }}
                    >
                        <FormControl sx={{ mt: 2, minWidth: 300 }}><InputLabel id="question-select-label">Number of questions</InputLabel>
                            <Select
                                labelId="question-select-label"
                                id="question-select"
                                value={QuestionNum}
                                label="Number of questions"
                                onChange={handleChange}
                                sx={{ width: '200px' }}
                            >
                                {[...Array(20)].map((_, index) => (
                                    <MenuItem key={index + 1} value={index + 1}>
                                        {index + 1}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    <Divider />

                    <Box sx={{ p: 2 }}>
                        <Autocomplete
                            multiple
                            id="tags-standard"
                            options={programmingConcepts}
                            groupBy={(option) => option.category}
                            getOptionLabel={(option) => option.concept}
                            onChange={(event, newValue) => setSelectedTopics(newValue.map(item => item.concept))} 
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    variant="standard"
                                    label="Topics for this session"
                                    placeholder="Pick some Tags"
                                />
                            )}
                        />
                    </Box>

                    <Divider />

                    <Typography variant="h5">Choose your reference book (Optional)</Typography>
                    <Grid container spacing={2}>
                        {cardContent.map((pdf) => (
                            <Grid item xs={12} sm={6} md={4} key={pdf.file_id}>
                                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <CardMedia
                                        component="img"
                                        alt={pdf.filename}
                                        height="140"
                                        image={pdf.thumbnail}
                                        sx={{ objectFit: 'cover' }}
                                    />
                                    <CardContent sx={{ flexGrow: 1 }}>
                                        <Typography gutterBottom variant="h6" component="div">
                                            {pdf.filename}
                                        </Typography>
                                    </CardContent>
                                    <CardActions>
                                        <Button size="small" onClick={() => handlePDFSelect(pdf.file_id)}>
                                            {selectedPDFs.includes(pdf.file_id) ? 'Selected' : 'Select'}
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleContinue} type="submit">Continue</Button>

                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
}

const programmingConcepts = [
    { concept: "Document Structure", category: "HTML" },
    { concept: "Semantic HTML", category: "HTML" },
    { concept: "HTML Elements", category: "HTML" },
    { concept: "Attributes", category: "HTML" },
    { concept: "Headings (`<h1>` to `<h6>`)", category: "HTML" },
    { concept: "Paragraphs (`<p>`)", category: "HTML" },
    { concept: "Links (`<a>`)", category: "HTML" },
    { concept: "Images (`<img>`)", category: "HTML" },
    { concept: "Lists (`<ul>`, `<ol>`, `<li>`)", category: "HTML" },
    { concept: "Tables (`<table>`, `<tr>`, `<td>`)", category: "HTML" },
    { concept: "Forms (`<form>`, `<input>`, `<textarea>`)", category: "HTML" },
    { concept: "Buttons (`<button>`)", category: "HTML" },
    { concept: "Divisions (`<div>`)", category: "HTML" },
    { concept: "Spans (`<span>`)", category: "HTML" },
    { concept: "Meta Tags", category: "HTML" },
    { concept: "Iframes (`<iframe>`)", category: "HTML" },
    { concept: "Scripts (`<script>`)", category: "HTML" },
    { concept: "Stylesheets (`<link>`)", category: "HTML" },
    { concept: "Accessibility (ARIA roles)", category: "HTML" },
    { concept: "Comments in HTML", category: "HTML" },
    { concept: "Selectors", category: "CSS" },
    { concept: "Box Model", category: "CSS" },
    { concept: "Flexbox", category: "CSS" },
    { concept: "Grid Layout", category: "CSS" },
    { concept: "Responsive Design", category: "CSS" },
    { concept: "Media Queries", category: "CSS" },
    { concept: "Classes and IDs", category: "CSS" },
    { concept: "Cascading Order", category: "CSS" },
    { concept: "Specificity", category: "CSS" },
    { concept: "Pseudo-classes", category: "CSS" },
    { concept: "Pseudo-elements", category: "CSS" },
    { concept: "Transitions", category: "CSS" },
    { concept: "Animations", category: "CSS" },
    { concept: "Overflow", category: "CSS" },
    { concept: "Positioning (static, relative, absolute, fixed)", category: "CSS" },
    { concept: "Z-index", category: "CSS" },
    { concept: "Borders", category: "CSS" },
    { concept: "Margins and Padding", category: "CSS" },
    { concept: "Color and Backgrounds", category: "CSS" },
    { concept: "Fonts and Typography", category: "CSS" },
    { concept: "Variables (let, const, var)", category: "JavaScript" },
    { concept: "Data Types (string, number, boolean, object, array)", category: "JavaScript" },
    { concept: "Operators (arithmetic, comparison, logical)", category: "JavaScript" },
    { concept: "Functions (declarations, expressions, arrow functions)", category: "JavaScript" },
    { concept: "Scope (global, local)", category: "JavaScript" },
    { concept: "Hoisting", category: "JavaScript" },
    { concept: "Event Handling", category: "JavaScript" },
    { concept: "DOM Manipulation", category: "JavaScript" },
    { concept: "Selectors (getElementById, querySelector)", category: "JavaScript" },
    { concept: "AddEventListener", category: "JavaScript" },
    { concept: "AJAX (Asynchronous JavaScript and XML)", category: "JavaScript" },
    { concept: "Promises", category: "JavaScript" },
    { concept: "Async/Await", category: "JavaScript" },
    { concept: "Error Handling (try/catch)", category: "JavaScript" },
    { concept: "JSON (JavaScript Object Notation)", category: "JavaScript" },
    { concept: "Local Storage and Session Storage", category: "JavaScript" },
    { concept: "Modules (import/export)", category: "JavaScript" },
    { concept: "Closure", category: "JavaScript" },
    { concept: "This Keyword", category: "JavaScript" },
    { concept: "Prototypes and Inheritance", category: "JavaScript" },
    { concept: "Single Page Applications (SPAs)", category: "Advanced" },
    { concept: "Frameworks (React, Angular, Vue)", category: "Advanced" },
    { concept: "CSS Preprocessors (Sass, LESS)", category: "Advanced" },
    { concept: "JavaScript Libraries (jQuery, Lodash)", category: "Advanced" },
    { concept: "Responsive Images (srcset)", category: "Advanced" },
    { concept: "Accessibility Best Practices", category: "Advanced" },
    { concept: "Progressive Enhancement", category: "Advanced" },
    { concept: "Mobile-First Design", category: "Advanced" },
    { concept: "Cross-Browser Compatibility", category: "Advanced" },
    { concept: "Web Performance Optimization", category: "Advanced" },
    { concept: "SEO Best Practices", category: "Advanced" },
    { concept: "Web APIs (Fetch, Geolocation)", category: "Advanced" },
    { concept: "Service Workers", category: "Advanced" },
    { concept: "WebSockets", category: "Advanced" },
    { concept: "Data Binding", category: "Advanced" },
    { concept: "State Management", category: "Advanced" },
    { concept: "Routing in SPAs", category: "Advanced" },
    { concept: "Testing (Jest, Mocha)", category: "Advanced" },
    { concept: "Debugging Techniques", category: "Advanced" },
    { concept: "Version Control (Git)", category: "Advanced" },
    { concept: "Code Minification", category: "Miscellaneous" },
    { concept: "Build Tools (Webpack, Gulp)", category: "Miscellaneous" },
    { concept: "Static vs Dynamic Websites", category: "Miscellaneous" },
    { concept: "Content Delivery Networks (CDNs)", category: "Miscellaneous" },
    { concept: "Versioning APIs", category: "Miscellaneous" },
    { concept: "RESTful Services", category: "Miscellaneous" },
    { concept: "GraphQL", category: "Miscellaneous" },
    { concept: "TypeScript", category: "Miscellaneous" },
    { concept: "CSS Variables", category: "Miscellaneous" },
    { concept: "Custom Properties in CSS", category: "Miscellaneous" },
    { concept: "Shadow DOM", category: "Miscellaneous" },
    { concept: "Web Components", category: "Miscellaneous" },
    { concept: "CSS Grid vs. Flexbox", category: "Miscellaneous" },
    { concept: "Design Systems", category: "Miscellaneous" },
    { concept: "User Experience (UX) Principles", category: "Miscellaneous" },
    { concept: "Cross-Origin Resource Sharing (CORS)", category: "Miscellaneous" },
    { concept: "Browser Developer Tools", category: "Miscellaneous" },
    { concept: "Accessibility Testing Tools", category: "Miscellaneous" },
    { concept: "Performance Monitoring Tools", category: "Miscellaneous" },
    { concept: "Progressive Web Apps (PWAs)", category: "Miscellaneous" }
];