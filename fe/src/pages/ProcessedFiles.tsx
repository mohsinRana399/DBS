import { Box, Button, Grid, Stack, Typography } from "@mui/material";
import React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import FileAnalysisTabs from "../components/fileAnalysis/FileAnalysisTabs";
import { useNavigate } from "react-router-dom";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ProcessedFilesProps {}
const ProcessedFiles: React.FC<ProcessedFilesProps> = () => {
  const { processedFiles } = useSelector((state: RootState) => state.file);
  const navigate = useNavigate();
  return (
    <Box
      sx={{
        display: "flex",
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {processedFiles?.length > 0 ? (
        <Grid
          container
          spacing={3}
          justifyContent="center"
          sx={{ width: "100%", mt: 3 }}
        >
          <FileAnalysisTabs files={processedFiles} processed />
        </Grid>
      ) : (
        <Stack alignItems="center" spacing={2}>
          <Typography variant="h6" color="text.primary">
            No previously processed files found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Process some files to view their analysis here.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/")}
            sx={{ mt: 1 }}
          >
            Process Files
          </Button>
        </Stack>
      )}
    </Box>
  );
};

export default ProcessedFiles;
