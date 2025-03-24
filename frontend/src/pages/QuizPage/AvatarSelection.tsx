import React, { useState } from 'react';
import { Box, Typography, Grid, Card, CardMedia, Button } from '@mui/material';
import { useAuth } from '../../authentication/AuthContext';
import { useNavigate } from 'react-router-dom';

const AVATAR_OPTIONS = [
  { id: 'av1', src: '/static/avatars/av1.png' },
  { id: 'av2', src: '/static/avatars/av2.png' },
  { id: 'av3', src: '/static/avatars/av3.png' },
  { id: 'av4', src: '/static/avatars/av4.png' },
];

const AvatarSelection: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);

  const handleAvatarSelect = (avatarId: string) => {
    setSelectedAvatar(avatarId);
  };

  const handleSaveAvatar = async () => {
    if (!selectedAvatar) return;

    try {
      const response = await fetch(`http://localhost:8504/users/${user?._id}/avatar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: selectedAvatar }),
      });

      if (!response.ok) {
        throw new Error('Failed to save avatar');
      }

      // Navigate back after successful update
      navigate(-1);
    } catch (error) {
      console.error('Error saving avatar:', error);
      alert('Failed to save avatar. Please try again.');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Select Your Avatar
      </Typography>
      <Grid container spacing={2}>
        {AVATAR_OPTIONS.map((avatar) => (
          <Grid item xs={6} sm={3} key={avatar.id}>
            <Card
              sx={{
                border: selectedAvatar === avatar.id ? '2px solid #1976d2' : '1px solid #ccc',
                cursor: 'pointer',
              }}
              onClick={() => handleAvatarSelect(avatar.id)}
            >
              <CardMedia
                component="img"
                image={avatar.src}
                alt={`Avatar ${avatar.id}`}
                sx={{ height: 100, objectFit: 'contain' }}
              />
            </Card>
          </Grid>
        ))}
      </Grid>
      <Button
        variant="contained"
        color="primary"
        sx={{ mt: 3 }}
        onClick={handleSaveAvatar}
        disabled={!selectedAvatar}
      >
        Save Avatar
      </Button>
    </Box>
  );
};

export default AvatarSelection;