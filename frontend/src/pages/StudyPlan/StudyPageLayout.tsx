import React from 'react';
import { Box, Container, Typography, Button, AppBar, Toolbar, ButtonGroup } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import logoimg from '../src/title.png';

interface StudyPageLayoutProps {
  title: string;
  children: React.ReactNode;
}

const StudyPageLayout: React.FC<StudyPageLayoutProps> = ({ title, children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navButtons = [
    { path: '/studyplan/html', label: 'HTML' },
    { path: '/studyplan/css', label: 'CSS' },
    { path: '/studyplan/javascript', label: 'JavaScript' }
  ];
  
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <AppBar position="static" color="default" elevation={0}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <img
            src={logoimg}
            alt="WebGenie Logo"
            style={{ height: '40px', cursor: 'pointer' }}
            onClick={() => navigate('/')}
          />
          
          {/* Navigation Buttons */}
          <ButtonGroup variant="text" color="inherit">
            {navButtons.map((button) => (
              <Button
                key={button.path}
                onClick={() => navigate(button.path)}
                sx={{
                  fontWeight: location.pathname === button.path ? 700 : 400,
                  borderBottom: location.pathname === button.path ? 2 : 0,
                  borderColor: 'primary.main',
                  borderRadius: 0
                }}
              >
                {button.label}
              </Button>
            ))}
          </ButtonGroup>

          <Button 
            color="inherit" 
            onClick={() => navigate('/main')}
            variant="outlined"
          >
            Back to Dashboard
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container 
        sx={{ 
          flexGrow: 1, 
          py: 4,
          maxWidth: 'lg',
          '& pre': {
            borderRadius: 2,
            p: 2,
            overflow: 'auto'
          }
        }}
      >
        <Typography 
          variant="h3" 
          gutterBottom
          sx={{ 
            fontWeight: 700,
            color: 'primary.main' 
          }}
        >
          {title}
        </Typography>
        {children}
      </Container>

      {/* Footer */}
      <Box sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider',
      }}>
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} WebGenie. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default StudyPageLayout;