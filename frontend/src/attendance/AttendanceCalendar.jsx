import React, { useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { CircularProgress, Box } from "@mui/material";
import "./AttendanceCalendar.css";

// Format to YYYY-MM-DD in America/Chicago
const formatToCSTDate = (input) => {
  if (!input) return null;
  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input)) return input;

  const d = input instanceof Date ? input : new Date(input);
  if (isNaN(d)) return null;

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);

  const y = parts.find((p) => p.type === "year").value;
  const m = parts.find((p) => p.type === "month").value;
  const da = parts.find((p) => p.type === "day").value;
  return `${y}-${m}-${da}`;
};

const todayStr = formatToCSTDate(new Date());

// Weekend check in America/Chicago
const isWeekendYMD = (year, month, day) => {
  const dUTCNoon = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "short",
  }).format(dUTCNoon);
  return weekday === "Sat" || weekday === "Sun";
};

// Map backend statuses to titles/icons
const STATUS_TITLES = {
  present: "✔ Present",
  late: "⏰ Late",
  on_leave: "🌴 Paid Leave",
  unpaid_leave: "💸 Unpaid Leave",
  absent: "❌ Absent",
  early: "⌚ Early",
};

export default function AttendanceCalendar({
  attendance = [],
  holidays = [],
  meetings = [],
  onDateClick,
  loading,
  onMonthChange,
  month,
  year,
  filter,
}) {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  // Attendance events
  const attendanceDates = new Set();
  const eventsFromAttendance = [];
  attendance.forEach(({ date, status }) => {
    const dateStr = formatToCSTDate(date);
    if (!dateStr) return;
    attendanceDates.add(dateStr);

    const normalized = (status || "").toLowerCase();
    eventsFromAttendance.push({
      id: `att-${dateStr}`,
      title: STATUS_TITLES[normalized] || `🔹 ${status}`,
      date: dateStr,
      classNames: [`status-${normalized}`],
    });
  });

  // Holiday events
  const holidayDates = new Set();
  const eventsFromHolidays = [];
  holidays.forEach(({ id, title, date }) => {
    const dateStr = formatToCSTDate(date);
    if (!dateStr) return;
    holidayDates.add(dateStr);
    eventsFromHolidays.push({
      id: `hol-${id || dateStr}`,
      title: `🎉 ${title}`,
      date: dateStr,
      classNames: ["status-holiday"],
    });
  });

  // Generate weekends + absents
  const generatedEvents = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateUTCNoon = new Date(Date.UTC(year, month - 1, d, 12, 0, 0));
    const dateStr = formatToCSTDate(dateUTCNoon);
    if (!dateStr) continue;

    const isPastDay = dateStr < todayStr;

    // weekends
    if (isWeekendYMD(year, month, d) && !holidayDates.has(dateStr)) {
      generatedEvents.push({
        id: `weekend-${dateStr}`,
        title: "🚫 Weekend",
        date: dateStr,
        classNames: ["status-weekend"],
      });
    }

    // mark Absent if:
    // - not weekend
    // - not holiday
    // - no attendance record
    // - in the past
    if (
      !isWeekendYMD(year, month, d) &&
      !holidayDates.has(dateStr) &&
      !attendanceDates.has(dateStr) &&
      isPastDay
    ) {
      generatedEvents.push({
        id: `absent-${dateStr}`,
        title: STATUS_TITLES["absent"],
        date: dateStr,
        classNames: ["status-absent"],
      });
    }
  }

  // Meetings
  const eventsFromMeetings = [];
  meetings.forEach(({ id, title, date }) => {
    const dateStr = formatToCSTDate(date);
    if (!dateStr) return;
    eventsFromMeetings.push({
      id: `meet-${id || dateStr}`,
      title: `📅 ${title}`,
      date: dateStr,
      classNames: ["status-meeting"],
    });
  });

  // Merge
  const allEvents = [
    ...eventsFromAttendance,
    ...eventsFromHolidays,
    ...generatedEvents,
    ...eventsFromMeetings,
  ];

  // Apply filter
  const filteredEvents = filter
    ? allEvents.filter((e) => e.classNames?.includes(`status-${filter}`))
    : allEvents;

  return (
    <FullCalendar
      timeZone="America/Chicago"
      plugins={[dayGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      events={filteredEvents}
      dateClick={(info) => onDateClick && onDateClick(info.dateStr)}
      height="auto"
      firstDay={1}
      dayMaxEvents={5}
      eventDisplay="block"
      showNonCurrentDates={false}
      fixedWeekCount={false}
      headerToolbar={{
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,dayGridWeek,dayGridDay",
      }}
      dayHeaderFormat={{ weekday: "short" }}
      datesSet={(info) => {
        const newMonth = info.start.getMonth() + 1;
        const newYear = info.start.getFullYear();
        if (typeof onMonthChange === "function") onMonthChange(newMonth, newYear);
      }}
    />
  );
}
