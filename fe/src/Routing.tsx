// src/Routing.tsx
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import ProcessedFiles from "./pages/ProcessedFiles";
import AppLayout from "./components/AppLayout";
import { useEffect } from "react";
import { databricksSetup } from "./services/databricksService";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "./redux/store";
import { setDatabricksConnected, setLoading } from "./redux/slices/fileSlice";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <Home /> },
      { path: "processed", element: <ProcessedFiles /> },
    ],
  },
]);

export default function Routing() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    initializeApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeApp = async () => {
    try {
      dispatch(setLoading(true));

      console.log("Attempting auto-connection to Databricks...");
      const connectResult = await databricksSetup();

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
  return <RouterProvider router={router} />;
}
