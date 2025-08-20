import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import toast from 'react-hot-toast';
import AttendanceDialog from './AttendanceDialog';
import AttendanceCalendar from './AttendanceCalendar';
import { useNavigate } from 'react-router-dom';

import {
  useGetEmployeeAttendanceQuery,
  useMarkAttendanceMutation,
} from '../redux/employeeApi';
import { useGetHolidaysQuery } from '../redux/holidayApi';
import { useGetMeetingsQuery } from '../redux/meetingApi';

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
const todayStr = new Date().toISOString().split('T')[0];
const isWeekend = (dateStr) => {
  const day = new Date(dateStr).getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
};

const AttendancePage = () => {
  const navigate = useNavigate();
  const employee = JSON.parse(localStorage.getItem('employeeData'));
  const employeeId = employee?.id;

  const currentDate = new Date();
  const currentMonthNumber = currentDate.getMonth() + 1; // 1-12
  const currentYearNumber = currentDate.getFullYear();

  console.log("Current Employee ID:", employeeId);

  const { data: attendance = [], isLoading } = useGetEmployeeAttendanceQuery(
    {
      employeeId: employeeId,
      month: currentMonthNumber,
      year: currentYearNumber,
    },
    { skip: !employeeId }
  );

  console.log("Attendance API Response:", attendance);

  const { data: allHolidayData } = useGetHolidaysQuery({ page: 1, pageSize: 9999 });
  const { data: meetings = [] } = useGetMeetingsQuery();
  const [markAttendance] = useMarkAttendanceMutation();

  const allHolidays = allHolidayData?.holidays ?? [];
  const alreadyMarked = attendance.some((a) => a.date === todayStr);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDateInfo, setSelectedDateInfo] = useState({});

  // Monthly summary
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const isCurrentMonth = (dateStr) => {
    const d = new Date(dateStr);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  };

  // Attendance summary counts
  const totalPresent = attendance.filter(
    (a) => a.status === 'present' && isCurrentMonth(a.date)
  ).length;

  const totalLate = attendance.filter(
    (a) => a.status === 'late' && isCurrentMonth(a.date)
  ).length;

  const totalLeave = attendance.filter(
    (a) => a.status === 'leave' && isCurrentMonth(a.date)
  ).length;

  // Calculate Absent including unmarked working days
  const totalAbsent = (() => {
    const holidaySet = new Set(allHolidays.map((h) => new Date(h.date).toISOString().split('T')[0]));
    const attendanceDates = new Set(
      attendance
        .filter((a) => isCurrentMonth(a.date))
        .map((a) => new Date(a.date).toISOString().split('T')[0])
    );

    const today = new Date();
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth + 1, 0);

    let count = 0;
    for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const isWeekendDay = d.getDay() === 0 || d.getDay() === 6;
      const isHoliday = holidaySet.has(dateStr);
      const isFuture = d > today;
      const hasAttendance = attendanceDates.has(dateStr);

      if (!isWeekendDay && !isHoliday && !isFuture && !hasAttendance) {
        count++;
      }
    }
    return count;
  })();

  const handleMarkToday = async () => {
    if (alreadyMarked) return toast.error('Already marked today');
    try {
      await markAttendance({ employee: employeeId }).unwrap();
      toast.success('Attendance marked for today');
    } catch {
      toast.error('Failed to mark attendance');
    }
  };

  const handleDateClick = (dateStr) => {
    const att = attendance.find(
      (a) => new Date(a.date).toISOString().split('T')[0] === dateStr
    );
    const allholiday = allHolidays.find(
      (h) => new Date(h.date).toISOString().split('T')[0] === dateStr
    );
    const dayMeetings = meetings.filter(
      (m) => new Date(m.date).toISOString().split('T')[0] === dateStr
    );

    setSelectedDateInfo({
      date: dateStr,
      attendance: att,
      holiday: allholiday,
      meetings: dayMeetings,
    });
    setDialogOpen(true);
  };

  return (
    <Box sx={{ bgcolor: '#f4f6f8', minHeight: '100vh', py: 4 }}>
      <Paper sx={{ maxWidth: 900, mx: 'auto', p: 4, borderRadius: 2 }}>
        <Typography variant="h4" align="center" fontWeight={600} gutterBottom>
          Employee Attendance
        </Typography>

        {/* Greeting and Mark Attendance Button */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
          <Typography variant="h6">
            Welcome, {employee?.name || 'Employee'}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleMarkToday}
            disabled={alreadyMarked}
          >
            {alreadyMarked ? 'Attendance Marked' : 'Mark Today'}
          </Button>
        </Box>

        {/* Attendance summary */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={3} mb={1} flexWrap="wrap" gap={2}>
          <Typography variant="subtitle1" color="success.main">
            ✅ Present: {totalPresent}
          </Typography>
          <Typography variant="subtitle1" color="warning.main">
            ⏰ Late: {totalLate}
          </Typography>
          <Typography variant="subtitle1" color="secondary">
            🌴 Leave: {totalLeave}
          </Typography>
          <Typography variant="subtitle1" color="error">
            ❌ Absent: {totalAbsent}
          </Typography>
        </Box>

        {/* Calendar View */}
        <Box mt={2}>
          <AttendanceCalendar
            attendance={attendance}
            holidays={allHolidays}
            meetings={meetings}
            loading={isLoading}
            onDateClick={handleDateClick}
          />
        </Box>

        {/* Back Button */}
        <Box textAlign="center" mt={4}>
          <Button variant="outlined" onClick={() => navigate('/employee-home')}>
            Back to Home
          </Button>
        </Box>
      </Paper>

      {/* Dialog Box on date click */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedDateInfo.date}</DialogTitle>
        <DialogContent dividers>
          {selectedDateInfo.holiday && (
            <Typography color="error" mb={1}>
              🎉 Public Holiday: {selectedDateInfo.holiday.title}
            </Typography>
          )}

          {selectedDateInfo.attendance ? (
            <Typography>
              📝 Attendance: <strong>{capitalize(selectedDateInfo.attendance.status)}</strong>
            </Typography>
          ) : selectedDateInfo.holiday || isWeekend(selectedDateInfo.date) ? (
            <Typography color="textSecondary">
              Attendance not required (holiday or weekend)
            </Typography>
          ) : (
            <Typography color="red">
              Attendance: <strong>Absent</strong>
            </Typography>
          )}

          {selectedDateInfo.meetings?.length > 0 && (
            <Box mt={2}>
              <Typography fontWeight={600}>📅 Meetings:</Typography>
              <ul>
                {selectedDateInfo.meetings.map((m) => (
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
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Mobile-friendly detail view */}
      <AttendanceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        date={selectedDateInfo.date}
        attendance={selectedDateInfo.attendance?.status}
        holiday={selectedDateInfo.holiday?.title}
        meetings={selectedDateInfo.meetings}
      />
    </Box>
  );
};

export default AttendancePage;
