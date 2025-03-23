import { Theme } from '@mui/material/styles';
import { SxProps } from '@mui/material';

interface LibPageStyles {
  container: SxProps<Theme>;
  mainContent: SxProps<Theme>;
  sidebar: SxProps<Theme>;
  userCard: SxProps<Theme>;
  calendar: SxProps<Theme>;
  searchBar: SxProps<Theme>;
  filterChips: SxProps<Theme>;
  table: SxProps<Theme>;
}

export const libPageStyles: LibPageStyles = {
  container: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', md: '1fr 300px' },
    gap: 2,
    p: 2,
    bgcolor: '#ffffff', // White background for the entire page
  },
  mainContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    bgcolor: '#f9f9f9', // Very light gray for subtle contrast
    p: 2,
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)', // Soft shadow for depth
},
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    bgcolor: '#ffffff',
    p: 2,
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    position: 'sticky',
    top: 10,
  },
  userCard: {
    p: 2,
    bgcolor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)', // Slightly stronger shadow for prominence
  },
  calendar: {
    p: 2,
    bgcolor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
    '& .react-calendar': {
      border: 'none',
      width: '100%',
      fontFamily: 'inherit',
      background: '#ffffff',
    },
    '& .react-calendar__tile--active': {
      backgroundColor: '#007bff', // Vibrant blue for active dates
      color: '#ffffff',
      borderRadius: '4px',
    },
    '& .highlight': {
      backgroundColor: '#ffd700', // Gold for highlighted activity
      color: '#000000',
      borderRadius: '4px',
    },
  },
  searchBar: {
    display: 'flex',
    gap: 1,
    alignItems: 'center',
    bgcolor: '#ffffff',
    p: 1,
    borderRadius: '8px',
    border: '1px solid #e0e0e0', // Light border for definition
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  filterChips: {
    display: 'flex',
    gap: 1,
    flexWrap: 'wrap',
    '& .MuiChip-root': {
      borderRadius: '16px',
      bgcolor: '#ffffff',
      border: '1px solid #e0e0e0',
      '&.MuiChip-colorPrimary': { bgcolor: '#007bff', color: '#ffffff' },
      '&.MuiChip-colorWarning': { bgcolor: '#ff9800', color: '#ffffff' },
      '&.MuiChip-colorSuccess': { bgcolor: '#28a745', color: '#ffffff' },
    },
  },
  table: {
    '& .MuiTableCell-root': {
      borderBottom: '1px solid #e8ecef', // Light separator
      fontSize: '14px',
    },
    '& .MuiTableHead-root': {
      bgcolor: '#f1f3f5', // Light gray header
      '& .MuiTableCell-root': { fontWeight: '600', color: '#495057' },
    },
    '& .MuiTableRow-root:hover': {
      bgcolor: '#f8f9fa', // Subtle hover effect
    },
  },
} as const;