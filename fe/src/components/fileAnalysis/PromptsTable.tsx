import { Box, Button, Typography } from "@mui/material";
import React from "react";
import { useAppColors } from "../../hooks/useAppColors";
import type { iPromptResponseTiming } from "../../redux/slices/fileSlice";

interface PromptsTableProps {
  responses: {
    prompt: string;
    answer: string;
    success: boolean;
    error: string | null;
    explanation?: string;
    title: string;
    timing?: iPromptResponseTiming;
  }[];
  handleOpen: (explanation: string | undefined) => void;
}
const PromptsTable: React.FC<PromptsTableProps> = ({
  responses,
  handleOpen,
}) => {
  const { colors } = useAppColors();

  const formatAnswer = (answer: unknown): string => {
    if (typeof answer === "string") return answer;
    if (Array.isArray(answer)) {
      return answer.map((item) => formatAnswer(item)).join(", ");
    }
    if (typeof answer === "object" && answer !== null) {
      return Object.entries(answer)
        .map(([key, value], idx, arr) => {
          const formatted = `${key}: ${formatAnswer(value)}`;
          if (arr.length > 1 && idx === arr.length - 1) {
            return `and ${formatted}`;
          }
          return formatted;
        })
        .join(", ");
    }
    return JSON.stringify(answer);
  };
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "1fr 3fr 1fr 1fr",
        gap: 2,
        backgroundColor: colors.background,
        borderRadius: 2,
        p: 2,
      }}
    >
      {/* Header Row */}
      <Box
        sx={{
          display: "contents",
          fontWeight: 600,
          borderBottom: "1px solid #30363d",
          pb: 1,
          mb: 4,
          color: "#8b949e",
        }}
      >
        <Typography>Title</Typography>
        <Typography>Answer</Typography>
        <Typography>Explanation</Typography>
        <Typography>Time</Typography>
      </Box>

      {/* Data Rows */}
      {responses.map((r, i) => (
        <Box sx={{ display: "contents" }} key={i}>
          <Typography
            sx={{
              whiteSpace: "pre-wrap",
              background: colors.background,
              borderRadius: 1,
              p: 1,
              border: `1px solid ${colors.border}`,
              color: colors.textSecondary,
            }}
          >
            {r.title}
          </Typography>

          <Typography
            sx={{
              whiteSpace: "pre-wrap",
              background: colors.background,
              borderRadius: 1,
              p: 1,
              border: `1px solid ${colors.border}`,
              color: colors.textSecondary,
            }}
          >
            {formatAnswer(r.answer)}
          </Typography>

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleOpen(r.explanation)}
              sx={{
                color: "#58a6ff",
                borderColor: "#58a6ff",
                "&:hover": {
                  borderColor: "#90bef3",
                  backgroundColor: "rgba(88,166,255,0.1)",
                },
              }}
            >
              Show
            </Button>
          </Box>
          <Typography
            sx={{
              whiteSpace: "pre-wrap",
              background: colors.background,
              borderRadius: 1,
              p: 1,
              border: `1px solid ${colors.border}`,
              color: colors.textSecondary,
            }}
          >
            {r?.timing?.total_time}s
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export default PromptsTable;
