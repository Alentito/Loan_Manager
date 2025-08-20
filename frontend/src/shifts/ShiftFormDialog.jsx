// src/components/shifts/ShiftFormDialog.js
import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  useMediaQuery,
  Snackbar,
  Alert,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useAddShiftMutation, useUpdateShiftMutation } from '../redux/shiftApi';

/**
 * Normalize many possible inputs into "HH:MM" (24-hour).
 * Accepts:
 *  - "HH:MM"
 *  - "H:MM"
 *  - "HH:MM:SS"
 *  - ISO datetime string (will be converted to America/Chicago time)
 *  - Date object
 * Returns '' for invalid input.
 */
function toChicagoHHMM(input) {
  if (!input) return '';

  // If already a simple time string
  if (typeof input === 'string') {
    const m = input.match(/^(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d{1,3})?)?$/);
    if (m) {
      const hh = m[1].padStart(2, '0');
      const mm = m[2];
      return `${hh}:${mm}`;
    }
  }

  // Try parsing as Date / ISO string
  const d = input instanceof Date ? input : new Date(input);
  if (isNaN(d.getTime())) return '';

  const hhmm = d.toLocaleTimeString('en-GB', {
    timeZone: 'America/Chicago',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  // toLocaleTimeString('en-GB') returns "HH:MM"
  return hhmm.slice(0, 5);
}

const initialFormState = {
  name: '',
  start_time: '',
  end_time: '',
  total_hours: '',
};

const ShiftFormDialog = ({ open, onClose, editData }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const [formData, setFormData] = useState(initialFormState);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [addShift] = useAddShiftMutation();
  const [updateShift] = useUpdateShiftMutation();

  useEffect(() => {
    if (!open) return;

    if (editData) {
      setFormData({
        name: editData.name || '',
        start_time: toChicagoHHMM(editData.start_time) || '', // ensure HH:MM or ''
        end_time: toChicagoHHMM(editData.end_time) || '',
        total_hours: editData.total_hours?.toString() || '',
      });
    } else {
      setFormData({
        ...initialFormState,
        start_time: toChicagoHHMM(new Date()), // current Chicago HH:MM
        end_time: '',
      });
    }
  }, [open, editData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // value from <input type="time"> should be "HH:MM" (or '')
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateHHMM = (value) => /^\d{2}:\d{2}$/.test(value);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.name.trim()) {
      setSnackbar({ open: true, message: 'Shift name is required', severity: 'error' });
      return;
    }
    if (!validateHHMM(formData.start_time) || !validateHHMM(formData.end_time)) {
      setSnackbar({ open: true, message: 'Start and End times must be valid (HH:MM)', severity: 'error' });
      return;
    }
    const parsedHours = parseFloat(formData.total_hours);
    if (isNaN(parsedHours)) {
      setSnackbar({ open: true, message: 'Total hours must be a number', severity: 'error' });
      return;
    }

    const payload = {
      name: formData.name.trim(),
      start_time: formData.start_time, // HH:MM matches your DRF input_formats
      end_time: formData.end_time,
      total_hours: parsedHours,
    };

    try {
      if (editData && editData.id) {
        await updateShift({ id: editData.id, ...payload }).unwrap();
        setSnackbar({ open: true, message: 'Shift updated successfully!', severity: 'success' });
      } else {
        await addShift(payload).unwrap();
        setSnackbar({ open: true, message: 'Shift added successfully!', severity: 'success' });
      }
      // close after short delay so user sees snackbar
      setTimeout(() => {
        handleClose();
      }, 350);
    } catch (err) {
      console.error('Shift submission error:', err);
      setSnackbar({ open: true, message: 'Failed to submit shift.', severity: 'error' });
    }
  };

  const handleClose = () => {
    setFormData(initialFormState);
    onClose();
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} fullScreen={fullScreen} fullWidth maxWidth="sm">
        <DialogTitle>{editData ? 'Edit Shift' : 'Add New Shift'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Shift Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  fullWidth
                  required
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  label="Start Time"
                  name="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={handleChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ step: 60 }}
                  required
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  label="End Time"
                  name="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={handleChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ step: 60 }}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Total Hours"
                  name="total_hours"
                  placeholder="e.g., 8.00"
                  type="text"
                  value={formData.total_hours}
                  onChange={handleChange}
                  fullWidth
                  required
                />
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editData ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ShiftFormDialog;
