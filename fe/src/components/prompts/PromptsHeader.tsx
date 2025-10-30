import React, { useState } from "react";
import { IconButton, Stack, Typography } from "@mui/material";
import { Collapse } from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import type { Prompt } from "../../redux/slices/promptsSlice";
interface PromptsHeaderProps {
  prompts: Prompt[];
  handleImport: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  clearAll: () => void;
  showAddBox: boolean;
  setShowAddBox: React.Dispatch<React.SetStateAction<boolean>>;
}
const iconBtnSx = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  transition: "all 0.2s ease",
  width: 40,
  height: 35,
  "&:hover": {
    minWidth: 140,
    px: 2,
    outline: "none",
    borderRadius: 1,
  },
  "&:focus": {
    outline: "none",
  },
};
const PromptsHeader: React.FC<PromptsHeaderProps> = ({
  prompts,
  handleImport,
  clearAll,
  showAddBox,
  setShowAddBox,
}) => {
  const [inFocus, setInFocus] = useState<string | null | undefined>();

  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between">
      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        Prompts
      </Typography>
      <Stack spacing={1} direction="row">
        <IconButton
          color="info"
          sx={iconBtnSx}
          onMouseEnter={() => setInFocus("Add Prompt")}
          onMouseLeave={() => setInFocus(null)}
          onClick={() => setShowAddBox((prev) => !prev)}
        >
          {showAddBox ? <RemoveRoundedIcon /> : <AddRoundedIcon />}
          <Collapse
            orientation="horizontal"
            in={inFocus === "Add Prompt"}
            timeout={300}
          >
            <Typography sx={{ ml: 1, fontSize: 14 }}>
              {showAddBox ? "Hide" : "Add "}
            </Typography>
          </Collapse>
        </IconButton>
        <IconButton
          color="secondary"
          component="label"
          sx={iconBtnSx}
          onMouseEnter={() => setInFocus("Import")}
          onMouseLeave={() => setInFocus(null)}
        >
          {<UploadFileIcon />}
          <Collapse
            orientation="horizontal"
            in={inFocus === "Import"}
            timeout={300}
          >
            <Typography sx={{ ml: 1, fontSize: 14 }}>Import</Typography>
          </Collapse>

          <input
            hidden
            accept=".json,.yaml,.yml"
            type="file"
            onChange={handleImport}
          />
        </IconButton>

        {prompts.length > 0 && (
          <IconButton
            color="error"
            sx={iconBtnSx}
            onClick={clearAll}
            onMouseEnter={() => setInFocus("Clear List")}
            onMouseLeave={() => setInFocus(null)}
          >
            {<DeleteForeverIcon />}
            <Collapse
              orientation="horizontal"
              in={inFocus === "Clear List"}
              timeout={300}
            >
              <Typography sx={{ ml: 1, fontSize: 14 }}>Clear </Typography>
            </Collapse>
          </IconButton>
        )}
      </Stack>
    </Stack>
  );
};

export default PromptsHeader;
