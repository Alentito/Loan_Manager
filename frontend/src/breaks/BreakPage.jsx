// src/pages/BreakPage.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Button,
  Typography,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Pagination,
} from "@mui/material";

import {
  useGetBreaksQuery,
  useStartBreakMutation,
  useEndBreakMutation,
} from "../api/breakApi";
import { formatDuration, intervalToDuration } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";


// Convert any date to CST
const toCSTDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString("en-US", { timeZone: "America/Chicago" });
};
// CST-safe YYYY-MM-DD
const formatToCSTDate = (input) => {
  if (!input) return "—";
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  const date = new Date(input);
  if (isNaN(date)) return "—";
  return date.toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
};

const getTodayRaw = () => new Date().toISOString().split("T")[0];

const BreakPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [viewMode, setViewMode] = useState("month");
  const [currentDate, setCurrentDate] = useState(getTodayRaw());
  const [reason, setReason] = useState("");
  const [showReasonField, setShowReasonField] = useState(false);
  const [ongoingBreak, setOngoingBreak] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState("");
  const [overlayOpen, setOverlayOpen] = useState(false);

  // Fetch breaks from API with server-side pagination
  const { data: breaksData, isLoading, refetch } = useGetBreaksQuery({ page, page_size: pageSize });
  const breaks = breaksData?.results || [];
  const totalCount = breaksData?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const [startBreak] = useStartBreakMutation();
  const [endBreak] = useEndBreakMutation();

  const { activeBreak: reduxActiveBreak } = useSelector((state) => state.auth);
  // Track ongoing break
  useEffect(() => {
  const ongoing = reduxActiveBreak || breaks.find((b) => !b.end_time);
  setOngoingBreak(ongoing || null);
  if (ongoing) setOverlayOpen(true);
}, [breaks, reduxActiveBreak]);

  // Timer for ongoing break
  useEffect(() => {
    if (!ongoingBreak) {
      setElapsedSeconds(0);
      return;
    }
    const interval = setInterval(() => {
      const start = new Date(ongoingBreak.start_time);
      setElapsedSeconds(Math.floor((new Date() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [ongoingBreak]);

  // Break In
  const handleBreakIn = async () => {
    try {
      setError("");
      const payload = reason?.trim() ? { reason: reason.trim() } : {};
      const response = await startBreak(payload).unwrap();

      setOngoingBreak(response);
      setElapsedSeconds(0);
      setOverlayOpen(true);
      setReason("");
      setShowReasonField(false);

      await refetch();
    } catch (err) {
      console.error("Failed to start break:", err);
      setError(
        err?.data?.reason?.[0] ||
        err?.data?.non_field_errors?.[0] ||
        err?.data?.detail ||
        JSON.stringify(err) ||
        "Failed to start break."
      );
    }
  };

  // Break Out
  const handleBreakOut = async () => {
    if (!ongoingBreak) return;
    try {
      setError("");
      await endBreak(ongoingBreak.id).unwrap();
      await refetch();
      setOverlayOpen(false);
      setOngoingBreak(null);
      navigate("/breaks");
    } catch (err) {
      console.error("Failed to end break:", err);
      setError(err?.data?.detail || "Failed to end break.");
    }
  };

  // Change view mode
 const handleViewModeChange = (mode) => {
  setViewMode(mode);
  setCurrentDate(getTodayRaw());
};

  // Filter breaks by viewMode and currentDate
  const filteredBreaks = useMemo(() => {
  return breaks.filter((b) => {
    const start = formatToCSTDate(b.start_time);
    const cur = currentDate;

    if (!start || !cur) return false;

    // DAY
    if (viewMode === "day") {
      return start === cur;
    }

    // WEEK
    if (viewMode === "week") {
      const dateObj = new Date(cur);
      const startOfWeek = new Date(dateObj);
      startOfWeek.setDate(dateObj.getDate() - dateObj.getDay());

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);


      const s = new Date(start);
      return s >= startOfWeek && s <= endOfWeek;
    }

    // MONTH
    if (viewMode === "month") {
      return start.slice(0, 7) === cur.slice(0, 7);
    }

    return true;
  });
}, [breaks, viewMode, currentDate]);

useEffect(() => {
  setPage(1);
}, [viewMode, currentDate]);


  // Format seconds to human-readable duration
  const formatSeconds = (secs) =>
    formatDuration(intervalToDuration({ start: 0, end: secs * 1000 }));

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" mb={2}>My Breaks</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* View Mode + Date Picker */}
      <Box display="flex" gap={2} mb={2} alignItems="center">
        <Button variant={viewMode === "day" ? "contained" : "outlined"} onClick={() => handleViewModeChange("day")}>Day</Button>
        <Button variant={viewMode === "week" ? "contained" : "outlined"} onClick={() => handleViewModeChange("week")}>Week</Button>
        <Button variant={viewMode === "month" ? "contained" : "outlined"} onClick={() => handleViewModeChange("month")}>Month</Button>

        <TextField
  type="date"
  size="small"
  value={currentDate}
  onChange={(e) => setCurrentDate(e.target.value || getTodayRaw())}
/>

      </Box>

      {/* Break In Area */}
      {!showReasonField && !ongoingBreak && (
        <Button variant="contained" color="primary" onClick={() => setShowReasonField(true)} sx={{ mb: 2 }}>Break In</Button>
      )}
      {showReasonField && !ongoingBreak && (
        <Box display="flex" gap={2} mb={2}>
          <TextField label="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} size="small" />
          <Button variant="contained" color="primary" onClick={handleBreakIn}>Confirm Break In</Button>
        </Box>
      )}

      {/* Break Table */}
      <Paper sx={{ maxHeight: 900, overflow: "auto" }}>
        {isLoading ? (
          <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
        ) : filteredBreaks.length === 0 ? (
          <Typography p={2}>No break records found.</Typography>
        ) : (
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Start Time (CST)</TableCell>
                <TableCell>End Time (CST)</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Reason</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredBreaks.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>{toCSTDate(b.start_time)}</TableCell>
                  <TableCell>{b.end_time ? toCSTDate(b.end_time) : "Ongoing"}</TableCell>
                  <TableCell>{b.duration_seconds ? formatSeconds(b.duration_seconds) : "Ongoing"}</TableCell>
                  <TableCell>{b.reason || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box display="flex" justifyContent="right" my={2}>
          <Pagination count={totalPages} page={page} onChange={(e, value) => setPage(value)} color="primary" shape="rounded" />
        </Box>
      )}

      {/* Overlay Timer */}
      {overlayOpen && ongoingBreak && (
        <Box sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          bgcolor: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(8px)",
          color: "#fff",
          zIndex: 1300,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
        }}>
          <Typography variant="h2">{formatSeconds(elapsedSeconds)}</Typography>
          <Button variant="contained" color="secondary" size="large" onClick={handleBreakOut}>Break Out</Button>
        </Box>
      )}
    </Box>
  );
};

export default BreakPage;
