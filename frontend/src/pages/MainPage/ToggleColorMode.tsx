/** ToggleColorMode.tsx:  
 * To define ToggleColor Button Desgin
 * */ 

import * as React from 'react';
import { PaletteMode } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import WbSunnyRoundedIcon from '@mui/icons-material/WbSunnyRounded';
import ModeNightRoundedIcon from '@mui/icons-material/ModeNightRounded';


interface ToggleColorModeProps {
  mode: PaletteMode;
  toggleColorMode: () => void;
}

function ToggleColorMode({ mode, toggleColorMode }: ToggleColorModeProps) {
  return (
    <Box
      sx={{
        maxWidth: '40px', // Increased size for better accessibility
        textAlign: 'center',
      }}
    >
      <Button
        variant="contained" // Changed to "contained" for a more prominent style
        onClick={toggleColorMode}
        size="medium"
        aria-label="button to toggle theme"
        sx={{
          width: '40px',
          height: '40px',
          minWidth: 'unset',
          borderRadius: '50%', // Circular button for a modern look
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: mode === 'dark' ? '#4caf50' : '#ff9800', // Dynamic background
          color: '#fff',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            backgroundColor: mode === 'dark' ? '#45a049' : '#fb8c00', // Slightly darker hover effect
          },
        }}
      >
        {mode === 'dark' ? (
          <ModeNightRoundedIcon fontSize="small" />
        ) : (
          <WbSunnyRoundedIcon fontSize="small" />
        )}
      </Button>
    </Box>
  );
}

export default ToggleColorMode;
