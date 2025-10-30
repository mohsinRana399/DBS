/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000,
  headers: {
    "Content-Type": "application/json",
  },
});
export const databricksSetup = async () => {
  try {
    const response = await api.get("/api/databricks/setup");
    return response.data;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Health check failed: ${error.message}`);
    }
    throw new Error("Connection failed");
  }
};

export const uploadAndAnalyzePdf = async (
  file: any,
  prompts: { title: string; prompt: string }[],
  createNotebook = false
) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("create_notebook", String(createNotebook));
    formData.append("prompts_json", JSON.stringify(prompts));
    const response = await api.post("/api/pdf/upload-and-analyze", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error: unknown) {
    console.log({ error });

    if (error instanceof Error)
      throw new Error(`PDF upload failed: ${error.message}`);
  }
};
