import { Box, Tab, Tabs, Typography, CircularProgress } from "@mui/material";
import React from "react";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import type { FileProcessStatus } from "../../redux/slices/fileSlice";
import { useAppColors } from "../../hooks/useAppColors";

interface FileTabsProps {
  files: FileProcessStatus[];
  value: number;
  setValue: React.Dispatch<React.SetStateAction<number>>;
}

const FileTabs: React.FC<FileTabsProps> = ({ files, value, setValue }) => {
  const { colors, theme } = useAppColors();

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Tabs
      orientation="vertical"
      variant="scrollable"
      value={value}
      onChange={handleChange}
      sx={{
        borderRight: `1px solid ${colors.border}`,
        minWidth: 240,
        background: colors.background,
        color: colors.text,
        "& .Mui-selected": {
          color: theme.palette.primary.main + " !important",
        },
        "& .MuiTab-root": {
          textTransform: "none",
          fontWeight: 500,
        },
      }}
    >
      {files.map((f, idx) => {
        let icon = null;

        if (f.status === "pending" || f.status === "processing") {
          icon = (
            <CircularProgress
              size={14}
              sx={{
                color: colors.progress,
                ml: 1,
              }}
            />
          );
        } else if (f.status === "done") {
          icon = (
            <CheckCircleIcon
              sx={{
                color: colors.success,
                fontSize: 16,
                ml: 1,
              }}
            />
          );
        } else if (f.status === "error") {
          icon = (
            <ErrorIcon
              sx={{
                color: colors.error,
                fontSize: 16,
                ml: 1,
              }}
            />
          );
        }

        return (
          <Tab
            key={idx}
            label={
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  textAlign: "left",
                  flex: 1,
                  width: "100%",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    maxWidth: 150,
                    display: "flex",
                    flex: 1,
                    textAlign: "left",
                  }}
                >
                  {f.file.name || f?.name}
                </Typography>
                {icon}
              </Box>
            }
            sx={{
              color: "inherit",
              transition: "all 0.3s ease",
              "&:hover": { color: colors.buttonHover },
              "&:focus": { outline: "none" },
              px: 2,
            }}
          />
        );
      })}
    </Tabs>
  );
};

export default FileTabs;
