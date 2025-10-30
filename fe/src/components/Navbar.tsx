import { AppBar, Toolbar, Button, Box, FormControlLabel } from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import ConnectionStatus from "./ConnectionStatus";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../redux/store";
import { setDatabricksConnected, setLoading } from "../redux/slices/fileSlice";
import { databricksSetup } from "../services/databricksService";
import { CustomDarkModeSwitch } from "./CustomDarkModeSwitch";
import { setDarkMode } from "../redux/slices/globalSlice";
import { useAppColors } from "../hooks/useAppColors";
const navItems = [
  { label: "Home", path: "/" },
  { label: "Processed Files", path: "/processed" },
  { label: "Prompts", path: "/prompts" },
];
export default function Navbar() {
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();

  const { loading, databricksConnected } = useSelector(
    (state: RootState) => state.file
  );
  const { colors, darkMode } = useAppColors();
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setDarkMode(event.target.checked));
  };
  const initializeApp = async () => {
    try {
      dispatch(setLoading(true));

      console.log("Attempting auto-connection to Databricks...");
      const connectResult = await databricksSetup();
      console.log({ connectResult });

      if (connectResult?.success) {
        console.log("Auto-connection successful");
        dispatch(setDatabricksConnected(true));
      }

      dispatch(setLoading(false));
    } catch (error) {
      console.error("Failed to initialize app:", error);
      dispatch(setDatabricksConnected(false));

      dispatch(setLoading(false));
    }
  };
  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        backgroundColor: colors.background,
        borderBottom: `1px solid ${colors.border}`,
        color: colors.text,
        boxShadow: colors.shadow,
        transition: "all 0.3s ease",
      }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <ConnectionStatus
          loading={loading}
          databricksConnected={databricksConnected}
          initializeApp={initializeApp}
        />

        <Box>
          <FormControlLabel
            control={
              <CustomDarkModeSwitch
                sx={{ m: 1 }}
                checked={darkMode}
                onChange={handleChange}
              />
            }
            label={darkMode ? "Dark" : "Light"}
          />
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Button
                key={item.path}
                component={Link}
                to={item.path}
                sx={{
                  mx: 1,
                  color: colors.text,
                  borderBottom: isActive
                    ? `2px solid ${colors.progress}`
                    : "2px solid transparent",
                  borderRadius: 0,
                  textTransform: "none",
                  fontWeight: isActive ? 600 : 400,
                  ":hover": {
                    color: colors.progress,
                    backgroundColor: "transparent",
                  },
                }}
              >
                {item.label}
              </Button>
            );
          })}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
