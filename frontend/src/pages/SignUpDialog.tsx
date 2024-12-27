import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Dialog from '@mui/material/Dialog';
import Fade from '@mui/material/Fade'; // Transition for smoothness
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useAuth } from '../authentication/AuthContext';
import { useNavigate } from 'react-router-dom';

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

const SIGNUP_API_ENDPOINT = 'http://localhost:8504/signup/';

function Copyright(props: any) {
  return (
    <Typography variant="body2" color="text.secondary" align="center" {...props}>
      {'Copyright © '}
      <Link color="inherit" href="https://mui.com/">
        WebGenie
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}

export default function SignUpDialog({ variant, size, sx }) {
  const [open, setOpen] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const { login } = useAuth(); // Get the login function from context
  const navigate = useNavigate(); // Initialize the useNavigate hook

  const handleClickOpen = () => {
    setOpen(true);
    setErrorMessage('');
  };


  const handleClose = () => {
    setOpen(false); // Close the dialog
    setErrorMessage(''); // Reset error message on open
  };

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    try {
      const response = await fetch(SIGNUP_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.get('email'),
          password: data.get('password'),
          username: data.get('username'),
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        setErrorMessage(json.detail || 'Sign up failed');
        return;
      }

      console.log(json);
      login(json);
      navigate('/begin'); // Redirect to /begin on successful login
    } catch (error) {
      setErrorMessage('An unexpected error occurred.' + error);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Button
        color='primary'
        variant={variant}
        sx={sx}
        size={size}
        onClick={handleClickOpen}
      >
        Register
      </Button>
      <Dialog
        open={open}
        onClose={handleClose}
        TransitionComponent={Fade} // Smooth transition for the dialog
      >
        <Container component='main' maxWidth='xs'>
          <Box
            sx={{
              marginTop: 8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
              <LockOutlinedIcon />
            </Avatar>
            <Typography component='h1' variant='h5'>
              Register
            </Typography>
            {errorMessage && (
              <Typography color="error" variant="body2">
                {errorMessage}
              </Typography>
            )}
            <Box component='form' onSubmit={handleSignUp} noValidate sx={{ mt: 1 }}>
              <TextField
                margin='normal'
                required
                fullWidth
                name='username'
                label='Username'
                id='username'
              />
              <TextField
                margin='normal'
                required
                fullWidth
                id='email'
                label='Email Address'
                name='email'
                autoComplete='email'
                autoFocus
              />
              <TextField
                margin='normal'
                required
                fullWidth
                name='password'
                label='Password'
                type='password'
                id='password'
                autoComplete='new-password'
              />
              <Button
                type='submit'
                fullWidth
                variant='contained'
                color='primary'
                sx={{ mt: 3, mb: 2 }}
              >
                Register
              </Button>
              <Grid container>
                <Grid item xs>
                  <Button
                     onClick={handleClose}
                     variant="text" // Correct variant for Button
                     sx={{ textTransform: 'none' }} // Prevent uppercase text
                    >
                        {"Already have an account? Login"}
                   </Button>
                </Grid>
              </Grid>
            </Box>
          </Box>
          <Copyright sx={{ mt: 8, mb: 4 }} />
        </Container>
      </Dialog>
    </ThemeProvider>
  );
}