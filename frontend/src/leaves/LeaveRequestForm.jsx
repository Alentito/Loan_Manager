// src/components/leaves/LeaveRequestForm.jsx
import React, { useState, useMemo } from "react";
import {
  TextField,
  Button,
  MenuItem,
  Box,
  Typography,
  Paper,
  Snackbar,
  Alert,
} from "@mui/material";
import { useSubmitLeaveRequestMutation } from "../api/leaveApi";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

// --- Helpers ---
// Parse YYYY-MM-DD string to JS Date (UTC midnight → CST-safe)
const parseCSTDate = (dateString) => {
  if (!dateString) return null;
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
};

// Format JS Date to YYYY-MM-DD string in CST


const LeaveRequestForm = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const permissions = useMemo(() => user?.permissions || [], [user]);

  const canRequestLeave = permissions.includes("employee.add_leaverequests");
  const isReviewer =
    permissions.includes("employee.approve_leave") ||
    permissions.includes("employee.deny_leave");

  // --- CST Today ---
  const todayCST = useMemo(() => {
    const nowUtc = new Date();
    return nowUtc.toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
  }, []);

  const [form, setForm] = useState({
  
    start_date: todayCST,
    end_date: todayCST,
    reason: "",
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [submitLeaveRequest, { isLoading }] = useSubmitLeaveRequestMutation();

  // --- Permission handling ---
  if (!canRequestLeave) {
    const message = isReviewer
      ? "You are authorized only to review leave requests. Requesting new leave is not permitted."
      : "You don’t have permission to request leave.";
    return (
      <Box mt={4} textAlign="center">
        <Typography color="error" variant="h6">
          {message}
        </Typography>
      </Box>
    );
  }

  // --- Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCloseSnackbar = () => setSnackbar((prev) => ({ ...prev, open: false }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { start_date, end_date, reason } = form;

    // Validation
    if (!start_date || !end_date || !reason) {
      return setSnackbar({
        open: true,
        message: "⚠️ Please fill in all fields.",
        severity: "error",
      });
    }

    const start = parseCSTDate(start_date);
    const end = parseCSTDate(end_date);

    if (end < start) {
      return setSnackbar({
        open: true,
        message: "⚠️ End date cannot be earlier than start date.",
        severity: "error",
      });
    }

    try {
      await submitLeaveRequest({
        ...form,
        start_date: form.start_date,
        end_date: form.end_date,
      }).unwrap();

      setSnackbar({
        open: true,
        message: "✅ Leave request submitted successfully!",
        severity: "success",
      });

      setForm({
        start_date: todayCST,
        end_date: todayCST,
        reason: "",
      });

      setTimeout(() => navigate("/leaves/my-requests"), 1200);
    } catch (err) {
      const errorMessage =
        err?.data?.non_field_errors?.[0] ||
        err?.data?.start_date?.[0] ||
        err?.data?.end_date?.[0] ||
        err?.data?.error ||
        "❌ Failed to submit leave request (possibly duplicate or invalid dates).";

      setSnackbar({ open: true, message: errorMessage, severity: "error" });
    }
  };

  return (
    <Box sx={{ maxWidth: 500, mx: "auto", mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Leave Request Form
        </Typography>

        <form onSubmit={handleSubmit}>
        
          <TextField
            name="start_date"
            label="Start Date"
            type="date"
            fullWidth
            value={form.start_date}
            onChange={handleChange}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            name="end_date"
            label="End Date"
            type="date"
            fullWidth
            value={form.end_date}
            onChange={handleChange}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            name="reason"
            label="Reason"
            multiline
            rows={3}
            fullWidth
            value={form.reason}
            onChange={handleChange}
            margin="normal"
          />

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={isLoading}
            sx={{ mt: 2 }}
          >
            {isLoading ? "Submitting..." : "Submit Request"}
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

export default LeaveRequestForm;
