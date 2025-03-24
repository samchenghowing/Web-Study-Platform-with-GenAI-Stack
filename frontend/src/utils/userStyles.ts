import { SxProps } from '@mui/material';
import { Theme } from '@mui/material/styles';

// Knowledge Level Function
export const getKnowledgeLevel = (knowledge: string): { style: SxProps<Theme>; label: string } => {
  switch (knowledge) {
    case "I am a beginner":
      return { style: { backgroundColor: '#E3F2FD', color: '#1976D2' }, label: "Beginner" };
    case "I know some basic":
      return { style: { backgroundColor: '#E8F5E9', color: '#2E7D32' }, label: "Learner" };
    case "I have tried web editing":
      return { style: { backgroundColor: '#FFF3E0', color: '#E65100' }, label: "Expert" };
    case "I can discuss advance topic":
      return { style: { backgroundColor: '#EDE7F6', color: '#673AB7' }, label: "Master" };
    default:
      return { style: { backgroundColor: '#E3F2FD', color: '#1976D2' }, label: "Beginner" };
  }
};

// Study Time Function
export const getStudyTimeStyle = (time: string): { style: SxProps<Theme>; label: string } => {
  switch (time) {
    case "Less than 15 minutes":
      return { style: { backgroundColor: '#FCE4EC', color: '#C2185B' }, label: "Quick Learner" };
    case "Around 30 minutes":
      return { style: { backgroundColor: '#F3E5F5', color: '#7B1FA2' }, label: "Dedicated Learner" };
    case "More than 30 minutes":
      return { style: { backgroundColor: '#FFEBEE', color: '#C62828' }, label: "Passionate Learner" };
    default:
      return { style: { backgroundColor: '#F3E5F5', color: '#7B1FA2' }, label: "Learner" };
  }
};