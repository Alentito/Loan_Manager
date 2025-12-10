// src/components/tokens/TokenApprovalPage.jsx
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
  Button,
  TextField,
  Pagination,
  CircularProgress,
  Grow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { useGetTokensQuery, useRespondTokenMutation } from "../api/tokenApi";

// ----------------------------------------------------
// 🔹 Utility Hooks
// ----------------------------------------------------
const useDebounce = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
};

const useHasPermission = (perm) => {
  const permissions = useSelector((state) => state.auth.user?.permissions || []);
  return permissions.includes(perm);
};

// ----------------------------------------------------
// 🔹 Time Helpers (CST-specific)
// ----------------------------------------------------
const toCSTDate = (date) => {
  if (!date) return null;
  const cstString = new Date(date).toLocaleString("en-US", {
    timeZone: "America/Chicago",
  });
  const cstDate = new Date(cstString);
  cstDate.setHours(0, 0, 0, 0);
  return cstDate;
};

const getCSTNow = () => {
  const now = new Date();
  const cstString = now.toLocaleString("en-US", { timeZone: "America/Chicago" });
  const cstDate = new Date(cstString);
  cstDate.setHours(0, 0, 0, 0);
  return cstDate;
};

const formatToCSTDate = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (isNaN(date)) return "—";
  return date.toLocaleString("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ----------------------------------------------------
// 🔹 UI Components
// ----------------------------------------------------
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
        minWidth: 90,
        textAlign: "center",
      }}
    >
      {status?.toUpperCase() || "—"}
    </Box>
  );
};

const ResponseDialog = ({ open, onClose, token, responseText, setResponseText, onSubmit }) => (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
    <DialogTitle>Respond to Complaint</DialogTitle>
    <DialogContent>
      <Typography mb={1}>
        <strong>Title:</strong> {token?.title}
      </Typography>
      <Typography mb={2}>
        <strong>Description:</strong> {token?.description}
      </Typography>
      <TextField
        label="Your Response"
        fullWidth
        multiline
        rows={4}
        value={responseText}
        onChange={(e) => setResponseText(e.target.value)}
      />
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button variant="contained" color="primary" onClick={onSubmit}>
        Submit Response
      </Button>
    </DialogActions>
  </Dialog>
);

// ----------------------------------------------------
// 🔹 Main Component
// ----------------------------------------------------
export default function TokenApprovalPage() {
  const user = useSelector((state) => state.auth.user);
  const userId = user?.id;
  const canRespond = useHasPermission("employee.approve_tokens");

  // -------------------- Access Control --------------------
  if (!canRespond) {
    return (
      <Typography color="error" mt={4} textAlign="center">
        🚫 Access denied. You do not have permission to respond to tokens.
      </Typography>
    );
  }
const getToday = () => new Date().toISOString().split("T")[0];
  // -------------------- State Management --------------------
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const [viewMode, setViewMode] = useState("month"); // Default view
const [currentDate, setCurrentDate] = useState(getToday());
  const [openModal, setOpenModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState(null);
  const [responseText, setResponseText] = useState("");

  const { data, isLoading, refetch } = useGetTokensQuery({
    page,
    page_size: rowsPerPage,
  });

  const [respondToken] = useRespondTokenMutation();

  // -------------------- Modal Handlers --------------------
  const handleOpenModal = (token) => {
    setSelectedToken(token);
    setResponseText(token.response || "");
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedToken(null);
    setResponseText("");
  };

  const handleSubmitResponse = async () => {
    if (!responseText.trim()) {
      toast.error("⚠️ Please enter a response");
      return;
    }
    try {
      await respondToken({ id: selectedToken.id, response: responseText }).unwrap();
      toast.success("✅ Response submitted successfully");
      handleCloseModal();
      refetch();
    } catch {
      toast.error("❌ Failed to submit response");
    }
  };

  // -------------------- Filtering by CST --------------------
  const tokens = data?.results || [];
  const total = data?.count || 0;

 // -------------------- Filtering --------------------
const filteredTokens = useMemo(() => {
  const selectedDay = currentDate;

  return tokens.filter((token) => {
    const createdDay = token.created_at.split("T")[0];

    if (viewMode === "day") return createdDay === selectedDay;

    if (viewMode === "week") {
      const selected = new Date(selectedDay);
      const created = new Date(createdDay);
      const diff = (created - selected) / (1000 * 3600 * 24);
      return diff >= -selected.getDay() && diff <= (6 - selected.getDay());
    }

    if (viewMode === "month") {
      return createdDay.slice(0, 7) === selectedDay.slice(0, 7);
    }

    return true;
  });
}, [tokens, viewMode, currentDate]);


  // ----------------------------------------------------
  // 🔹 Render
  // ----------------------------------------------------
  return (
    <Box p={3}>
      {/* Header + Filters */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
        flexWrap="wrap"
        gap={1}
      >
        <Typography variant="h5" fontWeight={600} color="primary">
          Respond to Complaints
        </Typography>

        <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
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
    size="small"
    value={currentDate}
    onChange={(e) => setCurrentDate(e.target.value || getToday())}
  />
</Box>

      </Box>

      {/* Table */}
      <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {[
                "Employee ID",
                "Title",
                "Description",
                "Status",
                "Response",
                "Created At",
                "Actions",
              ].map((label) => (
                <TableCell key={label} sx={{ fontWeight: 600 }}>
                  {label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : filteredTokens.length > 0 ? (
              filteredTokens.map((token) => (
                <Grow key={token.id} in timeout={300}>
                  <TableRow hover>
                    <TableCell>
                      {token.employee_login_id
                        ? `${token.employee_login_id} - ${token.employee_name || "—"}`
                        : "—"}
                    </TableCell>
                    <TableCell>{token.title}</TableCell>
                    <TableCell>{token.description}</TableCell>
                    <TableCell>
                      <StatusChip status={token.status} />
                    </TableCell>
                    <TableCell>{token.response || "—"}</TableCell>
                    <TableCell>{formatToCSTDate(token.created_at)}</TableCell>
                    <TableCell>
                      {token.status === "pending" && token.employee?.id !== userId && (
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          onClick={() => handleOpenModal(token)}
                        >
                          Respond
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                </Grow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
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
          count={Math.ceil(total / rowsPerPage) || 1}
          page={page}
          onChange={(_, newPage) => setPage(newPage)}
          color="primary"
          shape="rounded"
          showFirstButton
          showLastButton
        />
      </Box>

      {/* Response Modal */}
      <ResponseDialog
        open={openModal}
        onClose={handleCloseModal}
        token={selectedToken}
        responseText={responseText}
        setResponseText={setResponseText}
        onSubmit={handleSubmitResponse}
      />
    </Box>
  );
}
