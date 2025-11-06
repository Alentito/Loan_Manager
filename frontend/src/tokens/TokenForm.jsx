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
  useGetTokensQuery,
  useSubmitTokenMutation,
} from "../api/tokenApi";

const ROWS_PER_PAGE = 10;

// ✅ Helper: Convert to CST midnight safely
const toCSTDate = (date) => {
  if (!date) return null;
  const cstString = new Date(date).toLocaleString("en-US", { timeZone: "America/Chicago" });
  const cstDate = new Date(cstString);
  cstDate.setHours(0, 0, 0, 0);
  return cstDate;
};

// ✅ Get today in CST
const getCSTNow = () =>
  new Date(new Date().toLocaleString("en-US", { timeZone: "America/Chicago" }));

// ✅ Format date safely
const formatToCSTDate = (date) => {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
  } catch {
    return "—";
  }
};

// ✅ Status Badge
const StatusChip = ({ status }) => {
  const colors = {
    resolved: "#2e7d32",
    rejected: "#d32f2f",
    pending: "#ed6c02",
  };
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: 0.5,
        borderRadius: "16px",
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

// ✅ Main Component
export default function TokensPage() {
  const { user } = useSelector((state) => state.auth);
  const employeeId = user?.employee?.id;

  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState("month"); // Default to month
  const [currentDate, setCurrentDate] = useState(getCSTNow);
  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState({ title: "", description: "" });

  const { data, isLoading, isError, refetch } = useGetTokensQuery(
    { employeeId, page, page_size: ROWS_PER_PAGE },
    { skip: !employeeId }
  );

  const [submitToken, { isLoading: submitting }] = useSubmitTokenMutation();

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const tokens = data?.results || [];
  const total = data?.count || 0;

  // ✅ Filter by Day / Week / Month
  const filteredTokens = useMemo(() => {
    const currentCST = toCSTDate(currentDate);
    return tokens.filter((token) => {
      const tokenCST = toCSTDate(token.created_at);
      if (!tokenCST) return false;

      if (viewMode === "day") return tokenCST.getTime() === currentCST.getTime();

      if (viewMode === "week") {
        const startOfWeek = new Date(currentCST);
        startOfWeek.setDate(currentCST.getDate() - currentCST.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return tokenCST >= startOfWeek && tokenCST <= endOfWeek;
      }

      if (viewMode === "month") {
        return (
          tokenCST.getFullYear() === currentCST.getFullYear() &&
          tokenCST.getMonth() === currentCST.getMonth()
        );
      }

      return true;
    });
  }, [tokens, viewMode, currentDate]);

  // ✅ Form handlers
  const handleChangeForm = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitForm = async (e) => {
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
      await submitToken(form).unwrap();
      setSnackbar({
        open: true,
        message: "✅ Token submitted successfully!",
        severity: "success",
      });
      setOpenDialog(false);
      setForm({ title: "", description: "" });
      refetch();
    } catch (err) {
      setSnackbar({
        open: true,
        message:
          err?.data?.non_field_errors?.[0] ||
          err?.data?.title?.[0] ||
          "❌ Failed to save token.",
        severity: "error",
      });
    }
  };

  const handleSnackbarClose = () => setSnackbar({ ...snackbar, open: false });

  if (!employeeId)
    return (
      <Typography color="text.secondary" mt={4} textAlign="center">
        ⚠️ No employee profile linked to this account.
      </Typography>
    );

  if (isError)
    return (
      <Typography color="error" mt={4} textAlign="center">
        ❌ Failed to load tokens.
      </Typography>
    );

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={600} color="primary">
          Tokens
        </Typography>
        <Button variant="contained" color="primary" onClick={() => setOpenDialog(true)}>
          + Add Token
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
              {["Title", "Description", "Status", "Response", "Created At"].map((label) => (
                <TableCell key={label} sx={{ fontWeight: 600 }}>
                  {label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading
              ? Array.from({ length: ROWS_PER_PAGE }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton height={40} />
                    </TableCell>
                  </TableRow>
                ))
              : filteredTokens.length > 0
              ? filteredTokens.map((token) => (
                  <Grow key={token.id} in timeout={300}>
                    <TableRow hover>
                      <TableCell>{token.title}</TableCell>
                      <TableCell>{token.description}</TableCell>
                      <TableCell>
                        <StatusChip status={token.status} />
                      </TableCell>
                      <TableCell>{token.response || "—"}</TableCell>
                      <TableCell>{formatToCSTDate(token.created_at)}</TableCell>
                    </TableRow>
                  </Grow>
                ))
              : (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      No tokens found.
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

      {/* Add Token Modal */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add Token</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmitForm} sx={{ mt: 2 }}>
            <TextField
              name="title"
              label="Title"
              fullWidth
              value={form.title}
              onChange={handleChangeForm}
              margin="normal"
              required
            />
            <TextField
              name="description"
              label="Description"
              multiline
              rows={3}
              fullWidth
              value={form.description}
              onChange={handleChangeForm}
              margin="normal"
              required
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={submitting}
              sx={{ mt: 2 }}
            >
              {submitting ? "Submitting..." : "Submit Token"}
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
