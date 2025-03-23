import React, { useState, useEffect } from 'react';
import { Box, Card, Avatar, Typography, Grid, Chip, TextField } from '@mui/material';
import { Search, ExpandMore } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatDistance } from 'date-fns';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; 
import './cal.css';

import { useAuth } from '../../authentication/AuthContext';
import SessionRecord from './SessionRecord';
import htmlIMG from '../src/html.png';
import cssIMG from '../src/css.png';
import javascriptIMG from '../src/javascript.png';

const LibPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Mock login history - replace with your actual data
  const loginDates = [
    new Date(2024, 2, 20),
    new Date(2024, 2, 21),
    new Date(2024, 2, 23),
    new Date() // Today
  ];

  const months = ["January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December"];

  const today = new Date();
  const LISTSESSION_API_ENDPOINT = 'http://localhost:8504/list_session';
  const [quizData, setQuizData] = useState<QuizData[]>([]);

  const convertTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  interface QuizData {
    session_id: string;
    name: string;
    sname: string;
    question_count: number;
    timestamp: string;
    current_question_count: number;
    score: number;
    topics: string[];
    progressstate: 'Done' | 'In Progress';
    difficulty: 'Easy' | 'Medium' | 'Hard';
  }

  // Calendar tile class function
  const getTileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const isLoginDate = loginDates.some(loginDate => 
        loginDate.toDateString() === date.toDateString()
      );
      const isToday = new Date().toDateString() === date.toDateString();

      if (isToday) return 'today-highlight';
      if (isLoginDate) return 'login-highlight';
    }
    return '';
  };

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch(`${LISTSESSION_API_ENDPOINT}/${user?._id}`, {
          method: 'GET',
        });
        if (response.ok) {
          const data = await response.json();
          const newQuizData: QuizData[] = data.map((item: any) => ({
            session_id: item.session_id,
            name: item.sname,
            sname: item.sname,
            question_count: item.question_count,
            timestamp: convertTimestamp(item.timestamp),
            current_question_count: item.current_question_count,
            score: item.score,
            topics: item.topics,
            progressstate: item.current_question_count === (item.question_count + 1) ? 'Done' : 'In Progress',
            difficulty: ['Easy', 'Medium', 'Hard'][Math.floor(Math.random() * 3)] as 'Easy' | 'Medium' | 'Hard',
          }));
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
      }
    };
    fetchSessions();
  }, [user?._id]);

  const completedSessions = quizData.filter(q => q.progressstate === 'Done').length;
  const totalSessions = quizData.length;
  const completionPercentage = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
  const easyCount = quizData.filter(q => q.difficulty === 'Easy').length;
  const mediumCount = quizData.filter(q => q.difficulty === 'Medium').length;
  const hardCount = quizData.filter(q => q.difficulty === 'Hard').length;

  // Calculate success rate based on scores
  const successRate = totalSessions > 0
    ? Math.round(
        (quizData.reduce((sum, quiz) => {
          // Assuming quiz.score is a number representing percentage
          return sum + (quiz.score / 100);
        }, 0) / totalSessions) * 100
      )
    : 0;

  const studyPlans = [
    { 
      title: 'HTML Basic', 
      description: 'The Most Basic HTML Tech Skill', 
      image: htmlIMG,
      path: '/studyplan/html'
    },
    { 
      title: 'CSS Skill', 
      description: 'Best CSS tech skill you should know', 
      image: cssIMG,
      path: '/studyplan/css'
    },
    { 
      title: 'JavaScript Tech', 
      description: 'Introduction to the Javascript Basic!', 
      image: javascriptIMG,
      path: '/studyplan/javascript'
    },
  ];

  const handleCardClick = (path: string) => {
    navigate(path);
  };

  return (
    <Box
      sx={{
        mx: 'auto',
        width: '100%',
        flexGrow: 1,
        p: { xs: 0, md: 0 }, 
        maxWidth: { md: '1200px', lg: '1440px' }, // Increased max width
        bgcolor: 'background.paper',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '3fr 2fr' }, // Changed ratio to make sidebar wider
        gap: { xs: 1, md: 2 }, // Reduced gap
      }}
    >
      {/* Main Content */}
      <Box sx={{ p: 0 }}> 
        {/* Study Plan Section */}
        <Box sx={{ mb: 0 }}> 
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" fontWeight="medium">Study Plan</Typography>
            <a href="/studyplan" style={{ fontSize: '16px', color: '#1976d2' }}>See all</a>
          </Box>
          <Grid container spacing={2}>
            {studyPlans.map((plan, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card
                  onClick={() => handleCardClick(plan.path)}
                  sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    borderRadius: 2,
                    boxShadow: 1,
                    bgcolor: 'background.default',
                    transition: 'all 0.3s',
                    '&:hover': { boxShadow: 3, bgcolor: 'grey.100' },
                  }}
                >
                  <img src={plan.image} alt={plan.title} style={{ width: 72, height: 72, borderRadius: 4 }} />
                  <Box>
                    <Typography variant="subtitle1" fontWeight="medium">{plan.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{plan.description}</Typography>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        <SessionRecord 
          searchTerm={searchTerm}
          selectedFilters={selectedFilters}
          onSearchChange={(value: string) => setSearchTerm(value)}
        />
      </Box>

      {/* Sidebar */}
      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        minWidth: { md: '320px', lg: '380px' }, // Set minimum width
        p: 1, // Reduced padding
      }}>
        {/* User Card */}
        <Card sx={{ 
          p: 2, // Reduced padding
          width: '100%',
        }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
            <Avatar src={user?.avatarUrl} sx={{ width: 60, height: 60 }}>{user?.username?.[0]?.toUpperCase()}</Avatar>
            <Box>
              <Typography variant="h6">{user?.username}</Typography>
              <Typography variant="body2" color="text.secondary">Last login: Today</Typography>
              <Typography variant="body2" color="text.secondary">Success Rate: {successRate}%</Typography>
              <Typography variant="body2" color="text.secondary">Complete Rate: {completionPercentage}%</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
            <Box textAlign="center">
              <Typography variant="h6" color="success.main">{easyCount}</Typography>
              <Typography variant="body2" color="text.secondary">Easy</Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h6" color="warning.main">{mediumCount}</Typography>
              <Typography variant="body2" color="text.secondary">Medium</Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h6" color="error.main">{hardCount}</Typography>
              <Typography variant="body2" color="text.secondary">Hard</Typography>
            </Box>
          </Box>
        </Card>

        {/* Calendar */}
        <Card sx={{ 
          p: 2,
          width: '100%',
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">{months[today.getMonth()]}</Typography>
            <Box>
              <Typography variant="h5" color="primary.main" sx={{ fontWeight: 'bold' }}>
                Day {selectedDate.getDate()}
              </Typography>
              <Typography variant="caption" color="text.secondary">

                {formatDistance(selectedDate, new Date(), { addSuffix: true })}
              </Typography>
            </Box>
          </Box>
          <Calendar
            value={selectedDate}
            tileClassName={getTileClassName}
            className="custom-calendar"
            formatShortWeekday={(locale, date) => 
                ['S', 'M', 'T', 'W', 'T', 'F', 'S'][date.getDay()]
            }
            showNavigation={false}
            view="month"
            tileDisabled={() => true}
            onClickDay={() => {}}
            calendarType="gregory"
        />  
        </Card>
      </Box>
    </Box>
  );
};

export default LibPage;