import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { CalendarToday, Event, AssignmentTurnedIn } from "@mui/icons-material";
import { formatSecondsToHHMMSS } from "./utils"; // ⬅️ Import your utility

const capitalize = (str) => {
  if (typeof str !== "string") return ""; // return empty string for non-strings
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const getStatusColor = (status) => {
  switch (status) {
    case "present":
      return "success.main";
    case "late":
      return "warning.main";
    case "absent":
      return "error.main";
    case "leave":
    case "on_leave":
      return "info.main";
    default:
      return "text.secondary";
  }
};

const AttendanceDialog = ({ open, onClose, date, attendance, holiday, breaks = [] }) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    {/* Header */}
    <DialogTitle>
      <Box display="flex" alignItems="center" gap={1}>
        <CalendarToday fontSize="small" />
        <Typography variant="h6">Details – {date}</Typography>
      </Box>
    </DialogTitle>

    <DialogContent dividers>
      {/* Holiday */}
      {holiday && (
        <Typography color="error" mb={2}>
          🎉 Public Holiday: <strong>{holiday}</strong>
        </Typography>
      )}

      {/* Attendance */}
      <Box mb={2}>
        <Typography gutterBottom fontWeight={600}>
          📝 Attendance
        </Typography>

        {attendance ? (
          <>
            <Chip
              label={capitalize(attendance?.status || "")}
              sx={{
                bgcolor: getStatusColor(attendance?.status || ""),
                color: "#fff",
                fontWeight: 600,
                mb: 1,
              }}
            />
            {attendance.daily_late_hhmmss &&
              attendance.daily_late_hhmmss !== "00:00:00" && (
                <Typography variant="body2" color="warning.main" sx={{ fontWeight: 600 }}>
                  ⏱️ Late by {attendance.daily_late_hhmmss}
                </Typography>
              )}
          </>
        ) : (
          <>
            <Typography color="textSecondary">No attendance marked</Typography>
            {/* ✅ Always check for weekend regardless of attendance */}
            {["Saturday", "Sunday"].includes(
              new Date(date).toLocaleDateString("en-US", { weekday: "long" })
            ) && (
                <Typography color="textSecondary" sx={{ fontStyle: "italic" }}>
                  Weekend
                </Typography>
              )}
          </>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Breaks */}
      <Box>
        <Typography gutterBottom fontWeight={600}>
          ☕ Breaks
        </Typography>
        {breaks.length > 0 ? (
          <List dense>
            {breaks.map((b) => {
              const start = new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const end = b.end_time ? new Date(b.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Ongoing";
              const duration = b.duration_seconds ? formatSecondsToHHMMSS(b.duration_seconds) : "Ongoing";

              return (
                <ListItem key={b.id} alignItems="flex-start">
                  <Chip
                    label={`${start} → ${end} (${duration})`}
                    size="small"
                    color="info"
                    sx={{ mr: 1, fontWeight: 600 }}
                  />
                  {b.reason && <ListItemText primary={`Reason: ${b.reason}`} />}
                </ListItem>
              );
            })}
          </List>
        ) : (
          <Typography color="textSecondary">No breaks recorded</Typography>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Meetings */}

    </DialogContent>

    <DialogActions>
      <Button onClick={onClose} variant="outlined" startIcon={<AssignmentTurnedIn />}>
        Close
      </Button>
    </DialogActions>
  </Dialog>
);

export default AttendanceDialog;
