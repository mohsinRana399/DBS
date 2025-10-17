import { Box, Typography } from "@mui/material";
import React from "react";
import { useAppColors } from "../../hooks/useAppColors";

interface TabStatusIndicatorProps {
  total: number;
  success: number;
  rate: number;
  light: string;
  processingTime: number;
}

const TabStatusIndicator: React.FC<TabStatusIndicatorProps> = ({
  total,
  success,
  rate,
  light,
  processingTime,
}) => {
  const { colors } = useAppColors();

  return (
    <Box
      sx={{
        position: "absolute",
        top: -80,
        right: 0,
        display: "flex",
        flexDirection: "column",
        backgroundColor: colors.background,
        p: 2,
        borderRadius: 2,
        border: `1px solid ${colors.border}`,
        boxShadow: colors.shadow,
        transition: "background 0.3s ease, color 0.3s ease",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: 0.5,
        }}
      >
        <Box
          sx={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            backgroundColor: light,
            boxShadow: `0 0 8px ${light}`,
          }}
        />
        <Typography
          variant="body2"
          sx={{
            color: colors.text,
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          Successful Prompts: {success} / {total} ({rate}%)
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "flex-end",
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: colors.text,
            fontSize: 13,
          }}
        >
          Total Query Time:{" "}
          <strong style={{ color: light }}>{processingTime}s</strong>
        </Typography>
      </Box>
    </Box>
  );
};

export default TabStatusIndicator;
