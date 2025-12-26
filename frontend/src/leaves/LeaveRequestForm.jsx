import React, { useState, useMemo } from "react";
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
// Format for display: accepts ISO strings or YYYY-MM-DD
const formatToCSTDate = (input) => {
  if (!input) return "—";
  // If already YYYY-MM-DD, return that
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  const date = new Date(input);
  if (isNaN(date)) return "—";
  return date.toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
};

// Return today's date in America/Chicago as 'YYYY-MM-DD'
const getCSTTodayString = () => {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
};

// Convert 'YYYY-MM-DD' → JS Date in UTC at midnight (safe, timezone-free)
const ymdToUTCDate = (ymd) => {
  if (!ymd) return null;
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
};

// Extract YYYY-MM-DD from an ISO-like value. If req value already has 'T', split it.
// If it is already YYYY-MM-DD, return as-is.
const extractYMD = (val) => {
  if (!val) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  if (typeof val === "string") {
    const idx = val.indexOf("T");
    if (idx > -1) return val.slice(0, idx);
    // fallback: try Date parsing and format in en-CA (CST for display is irrelevant here)
    const d = new Date(val);
    if (!isNaN(d)) return d.toISOString().slice(0, 10);
  }
  return null;
};

// ------------------ Main Component ------------------
export default function LeaveRequestsPage() {
  const { user } = useSelector((state) => state.auth);
  const employeeId = user?.employee?.id;
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState("month");

  // store currentDate as 'YYYY-MM-DD' string (CST today by default)
  const [currentDate, setCurrentDate] = useState(() => getCSTTodayString());

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
    // form fields should be YYYY-MM-DD strings (in CST) so date inputs show correctly
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

  // Filtered leaves using YYYY-MM-DD comparisons and UTC date math for week/month
  const filteredLeaves = useMemo(() => {
    const curYMD = extractYMD(currentDate);
    if (!curYMD) return [];

    return leaveRequests
      .filter((req) => {
        const startYMD = extractYMD(req.start_date);
        const endYMD = extractYMD(req.end_date);
        if (!startYMD || !endYMD) return false;

        if (viewMode === "day") {
          // string safe comparison because format is YYYY-MM-DD
          return curYMD >= startYMD && curYMD <= endYMD;
        }

        if (viewMode === "week") {
          // compute startOfWeek and endOfWeek in UTC (week starting Sunday)
          const curUTC = ymdToUTCDate(curYMD);
          const dayOfWeek = curUTC.getUTCDay(); // 0 (Sun) to 6 (Sat)
          const startOfWeekUTC = new Date(curUTC);
          startOfWeekUTC.setUTCDate(curUTC.getUTCDate() - dayOfWeek);
          const endOfWeekUTC = new Date(startOfWeekUTC);
          endOfWeekUTC.setUTCDate(startOfWeekUTC.getUTCDate() + 6);

          const startUTC = ymdToUTCDate(startYMD);
          const endUTC = ymdToUTCDate(endYMD);
          if (!startUTC || !endUTC) return false;

          // overlaps
          return startUTC <= endOfWeekUTC && endUTC >= startOfWeekUTC;
        }

        if (viewMode === "month") {
          const curUTC = ymdToUTCDate(curYMD);
          const curYear = curUTC.getUTCFullYear();
          const curMonth = curUTC.getUTCMonth();

          const startUTC = ymdToUTCDate(startYMD);
          const endUTC = ymdToUTCDate(endYMD);
          if (!startUTC || !endUTC) return false;

          const startMonthMatch =
            startUTC.getUTCFullYear() === curYear &&
            startUTC.getUTCMonth() === curMonth;
          const endMonthMatch =
            endUTC.getUTCFullYear() === curYear &&
            endUTC.getUTCMonth() === curMonth;
          return startMonthMatch || endMonthMatch;
        }

        return true;
      })
      .sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
  }, [leaveRequests, viewMode, currentDate]);

  const handleChangeForm = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const parseYMDToUTCDateObj = (ymd) => {
    if (!ymd) return null;
    return ymdToUTCDate(ymd);
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

    const start = parseYMDToUTCDateObj(start_date);
    const end = parseYMDToUTCDateObj(end_date);
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

        {/* Date picker uses YYYY-MM-DD string value — no timezone conversions */}
        <TextField
          type="date"
          value={currentDate || ""}
          onChange={(e) => {
            const value = e.target.value;
            if (!value) {
              // if cleared, reset to CST today
              setCurrentDate(getCSTTodayString());
            } else {
              // store raw YYYY-MM-DD string (no timezone conversion)
              setCurrentDate(value);
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
                      <TableCell>{formatToCSTDate(extractYMD(req.start_date) || req.start_date)}</TableCell>
                      <TableCell>{formatToCSTDate(extractYMD(req.end_date) || req.end_date)}</TableCell>
                      <TableCell>{formatToCSTDate(req.created_at)}</TableCell>
                      <TableCell>
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
                            backgroundColor:
                              (req.status === "approved" && "#2e7d32") ||
                              (req.status === "denied" && "#d32f2f") ||
                              (req.status === "pending" && "#ed6c02") ||
                              "#757575",
                          }}
                        >
                          {(req.status || "—").toString().toUpperCase()}
                        </Box>
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
