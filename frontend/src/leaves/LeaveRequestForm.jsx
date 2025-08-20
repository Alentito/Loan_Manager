// src/components/leaves/LeaveRequestForm.js
import React, { useState } from 'react';
import {
  TextField,
  Button,
  MenuItem,
  Box,
  Typography,
  Paper,
  Snackbar,
  Alert,
} from '@mui/material';
import { useSubmitLeaveRequestMutation } from '../redux/leaveApi';
import { useNavigate } from 'react-router-dom';
import { getUserRole } from '../../utils/authUtils';

const leaveTypes = [
  'Casual Leave',
  'Sick Leave',
  'Earned Leave',
  'Maternity Leave',
  'Paternity Leave',
  'Unpaid Leave',
];

const LeaveRequestForm = () => {
  const role = getUserRole();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    leave_type: '',
    start_date: '',
    end_date: '',
    reason: '',
  });

  const [submitLeaveRequest, { isLoading }] = useSubmitLeaveRequestMutation();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // ❌ Team Manager not allowed to request leave
  if (role === 'team_manager') {
    return (
      <Box mt={4} textAlign="center">
        <Typography color="error">Team Managers are not allowed to request leave.</Typography>
      </Box>
    );
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.leave_type || !form.start_date || !form.end_date || !form.reason) {
      setSnackbar({
        open: true,
        message: 'Please fill in all fields',
        severity: 'error',
      });
      return;
    }

    try {
      await submitLeaveRequest(form).unwrap();
      setSnackbar({
        open: true,
        message: 'Leave request submitted successfully!',
        severity: 'success',
      });
      setForm({ leave_type: '', start_date: '', end_date: '', reason: '' });
      
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to submit leave request',
        severity: 'error',
      });
    }
  };

  return (
    <Box sx={{ maxWidth: 500, mx: 'auto', mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Leave Request Form
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            select
            name="leave_type"
            label="Leave Type"
            fullWidth
            value={form.leave_type}
            onChange={handleChange}
            margin="normal"
          >
            {leaveTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </TextField>
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
            Submit Request
          </Button>
        </form>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LeaveRequestForm;
