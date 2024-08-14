import * as React from 'react';
import { Outlet } from 'react-router-dom';
import getLPTheme from './getLPTheme';
import Drawer from './components/Drawer';
import { PaletteMode } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const MainPage: React.FC = () => {
	// Theme and CSS layout
	const [mode, setMode] = React.useState<PaletteMode>('light');
	const LPtheme = createTheme(getLPTheme(mode));

	const toggleColorMode = () => setMode(prev => (prev === 'dark' ? 'light' : 'dark'));

    return (
		<ThemeProvider theme={LPtheme}>
			<CssBaseline />
			<Drawer>
                <Outlet /> {/* Renders child routes */}
			</Drawer>
		</ThemeProvider>
    );
};

export default MainPage;
