import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  TextField,
  Paper,
  IconButton,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Pagination,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import toast from 'react-hot-toast';
import {
  useGetHolidaysQuery,
  useAddHolidayMutation,
  useDeleteHolidayMutation,
  useUpdateHolidayMutation,
} from '../redux/holidayApi';

const HolidayAdminPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [form, setForm] = useState({ title: '', date: '' });
  const [editingHoliday, setEditingHoliday] = useState(null);

  // Fetch holidays with current page and filters
  const { data, isLoading, refetch } = useGetHolidaysQuery({
    page,
    pageSize: 10,
    search,
    date: filterDate,
  });

  const [addHoliday] = useAddHolidayMutation();
  const [updateHoliday] = useUpdateHolidayMutation();
  const [deleteHoliday] = useDeleteHolidayMutation();

  useEffect(() => {
    setPage(1); // reset to page 1 on filter change
  }, [search, filterDate]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const resetForm = () => {
    setForm({ title: '', date: '' });
    setEditingHoliday(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.date) {
      toast.error('Please fill out all fields');
      return;
    }
    try {
      if (editingHoliday) {
        await updateHoliday({ id: editingHoliday.id, ...form }).unwrap();
        toast.success('Holiday updated');
      } else {
        await addHoliday(form).unwrap();
        toast.success('Holiday added');
      }
      resetForm();
      refetch();
    } catch {
      toast.error('Failed to save holiday');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this holiday?')) return;
    try {
      await deleteHoliday(id).unwrap();
      toast.success('Holiday deleted');
      refetch();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const startEdit = (holiday) => {
    setEditingHoliday(holiday);
    setForm({ title: holiday.title, date: holiday.date });
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', mt: 4, p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Manage Public Holidays
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          {editingHoliday ? 'Edit Holiday' : 'Add New Holiday'}
        </Typography>

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              name="title"
              label="Holiday Title"
              value={form.title}
              onChange={handleChange}
              required
              fullWidth
              sx={{ minWidth: 200 }}
            />
            <TextField
              name="date"
              type="date"
              label="Date"
              value={form.date}
              onChange={handleChange}
              required
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 160 }}
            />
            <Button type="submit" variant="contained" color="primary">
              {editingHoliday ? 'Update' : 'Add'}
            </Button>
            {editingHoliday && (
              <Button onClick={resetForm} color="inherit" sx={{ ml: 1 }}>
                Cancel
              </Button>
            )}
          </Box>
        </form>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Holiday List
        </Typography>

        {/* Filters */}
        <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            label="Search by Title"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
          />
          <TextField
            label="Filter by Date"
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 160 }}
          />
          <Button
            onClick={() => {
              setSearch('');
              setFilterDate('');
            }}
            size="small"
          >
            Clear Filters
          </Button>
        </Box>

        {isLoading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {data?.holidays?.map((holiday) => (
                  <TableRow key={holiday.id}>
                    <TableCell>{holiday.title}</TableCell>
                    <TableCell>{holiday.date}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        aria-label={`Edit ${holiday.title}`}
                        onClick={() => startEdit(holiday)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        aria-label={`Delete ${holiday.title}`}
                        onClick={() => handleDelete(holiday.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}

                {data?.holidays?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      No holidays found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {data?.count > 10 && (
              <Box mt={2} display="flex" justifyContent="center">
                <Pagination
                  count={Math.ceil(data.count / 10)}
                  page={page}
                  onChange={(_, value) => setPage(value)}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
};

export default HolidayAdminPage;
