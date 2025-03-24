import React, { useState, useEffect } from 'react';
import { Box, Card, Avatar, Typography, Grid, Chip, TextField } from '@mui/material';
import { Search, ExpandMore } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { formatDistance } from 'date-fns';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; 
import './cal.css';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AvatarSelectionDialog from '../../components/AvatarSelectionDialog';

import { useAuth } from '../../authentication/AuthContext';
import SessionRecord from './SessionRecord';
import htmlIMG from '../src/html.png';
import cssIMG from '../src/css.png';
import javascriptIMG from '../src/javascript.png';
import { getKnowledgeLevel, getStudyTimeStyle } from '../../utils/userStyles';
import { getAvatarPath } from '../../utils/avatarUtils';

const LibPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [userProfile, setUserProfile] = useState<{
    Knowledge?: string;
    Time?: string;
  } | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);

  const handleOpenAvatarDialog = () => {
    setIsAvatarDialogOpen(true);
  };

  const handleCloseAvatarDialog = () => {
    setIsAvatarDialogOpen(false);
  };

  const handleAvatarUpdate = (newAvatar: string) => {
    setUserAvatar(newAvatar);
  };

  useEffect(() => {
    const fetchUserAvatar = async () => {
      if (!user?._id) return;
      
      try {
        const response = await fetch(`http://localhost:8504/users/${user._id}/avatar`);
        if (response.ok) {
          const data = await response.json();
          setUserAvatar(data.avatar);
        }
      } catch (error) {
        console.error('Error fetching avatar:', error);
      }
    };

    fetchUserAvatar();
  }, [user?._id]);

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
  
      if (isToday && isLoginDate) return 'today-highlight login-highlight';
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
            question_count: item.question_count,
            timestamp: `${item.timestamp._DateTime__date._Date__year}-${item.timestamp._DateTime__date._Date__month}-${item.timestamp._DateTime__date._Date__day} ${item.timestamp._DateTime__time._Time__hour}:${item.timestamp._DateTime__time._Time__minute}:${item.timestamp._DateTime__time._Time__second}`,
            current_question_count: item.current_question_count,
            score: item.score,
            topics: item.topics,
            progressstate:
              item.current_question_count === item.question_count
                ? 'Done'
                : 'In Progress',
            difficulty: ['Easy', 'Medium', 'Hard'][Math.floor(Math.random() * 3)] as
              | 'Easy'
              | 'Medium'
              | 'Hard',
          }));
          setQuizData(newQuizData);
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
      }
    };
    fetchSessions();
  }, [user?._id]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch(`http://localhost:8504/users/${user?._id}/profile`);
        if (response.ok) {
          const profileData = await response.json();
          setUserProfile(profileData); // Save the profile data to state
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    if (user?._id) {
      fetchUserProfile();
    }
  }, [user?._id]);

 // Calculate completion rate
  const completedSessions = quizData.filter(
    (quiz) => quiz.current_question_count >= quiz.question_count // Session is complete if all questions are answered
  ).length;

  const totalSessions = quizData.length;
  const completionPercentage =
    totalSessions > 0
      ? Math.round((completedSessions / totalSessions) * 100)
      : 0;

  // Calculate success rate
  const successRate =
    totalSessions > 0
      ? Math.round(
          quizData.reduce((sum, quiz) => sum + quiz.score, 0) / totalSessions
        )
      : 0;

  const easyCount = quizData.filter(q => q.difficulty === 'Easy').length;
  const mediumCount = quizData.filter(q => q.difficulty === 'Medium').length;
  const hardCount = quizData.filter(q => q.difficulty === 'Hard').length;

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
    <>
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
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center'}}>
              <Avatar 
                src={getAvatarPath(userAvatar)}
                sx={{ 
                  width: 80, 
                  height: 80,
                  cursor: 'pointer',
                  '&:hover': {
                    opacity: 0.8,
                  }
                }}
                onClick={handleOpenAvatarDialog}
              >
                {!userAvatar && user?.username?.[0]?.toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h6">{user?.username}</Typography>
                
                {/* Chips Section */}
                {userProfile && (
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {userProfile.Knowledge && (
                      <Box
                      sx={{
                        padding: '4px 8px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        ...getKnowledgeLevel(userProfile.Knowledge).style, // Spread the dynamic style
                      }}
                      >
                        {getKnowledgeLevel(userProfile.Knowledge).label}
                      </Box>
                    )}
                    {userProfile.Time && (
                      <Box
                        sx={{
                          padding: '4px 8px',
                          borderRadius: '16px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          ...getStudyTimeStyle(userProfile.Time).style, // Spread the dynamic style
                        }}
                      >
                        {getStudyTimeStyle(userProfile.Time).label}
                      </Box>
                    )}
                  </Box>
                )}
                <Typography variant="body2" color="text.secondary" sx={{ mt:1}}>Last login: Today</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center'}}>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 1 }}>
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

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

            {/* New Metrics Card */}
            <MetricsCard successRate={successRate} completionRate={completionPercentage} />
          </Box>

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
              formatDay={(locale, date) => date.getDate().toString()}
              formatShortWeekday={(locale, date) => 
                ['S', 'M', 'T', 'W', 'T', 'F', 'S'][date.getDay()]
              }
              showNavigation={false}
              view="month"
              tileDisabled={() => true}
              onClickDay={() => {}}
              calendarType="gregory"
              showNeighboringMonth={false}
            />
          </Card>
        </Box>
      </Box>
      <AvatarSelectionDialog
        open={isAvatarDialogOpen}
        onClose={handleCloseAvatarDialog}
        onAvatarUpdate={handleAvatarUpdate}
      />
    </>
  );
};

const MetricsCard = ({ successRate, completionRate }: { successRate: number; completionRate: number }) => {
  return (
    <Card
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
      {/* Icon Section */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 72,
          height: 72,
          borderRadius: '50%',
          bgcolor: 'primary.light',
        }}
      >
        <CheckCircleOutlineIcon sx={{ fontSize: 48, color: 'primary.main' }} />
      </Box>

      {/* Metrics Section */}
      <Box>
        <Typography variant="subtitle1" fontWeight="medium">
          Success Rate: {successRate}%
        </Typography>
        <Typography variant="subtitle1" fontWeight="medium">
          Complete Rate: {completionRate}%
        </Typography>
      </Box>
    </Card>
  );
};

export default LibPage;