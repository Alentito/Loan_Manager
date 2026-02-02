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
} from '../api/holidayApi';

// Full hardcoded U.S. federal holidays (observed where appropriate) for 2025-2035
const HARDCODED_US_HOLIDAYS_2025_2035 = [
  // 2025
  { date: '2025-01-01', title: "New Year's Day" },
  { date: '2025-01-20', title: 'Martin Luther King Jr. Day' },
  { date: '2025-02-17', title: "Washington's Birthday" },
  { date: '2025-05-26', title: 'Memorial Day' },
  { date: '2025-06-19', title: 'Juneteenth National Independence Day' },
  { date: '2025-07-04', title: 'Independence Day' },
  { date: '2025-09-01', title: 'Labor Day' },
  { date: '2025-10-13', title: 'Columbus Day' },
  { date: '2025-11-11', title: 'Veterans Day' },
  { date: '2025-11-27', title: 'Thanksgiving Day' },
  { date: '2025-12-25', title: 'Christmas Day' },

  // 2026
  { date: '2026-01-01', title: "New Year's Day" },
  { date: '2026-01-19', title: 'Martin Luther King Jr. Day' },
  { date: '2026-02-16', title: "Washington's Birthday" },
  { date: '2026-05-25', title: 'Memorial Day' },
  { date: '2026-06-19', title: 'Juneteenth National Independence Day' },
  { date: '2026-07-03', title: 'Independence Day (Observed)' }, // July 4 on Saturday -> observed Friday
  { date: '2026-09-07', title: 'Labor Day' },
  { date: '2026-10-12', title: 'Columbus Day' },
  { date: '2026-11-11', title: 'Veterans Day' },
  { date: '2026-11-26', title: 'Thanksgiving Day' },
  { date: '2026-12-25', title: 'Christmas Day' },

  // 2027
  { date: '2027-01-01', title: "New Year's Day" },
  { date: '2027-01-18', title: 'Martin Luther King Jr. Day' },
  { date: '2027-02-15', title: "Washington's Birthday" },
  { date: '2027-05-31', title: 'Memorial Day' },
  { date: '2027-06-18', title: 'Juneteenth National Independence Day (Observed)' }, // Juneteenth Saturday
  { date: '2027-07-05', title: 'Independence Day (Observed)' }, // July 4 Sunday -> observed Monday
  { date: '2027-09-06', title: 'Labor Day' },
  { date: '2027-10-11', title: 'Columbus Day' },
  { date: '2027-11-11', title: 'Veterans Day' },
  { date: '2027-11-25', title: 'Thanksgiving Day' },
  { date: '2027-12-24', title: 'Christmas Day (Observed)' }, // Dec 25 Saturday -> observed Friday

  // 2028
  { date: '2028-01-01', title: "New Year's Day" },
  { date: '2028-01-17', title: 'Martin Luther King Jr. Day' },
  { date: '2028-02-21', title: "Washington's Birthday" },
  { date: '2028-05-29', title: 'Memorial Day' },
  { date: '2028-06-19', title: 'Juneteenth National Independence Day' },
  { date: '2028-07-04', title: 'Independence Day' },
  { date: '2028-09-04', title: 'Labor Day' },
  { date: '2028-10-09', title: 'Columbus Day' },
  { date: '2028-11-10', title: 'Veterans Day (Observed)' }, // Nov 11 Saturday -> observed Friday
  { date: '2028-11-23', title: 'Thanksgiving Day' },
  { date: '2028-12-25', title: 'Christmas Day' },

  // 2029
  { date: '2029-01-01', title: "New Year's Day" },
  { date: '2029-01-15', title: 'Martin Luther King Jr. Day' },
  { date: '2029-02-19', title: "Washington's Birthday" },
  { date: '2029-05-28', title: 'Memorial Day' },
  { date: '2029-06-19', title: 'Juneteenth National Independence Day' },
  { date: '2029-07-04', title: 'Independence Day' },
  { date: '2029-09-03', title: 'Labor Day' },
  { date: '2029-10-08', title: 'Columbus Day' },
  { date: '2029-11-12', title: 'Veterans Day (Observed)' }, // Nov 11 Sunday -> observed Monday
  { date: '2029-11-22', title: 'Thanksgiving Day' },
  { date: '2029-12-25', title: 'Christmas Day' },

  // 2030
  { date: '2030-01-01', title: "New Year's Day" },
  { date: '2030-01-21', title: 'Martin Luther King Jr. Day' },
  { date: '2030-02-18', title: "Washington's Birthday" },
  { date: '2030-05-27', title: 'Memorial Day' },
  { date: '2030-06-19', title: 'Juneteenth National Independence Day' },
  { date: '2030-07-04', title: 'Independence Day' },
  { date: '2030-09-02', title: 'Labor Day' },
  { date: '2030-10-14', title: 'Columbus Day' },
  { date: '2030-11-11', title: 'Veterans Day' },
  { date: '2030-11-28', title: 'Thanksgiving Day' },
  { date: '2030-12-25', title: 'Christmas Day' },

  // 2031
  { date: '2031-01-01', title: "New Year's Day" },
  { date: '2031-01-20', title: 'Martin Luther King Jr. Day' },
  { date: '2031-02-17', title: "Washington's Birthday" },
  { date: '2031-05-26', title: 'Memorial Day' },
  { date: '2031-06-19', title: 'Juneteenth National Independence Day' },
  { date: '2031-07-04', title: 'Independence Day' },
  { date: '2031-09-01', title: 'Labor Day' },
  { date: '2031-10-13', title: 'Columbus Day' },
  { date: '2031-11-11', title: 'Veterans Day' },
  { date: '2031-11-27', title: 'Thanksgiving Day' },
  { date: '2031-12-25', title: 'Christmas Day' },

  // 2032
  { date: '2032-01-01', title: "New Year's Day" },
  { date: '2032-01-19', title: 'Martin Luther King Jr. Day' },
  { date: '2032-02-16', title: "Washington's Birthday" },
  { date: '2032-05-31', title: 'Memorial Day' },
  { date: '2032-06-19', title: 'Juneteenth National Independence Day' },
  { date: '2032-07-05', title: 'Independence Day (Observed)' }, // July 4 Sunday -> observed Monday
  { date: '2032-09-06', title: 'Labor Day' },
  { date: '2032-10-11', title: 'Columbus Day' },
  { date: '2032-11-11', title: 'Veterans Day' },
  { date: '2032-11-25', title: 'Thanksgiving Day' },
  { date: '2032-12-24', title: 'Christmas Day (Observed)' }, // Dec 25 Saturday -> observed Friday

  // 2033
  { date: '2033-01-01', title: "New Year's Day" },
  { date: '2033-01-17', title: 'Martin Luther King Jr. Day' },
  { date: '2033-02-21', title: "Washington's Birthday" },
  { date: '2033-05-30', title: 'Memorial Day' },
  { date: '2033-06-19', title: 'Juneteenth National Independence Day' },
  { date: '2033-07-04', title: 'Independence Day' },
  { date: '2033-09-05', title: 'Labor Day' },
  { date: '2033-10-10', title: 'Columbus Day' },
  { date: '2033-11-11', title: 'Veterans Day' },
  { date: '2033-11-24', title: 'Thanksgiving Day' },
  { date: '2033-12-25', title: 'Christmas Day' },

  // 2034
  { date: '2034-01-02', title: "New Year's Day (Observed)" }, // Jan 1 Sunday -> observed Monday
  { date: '2034-01-16', title: 'Martin Luther King Jr. Day' },
  { date: '2034-02-20', title: "Washington's Birthday" },
  { date: '2034-05-29', title: 'Memorial Day' },
  { date: '2034-06-19', title: 'Juneteenth National Independence Day' },
  { date: '2034-07-04', title: 'Independence Day' },
  { date: '2034-09-04', title: 'Labor Day' },
  { date: '2034-10-09', title: 'Columbus Day' },
  { date: '2034-11-10', title: 'Veterans Day (Observed)' }, // Nov 11 Saturday -> observed Friday
  { date: '2034-11-23', title: 'Thanksgiving Day' },
  { date: '2034-12-25', title: 'Christmas Day' },

  // 2035
  { date: '2035-01-01', title: "New Year's Day" },
  { date: '2035-01-15', title: 'Martin Luther King Jr. Day' },
  { date: '2035-02-19', title: "Washington's Birthday" },
  { date: '2035-05-27', title: 'Memorial Day' },
  { date: '2035-06-19', title: 'Juneteenth National Independence Day' },
  { date: '2035-07-04', title: 'Independence Day' },
  { date: '2035-09-02', title: 'Labor Day' },
  { date: '2035-10-08', title: 'Columbus Day' },
  { date: '2035-11-11', title: 'Veterans Day' },
  { date: '2035-11-22', title: 'Thanksgiving Day' },
  { date: '2035-12-25', title: 'Christmas Day' },
];

const HolidayAdminPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [form, setForm] = useState({ title: '', date: '' });
  const [editingHoliday, setEditingHoliday] = useState(null);

  // Seeding state
  const [isSeeding, setIsSeeding] = useState(false);
  const [seededCount, setSeededCount] = useState(0);

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

  // Seed function: idempotent, skips already existing dates
  const seedHardcodedHolidays = async () => {
    if (!data) {
      toast.error('Please wait until holidays load.');
      return;
    }

    // Build set of existing dates (format expected from backend: 'YYYY-MM-DD')
    const existingDates = new Set((data.holidays || []).map((h) => h.date));

    const toSeed = HARDCODED_US_HOLIDAYS_2025_2035.filter(
      (h) => !existingDates.has(h.date),
    );

    if (toSeed.length === 0) {
      toast.success('All hardcoded holidays are already present.');
      return;
    }

    setIsSeeding(true);
    setSeededCount(0);

    // Send requests in small batches to avoid overwhelming backend
    const batchSize = 8;
    let seeded = 0;
    try {
      for (let i = 0; i < toSeed.length; i += batchSize) {
        const batch = toSeed.slice(i, i + batchSize);
        const promises = batch.map((h) =>
          addHoliday({ title: h.title, date: h.date }).unwrap().then(
            () => ({ ok: true }),
            (err) => ({ ok: false, err }),
          ),
        );
        const results = await Promise.all(promises);
        results.forEach((r) => {
          if (r.ok) seeded += 1;
        });
        setSeededCount(seeded);
      }

      toast.success(`Seeding finished. Inserted ${seeded} holidays.`);
    } catch (err) {
      toast.error('Seeding encountered an error. Check console.');
      // eslint-disable-next-line no-console
      console.error('Seeding error', err);
    } finally {
      setIsSeeding(false);
      refetch();
    }
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

            {/* Seed button (admin-only usage suggested) */}
            <Box sx={{ ml: 'auto' }}>
              <Button
                onClick={seedHardcodedHolidays}
                variant="outlined"
                disabled={isSeeding}
                size="small"
              >
                {isSeeding ? `Seeding... (${seededCount})` : 'Seed 2025–2035 US Holidays'}
              </Button>
            </Box>
          </Box>
        </form>
        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
          Tip: This action is idempotent — existing dates are skipped. Use only from admin.
        </Typography>
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
