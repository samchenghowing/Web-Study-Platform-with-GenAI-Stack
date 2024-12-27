import * as React from 'react';
import { Box, Container, Typography, Button } from '@mui/material';
import imageToAdd from './company.jpg'; // Replace with your image path
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom'; // Import useNavigate from react-router-dom

export default function AboutUs() {
    const theme = createTheme({
        typography: {
            fontFamily: '"Roboto", sans-serif',
        },
        palette: {
            primary: {
                main: '#3f51b5', // Set primary color for buttons
            },
        },
    });

    const navigate = useNavigate(); // Initialize navigate hook

    // Handle the back to main page navigation
    const handleBackToMain = () => {
        navigate('/'); // Redirect to the main page (adjust the route as needed)
    };

    return (
        <ThemeProvider theme={theme}>
            <Box
                id="hero"
                sx={{
                    width: '100%',
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between', // Distribute space between top and bottom pieces
                }}
            >
                {/* Top Section: Image and Description */}
                <Container
                    sx={{
                        pt: { xs: 4, sm: 12 },
                        pb: { xs: 8, sm: 16 },
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: 'center',
                        gap: { xs: 3, sm: 6 }
                    }}
                >
                    {/* Image on the left */}
                    <Box
                        sx={{
                            flex: 1,
                            display: 'flex',
                            justifyContent: 'center',
                        }}
                    >
                        <img
                            src={imageToAdd}
                            alt="About Us"
                            style={{
                                maxWidth: '100%',
                                height: 'auto',
                                borderRadius: '8px',
                            }}
                        />
                    </Box>

                    {/* Description text on the right */}
                    <Box
                        sx={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            justifyContent: 'center',
                        }}
                    >
                        <Typography variant="h4" component="h2" color="text.primary">
                            About Us
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            We are a passionate team committed to providing the best service and experience. Our goal is to innovate and lead in our industry, making sure that our customers are always satisfied. We focus on quality, efficiency, and customer-centric solutions.
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Our team is composed of experts in various fields, bringing a diverse set of skills and experiences to deliver top-notch solutions. We believe in continuous improvement and always aim to exceed expectations.
                        </Typography>
                    </Box>
                </Container>
                </Box>

                {/* Bottom Section: Back to Main button */}
                <Box
                    sx={{
                        width: '100%',
                        position: 'fixed', // Fix the button to the bottom of the viewport
                        bottom: 0, // Position it at the bottom
                        left: 0, // Align it to the left edge of the viewport
                        display: 'flex',
                        justifyContent: 'flex-end', // Align the button to the right
                        p: 3, // Add padding for spacing
                        backgroundColor: 'white', // Add a background color to avoid overlap with page content
                        boxShadow: '0px -2px 10px rgba(0, 0, 0, 0.1)', // Optional: Add shadow for better visibility
                    }}
                >
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleBackToMain} // When clicked, navigate to the main page
                    >
                        Back to Main
                    </Button>
                </Box>
            
        </ThemeProvider>
    );
}
