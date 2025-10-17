import { useState } from "react";
import "../App.css";
import { uploadAndAnalyzePdf } from "../services/databricksService";
import { Box } from "@mui/material";
import Grid from "@mui/material/Grid";
import FileUploadBox from "../components/FileUploadBox";
import FileAnalysisTabs from "../components/fileAnalysis/FileAnalysisTabs";
import { useDispatch, useSelector } from "react-redux";
import {
  addProcessedFile,
  setFileQueue,
  updateFileStatus,
} from "../redux/slices/fileSlice";
import type { FileProcessStatus } from "../redux/slices/fileSlice";
import type { AppDispatch, RootState } from "../redux/store";
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface HomeProps {}
const Home: React.FC<HomeProps> = () => {
  const [processingFile, setProcessingFile] = useState<boolean>(false);

  const [currentFileIndex, setCurrentFileIndex] = useState<number | null>(null);

  const dispatch = useDispatch<AppDispatch>();
  const { fileQueue, loading, databricksConnected } = useSelector(
    (state: RootState) => state.file
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const validFiles = files.filter(
      (file) => file.type.includes("pdf") && file.size <= 50 * 1024 * 1024
    );

    const queue = validFiles.map((file) => ({
      file,
      status: "pending" as const,
    }));

    dispatch(setFileQueue(queue));
    processFilesSequentially(queue);
  };
  const processFilesSequentially = async (queue: FileProcessStatus[]) => {
    setProcessingFile(true);
    for (let i = 0; i < queue.length; i++) {
      setCurrentFileIndex(i);
      // updateFileStatus(i, "processing");
      dispatch(updateFileStatus({ index: i, status: "processing" }));
      try {
        const result = await uploadAndAnalyzePdf(queue[i].file, true);
        console.log({ result });

        if (result?.success) {
          dispatch(
            updateFileStatus({
              index: i,
              status: "done",
              analysis: result.analysis,
              name: result?.name,
              timestamp: result?.timestamp,
            })
          );
          dispatch(
            addProcessedFile({
              status: "done",
              analysis: result.analysis,
              name: result?.name,
              timestamp: result?.timestamp,
              file: {},
            })
          );
        } else {
          dispatch(updateFileStatus({ index: i, status: "error" }));
        }
      } catch (err) {
        console.log({ err });
        dispatch(updateFileStatus({ index: i, status: "error" }));
        setProcessingFile(false);
      }
    }
    setProcessingFile(false);

    setCurrentFileIndex(null);
  };

  return (
    <Box
      sx={{
        color: "#1b1f23",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        flex: 1,
      }}
    >
      {/* Upload Box */}
      <FileUploadBox
        loading={loading}
        processing={processingFile}
        databricksConnected={databricksConnected}
        handleFileChange={handleFileChange}
        totalFiles={fileQueue?.length}
        currentFileIndex={currentFileIndex}
      />

      {/* File Results */}
      {fileQueue?.length > 0 && (
        <Grid
          container
          spacing={3}
          justifyContent="center"
          sx={{ width: "100%", mt: 3 }}
        >
          <FileAnalysisTabs files={fileQueue} />
        </Grid>
      )}
    </Box>
  );
};

export default Home;
