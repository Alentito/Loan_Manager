import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Skeleton,
  Pagination,
  Grow,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Snackbar,
  Alert,
} from "@mui/material";
import { useSelector } from "react-redux";
import {
  useGetEmployeeLeaveRequestsQuery,
  useSubmitLeaveRequestMutation,
} from "../api/leaveApi";

const ROWS_PER_PAGE = 10;

// ------------------ Helpers ------------------
const formatToCSTDate = (input) => {
  if (!input) return "—";
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  const date = new Date(input);
  if (isNaN(date)) return "—";
  return date.toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
};

const StatusBox = ({ status }) => {
  const colors = { approved: "#2e7d32", denied: "#d32f2f", pending: "#ed6c02" };
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: 0.5,
        borderRadius: "12px",
        fontWeight: 600,
        fontSize: "0.8rem",
        color: "#fff",
        backgroundColor: colors[status] || "#757575",
      }}
    >
      {status?.toUpperCase() || "—"}
    </Box>
  );
};

// Return current CST Date
const getCSTNow = () => {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Chicago" })
  );
};

// Convert any date to CST midnight (safe normalization)
const toCSTDate = (date) => {
  if (!date) return null;
  const cstString = date.toLocaleString("en-US", { timeZone: "America/Chicago" });
  const cstDate = new Date(cstString);
  cstDate.setHours(0, 0, 0, 0);
  return cstDate;
};



// Parse YYYY-MM-DD → JS Date (UTC)
const parseCSTDate = (dateString) => {
  if (!dateString) return null;
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
};

// ------------------ Main Component ------------------
export default function LeaveRequestsPage() {
  const { user } = useSelector((state) => state.auth);
  const employeeId = user?.employee?.id;
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState("month");
  const [currentDate, setCurrentDate] = useState(getCSTNow);

  const [openDialog, setOpenDialog] = useState(false);

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useGetEmployeeLeaveRequestsQuery(
    { employeeId, page, page_size: ROWS_PER_PAGE },
    { skip: !employeeId }
  );

  const [submitLeaveRequest, { isLoading: submitting }] =
    useSubmitLeaveRequestMutation();

  const [form, setForm] = useState({
    start_date: new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" }),
    end_date: new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" }),
    reason: "",
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const handleSnackbarClose = () => setSnackbar({ ...snackbar, open: false });

  const leaveRequests = data?.results || [];
  const total = data?.count || 0;

  const filteredLeaves = useMemo(() => {
    const currentCST = toCSTDate(currentDate);
    return leaveRequests
      .filter((req) => {
        const startCST = toCSTDate(new Date(req.start_date));
        const endCST = toCSTDate(new Date(req.end_date));
        if (!startCST || !endCST || !currentCST) return false;

        if (viewMode === "day")
          return currentCST >= startCST && currentCST <= endCST;

        if (viewMode === "week") {
          const startOfWeek = new Date(currentCST);
          startOfWeek.setDate(currentCST.getDate() - currentCST.getDay());
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          return startCST <= endOfWeek && endCST >= startOfWeek;
        }

        if (viewMode === "month") {
          const sameMonth =
            (startCST.getFullYear() === currentCST.getFullYear() &&
              startCST.getMonth() === currentCST.getMonth()) ||
            (endCST.getFullYear() === currentCST.getFullYear() &&
              endCST.getMonth() === currentCST.getMonth());
          return sameMonth;
        }
        return true;
      })
      .sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
  }, [leaveRequests, viewMode, currentDate]);

  const handleChangeForm = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    const { start_date, end_date, reason } = form;

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
      await submitLeaveRequest(form).unwrap();
      setSnackbar({
        open: true,
        message: "✅ Leave request submitted successfully!",
        severity: "success",
      });
      setOpenDialog(false);
      setForm({
        start_date: new Date().toLocaleDateString("en-CA", {
          timeZone: "America/Chicago",
        }),
        end_date: new Date().toLocaleDateString("en-CA", {
          timeZone: "America/Chicago",
        }),
        reason: "",
      });
      refetch();
    } catch (err) {
      setSnackbar({
        open: true,
        message:
          err?.data?.error ||
          "❌ Failed to submit leave request for duplicate days. Try again.",
        severity: "error",
      });
    }
  };

  if (!employeeId)
    return (
      <Typography color="text.secondary" mt={4} textAlign="center">
        ⚠️ No employee profile linked to this account.
      </Typography>
    );

  if (isError)
    return (
      <Typography color="error" mt={4} textAlign="center">
        ❌ Failed to load leave requests.
      </Typography>
    );

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={600} color="primary">
          Leave Requests
        </Typography>
        <Button variant="contained" color="primary" onClick={() => setOpenDialog(true)}>
          + Add Leave Request
        </Button>
      </Box>

      {/* Filters */}
      <Box display="flex" gap={2} mb={2} flexWrap="wrap" alignItems="center">
        {["day", "week", "month"].map((mode) => (
          <Button
            key={mode}
            variant={viewMode === mode ? "contained" : "outlined"}
            onClick={() => setViewMode(mode)}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </Button>
        ))}
        <TextField
  type="date"
  value={currentDate instanceof Date && !isNaN(currentDate) ? currentDate.toISOString().split("T")[0] : ""}
  onChange={(e) => {
  const value = e.target.value;
  if (!value) {
    // Clear button pressed → reset to CST today
    setCurrentDate(getCSTNow());
  } else {
    // Parse input date safely in CST context
    const selectedDate = new Date(`${value}T00:00:00`);
    setCurrentDate(toCSTDate(selectedDate));
  }
}}

  size="small"
/>

      </Box>

      {/* Table */}
      <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {["Approval Type", "Leave Balance", "Start Date", "End Date", "Created At", "Status", "Reason"].map(
                (label) => (
                  <TableCell key={label} sx={{ fontWeight: 600 }}>
                    {label}
                  </TableCell>
                )
              )}
            </TableRow>
          </TableHead>

          <TableBody>
            {isLoading
              ? Array.from({ length: ROWS_PER_PAGE }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}>
                      <Skeleton height={40} />
                    </TableCell>
                  </TableRow>
                ))
              : filteredLeaves.length > 0
              ? filteredLeaves.map((req) => (
                  <Grow key={req.id} in timeout={300}>
                    <TableRow hover>
                      <TableCell>{req.approval_type || "—"}</TableCell>
                      <TableCell>{req.employee_balance ?? "—"}</TableCell>
                      <TableCell>{formatToCSTDate(req.start_date)}</TableCell>
                      <TableCell>{formatToCSTDate(req.end_date)}</TableCell>
                      <TableCell>{formatToCSTDate(req.created_at)}</TableCell>
                      <TableCell>
                        <StatusBox status={req.status} />
                      </TableCell>
                      <TableCell>{req.reason || "—"}</TableCell>
                    </TableRow>
                  </Grow>
                ))
              : (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      No leave requests found.
                    </TableCell>
                  </TableRow>
                )}
          </TableBody>
        </Table>
      </Paper>

      {/* Pagination */}
      <Box mt={2} display="flex" justifyContent="flex-end">
        <Pagination
          count={Math.ceil(total / ROWS_PER_PAGE) || 1}
          page={page}
          onChange={(_, newPage) => setPage(newPage)}
          color="primary"
          shape="rounded"
          showFirstButton
          showLastButton
        />
      </Box>

      {/* Add Leave Modal */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add Leave Request</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmitForm} sx={{ mt: 2 }}>
            <TextField
              name="start_date"
              label="Start Date"
              type="date"
              fullWidth
              value={form.start_date}
              onChange={handleChangeForm}
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              name="end_date"
              label="End Date"
              type="date"
              fullWidth
              value={form.end_date}
              onChange={handleChangeForm}
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
              onChange={handleChangeForm}
              margin="normal"
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={submitting}
              sx={{ mt: 2 }}
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
