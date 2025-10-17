import { Box, Button, Modal, Typography } from "@mui/material";
import React from "react";
import { useAppColors } from "../../hooks/useAppColors";

interface ExplanationModalProps {
  open: boolean;
  selectedExplanation: string | null;
  handleClose: () => void;
}

const ExplanationModal: React.FC<ExplanationModalProps> = ({
  selectedExplanation,
  handleClose,
  open,
}) => {
  const { colors } = useAppColors();

  return (
    <Modal
      open={open}
      onClose={handleClose}
      sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <Box
        sx={{
          backgroundColor: colors.background,
          borderRadius: 2,
          p: 3,
          width: "80%",
          maxWidth: 600,
          border: `1px solid ${colors.border}`,
          boxShadow: colors.shadow,
        }}
      >
        <Typography variant="h6" sx={{ mb: 2, color: colors.text }}>
          Explanation
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: colors.text,
            opacity: 0.9,
            whiteSpace: "pre-wrap",
          }}
        >
          {selectedExplanation}
        </Typography>

        <Box sx={{ textAlign: "right", mt: 2 }}>
          <Button
            variant="outlined"
            onClick={handleClose}
            sx={{
              color: colors.buttonHover,
              borderColor: colors.buttonHover,
              "&:hover": {
                borderColor: colors.buttonHover,
                backgroundColor:
                  colors.background === "#161b22"
                    ? "rgba(88,166,255,0.1)"
                    : "rgba(25,118,210,0.08)",
              },
            }}
          >
            Close
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default ExplanationModal;
