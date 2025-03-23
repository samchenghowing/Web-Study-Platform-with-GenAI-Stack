import React from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import StudyPageLayout from './StudyPageLayout';
import { CodeBlock, dracula } from 'react-code-blocks';

const StudyJavaScriptPage = () => {
  const jsExample = `
// Variables and Data Types
let name = 'John';
const age = 25;

// Functions
function greet(name) {
  return \`Hello, \${name}!\`;
}

// Arrays and Objects
const fruits = ['apple', 'banana', 'orange'];
const person = {
  name: 'John',
  age: 25,
  sayHello() {
    console.log('Hello!');
  }
};`;

  const jsTopics = [
    { topic: 'Variables', description: 'Store and manage data' },
    { topic: 'Functions', description: 'Reusable code blocks' },
    { topic: 'Arrays', description: 'Ordered collections' },
    { topic: 'Objects', description: 'Key-value pairs' },
    { topic: 'Events', description: 'Handle user interactions' },
    { topic: 'DOM', description: 'Manipulate HTML elements' },
  ];

  return (
    <StudyPageLayout title="JavaScript Basics">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          JavaScript Fundamentals
        </Typography>
        <Grid container spacing={2}>
          {jsTopics.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.topic}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="primary">
                    {item.topic}
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
          Code Examples
        </Typography>
        <CodeBlock
          text={jsExample}
          language="javascript"
          theme={dracula}
        />
      </Box>
    </StudyPageLayout>
  );
};

export default StudyJavaScriptPage;