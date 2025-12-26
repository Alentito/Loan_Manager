import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Snackbar,
  Alert,
  Box,
  Typography,
  LinearProgress,
  IconButton,
  Stack,
  useTheme,
} from "@mui/material";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import ReplayIcon from "@mui/icons-material/Replay";

/* ------------------------------------------------------------------ */
/* Helper for POSTing with progress                                   */
/* ------------------------------------------------------------------ */
const uploadWithProgress = (url, formData, onProgress) =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) {
        onProgress(Math.round((evt.loaded / evt.total) * 100));
      }
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve(JSON.parse(xhr.responseText))
        : reject(xhr.responseText);
    xhr.onerror = reject;
    xhr.send(formData);
  });

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
export default function ImportDialog({ open, onClose }) {
  const theme = useTheme();
  const inputRef = useRef(null);

  // [{ id, name, pct, status, file }]
  const [queue, setQueue] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);

  /* ---------------------------------------------------------------- */
  /* Reset dialog state every time it closes                          */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    if (!open) {
      setQueue([]);
      if (inputRef.current) inputRef.current.value = null;
      setShowSuccess(false);
    }
  }, [open]);

  /* ---------------------------------------------------------------- */
  /* Drop zone & click‑to‑browse handlers                             */
  /* ---------------------------------------------------------------- */
  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };
  const handleDragOver = (e) => e.preventDefault();
  const handleSelect = () => inputRef.current?.click();

  /* ---------------------------------------------------------------- */
  /* Core upload logic                                                */
  /* ---------------------------------------------------------------- */
  const handleFiles = useCallback((files) => {
    const items = Array.from(files).map((f) => ({
      id: crypto.randomUUID(),
      file: f,
      name: f.name,
      pct: 0,
      status: "uploading", // uploading | success | error
    }));
    setQueue((prev) => [...prev, ...items]);

    items.forEach(async (item) => {
      const formData = new FormData();
      formData.append("file", item.file);

      try {
        await uploadWithProgress(
          "http://localhost:8000/api/xml-upload/",
          formData,
          (pct) =>
            setQueue((prev) =>
              prev.map((q) => (q.id === item.id ? { ...q, pct } : q))
            )
        );
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id ? { ...q, pct: 100, status: "success" } : q
          )
        );
      } catch (err) {
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id ? { ...q, status: "error" } : q
          )
        );
      }
    });
  }, []);

  /* ---------------------------------------------------------------- */
  /* Snackbar trigger: all uploads finished & succeeded               */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    if (
      queue.length > 0 &&
      queue.every((q) => q.status === "success") &&
      !showSuccess
    ) {
      setShowSuccess(true);
    }
  }, [queue, showSuccess]);

  /* ---------------------------------------------------------------- */
  /* Misc helpers                                                     */
  /* ---------------------------------------------------------------- */
  const retryUpload = (item) => handleFiles([item.file]);
  const removeItem = (id) => setQueue((prev) => prev.filter((q) => q.id !== id));
  const handleSnackbarClose = () => setShowSuccess(false);

  /* ---------------------------------------------------------------- */
  /* JSX                                                              */
  /* ---------------------------------------------------------------- */
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Upload your files</DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        {/* ---- DROP ZONE ---- */}
        <Box
          onClick={handleSelect}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          sx={{
            cursor: "pointer",
            p: 4,
            borderRadius: 2,
            border: "2px dashed",
            borderColor: "divider",
            textAlign: "center",
            transition: "background .2s",
            "&:hover": { background: theme.palette.action.hover },
          }}
        >
          <FolderOpenOutlinedIcon
            sx={{ fontSize: 48, mb: 1, color: "primary.main" }}
          />
          <Typography variant="body2" color="text.secondary">
            Drag and drop <b>XML</b> files here
            <br />
            or click to browse
          </Typography>
          <input
            type="file"
            accept=".xml"
            multiple
            ref={inputRef}
            hidden
            onChange={(e) => handleFiles(e.target.files)}
          />
        </Box>

        {/* ---- UPLOAD LIST ---- */}
        {queue.length > 0 && (
          <Stack spacing={2} mt={3}>
            {queue.map((item) => (
              <Box key={item.id}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Typography
                    variant="body2"
                    sx={{
                      pr: 2,
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.name}
                  </Typography>

                  {item.status === "success" && (
                    <CheckCircleOutlineIcon
                      color="success"
                      fontSize="small"
                    />
                  )}
                  {item.status === "error" && (
                    <IconButton
                      size="small"
                      onClick={() => retryUpload(item)}
                      title="Retry"
                    >
                      <ReplayIcon color="error" fontSize="small" />
                    </IconButton>
                  )}
                  {item.status !== "uploading" && (
                    <IconButton
                      size="small"
                      onClick={() => removeItem(item.id)}
                      title="Remove"
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  )}
                </Stack>

                <LinearProgress
                  variant="determinate"
                  value={item.pct}
                  sx={{
                    height: 4,
                    borderRadius: 10,
                    mt: 0.5,
                    "& .MuiLinearProgress-bar": {
                      background:
                        item.status === "error"
                          ? theme.palette.error.main
                          : theme.palette.primary.main,
                    },
                  }}
                />
              </Box>
            ))}
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>

      {/* ---- SUCCESS SNACKBAR ---- */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
      >
        <Alert
          severity="success"
          onClose={handleSnackbarClose}
          sx={{ width: "100%" }}
        >
          XML upload completed successfully!
        </Alert>
      </Snackbar>
    </Dialog>
  );
}
