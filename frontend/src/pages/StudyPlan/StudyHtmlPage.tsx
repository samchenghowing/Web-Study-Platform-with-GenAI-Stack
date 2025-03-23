import React from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import StudyPageLayout from './StudyPageLayout';
import { CodeBlock, dracula } from 'react-code-blocks';

const StudyHtmlPage = () => {
  const htmlExample = `
<!DOCTYPE html>
<html>
  <head>
    <title>My First Page</title>
  </head>
  <body>
    <h1>Hello World!</h1>
    <p>This is a paragraph.</p>
  </body>
</html>`;

  const commonTags = [
    { tag: '<div>', description: 'Container for other elements' },
    { tag: '<p>', description: 'Paragraph text' },
    { tag: '<a>', description: 'Hyperlink' },
    { tag: '<img>', description: 'Image' },
    { tag: '<ul>', description: 'Unordered list' },
    { tag: '<table>', description: 'Table structure' },
  ];

  return (
    <StudyPageLayout title="HTML Fundamentals">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Common HTML Tags
        </Typography>
        <Grid container spacing={2}>
          {commonTags.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.tag}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="primary">
                    {item.tag}
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
          Basic HTML Structure
        </Typography>
        <CodeBlock
          text={htmlExample}
          language="html"
          theme={dracula}
        />
      </Box>
    </StudyPageLayout>
  );
};

export default StudyHtmlPage;