import {
  Box,
  Button,
  CircularProgress,
  Typography,
  useTheme,
} from "@mui/material";
import React from "react";

interface ConnectionStatusProps {
  loading: boolean;
  databricksConnected: boolean;
  initializeApp: () => Promise<void>;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  loading,
  databricksConnected,
  initializeApp,
}) => {
  const theme = useTheme();

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          p: 1.5,
          borderRadius: 2,
        }}
      >
        <CircularProgress size={20} color="primary" />
        <Typography variant="body1" color={"#fff"}>
          Connecting to Databricks...
        </Typography>
      </Box>
    );
  }

  const connectedColor = theme.palette.success.main;
  const disconnectedColor = theme.palette.error.main;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        p: 1.5,
        borderRadius: 2,
        transition: "all 0.3s ease",
      }}
    >
      <Box
        sx={{
          width: 12,
          height: 12,
          borderRadius: "50%",
          backgroundColor: databricksConnected
            ? connectedColor
            : disconnectedColor,
          boxShadow: `0 0 6px ${
            databricksConnected ? connectedColor : disconnectedColor
          }`,
          animation: "pulse 1.5s infinite",
          "@keyframes pulse": {
            "0%, 100%": { transform: "scale(1)" },
            "50%": { transform: "scale(1.3)" },
          },
        }}
      />
      <Typography
        variant="body1"
        sx={{
          fontWeight: 500,
          color: databricksConnected ? connectedColor : disconnectedColor,
        }}
      >
        {databricksConnected ? "Connected to Databricks" : "Disconnected"}
      </Typography>

      {!databricksConnected && (
        <Button
          variant="outlined"
          color="secondary"
          size="small"
          onClick={initializeApp}
          sx={{ ml: "auto" }}
        >
          Retry
        </Button>
      )}
    </Box>
  );
};

export default ConnectionStatus;
