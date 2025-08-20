// src/components/admin/MeetingAdminPage.js
import React, { useState } from 'react';
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
import {
  useGetMeetingsQuery,
  useAddMeetingMutation,
  useUpdateMeetingMutation,
  useDeleteMeetingMutation,
} from '../redux/meetingApi';
import { useGetHolidaysQuery } from '../redux/holidayApi';
import toast from 'react-hot-toast';

const MeetingAdminPage = () => {
  const { data: meetings = [], isLoading } = useGetMeetingsQuery();
  const { data } = useGetHolidaysQuery({ page: 1 });
  const holidays = data?.holidays ?? [];
  const [addMeeting] = useAddMeetingMutation();
  const [updateMeeting] = useUpdateMeetingMutation();
  const [deleteMeeting] = useDeleteMeetingMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', date: '', time: '' });

  const handleDateClick = (arg) => {
    const isHoliday = holidays.some((h) => h.date === arg.dateStr);
    if (isHoliday) {
      const holiday = holidays.find((h) => h.date === arg.dateStr);
      toast.error(`"${holiday.title}" is a public holiday. Cannot schedule a meeting.`);
      return;
    }

    setSelectedMeeting(null);
    setForm({ title: '', description: '', date: arg.dateStr, time: '' });
    setDialogOpen(true);
  };

  const handleEventClick = (clickInfo) => {
    const meeting = meetings.find((m) => m.id === parseInt(clickInfo.event.id));
    if (meeting) {
      setSelectedMeeting(meeting);
      setForm({
        title: meeting.title,
        description: meeting.description,
        date: meeting.date,
        time: meeting.time || '',
      });
      setDialogOpen(true);
    }
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async () => {
    const { title, description, date, time } = form;

    if (!title || !date || !time) {
      toast.error('Title, Date, and Time are required');
      return;
    }

    const isHoliday = holidays.some((h) => h.date === date);
    if (isHoliday) {
      const holiday = holidays.find((h) => h.date === date);
      toast.error(`"${holiday.title}" is a public holiday. Cannot schedule a meeting.`);
      return;
    }

    const payload = { title, description, date, time };

    try {
      if (selectedMeeting) {
        await updateMeeting({ id: selectedMeeting.id, ...payload }).unwrap();
        toast.success('Meeting updated');
      } else {
        await addMeeting(payload).unwrap();
        toast.success('Meeting added');
      }
      setDialogOpen(false);
    } catch (error) {
      console.error('Failed to save meeting:', error);
      toast.error(error?.data?.detail || 'Error saving meeting');
    }
  };

  const handleDelete = async () => {
    if (!selectedMeeting) return;
    try {
      await deleteMeeting(selectedMeeting.id).unwrap();
      toast.success('Meeting deleted');
      setDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete meeting:', error);
      toast.error('Failed to delete meeting');
    }
  };

  const calendarEvents = [
    // 🗓️ Add meetings (blue)
    ...meetings.map((m) => ({
      id: m.id.toString(),
      title: m.title,
      date: m.date,
      backgroundColor: '#1976d2',
      borderColor: '#1976d2',
      textColor: '#fff',
    })),
    // 🛑 Add public holidays (red)
    ...holidays.map((h, i) => ({
      id: `holiday-${i}`,
      title: `Holiday: ${h.title}`,
      date: h.date,
      backgroundColor: '#d32f2f',
      borderColor: '#d32f2f',
      textColor: '#fff',
    })),
  ];

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
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth',
            }}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            events={calendarEvents}
            height="auto"
          />
        )}
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedMeeting ? 'Edit Meeting' : `Add Meeting on ${form.date}`}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={2}>
            <TextField
              label="Title"
              value={form.title}
              onChange={handleChange('title')}
              fullWidth
            />
            <TextField
              label="Description"
              value={form.description}
              onChange={handleChange('description')}
              fullWidth
              multiline
              rows={3}
            />
            <TextField
              label="Date"
              type="date"
              value={form.date}
              onChange={handleChange('date')}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Time"
              type="time"
              value={form.time}
              onChange={handleChange('time')}
              fullWidth
              InputLabelProps={{ shrink: true }}
              inputProps={{ step: 300 }}
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
