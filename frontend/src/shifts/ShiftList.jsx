import React, { useState } from 'react';
import {
  Box, Typography, IconButton, TextField, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Checkbox, Snackbar, Pagination
} from '@mui/material';
import { Delete, Edit } from '@mui/icons-material';
import { useGetShiftsQuery, useDeleteShiftMutation } from '../redux/shiftApi';
import ShiftFormDialog from './ShiftFormDialog';

/**
 * Flexible formatter:
 * - If value is already a time-only string "HH:MM" or "HH:MM:SS", return "HH:MM".
 * - If value is a full datetime (ISO or Date), convert to America/Chicago and return either time or date+time.
 * - Otherwise return ''.
 */
function formatChicagoTimeFlexible(value, { showDate = false } = {}) {
  if (!value) return '';

  // If value is time-only like "HH:MM" or "H:MM" or "HH:MM:SS"
  const timeOnly = String(value).match(/^(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d{1,3})?)?$/);
  if (timeOnly) {
    const hh = timeOnly[1].padStart(2, '0');
    const mm = timeOnly[2];
    return `${hh}:${mm}`;
  }

  // Try parse full date
  const d = (value instanceof Date) ? value : new Date(value);
  if (isNaN(d.getTime())) return '';

  if (showDate) {
    return d.toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      hour12: false,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return d.toLocaleTimeString('en-GB', { // 24-hour "HH:MM"
    timeZone: 'America/Chicago',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).slice(0, 5);
}

const ShiftList = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  const { data, isLoading, refetch } = useGetShiftsQuery({ page, search });
  const [deleteShift] = useDeleteShiftMutation();

  const handleDelete = async (id) => {
    try {
      await deleteShift(id).unwrap();
      setSnackbar({ open: true, message: 'Shift deleted successfully' });
      refetch();
    } catch (err) {
      console.error('Delete error', err);
      setSnackbar({ open: true, message: 'Failed to delete' });
    }
  };

  const handleEdit = (shift) => {
    setSelectedShift(shift);
    setOpenForm(true);
  };

  const handleBulkDelete = async () => {
    for (const id of selectedIds) {
      try { await deleteShift(id).unwrap(); } catch (e) { /* continue */ }
    }
    setSnackbar({ open: true, message: 'Selected shifts deleted' });
    setSelectedIds([]);
    refetch();
  };

  const handleCheckbox = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight="bold">Shift Management</Typography>
        <Button variant="contained" onClick={() => { setSelectedShift(null); setOpenForm(true); }}>
          Add Shift
        </Button>
      </Box>

      <Box mb={2} display="flex" gap={2}>
        <TextField
          label="Search by name"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          fullWidth
        />
        {selectedIds.length > 0 && (
          <Button variant="contained" color="error" onClick={handleBulkDelete}>
            Delete Selected ({selectedIds.length})
          </Button>
        )}
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selectedIds.length === (data?.results?.length || 0) && (data?.results?.length || 0) > 0}
                  indeterminate={selectedIds.length > 0 && selectedIds.length < (data?.results?.length || 0)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedIds(data?.results?.map(s => s.id) || []);
                    else setSelectedIds([]);
                  }}
                />
              </TableCell>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Start Time</strong></TableCell>
              <TableCell><strong>End Time</strong></TableCell>
              <TableCell><strong>Total Hours</strong></TableCell>
              <TableCell><strong>Created At</strong></TableCell>
              <TableCell><strong>Updated At</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {data?.results?.map((shift) => (
              <TableRow key={shift.id}>
                <TableCell padding="checkbox">
                  <Checkbox checked={selectedIds.includes(shift.id)} onChange={() => handleCheckbox(shift.id)} />
                </TableCell>
                <TableCell>{shift.name}</TableCell>
                <TableCell>{formatChicagoTimeFlexible(shift.start_time)}</TableCell>
                <TableCell>{formatChicagoTimeFlexible(shift.end_time)}</TableCell>
                <TableCell>{shift.total_hours}</TableCell>
                <TableCell>{formatChicagoTimeFlexible(shift.created_at, { showDate: true })}</TableCell>
                <TableCell>{formatChicagoTimeFlexible(shift.updated_at, { showDate: true })}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEdit(shift)}><Edit /></IconButton>
                  <IconButton onClick={() => handleDelete(shift.id)} color="error"><Delete /></IconButton>
                </TableCell>
              </TableRow>
            ))}

            {(!data?.results || data.results.length === 0) && !isLoading && (
              <TableRow><TableCell colSpan={8} align="center">No shifts found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box mt={2} display="flex" justifyContent="center">
        <Pagination count={data?.total_pages || 1} page={page} onChange={(e, value) => setPage(value)} color="primary" />
      </Box>

      <ShiftFormDialog
        open={openForm}
        onClose={() => { setOpenForm(false); setSelectedShift(null); refetch(); }}
        editData={selectedShift}
      />

      <Snackbar open={snackbar.open} onClose={() => setSnackbar({ open: false, message: '' })} autoHideDuration={3000} message={snackbar.message} />
    </Box>
  );
};

export default ShiftList;
