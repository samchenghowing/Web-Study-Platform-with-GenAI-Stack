import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardMedia,
  Button,
  Box,
  Snackbar,
  Alert,
} from '@mui/material';
import { useAuth } from '../authentication/AuthContext';

const AVATAR_OPTIONS = [
  { id: 'av1', src: '/static/avatars/av1.png' },
  { id: 'av2', src: '/static/avatars/av2.png' },
  { id: 'av3', src: '/static/avatars/av3.png' },
  { id: 'av4', src: '/static/avatars/av4.png' },
  { id: 'av5', src: '/static/avatars/av5.png' },
  { id: 'av6', src: '/static/avatars/av6.png' },
];

interface AvatarSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onAvatarUpdate: (avatar: string) => void;
}

const AvatarSelectionDialog: React.FC<AvatarSelectionDialogProps> = ({
  open,
  onClose,
  onAvatarUpdate,
}) => {
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

      onAvatarUpdate(selectedAvatar);
      setShowSuccess(true);
      onClose();
      setTimeout(() => {
        setShowSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Error saving avatar:', error);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle fontSize={30} align="center" color="primary" >Choose Your Avatar</DialogTitle>
        <DialogContent>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!selectedAvatar}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={showSuccess}
        autoHideDuration={2000}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" elevation={6} variant="filled">
          Avatar updated successfully!
        </Alert>
      </Snackbar>
    </>
  );
};

export default AvatarSelectionDialog;