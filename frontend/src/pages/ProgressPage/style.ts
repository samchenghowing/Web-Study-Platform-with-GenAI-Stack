import { styled } from '@mui/material/styles';
import Card from '@mui/material/Card';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';

export const StyledCard = styled(Card)(({ theme }) => ({
    margin: '0px',
    boxShadow: theme.shadows[3],
}));

export const StyledAccordion = styled(Accordion)(({ theme }) => ({
    marginBottom: '10px',
    borderRadius: '8px',
    '&:before': {
        display: 'none', // Removes the default divider line
    },
}));

export const StyledAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
    backgroundColor: theme.palette.grey[100],
    borderRadius: '8px',
    '& .MuiAccordionSummary-content': {
        alignItems: 'center',
    },
}));

export const StyledAccordionDetails = styled(AccordionDetails)(({ theme }) => ({
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
}));