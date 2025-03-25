import { SxProps } from '@mui/material';

export const containerStyles = {
  pageContainer: {
    py: 1,
    px: 2,
  },
  flexCenter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
} as const;

export const cardStyles = {
  root: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  content: {
    flexGrow: 1,
    p: 2,
  },
  actions: {
    justifyContent: 'space-between',
    p: 2,
  },
} as const;

export const buttonStyles = {
  primary: {
    minWidth: 120,
  },
  icon: {
    minWidth: 'auto',
    p: '6px',
  },
} as const;