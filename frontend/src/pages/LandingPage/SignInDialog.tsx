import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { useAuth } from '../../authentication/AuthContext';
import { SxProps, Theme } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';

const LOGIN_API_ENDPOINT = 'http://localhost:8504/login/';

function Copyright(props: any) {
  return (
    <Typography variant='body2' color='text.secondary' align='center' {...props}>
      {'Copyright © '}
      <Link color='inherit' href='https://mui.com/'>
        Your Website
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}

interface SignInDialogProps {
  variant: 'text' | 'outlined' | 'contained';
  size: 'small' | '';
  sx?: SxProps<Theme>;
}

export default function SignInDialog({ variant, size, sx }) {
  const [open, setOpen] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');

  const handleClickOpen = () => {
    setOpen(true);
    setErrorMessage(''); // Reset error message on open
  };

  const handleClose = () => {
    setOpen(false);
  };

  const { login } = useAuth();

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    try {
      const response = await fetch(LOGIN_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.get('email'),
          password: data.get('password'),
        })
      });

      if (!response.ok) {
        const json = await response.json();
        setErrorMessage(json.detail || 'Login failed');
        return;
      }

      const json = await response.json();
      console.log(json);
      login(json);
    } catch (error) {
      setErrorMessage('An unexpected error occurred.' + error);
    }
  };

  return (
    <React.Fragment>
      <Button
        color='primary'
        variant={variant}
        sx={sx}
        size={size}
        onClick={handleClickOpen}
      >
        Sign in
      </Button>
      <Dialog
        open={open}
        onClose={handleClose}
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
              Sign in
            </Typography>
            {errorMessage && (
              <Typography color="error" variant="body2">
                {errorMessage}
              </Typography>
            )}
            <Box component='form' onSubmit={handleLogin} noValidate sx={{ mt: 1 }}>
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
                autoComplete='current-password'
              />
              <FormControlLabel
                control={<Checkbox value='remember' color='primary' />}
                label='Remember me'
              />
              <Button
                type='submit'
                fullWidth
                variant='contained'
                sx={{ mt: 3, mb: 2 }}
              >
                Sign In
              </Button>
              <Grid container>
                <Grid item xs>
                  <Link href='#' variant='body2'>
                    Forgot password?
                  </Link>
                </Grid>
                <Grid item>
                  <Link href='#' variant='body2'>
                    {"Don't have an account? Sign Up"}
                  </Link>
                </Grid>
              </Grid>
            </Box>
          </Box>
          <Copyright sx={{ mt: 8, mb: 4 }} />
        </Container>
      </Dialog>
    </React.Fragment>
  );
}