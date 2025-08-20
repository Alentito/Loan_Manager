import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

const AttendanceDialog = ({ open, onClose, date, attendance, holiday, meetings }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Details – {date}</DialogTitle>
      <DialogContent dividers>
        {holiday && (
          <Typography color="error" mb={1}>
            🎉 Public Holiday: {holiday}
          </Typography>
        )}

        {attendance ? (
          <Typography>
            📝 Attendance: <strong>{capitalize(attendance)}</strong>
          </Typography>
        ) : (
          <Typography>No attendance marked</Typography>
        )}

        {meetings?.length > 0 && (
          <Box mt={2}>
            <Typography fontWeight={600}>📅 Meetings:</Typography>
            <ul style={{ paddingLeft: '1.2rem', marginTop: 4 }}>
              {meetings.map((m) => (
                <li key={m.id}>
                  <strong>{m.title}</strong> ({m.time})
                  <br />
                  <small>{m.description}</small>
                </li>
              ))}
            </ul>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AttendanceDialog;
