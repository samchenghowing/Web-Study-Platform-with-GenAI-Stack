const AVATAR_COUNT = 6; // Total number of avatars available

export const getAvatarPath = (avatarId: string | null | undefined): string => {
    if (!avatarId) {
      return '/static/avatars/default.png'; // Default avatar path
    }
  
    // Extract the number from avatarId (e.g., "av1" -> 1)
    const avatarNumber = parseInt(avatarId.replace('av', ''));
    
    // Validate the avatar number
    if (isNaN(avatarNumber) || avatarNumber < 1 || avatarNumber > AVATAR_COUNT) {
      return '/static/avatars/default.png';
    }
  
    return `/static/avatars/av${avatarNumber}.png`;
  };