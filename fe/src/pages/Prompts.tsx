import React, { useState } from "react";
import {
  addPrompt,
  removePrompt,
  updatePrompt,
  clearPrompts,
} from "../redux/slices/promptsSlice";
import { useAppColors } from "../hooks/useAppColors";
import type { AppDispatch, RootState } from "../redux/store";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grow,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import * as yaml from "js-yaml";
import PromptsHeader from "../components/prompts/PromptsHeader";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface PromptsProps {}

const Prompts: React.FC<PromptsProps> = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { prompts } = useSelector((state: RootState) => state.prompts);
  const { colors } = useAppColors();

  const [newTitle, setNewTitle] = useState("");
  const [newPrompt, setNewPrompt] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPrompt, setEditPrompt] = useState("");
  const [showAddBox, setShowAddBox] = useState<boolean>(false);
  const addNew = () => {
    if (!newTitle.trim() || !newPrompt.trim()) return;
    dispatch(addPrompt({ title: newTitle.trim(), prompt: newPrompt.trim() }));
    setNewTitle("");
    setNewPrompt("");
  };

  const startEdit = (idx: number) => {
    const p = prompts[idx];
    setEditingIndex(idx);
    setEditTitle(p.title);
    setEditPrompt(p.prompt);
  };

  const saveEdit = () => {
    if (editingIndex === null) return;
    if (!editTitle.trim() || !editPrompt.trim()) return;
    dispatch(
      updatePrompt({
        index: editingIndex,
        prompt: { title: editTitle.trim(), prompt: editPrompt.trim() },
      })
    );
    setEditingIndex(null);
    setEditTitle("");
    setEditPrompt("");
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditTitle("");
    setEditPrompt("");
  };

  const remove = (idx: number) => {
    dispatch(removePrompt(idx));
  };

  const clearAll = () => {
    if (!confirm("Clear all prompts?")) return;
    dispatch(clearPrompts());
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let data: any;

      if (file.name.endsWith(".yaml") || file.name.endsWith(".yml")) {
        data = yaml.load(text);
      } else {
        data = JSON.parse(text);
      }

      const imported = data?.prompts ?? [];

      if (!Array.isArray(imported) || imported.length === 0) {
        alert("No valid prompts found in file.");
        return;
      }

      let addedCount = 0;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      imported.forEach((p: any) => {
        if (p.title && p.prompt) {
          dispatch(addPrompt({ title: p.title, prompt: p.prompt }));
          addedCount++;
        }
      });

      alert(
        `${addedCount} prompt${
          addedCount !== 1 ? "s" : ""
        } imported successfully!`
      );
    } catch (err) {
      console.error(err);
      alert("Failed to parse file. Please check the format.");
    } finally {
      // reset the file input
      e.target.value = "";
    }
  };
  return (
    <Box
      sx={{
        flexGrow: 1,
        bgcolor: colors.backgroundSecondary,
        display: "flex",
        flexDirection: "column",
        color: colors.text,
        borderRadius: 2,
        p: 2,
        boxShadow: colors.shadow,
        gap: 2,
      }}
    >
      {/* Header */}

      <PromptsHeader
        prompts={prompts}
        handleImport={handleImport}
        clearAll={clearAll}
        setShowAddBox={setShowAddBox}
        showAddBox={showAddBox}
      />
      {/* Add Prompt */}
      {showAddBox && (
        <Grow in={showAddBox} timeout={300}>
          <Card
            sx={{
              bgcolor: colors.background,
              border: `1px solid ${colors.border}`,
              borderRadius: 2,
              boxShadow: "none",
            }}
          >
            <CardContent sx={{ pb: "12px !important" }}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 1 }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 600, color: colors.text }}
                >
                  Add New Prompt
                </Typography>

                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={addNew}
                  >
                    Add
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() => {
                      setNewTitle("");
                      setNewPrompt("");
                    }}
                  >
                    Reset
                  </Button>
                </Stack>
              </Stack>

              <Stack spacing={1}>
                <TextField
                  placeholder="Title"
                  size="small"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  fullWidth
                  variant="outlined"
                />
                <TextField
                  placeholder="Prompt"
                  size="small"
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  multiline
                  minRows={2}
                  fullWidth
                  variant="outlined"
                />
              </Stack>
            </CardContent>
          </Card>
        </Grow>
      )}

      {/* Existing Prompts */}
      {prompts.length === 0 ? (
        <Typography
          variant="body2"
          align="center"
          sx={{ color: colors.textSecondary, mt: 4 }}
        >
          No prompts yet.
        </Typography>
      ) : (
        <Box
          sx={{
            flexGrow: 1,
            overflowY: "auto",
            maxHeight: showAddBox ? "50vh" : "75vh",
            pr: 1,
          }}
        >
          <Stack spacing={1}>
            {prompts.map((p, idx) => (
              <Card
                key={idx}
                sx={{
                  bgcolor: colors.background,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 2,
                  boxShadow: "none",
                }}
              >
                <CardContent>
                  {editingIndex === idx ? (
                    <Stack spacing={2}>
                      <TextField
                        label="Title"
                        size="small"
                        fullWidth
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                      />
                      <TextField
                        label="Prompt"
                        size="small"
                        fullWidth
                        multiline
                        minRows={3}
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                      />
                      <Stack direction="row" spacing={1}>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={saveEdit}
                        >
                          Save
                        </Button>
                        <Button variant="outlined" onClick={cancelEdit}>
                          Cancel
                        </Button>
                      </Stack>
                    </Stack>
                  ) : (
                    <Stack spacing={1}>
                      <Stack
                        direction="row"
                        alignItems="flex-start"
                        justifyContent="space-between"
                      >
                        <Box>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontWeight: 600,
                              mb: 0.5,
                              textAlign: "left",
                              color: colors.text,
                            }}
                          >
                            {p.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              whiteSpace: "pre-wrap",
                              color: colors.textSecondary,
                            }}
                          >
                            {p.prompt}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={1}>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => startEdit(idx)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="contained"
                            color="error"
                            size="small"
                            onClick={() => remove(idx)}
                          >
                            Delete
                          </Button>
                        </Stack>
                      </Stack>
                    </Stack>
                  )}
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
};

export default Prompts;
