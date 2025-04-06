import { Height } from '@mui/icons-material';
import { SxProps, Theme } from '@mui/material/styles';
// index.tsx styles
export const dialogStyles = {
  paper: {
    maxWidth: '60vw',
    width: '100%',
    '@media (max-width: 600px)': {
      maxWidth: '100%',
    },
  },
};

export const loadingBoxStyles: SxProps<Theme> = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

export const questionBoxStyles: SxProps<Theme> = {
  overflowY: 'auto',
  maxHeight: '45vw',
  overflowWrap: 'break-word',
  whiteSpace: 'pre-wrap',
};

export const snackbarAlertStyles: SxProps<Theme> = {
  width: '100%',
  left: 100,
  zIndex: 9999,

};

// Preview.tsx styles
export const iframeStyles: React.CSSProperties = {
  border: 'none',
};

export const consoleOutputStyles: React.CSSProperties = {
  height: '20%',
  overflowY: 'auto',
  padding: '8px',
  background: '#f5f5f5',
};

// EditorView.tsx styles
export const codeMirrorHeight = '100%';

// AIChat.tsx styles
export const backgroundPaperStyles = (theme: Theme): SxProps<Theme> => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  color: theme.palette.text.secondary,
  width: '100%',
  height: '70vh',
  margin: 'auto',
  overflow: 'auto',
});

export const styledCardStyles = (theme: Theme, role: string): SxProps<Theme> => ({
  backgroundColor: role === 'human' ? theme.palette.primary.main : theme.palette.background.paper,
  color: role === 'human' ? theme.palette.common.white : theme.palette.text.primary,
  ...theme.typography.body2,
  padding: theme.spacing(1),
  whiteSpace: 'pre-wrap',
  minWidth: 275,
  marginBottom: 2,
});

export const chatInputContainerStyles: SxProps<Theme> = {
  mt: 2,
};

export const chatActionsBoxStyles: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
};

export const chatInputBoxStyles: SxProps<Theme> = {
  flexGrow: 1,
  ml: 1,
};

export const leftpanelStyles: SxProps<Theme> = {
  height: '57vw',
};

export const mergeScrollerStyles: SxProps<Theme> = {
  height: '100% !important',
  maxHeight: '62vw',
};

export const editorPageStyles = {
  root: {
    display: 'flex',
    height: '100vh', // Changed from 86.93vh
    width: '100%',   // Changed from 92vw
    overflow: 'hidden',
    position: 'fixed', 
    top: 0,
    left: 0,
  },
  mainContainer: {
    display: 'flex',
    width: '100%',
    height: '100%', // Changed from 100vh
    margin: 0,
    padding: '100px  0   0 100px', // Adjusted padding to account for header  top right bottem left
    overflow: 'hidden', // Prevent scrolling on the main container
  },
  leftPanel: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%', 
    overflow: 'hidden', // Prevent scrolling on the left panel itself
    backgroundColor: 'background.paper',
    position: 'relative',
  },
  rightPanel: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%', // Changed from 100vh
    // overflow: 'hidden',
    flexGrow: 1,
  },
  editorContainer: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    height: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  questionCard: {
    // display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    overflow: 'hidden', // Ensure outer container doesn't scroll
    margin: 1,
    position: 'relative',
    height: '75vh', 
  },
  questionContent: {
    flexGrow: 1,
    overflow: 'auto', // Enable scrolling when needed
    padding: 2,
    maxHeight: 'calc(100% - 48px)', // More flexible height that accounts for card header/footer
    overflowWrap: 'break-word', // Prevent text from extending beyond container width
    wordWrap: 'break-word', // Additional support for older browsers
    width: '100%', // Ensure content respects container width
  },
  codeMirror: {
    flexGrow: 1,
    // overflow: 'hidden',
    height: '100%',
    '& .cm-editor': {
      height: '82vh', // Changed from calc(100vh - 64px)
      maxHeight: '100%',
    },
    '& .cm-scroller': {
      overflow: 'auto',
      maxHeight: '80vh' // Ensure scroller doesn't exceed container
    },
    '& .cm-content': {
      fontFamily: 'monospace',
      fontSize: '14px',
      lineHeight: '1.5',
      whiteSpace: 'pre-wrap', // Added for line wrapping
      wordBreak: 'break-word' // Added for word wrapping
    }
  },
  questionActions: {
    borderTop: 1,
    borderColor: 'divider',
    padding: 1,
  },
  startButton: {
    position: 'absolute',
    top: 10,
    right: 15,
    zIndex: 1,
    backgroundColor: 'primary.main',
    color: 'white',
    '&:hover': {
      backgroundColor: 'primary.dark',
    },
    borderRadius: 2,
    boxShadow: 2,
  },
};