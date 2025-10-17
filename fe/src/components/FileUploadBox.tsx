import React, { useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";
import { useAppColors } from "../hooks/useAppColors";

interface FileUploadBoxProps {
  loading: boolean;
  processing: boolean;
  currentFileIndex: number | null;
  totalFiles?: number;
  databricksConnected?: boolean;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

const FileUploadBox: React.FC<FileUploadBoxProps> = ({
  loading,
  currentFileIndex,
  totalFiles,
  databricksConnected,
  handleFileChange,
  processing,
}) => {
  const { colors } = useAppColors();

  const isDisabled = loading || !databricksConnected || processing;

  const content = useMemo(() => {
    if (loading) return "Waiting for connection...";
    if (!databricksConnected) return "Not Connected";
    if (processing)
      return `Processing file ${currentFileIndex! + 1} of ${totalFiles ?? 0}`;
    return "Ready to Upload";
  }, [loading, databricksConnected, processing, currentFileIndex, totalFiles]);

  return (
    <Card
      sx={{
        width: "100%",
        maxWidth: 300,
        background: colors.background,
        boxShadow: colors.shadow,
        borderRadius: 4,
        backdropFilter: "blur(6px)",
        border: `1px solid ${colors.border}`,
        transition: "background 0.3s ease, box-shadow 0.3s ease",
      }}
    >
      <CardContent
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
          py: 5,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mb: 1,
          }}
        >
          {loading ? (
            <CircularProgress size={22} sx={{ color: colors.progress }} />
          ) : databricksConnected ? (
            <CheckCircleIcon sx={{ color: colors.success }} />
          ) : (
            <HourglassBottomIcon sx={{ color: colors.error }} />
          )}
          <Typography
            variant="body1"
            sx={{ opacity: 0.9, color: colors.text, fontWeight: 500 }}
          >
            {content}
          </Typography>
        </Box>

        <Box
          sx={{
            width: "100%",
            borderRadius: 3,
            px: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            transition: "all 0.3s ease",
            "&:hover": {
              borderColor: databricksConnected
                ? colors.progress
                : colors.border,
              transform: databricksConnected ? "scale(1.02)" : "none",
            },
          }}
        >
          <Button
            variant="contained"
            component="label"
            disabled={isDisabled}
            sx={{
              mt: 1,
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 2,
              "&:hover": {
                backgroundColor: colors.buttonHover,
              },
            }}
          >
            Select PDF Files
            <input
              type="file"
              accept=".pdf"
              multiple
              hidden
              onChange={handleFileChange}
            />
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default FileUploadBox;
