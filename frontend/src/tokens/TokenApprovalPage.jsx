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
  InputAdornment,
  IconButton,
  Pagination,
  CircularProgress,
  Grow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Clear } from "@mui/icons-material";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { useGetTokensQuery, useRespondTokenMutation } from "../api/tokenApi";

// --- Hooks ---
function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

function useHasPermission(perm) {
  const permissions = useSelector((state) => state.auth.user?.permissions || []);
  return permissions.includes(perm);
}

// --- Helpers ---
const toCSTDate = (date) => {
  if (!date) return null;
  const cstString = new Date(date).toLocaleString("en-US", { timeZone: "America/Chicago" });
  const cstDate = new Date(cstString);
  cstDate.setHours(0, 0, 0, 0);
  return cstDate;
};

// --- UI Components ---
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
    <DialogTitle>Respond to Token</DialogTitle>
    <DialogContent>
      <Typography mb={1}><strong>Title:</strong> {token?.title}</Typography>
      <Typography mb={2}><strong>Description:</strong> {token?.description}</Typography>
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
      <Button
        variant="contained"
        color="primary"
        onClick={onSubmit}
        sx={{ borderRadius: "16px" }}
      >
        Submit Response
      </Button>
    </DialogActions>
  </Dialog>
);

// --- Main Component ---
export default function TokenApprovalPage() {
  const user = useSelector((state) => state.auth.user);
  const userId = user?.id;
  const canRespond = useHasPermission("employee.approve_tokens");

  if (!canRespond) {
    return (
      <Typography color="error" mt={4} textAlign="center">
        🚫 Access denied. You do not have permission to respond to tokens.
      </Typography>
    );
  }

  // --- State ---
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const [viewMode, setViewMode] = useState("day"); // day/week/month
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data, isLoading, refetch } = useGetTokensQuery({
    page,
    page_size: rowsPerPage,
    search: debouncedSearch || undefined,
  });

  const [respondToken] = useRespondTokenMutation();

  // Modal
  const [openModal, setOpenModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState(null);
  const [responseText, setResponseText] = useState("");

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
      toast.success("✅ Response submitted");
      handleCloseModal();
      refetch();
    } catch {
      toast.error("❌ Failed to respond");
    }
  };

  const tokens = data?.results || [];
  const total = data?.count || 0;

  // ------------------ Filter tokens by CST date ------------------
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
        return tokenCST.getFullYear() === currentCST.getFullYear() &&
          tokenCST.getMonth() === currentCST.getMonth();
      }

      return true;
    });
  }, [tokens, viewMode, currentDate]);

  return (
    <Box p={3}>
      {/* Header + Search + Filters */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Typography variant="h5" fontWeight="bold" color="primary">
          Employee Tokens
        </Typography>

        <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">





          {/* Day/Week/Month + Date picker */}
          <Button
            variant={viewMode === "day" ? "contained" : "outlined"}
            onClick={() => setViewMode("day")}
          >
            Day
          </Button>
          <Button
            variant={viewMode === "week" ? "contained" : "outlined"}
            onClick={() => setViewMode("week")}
          >
            Week
          </Button>
          <Button
            variant={viewMode === "month" ? "contained" : "outlined"}
            onClick={() => setViewMode("month")}
          >
            Month
          </Button>

          <input
            type="date"
            value={currentDate.toISOString().split("T")[0]}
            onChange={(e) => setCurrentDate(new Date(e.target.value))}
            style={{ height: 32, borderRadius: 4, padding: "0 8px" }}
          />
        </Box>
      </Box>

      {/* Table */}
      <Paper sx={{ minWidth: 1000 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {["Employee ID", "Title", "Description", "Status", "Response", "Actions"].map((label) => (
                <TableCell key={label} sx={{ py: 1.5, px: 2, fontWeight: "bold" }}>
                  {label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                  <CircularProgress size={30} />
                </TableCell>
              </TableRow>
            ) : filteredTokens.length > 0 ? (
              filteredTokens.map((token) => (
                <Grow key={token.id} in timeout={300}>
                  <TableRow hover sx={{ "& > *": { height: 60 } }}>
                    <TableCell>
                      {token.employee_login_id
                        ? `${token.employee_login_id} - ${token.employee_name || "—"}`
                        : "—"}
                    </TableCell>
                    <TableCell>{token.title}</TableCell>
                    <TableCell>{token.description}</TableCell>
                    <TableCell><StatusChip status={token.status} /></TableCell>
                    <TableCell>{token.response || "—"}</TableCell>
                    <TableCell>
                      {token.status === "pending" && token.employee?.id !== userId && (
                        <Button
                          size="small"
                          color="primary"
                          variant="contained"
                          onClick={() => handleOpenModal(token)}
                          sx={{ borderRadius: "16px", textTransform: "none" }}
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
                <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
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

      {/* Modal */}
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
