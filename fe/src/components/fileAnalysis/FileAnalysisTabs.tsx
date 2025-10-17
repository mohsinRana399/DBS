import * as React from "react";
import Box from "@mui/material/Box";
import ExplanationModal from "./ExplanationModal";
import type { FileProcessStatus } from "../../redux/slices/fileSlice";
import moment from "moment";
import TabStatusIndicator from "./TabStatusIndicator";
import FileTabs from "./FileTabs";
import { useAppColors } from "../../hooks/useAppColors";
import TableHelper from "./TableHelper";
import PromptsTable from "./PromptsTable";
import { Button, Stack } from "@mui/material";
interface AiResponse {
  prompt: string;
  answer: string;
  explanation?: string;
  title?: string;
  success?: boolean;
  error?: string | null;
}

interface FileAnalysisTabsProps {
  files: FileProcessStatus[];
  processed?: boolean;
}

export default function FileAnalysisTabs({
  files,
  processed,
}: FileAnalysisTabsProps) {
  const [value, setValue] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const [selectedExplanation, setSelectedExplanation] = React.useState<
    string | null
  >(null);

  const { colors } = useAppColors();

  const handleOpen = (explanation: string | undefined) => {
    setSelectedExplanation(explanation || "No explanation available");
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const getSuccessStats = (responses: AiResponse[]) => {
    const total = responses.length;
    const success = responses.filter(
      (r) => r.success && r.answer && r.answer !== "Not found in document"
    ).length;
    const rate = Math.round((success / total) * 100);
    return { total, success, rate };
  };

  const getLightColor = (rate: number) => {
    if (rate >= 90) return "#238636"; // green
    if (rate >= 70) return "#f1e05a"; // yellow
    return "#da3633"; // red
  };
  const exportToCSV = (file: FileProcessStatus) => {
    if (!file?.analysis?.responses?.length) return;

    const processedOn = file.timestamp
      ? moment(file.timestamp).format("YYYY-MM-DD HH:mm:ss")
      : "—";
    const rows = file.analysis.responses.map((r) => ({
      "Document Name": file.name || "Unknown",
      Title: r.title || "",
      Answer: r.answer || "",
      Explanation: r.explanation || "",
      "Query Time (s)": r.timing?.total_time?.toFixed(2) ?? "",
      "Processed On": processedOn,
    }));

    const headers = Object.keys(rows[0]).join(",");
    const csvRows = rows.map((row) =>
      Object.values(row)
        .map((val) => `"${String(val).replace(/"/g, '""')}"`)
        .join(",")
    );

    const csvContent = [headers, ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${file.name?.replace(".pdf", "") || "analysis"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <>
      <Box
        sx={{
          flexGrow: 1,
          bgcolor: colors.backgroundSecondary,
          display: "flex",
          color: colors.text,
          position: "relative",
          borderRadius: 2,
          p: 1,
          boxShadow: colors?.shadow,
        }}
      >
        <FileTabs files={files} value={value} setValue={setValue} />

        {/* File Content */}
        {files.map((f, idx) => {
          const responses = f.analysis?.responses ?? [];
          const { total, success, rate } = getSuccessStats(responses);
          const light = getLightColor(rate);

          return (
            <div
              key={idx}
              role="tabpanel"
              hidden={value !== idx}
              id={`vertical-tabpanel-${idx}`}
              aria-labelledby={`vertical-tab-${idx}`}
              style={{
                flex: 1,
                padding: "0px 16px",
                color: colors.text,
                borderRadius: "8px",
                background: colors.backgroundSecondary,
              }}
            >
              {value === idx && (
                <Box sx={{ p: 0 }}>
                  {f?.status !== "pending" && f?.status !== "processing" && (
                    <TabStatusIndicator
                      total={total}
                      success={success}
                      rate={rate}
                      light={light}
                      processingTime={f?.analysis?.total_processing_time || 0}
                    />
                  )}
                  {f?.status === "done" && (
                    <Stack
                      direction="row"
                      justifyContent="flex-end"
                      sx={{ mb: 2 }}
                    >
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => exportToCSV(f)}
                      >
                        Export CSV
                      </Button>
                    </Stack>
                  )}
                  <PromptsTable responses={responses} handleOpen={handleOpen} />

                  <TableHelper
                    title="Merged Summary"
                    content={f.analysis?.merged_summary || "—"}
                  />

                  {processed && (
                    <TableHelper
                      title="Processed on"
                      content={
                        moment(f.timestamp).format("MMMM Do YYYY, h:mm a") ||
                        "—"
                      }
                    />
                  )}
                </Box>
              )}
            </div>
          );
        })}
      </Box>
      <ExplanationModal
        open={open}
        handleClose={handleClose}
        selectedExplanation={selectedExplanation}
      />
    </>
  );
}
