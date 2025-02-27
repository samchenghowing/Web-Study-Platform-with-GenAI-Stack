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
import FaceIcon from '@mui/icons-material/Face';
import Button from '@mui/material/Button';
import { Link, useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ToggleColorMode from './ToggleColorMode';
import AccountMenu from './AccountMenu';
import logoimg from '../src/title.png'; // Adjust the path as necessary


const drawerWidth = 240;
const logoStyle = {
    width: '150px',
    height: 'auto',
};

const openedMixin = (theme: Theme): CSSObject => ({
    width: drawerWidth,
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: 'hidden',
});

const closedMixin = (theme: Theme): CSSObject => ({
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: 'hidden',
    width: `calc(${theme.spacing(7)} + 1px)`,
    [theme.breakpoints.up('sm')]: {
        width: `calc(${theme.spacing(8)} + 1px)`,
    },
});

const DrawerHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: theme.spacing(0, 1),
    ...theme.mixins.toolbar,

}));

interface AppBarProps extends MuiAppBarProps {
    open?: boolean;
}

const AppBar = styled(MuiAppBar, {
    shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    ...(open && {
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
        }),
    }),
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
    ({ theme, open }) => ({
        width: drawerWidth,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        ...(open && {
            ...openedMixin(theme),
            '& .MuiDrawer-paper': openedMixin(theme),
        }),
        ...(!open && {
            ...closedMixin(theme),
            '& .MuiDrawer-paper': closedMixin(theme),
        }),
    }),
);

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
            
        <Box sx={{ display: 'flex',color: 'primary.main' }}>
            <CssBaseline />

            <AppBar position="fixed" open={open} sx={{ backgroundColor: '#6887c1' }}>
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        onClick={handleDrawerOpen}
                        edge="start"
                        sx={{
                            marginRight: 5,
                            ...(open && { display: 'none' }),
                        }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Button onClick={handleOnClick} sx={{ padding: 0 }}>
                        <img // The logo
                            src={logoimg}
                            style={logoStyle}
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
                    <ListItem disablePadding sx={{ display: 'block' }}>
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
                                <FaceIcon />
                            </ListItemIcon>
                            <ListItemText primary="Friends" />
                        </ListItemButton>
                    </ListItem>
                </List>
                
            </Drawer>
            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                <DrawerHeader />
                {children}
            </Box>
        </Box>
        </ThemeProvider>
    );
}
