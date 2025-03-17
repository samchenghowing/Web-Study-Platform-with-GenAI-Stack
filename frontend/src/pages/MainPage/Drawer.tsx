/** Drawer.tsx:  
 * 1. Define Drawer Routining of the drawer item
 * 2. Define Drawer interactive behavior and desgin
 * */ 

import * as React from 'react';
import { styled, useTheme, Theme, CSSObject } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import EditIcon from '@mui/icons-material/Edit';
import QuizIcon from '@mui/icons-material/Quiz';
import UploadIcon from '@mui/icons-material/Upload';
import DatasetIcon from '@mui/icons-material/Dataset';
import PeopleIcon from '@mui/icons-material/People';
import Button from '@mui/material/Button';
import { Link, useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ToggleColorMode from './ToggleColorMode';
import AccountMenu from './AccountMenu';
import logoimg from '../src/title.png'; // Adjust the path as necessary
import { mainPageStyles, DrawerHeader, AppBar, Drawer } from './styles';


interface MiniDrawerProps {
    children: React.ReactNode;
    mode: Theme['palette']['mode']; // Add mode prop
    toggleColorMode: () => void;   // Add toggleColorMode prop
}

export default function MiniDrawer({ children, mode, toggleColorMode }: MiniDrawerProps) {

    // Set Theme
    const theme = createTheme({
        typography: {
            fontFamily: "'Roboto', Arial, sans-serif",
        },
        palette: {
            mode,
        },
    });

    const [open, setOpen] = React.useState(false);

    const handleDrawerOpen = () => {
        setOpen(true);
    };

    const handleDrawerClose = () => {
        setOpen(false);
    };
    const navigate = useNavigate();
    const handleOnClick = () => {
        navigate('/');
    };

    return (
        <ThemeProvider theme={theme}>
            <Box sx={mainPageStyles.root}>
                <CssBaseline />

                <AppBar position="fixed" open={open} sx={mainPageStyles.appBar}>
                    <Toolbar>
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            onClick={handleDrawerOpen}
                            edge="start"
                            sx={{
                                ...mainPageStyles.menuButton,
                                ...(open && { display: 'none' }),
                            }}
                        >
                            <MenuIcon />
                        </IconButton>
                        <Button onClick={handleOnClick} sx={{ padding: 0 }}>
                            <img 
                                src={logoimg}
                                style={mainPageStyles.logo}
                                alt='logo of WebGenie'
                            />
                        </Button>

                        <Box sx={{ flexGrow: 1 }} />

                        <Box sx={{ p: 2 }}>
                            <ToggleColorMode mode={mode} toggleColorMode={toggleColorMode} />
                        </Box>
                        <AccountMenu />

                    </Toolbar>
                </AppBar>
                <Drawer variant="permanent" open={open}>
                    <DrawerHeader>
                        <IconButton onClick={handleDrawerClose}>
                            {theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                        </IconButton>
                    </DrawerHeader>
                    <Divider />
                    <List>
                        <ListItem disablePadding sx={mainPageStyles.listItem}>
                            <ListItemButton component={Link} to="/main/Lib">
                                <ListItemIcon>
                                    <QuizIcon />
                                </ListItemIcon>
                                <ListItemText primary="Lib" />
                            </ListItemButton>
                        </ListItem>
                        {/* <ListItem disablePadding sx={{ display: 'block' }}>
                            <ListItemButton component={Link} to="/main/editor">
                                <ListItemIcon>
                                    <EditIcon />
                                </ListItemIcon>
                                <ListItemText primary="Editor" />
                            </ListItemButton>
                        </ListItem> */}
                        <ListItem disablePadding sx={{ display: 'block' }}>
                            <ListItemButton component={Link} to="/main/upload">
                                <ListItemIcon>
                                    <UploadIcon />
                                </ListItemIcon>
                                <ListItemText primary="Upload" />
                            </ListItemButton>
                        </ListItem>
                        <ListItem disablePadding sx={{ display: 'block' }}>
                            <ListItemButton component={Link} to="/main/progress">
                                <ListItemIcon>
                                    <DatasetIcon />
                                </ListItemIcon>
                                <ListItemText primary="My progress" />
                            </ListItemButton>
                        </ListItem>
                        <ListItem disablePadding sx={{ display: 'block' }}>
                            <ListItemButton component={Link} to="/main/friends">
                                <ListItemIcon>
                                    <PeopleIcon  />
                                </ListItemIcon>
                                <ListItemText primary="Friends" />
                            </ListItemButton>
                        </ListItem>
                    </List>
                    
                </Drawer>
                <Box component="main" sx={mainPageStyles.mainContent}>
                    <DrawerHeader />
                    {children}
                </Box>
            </Box>
        </ThemeProvider>
    );
}
