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
import ArticleIcon from "@mui/icons-material/Article";
import { useAppColors } from "../hooks/useAppColors";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import { useNavigate } from "react-router-dom";

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
  const { prompts } = useSelector((state: RootState) => state.prompts);
  const navigate = useNavigate();

  const isDisabled = loading || !databricksConnected || processing;
  const hasPrompts = prompts && prompts.length > 0;

  const content = useMemo(() => {
    if (loading) return "Waiting for connection...";
    if (!databricksConnected) return "Not Connected";
    if (processing)
      return `Processing file ${currentFileIndex! + 1} of ${totalFiles ?? 0}`;
    if (!hasPrompts) return `No Prompts Found`;

    return "Ready to Upload";
  }, [
    loading,
    databricksConnected,
    processing,
    currentFileIndex,
    totalFiles,
    hasPrompts,
  ]);
  const renderIcon = useMemo(() => {
    if (loading)
      return <CircularProgress size={22} sx={{ color: colors.progress }} />;
    if (!databricksConnected)
      return <HourglassBottomIcon sx={{ color: colors.error }} />;
    if (!hasPrompts) return <ArticleIcon sx={{ color: colors.info }} />;
    return <CheckCircleIcon sx={{ color: colors.success }} />;
  }, [loading, databricksConnected, hasPrompts, colors]);
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
        display: "flex",
        flex: 1,
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
          {renderIcon}
          <Typography
            variant="body1"
            sx={{ opacity: 0.9, color: colors.text, fontWeight: 500 }}
          >
            {content}
          </Typography>
        </Box>
        {!hasPrompts && (
          <Typography
            variant="body2"
            sx={{ color: colors.textSecondary, mb: 1 }}
          >
            Add or import prompts to get started.
          </Typography>
        )}

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
          {!hasPrompts ? (
            <Button
              variant="contained"
              size="small"
              onClick={() => navigate("/prompts")}
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
              Go to Prompts
            </Button>
          ) : (
            <Button
              variant="contained"
              component="label"
              disabled={isDisabled || !hasPrompts}
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
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default FileUploadBox;
