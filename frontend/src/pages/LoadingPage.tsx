import * as React from "react";
import { Box, Typography } from "@mui/material";
import { keyframes } from "@emotion/react";

// Define keyframe animations
const bounce = keyframes`
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
`;

const fade = keyframes`
  0% {
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.3;
  }
`;

const LoadingPage: React.FC = () => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "background.paper",
        padding: 3,
      }}
    >
      {/* Animated Dots */}
      <Box sx={{ display: "flex", gap: 1 }}>
        <Box
          sx={{
            width: 15,
            height: 15,
            backgroundColor: "primary.main",
            borderRadius: "50%",
            animation: `${bounce} 1.2s infinite ease-in-out`,
          }}
        />
        <Box
          sx={{
            width: 15,
            height: 15,
            backgroundColor: "primary.main",
            borderRadius: "50%",
            animation: `${bounce} 1.2s infinite ease-in-out`,
            animationDelay: "0.2s",
          }}
        />
        <Box
          sx={{
            width: 15,
            height: 15,
            backgroundColor: "primary.main",
            borderRadius: "50%",
            animation: `${bounce} 1.2s infinite ease-in-out`,
            animationDelay: "0.4s",
          }}
        />
      </Box>

      {/* Fading Loading Text */}
      <Typography
        variant="h6"
        sx={{
          mt: 3,
          animation: `${fade} 2s infinite`,
          color: "text.primary",
        }}
        aria-live="polite"
      >
        Loading, please wait...
      </Typography>
    </Box>
  );
};

export default LoadingPage;
