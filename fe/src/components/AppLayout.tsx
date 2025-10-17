// src/components/AppLayout.tsx
import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";
import Navbar from "./Navbar";
import { useAppColors } from "../hooks/useAppColors";

export default function AppLayout() {
  const { colors } = useAppColors();

  return (
    <Box
      sx={{
        p: 0,
        display: "flex",
        flex: 1,
        flexDirection: "column",
        backgroundColor: colors.background,
        height: "100vh",
        color: colors.text,
      }}
    >
      <Navbar />
      <Box
        sx={{
          display: "flex",
          flex: 1,
          p: 4,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
