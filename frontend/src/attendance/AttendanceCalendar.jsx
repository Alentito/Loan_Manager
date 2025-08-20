import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CircularProgress, Box } from '@mui/material';
import './AttendanceCalendar.css';

const getDateStr = (date) => new Date(date).toISOString().split('T')[0];

const AttendanceCalendar = ({
  attendance = [],
  holidays = [],
  meetings = [],
  onDateClick,
  loading = false,
}) => {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const attendanceDates = new Set(attendance.map((a) => getDateStr(a.date)));
  const holidayDates = new Set(holidays.map((h) => getDateStr(h.date)));

  const events = [];

  // Attendance Events
  attendance.forEach(({ date, status }) => {
    const dateStr = getDateStr(date);
    events.push({
      id: `att-${dateStr}`,
      title: `Attendance: ${status.toUpperCase()}`,
      date: dateStr,
      classNames: [`status-${status}`],
    });
  });

  // Holiday Events
  holidays.forEach(({ id, title, date }) => {
    const dateStr = getDateStr(date);
    events.push({
      id: `hol-${id}`,
      title: `🎉 Holiday: ${title}`,
      date: dateStr,
      classNames: ['status-holiday'],
    });
  });

  // Auto-mark unmarked working days as Absent
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = getDateStr(d);
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const isHoliday = holidayDates.has(dateStr);
    const hasAttendance = attendanceDates.has(dateStr);
    const isPast = d < today;

    if (!isWeekend && !isHoliday && !hasAttendance && isPast) {
      events.push({
        id: `absent-${dateStr}`,
        title: `Attendance: ABSENT`,
        date: dateStr,
        classNames: ['status-absent'],
      });
    }
  }

  // Meeting Events
  meetings.forEach(({ id, title, date }) => {
    if (!date) return;
    const dateStr = getDateStr(date);
    events.push({
      id: `meet-${id}`,
      title: `📅 Meeting: ${title}`,
      date: dateStr,
      classNames: ['status-meeting'],
    });
  });

  return (
    <FullCalendar
      plugins={[dayGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      events={events}
      dateClick={(info) => onDateClick(info.dateStr)}
      height="auto"
      firstDay={0}
      dayMaxEvents={2}
      eventDisplay="block"
      headerToolbar={{
        left: 'prev,next today',
        center: 'title',
        right: '',
      }}
      dayHeaderFormat={{ weekday: 'short' }}
    />
  );
};

export default AttendanceCalendar;
