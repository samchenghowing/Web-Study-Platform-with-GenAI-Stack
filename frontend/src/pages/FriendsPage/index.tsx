import * as React from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { Divider } from '@mui/material';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';

const friendsData = [
    { id: 1, name: 'Alice', age: 28, location: 'New York', hobbies: 'data structure, css' },
    { id: 2, name: 'Bob', age: 34, location: 'San Francisco', hobbies: 'html, javascript' },
    { id: 3, name: 'Charlie', age: 22, location: 'Chicago', hobbies: 'javascript' },
    { id: 4, name: 'Diana', age: 30, location: 'London', hobbies: 'css' },
];

export default function FriendsPage() {
    return (
        <Container>
            <Typography variant="h4" gutterBottom>
                Where are my friends?
            </Typography>
            <Divider sx={{ marginBottom: 2 }} />

            <Grid container spacing={3}>
                {friendsData.map(friend => (
                    <Grid item xs={12} sm={6} md={4} key={friend.id}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6">{friend.name}</Typography>
                                <Typography color="textSecondary">Age: {friend.age}</Typography>
                                <Typography color="textSecondary">Location: {friend.location}</Typography>
                                <Typography color="textSecondary">Hobbies: {friend.hobbies}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
}