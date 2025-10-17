import { Box, Typography } from "@mui/material";
import React from "react";
import { useAppColors } from "../../hooks/useAppColors";

interface TableHelperProps {
  title?: string;
  content?: string;
}
const TableHelper: React.FC<TableHelperProps> = ({ title, content }) => {
  const { colors } = useAppColors();

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        <strong>{title}</strong>
      </Typography>
      <Typography
        variant="body2"
        sx={{
          backgroundColor: colors.background,
          borderRadius: 2,
          p: 2,
          fontFamily: "monospace",
          border: `1px solid ${colors.border}`,
          color: colors.textSecondary,
        }}
      >
        {content}
      </Typography>
    </Box>
  );
};

export default TableHelper;
