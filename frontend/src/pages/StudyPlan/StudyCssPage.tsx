import React from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import StudyPageLayout from './StudyPageLayout';
import { CodeBlock, dracula } from 'react-code-blocks';

const StudyCssPage = () => {
  const cssExample = `
/* Basic Styling */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* Flexbox Layout */
.flex-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}`;

  const cssProperties = [
    { property: 'color', description: 'Text color' },
    { property: 'background-color', description: 'Background color' },
    { property: 'margin', description: 'Outside spacing' },
    { property: 'padding', description: 'Inside spacing' },
    { property: 'display', description: 'Display type' },
    { property: 'position', description: 'Positioning method' },
  ];

  return (
    <StudyPageLayout title="CSS Styling">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Common CSS Properties
        </Typography>
        <Grid container spacing={2}>
          {cssProperties.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.property}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="primary">
                    {item.property}
                  </Typography>
                  <Typography>
                    {item.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          CSS Example
        </Typography>
        <CodeBlock
          text={cssExample}
          language="css"
          theme={dracula}
        />
      </Box>
    </StudyPageLayout>
  );
};

export default StudyCssPage;