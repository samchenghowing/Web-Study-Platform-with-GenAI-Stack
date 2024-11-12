import * as React from 'react';
import { alpha } from '@mui/material';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import SignInDialog from '../SignInDialog';
import SignUpDialog from '../SignUpDialog';
import imageToAdd from "./title2.png";


export default function Hero() {

  const logoStyle = {
    width: '180px',
    height: 'auto',
    cursor: 'pointer',
  };
  
  return (
    <Box
      id="hero"
      sx={(theme) => ({
        width: '100%',
        height: '100vh',
        backgroundImage:
          theme.palette.mode === 'light'
            ? 'linear-gradient(180deg, #CEE5FD, #FFF)'
            : `linear-gradient(#02294F, ${alpha('#090E10', 0.0)})`,
        backgroundSize: '100% 20%',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        alignItems: 'center', // Center content vertically
      })}
    >
      <Container>
        <Grid container spacing={6} alignItems="center" justifyContent="center">

          {/* Left Side: Text */}
          <Grid item xs={12} md={8} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
            <Typography
              variant="h2"
              sx={{
                fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
                color: 'text.primary',
                fontFamily: '"Roboto", sans-serif', // Specify the font family here
              }}
            >
              Your AI Assistant for Learning Web Development
            </Typography>

            <Typography
              color="text.secondary"
              sx={{
                mt: 2, // Y axis Distance to the last element
                fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                fontFamily: '"Roboto", sans-serif', // Specify the font family here
              }}
            >
              Learn HTML, JavaScript, and CSS with ease and efficiency.
            </Typography>
          </Grid>

          {/* Right Side: Buttons */}
          <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: { xs: 'center', md: 'flex-start' } }}>
            <Stack direction="column" spacing={2} alignItems="center" sx={{ width: '100%' }}>
              <SignInDialog
                variant="contained" // Use 'contained' for a consistent button style
                size="large" // Make the button 
                sx={{
                  width: '100%', // Make the button full-width
                  background: 'linear-gradient(45deg, #3b82f6, #9333ea)', // Color gradient
                  color: 'white',
                  fontWeight: 'bold',
                  // borderRadius: 2,
                  textTransform: 'none',
                  // boxShadow: 3, // Adds a subtle shadow
                  fontFamily: '"Roboto", sans-serif', // Specify the font family here
                  '&:hover': {
                    boxShadow: 6,
                    background: 'linear-gradient(45deg, #4b90f7, #a34bf2)',

                  },
                }}
              />
              <SignUpDialog
                variant="contained" // Use 'contained' for a consistent button style
                size="large" // Make the button larger
                sx={{
                  background: '#ffffff', // Color gradient
                  width: '100%', // Make the button full-width
                  color: '#3b82f6', // text colur
                  fontWeight: 'bold',
                  // borderRadius: 2, // Rounded corners
                  textTransform: 'none', // Removes uppercase styling
                  backgroundColor: '#FFFFFF', // Darken the color on hover
                  // boxShadow: 3,
                  fontFamily: '"Roboto", sans-serif', // Specify the font family here
                  '&:hover': {
                    backgroundColor: '#f0f7ff', // Same color as SignInDialog for uniformity
                  },
                }}
              />
            </Stack>
          </Grid>

        </Grid>
      </Container>
    </Box>
  );
}
