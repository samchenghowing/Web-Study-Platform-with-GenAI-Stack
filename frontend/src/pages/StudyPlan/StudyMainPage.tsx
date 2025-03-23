import React from 'react';
import { Grid, Card, CardContent, Typography, Box, Button } from '@mui/material';
import StudyPageLayout from './StudyPageLayout';
import { CodeBlock, dracula } from 'react-code-blocks';

const StudyMainPage = () => {
  const topics = [
    {
      title: 'HTML',
      description: 'Structure and content of web pages',
      path: '/studyplan/html',
    },
    {
      title: 'CSS',
      description: 'Styling and layout of web pages',
      path: '/studyplan/css',
    },
    {
      title: 'JavaScript',
      description: 'Interactive and dynamic web functionality',
      path: '/studyplan/javascript',
    },
  ];

  return (
    <StudyPageLayout title="Web Development Overview">
      <Typography paragraph>
        Web development involves creating websites and web applications using various technologies.
        The three core technologies are HTML, CSS, and JavaScript.
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {topics.map((topic) => (
          <Grid item xs={12} md={4} key={topic.title}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  {topic.title}
                </Typography>
                <Typography paragraph>
                  {topic.description}
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary"
                  href={topic.path}
                >
                  Learn More
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </StudyPageLayout>
  );
};

export default StudyMainPage;