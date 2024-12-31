import * as React from 'react';
import { PaletteMode } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import AppAppBar from './Header';
import Hero from './Hero';
import Features from './Features';
import Footer from './Footer';
import getLPTheme from '../MainPage/getLPTheme';


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

      <Hero />
      <Box sx={{ bgcolor: 'background.default' }}>
        <Features />
        <Footer />
      </Box>
    </ThemeProvider>
  );
  /** 
   * <Highlights />
        <Divider />
        <Pricing />
        <Divider />
        <FAQ />
   * <Divider />
   *  */
}
