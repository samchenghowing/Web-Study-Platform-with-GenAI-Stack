import * as React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { PaletteMode } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useAuth } from '../../authentication/AuthContext';

import getLPTheme from './getLPTheme';
import Drawer from './Drawer';

interface MainPageProps {
    children?: React.ReactNode;
}

const MainPage: React.FC<MainPageProps> = ({ children }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [mode, setMode] = React.useState<PaletteMode>('light');
    const LPtheme = createTheme(getLPTheme(mode));

    React.useEffect(() => {
        const checkQuizProgress = async () => {
            if (!user?._id) return;

            try {
                const response = await fetch(`http://localhost:8504/quiz-progress/${user._id}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch quiz progress');
                }

                const data = await response.json();
                if (data.currentIndex <= 5) {
                    navigate('/begin');
                }
            } catch (error) {
                console.error('Error checking quiz progress:', error);
                navigate('/begin');
            }
        };

        checkQuizProgress();
    }, [user?._id, navigate]);

    const toggleColorMode = () => setMode(prev => (prev === 'dark' ? 'light' : 'dark'));

    return (
        <ThemeProvider theme={LPtheme}>
            <CssBaseline />
            <Drawer mode={mode} toggleColorMode={toggleColorMode}>
                <Outlet /> {/* Renders child routes */}
            </Drawer>
        </ThemeProvider>
    );
};

export default MainPage;
