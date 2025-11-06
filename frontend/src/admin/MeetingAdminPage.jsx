// src/pages/MeetingAdminPage.jsx
import React, { useState, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  DialogActions,
} from '@mui/material';
import toast from 'react-hot-toast';
import { DateTime } from 'luxon';
import {
  useGetMeetingsQuery,
  useAddMeetingMutation,
  useUpdateMeetingMutation,
  useDeleteMeetingMutation,
} from '../api/meetingApi';
import { useGetHolidaysQuery } from '../api/holidayApi';

const MeetingAdminPage = () => {
  // Fetch meetings and holidays
  const { data: meetings = [], isLoading, refetch } = useGetMeetingsQuery();
  const { data: holidaysData } = useGetHolidaysQuery({ page: 1 });
  const holidays = holidaysData?.holidays ?? [];

  const [addMeeting] = useAddMeetingMutation();
  const [updateMeeting] = useUpdateMeetingMutation();
  const [deleteMeeting] = useDeleteMeetingMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', datetime: '' });

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  // Open dialog to add a meeting
  const handleDateClick = (arg) => {
    if (holidays.find((h) => h.date === arg.dateStr)) {
      toast.error('Cannot schedule on a holiday');
      return;
    }
    setSelectedMeeting(null);
    setForm({ title: '', description: '', datetime: `${arg.dateStr}T09:00` });
    setDialogOpen(true);
  };

  // Open dialog to edit a meeting
  const handleEventClick = (clickInfo) => {
    const meeting = meetings.find((m) => m.id === parseInt(clickInfo.event.id));
    if (!meeting) return;

    setSelectedMeeting(meeting);
    setForm({
      title: meeting.title,
      description: meeting.description,
      datetime: meeting.datetime?.slice(0, 16) || '',
    });
    setDialogOpen(true);
  };

  // Save (Add / Update) meeting
  const handleSave = async () => {
  const { title, description, datetime } = form;
  if (!title || !datetime) return toast.error('Title and DateTime required');

  const dtCST = DateTime.fromISO(datetime, { zone: 'America/Chicago' });

  const payload = {
    title,
    description,
    date: dtCST.toISODate(),
    time: dtCST.toFormat('HH:mm:ss'),
    employees: [],
  };

  try {
    if (selectedMeeting) {
      await updateMeeting({ id: selectedMeeting.id, ...payload }).unwrap();
      toast.success('Meeting updated');
    } else {
      await addMeeting(payload).unwrap();
      toast.success('Meeting added');
    }

    setDialogOpen(false);

    // ✅ Force refresh after add/update
    refetch();

  } catch (err) {
    console.error('Add meeting error:', err);
    toast.error('Failed to save meeting');
  }
};

  // Delete meeting
  const handleDelete = async () => {
    if (!selectedMeeting) return;
    try {
      await deleteMeeting(selectedMeeting.id).unwrap();
      toast.success('Meeting deleted');
      setDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete meeting');
    }
  };

  // Prepare events for FullCalendar
  const calendarEvents = useMemo(() => {
    const meetingEvents = meetings.map((m) => ({
      id: m.id.toString(),
      title: m.title,
      start: DateTime.fromISO(m.datetime, { zone: 'America/Chicago' }).toISO(),
      backgroundColor: '#1976d2',
      borderColor: '#1976d2',
      textColor: '#fff',
    }));

    const holidayEvents = holidays.map((h, i) => ({
      id: `holiday-${i}`,
      title: `Holiday: ${h.title}`,
      date: h.date,
      backgroundColor: '#d32f2f',
      borderColor: '#d32f2f',
      textColor: '#fff',
    }));

    return [...meetingEvents, ...holidayEvents];
  }, [meetings, holidays]);

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Meeting Calendar
      </Typography>
      <Paper sx={{ p: 2 }}>
        {isLoading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth' }}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            events={calendarEvents}
            height="auto"
          />
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedMeeting ? 'Edit Meeting' : 'Add Meeting'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={2}>
            <TextField label="Title" value={form.title} onChange={handleChange('title')} fullWidth />
            <TextField
              label="Description"
              value={form.description}
              onChange={handleChange('description')}
              fullWidth
              multiline
              rows={3}
            />
            <TextField
              label="Date & Time"
              type="datetime-local"
              value={form.datetime}
              onChange={handleChange('datetime')}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {selectedMeeting && (
            <Button color="error" onClick={handleDelete}>
              Delete
            </Button>
          )}
          <Box flexGrow={1} />
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            {selectedMeeting ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MeetingAdminPage;