import { SxProps } from '@mui/material';
import { Theme } from '@mui/material/styles';


// Define the type for the styles object
interface FriendsPageStyles {
  userCard: {
    card: SxProps<Theme>;
    content: SxProps<Theme>;
    infoSection: SxProps<Theme>;
    statusChip: SxProps<Theme>;
  };
  knowledgeLevel: {
    beginner: SxProps<Theme>;
    learner: SxProps<Theme>;
    expert: SxProps<Theme>;
    master: SxProps<Theme>;
  };
  studyTime: {
    less: SxProps<Theme>;
    normal: SxProps<Theme>;
    passionate: SxProps<Theme>;
  };
  avatar: SxProps<Theme>;
  actions: SxProps<Theme>;
  followButton: SxProps<Theme>;
  messageButton: SxProps<Theme>;
  mutualText: SxProps<Theme>;
}

export const friendsPageStyles: FriendsPageStyles = {
  userCard: {
    card: {
      height: '100%',
      transition: 'transform 0.2s',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: 3,
      },
      
    },
    content: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingBottom: 0,
    },
    infoSection: {
      display: 'flex',
      flexDirection: 'row', 
      gap: 1,
      justifyContent: 'center', 
      alignItems: 'center',
      flexWrap: 'wrap', 
      width: '100%',
      mb: 1, 
    },
    statusChip: {
      borderRadius: '12px',
      padding: '4px 12px',
      fontSize: '0.75rem',
      fontWeight: 600,
      width: 'fit-content',
    },
  },
  knowledgeLevel: {
    beginner: {
      backgroundColor: '#E3F2FD',
      color: '#1976D2',
    },
    learner: {
      backgroundColor: '#E8F5E9',
      color: '#2E7D32',
    },
    expert: {
      backgroundColor: '#FFF3E0',
      color: '#E65100',
    },
    master: {
      backgroundColor: '#EDE7F6',
      color: '#673AB7',
    },
  },
  studyTime: {
    less: {
      backgroundColor: '#FCE4EC',
      color: '#C2185B',
    },
    normal: {
      backgroundColor: '#F3E5F5',
      color: '#7B1FA2',
    },
    passionate: {
      backgroundColor: '#FFEBEE',
      color: '#C62828',
    },
  },
  avatar: {
    width: 56,
    height: 56,
    mb: 1,
  },
  actions: {
    justifyContent: 'space-between',
    px: 2,
    pb: 2,
  },
  followButton: {
    flexGrow: 1,
    mr: 1,
  },
  messageButton: {
    minWidth: 'auto',
    p: '6px',
  },
  mutualText: {
    color: 'primary.main',
    mt: 0.5,
    mb: 1,
  },
} as const;