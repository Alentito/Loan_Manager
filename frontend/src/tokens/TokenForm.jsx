// src/components/tokens/TokenForm.jsx
import React, { useState } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  Paper,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  useSubmitTokenMutation,
  useUpdateTokenMutation,
} from "../api/tokenApi";
import { useNavigate } from "react-router-dom";

const TokenForm = ({ existingToken }) => {
  const navigate = useNavigate();

  const isEditMode = Boolean(existingToken);

  const [form, setForm] = useState({
    title: existingToken?.title || "",
    description: existingToken?.description || "",
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [submitToken, { isLoading: isSubmitting }] = useSubmitTokenMutation();
  const [updateToken, { isLoading: isUpdating }] = useUpdateTokenMutation();

  // --- Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCloseSnackbar = () =>
    setSnackbar((prev) => ({ ...prev, open: false }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { title, description } = form;

    if (!title || !description) {
      return setSnackbar({
        open: true,
        message: "⚠️ Please fill in all fields.",
        severity: "error",
      });
    }

    try {
      if (isEditMode) {
        await updateToken({ id: existingToken.id, ...form }).unwrap();
        setSnackbar({
          open: true,
          message: "✅ Token updated successfully!",
          severity: "success",
        });
      } else {
        await submitToken(form).unwrap();
        setSnackbar({
          open: true,
          message: "✅ Token submitted successfully!",
          severity: "success",
        });
        setForm({ title: "", description: "" });
      }

      setTimeout(() => navigate("/tokens/my-tokens"), 1200);
    } catch (err) {
      const errorMessage =
        err?.data?.non_field_errors?.[0] ||
        err?.data?.title?.[0] ||
        err?.data?.description?.[0] ||
        "❌ Failed to save token.";
      setSnackbar({ open: true, message: errorMessage, severity: "error" });
    }
  };

  return (
    <Box sx={{ maxWidth: 500, mx: "auto", mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          {isEditMode ? "Edit Token" : "Submit Token"}
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            name="title"
            label="Title"
            fullWidth
            value={form.title}
            onChange={handleChange}
            margin="normal"
            required
          />

          <TextField
            name="description"
            label="Description"
            multiline
            rows={4}
            fullWidth
            value={form.description}
            onChange={handleChange}
            margin="normal"
            required
          />

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={isSubmitting || isUpdating}
            sx={{ mt: 2 }}
          >
            {isSubmitting || isUpdating
              ? "Saving..."
              : isEditMode
              ? "Update Token"
              : "Submit Token"}
          </Button>
        </form>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        onClose={handleCloseSnackbar}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TokenForm;
