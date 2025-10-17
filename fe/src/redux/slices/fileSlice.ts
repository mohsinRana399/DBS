import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface iPromptResponseTiming {
  ai_query_time?: number;
  download_time?: number;
  extraction_time?: number;
  total_time?: number;
}
export interface AiAnalysisResponse {
  responses: {
    prompt: string;
    answer: string;
    success: boolean;
    error: string | null;
    explanation?: string;
    title: string;
    timing?: iPromptResponseTiming;
  }[];
  merged_summary: string;
  total_processing_time: number;
}

export interface UploadedFile {
  name?: string;
  size?: number;
  type?: string;
  lastModified?: number;
}

export interface FileProcessStatus {
  file: UploadedFile;
  status: "pending" | "processing" | "done" | "error";
  analysis?: AiAnalysisResponse | null;
  timestamp?: string;
  name?: string;
}

interface FileState {
  processedFiles: FileProcessStatus[];
  fileQueue: FileProcessStatus[];
  loading: boolean;
  databricksConnected: boolean;
}

const initialState: FileState = {
  processedFiles: [],
  fileQueue: [],
  loading: false,
  databricksConnected: false,
};

const fileSlice = createSlice({
  name: "file",
  initialState,
  reducers: {
    setProcessedFiles: (state, action: PayloadAction<FileProcessStatus[]>) => {
      state.processedFiles = action.payload;
    },
    addProcessedFile: (state, action: PayloadAction<FileProcessStatus>) => {
      state.processedFiles.push(action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setDatabricksConnected: (state, action: PayloadAction<boolean>) => {
      state.databricksConnected = action.payload;
    },
    setFileQueue: (state, action: PayloadAction<FileProcessStatus[]>) => {
      state.fileQueue = action.payload;
    },
    updateFileStatus: (
      state,
      action: PayloadAction<{
        index: number;
        status: FileProcessStatus["status"];
        analysis?: AiAnalysisResponse | null;
        name?: string;
        timestamp?: string;
      }>
    ) => {
      const { index, status, analysis, name, timestamp } = action.payload;
      if (state.fileQueue[index]) {
        state.fileQueue[index].status = status;
        if (analysis) state.fileQueue[index].analysis = analysis;
        if (name) state.fileQueue[index].name = name;
        if (timestamp) state.fileQueue[index].timestamp = timestamp;
      }
    },
    clearFiles: (state) => {
      state.fileQueue = [];
    },
  },
});

export const {
  setProcessedFiles,
  setFileQueue,
  updateFileStatus,
  clearFiles,
  setLoading,
  setDatabricksConnected,
  addProcessedFile,
} = fileSlice.actions;
export default fileSlice.reducer;
