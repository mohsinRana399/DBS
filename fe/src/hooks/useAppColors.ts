import { useTheme } from "@mui/material";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";

export const useAppColors = () => {
  const theme = useTheme();
  const { darkMode } = useSelector((state: RootState) => state.global);

  const colors = {
    background: darkMode ? "#161b22" : "#f9f9f9",
    backgroundSecondary: darkMode ? "#1e242d" : "#ffffff",
    border: darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
    text: darkMode ? "#e0e0e0" : "#333",
    textSecondary: darkMode ? "#c9d1d9" : "#55647a",
    success: theme.palette.success.main,
    error: theme.palette.error.main,
    progress: theme.palette.info.main,
    buttonHover: theme.palette.primary.main,
    shadow: darkMode
      ? "0 8px 24px rgba(0,0,0,0.3)"
      : "0 4px 12px rgba(0,0,0,0.08)",
  };

  return { colors, darkMode, theme };
};
