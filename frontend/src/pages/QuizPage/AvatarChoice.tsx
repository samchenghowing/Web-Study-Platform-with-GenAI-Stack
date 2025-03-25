import React, { useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  Box,
  Button,
  Snackbar,
  Alert
} from '@mui/material';
import { useAuth } from '../../authentication/AuthContext';

const AVATAR_OPTIONS = [
  { id: 'av1', src: '/static/avatars/av1.png' },
  { id: 'av2', src: '/static/avatars/av2.png' },
  { id: 'av3', src: '/static/avatars/av3.png' },
  { id: 'av4', src: '/static/avatars/av4.png' },
  { id: 'av5', src: '/static/avatars/av5.png' },
  { id: 'av6', src: '/static/avatars/av6.png' },
];

interface AvatarChoiceProps {
    onComplete: (selectedAvatar: string) => void;
}

const AvatarChoice: React.FC<AvatarChoiceProps> = ({ onComplete }) => {
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const { user } = useAuth();

  const handleAvatarSelect = (avatarId: string) => {
    setSelectedAvatar(avatarId);
  };

  const handleSave = async () => {
    if (!selectedAvatar || !user?._id) return;

    try {
      const response = await fetch(`http://localhost:8504/users/${user._id}/avatar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: selectedAvatar }),
      });

      if (!response.ok) {
        throw new Error('Failed to save avatar');
      }

      setShowSuccess(true);
      onComplete(selectedAvatar); // Notify parent of completion
      setTimeout(() => {
        setShowSuccess(false);
      }, 1500);
    } catch (error) {
      console.error('Error saving avatar:', error);
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom align="center" color="primary">
        Choose Your Avatar
      </Typography>
      <Grid container spacing={2}>
        {AVATAR_OPTIONS.map((avatar) => (
            <Grid item xs={4} sm={4} key={avatar.id}>
            <Card
                sx={{
                cursor: 'pointer',
                border: selectedAvatar === avatar.id ? '2px solid #1976d2' : '1px solid #ccc',
                transition: 'all 0.2s',
                aspectRatio: '1/1',
                borderRadius: '50%', // Make card circular
                overflow: 'hidden',  // Ensure content stays within circle
                '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: 3,
                },
                }}
                onClick={() => handleAvatarSelect(avatar.id)}
            >
                <Box 
                sx={{ 
                    position: 'relative', 
                    width: '100%', 
                    paddingTop: '100%',
                    borderRadius: '50%',
                    overflow: 'hidden',
                }}
                >
                <CardMedia
                    component="img"
                    image={avatar.src}
                    alt={`Avatar ${avatar.id}`}
                    sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '50%',
                    }}
                />
                </Box>
            </Card>
            </Grid>
        ))}
      </Grid>
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!selectedAvatar}
          sx={{ minWidth: 200 }}
        >
          Save 
        </Button>
      </Box>

      <Snackbar
        open={showSuccess}
        autoHideDuration={1500}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" elevation={6} variant="filled">
          Avatar updated successfully!
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AvatarChoice;