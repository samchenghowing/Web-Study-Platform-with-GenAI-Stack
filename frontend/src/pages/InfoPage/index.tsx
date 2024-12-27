import * as React from 'react';
import { PaletteMode } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import AppAppBar from './Header';
import getLPTheme from '../MainPage/getLPTheme';
import Body from './Body';



export default function LandingPage() {
    const [mode, setMode] = React.useState<PaletteMode>('light');
    const LPtheme = createTheme(getLPTheme(mode));
  
    /** Function:  Light Dark Theme setting* */ 
    const toggleColorMode = () => {
      setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
    };

  return (
    
    <ThemeProvider theme={LPtheme}> 
      <CssBaseline />
      
      <AppAppBar mode={mode} toggleColorMode={toggleColorMode} /> 
      <Body/>
      
    </ThemeProvider >

    

  );

}
