// src/components/tokens/MyTokens.jsx
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
  Pagination,
  CircularProgress,
  Grow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Skeleton,
} from "@mui/material";
import { useSelector } from "react-redux";
import { useGetTokensQuery } from "../api/tokenApi";

const ROWS_PER_PAGE = 10;

// --- StatusChip ---
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

// --- Token Detail Dialog ---
const TokenDetailDialog = ({ open, onClose, token }) => (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
    <DialogTitle>Token Details</DialogTitle>
    <DialogContent>
      <Typography mb={1}>
        <strong>Title:</strong> {token?.title}
      </Typography>
      <Typography mb={1}>
        <strong>Description:</strong> {token?.description}
      </Typography>
      <Typography mb={1}>
        <strong>Status:</strong> {token?.status?.toUpperCase()}
      </Typography>
      <Typography mb={1}>
        <strong>Response:</strong> {token?.response || "—"}
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} sx={{ borderRadius: "16px" }}>
        Close
      </Button>
    </DialogActions>
  </Dialog>
);

// --- Helpers ---
const toCSTDate = (date) => {
  if (!date) return null;
  const cstString = new Date(date).toLocaleString("en-US", { timeZone: "America/Chicago" });
  const cstDate = new Date(cstString);
  cstDate.setHours(0, 0, 0, 0);
  return cstDate;
};

const formatToCSTDate = (date) => {
  const cst = toCSTDate(date);
  return cst ? cst.toISOString().split("T")[0] : "—";
};

// --- Main Component ---
export default function MyTokens() {
  const { user } = useSelector((state) => state.auth);
  const employeeId = user?.employee?.id;

  const [page, setPage] = useState(1);
  const [selectedToken, setSelectedToken] = useState(null);
  const [viewMode, setViewMode] = useState("day"); // day/week/month
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data, isLoading, isError } = useGetTokensQuery(
    { employeeId, page, page_size: ROWS_PER_PAGE },
    { skip: !employeeId }
  );

  const tokens = data?.results || [];
  const total = data?.count || 0;

  // ------------------ Filter tokens ------------------
  const filteredTokens = useMemo(() => {
    const currentCST = toCSTDate(currentDate);
    return tokens.filter((token) => {
      const tokenCST = toCSTDate(token.created_at); // assuming 'created_at' exists
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

  // ------------------ Early returns ------------------
  if (!employeeId) {
    return (
      <Typography color="text.secondary" mt={4} textAlign="center">
        ⚠️ No employee profile linked to this account.
      </Typography>
    );
  }

  if (isError) {
    return (
      <Typography color="error" mt={4} textAlign="center">
        ❌ Failed to load tokens.
      </Typography>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight={600} color="primary" mb={2}>
        My Tokens
      </Typography>

      {/* Day/Week/Month + Date picker */}
      <Box display="flex" gap={1} flexWrap="wrap" alignItems="center" mb={2}>
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

      {/* Table */}
      <Paper sx={{ mt: 2, borderRadius: 2, overflow: "hidden" }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {["Title", "Status", "Response", "Actions"].map((label) => (
                <TableCell key={label} sx={{ fontWeight: 600 }}>
                  {label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {isLoading ? (
              Array.from({ length: ROWS_PER_PAGE }).map((_, idx) => (
                <TableRow key={idx}>
                  <TableCell colSpan={4}>
                    <Skeleton variant="text" width="80%" height={28} />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredTokens.length > 0 ? (
              filteredTokens.map((token) => (
                <Grow key={token.id} in timeout={300}>
                  <TableRow hover>
                    <TableCell>{token.title}</TableCell>
                    <TableCell>
                      <StatusChip status={token.status} />
                    </TableCell>
                    <TableCell>{token.response || "—"}</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setSelectedToken(token)}
                        sx={{ borderRadius: "16px", textTransform: "none" }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                </Grow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
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

      {/* Token Detail Modal */}
      <TokenDetailDialog
        open={!!selectedToken}
        onClose={() => setSelectedToken(null)}
        token={selectedToken}
      />
    </Box>
  );
}
