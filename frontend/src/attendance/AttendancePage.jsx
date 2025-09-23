import React, { useState, useMemo, useCallback } from "react";
import { Box, Typography, Paper } from "@mui/material";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";

import AttendanceDialog from "./AttendanceDialog";
import AttendanceCalendar from "./AttendanceCalendar";
import { setAuthenticated } from "../api/authSlice";

import {
  useGetEmployeeAttendanceQuery,
  useMarkAttendanceMutation,
} from "../api/attendanceApi";
import { useGetHolidaysQuery } from "../api/holidayApi";
import { useGetMeetingsQuery } from "../api/meetingApi";

// format date to YYYY-MM-DD in America/Chicago
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

// weekend check given a YYYY-MM-DD string (safe)
const isWeekendFromDateStr = (dateStr) => {
  if (!dateStr) return false;
  // parse y,m,d
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return false;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const dUTCNoon = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "short",
  }).format(dUTCNoon);
  return weekday === "Sat" || weekday === "Sun";
};

const AttendancePage = () => {
  const { user: employee, attendance: todayAttendance } = useSelector((s) => s.auth);
  const employeeId = employee?.id;
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);

  const now = new Date();
  const todayStr = formatToCSTDate(now);

  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const {
    data: attendance = [],
    isLoading,
    refetch,
  } = useGetEmployeeAttendanceQuery({ employeeId, month, year }, { skip: !employeeId });

  const { data: allHolidayData } = useGetHolidaysQuery({ page: 1, pageSize: 9999 });
  const { data: meetings = [] } = useGetMeetingsQuery();
  const [markAttendance] = useMarkAttendanceMutation();

  const allHolidays = allHolidayData?.holidays ?? [];

  const alreadyMarked =
    (todayAttendance && formatToCSTDate(todayAttendance.date) === todayStr) ||
    attendance.some((a) => formatToCSTDate(a.date) === todayStr);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDateInfo, setSelectedDateInfo] = useState({});
  const [filter, setFilter] = useState(null);

  // Summary counts for the selected month/year using safe CST dates
  const { totalPresent, totalLate, totalPaidLeave, totalUnpaidLeave, totalAbsent, totalEarly } = useMemo(() => {
    const holidaySet = new Set(allHolidays.map((h) => formatToCSTDate(h.date)).filter(Boolean));

    const attendanceMap = new Map(
      attendance
        .map((a) => [formatToCSTDate(a.date), a.status?.toUpperCase()])
        .filter(([k]) => !!k)
    );

    let present = 0,
      late = 0,
      paidLeave = 0,
      unpaidLeave = 0,
      absent = 0,
      early =0;

    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

    for (let d = 1; d <= daysInMonth; d++) {
      const dUTCNoon = new Date(Date.UTC(year, month - 1, d, 12, 0, 0));
      const dateStr = formatToCSTDate(dUTCNoon);
      if (!dateStr) continue;

      const isFuture = dateStr > todayStr;
      const status = attendanceMap.get(dateStr);

      if (status) {
        if (status === "PRESENT") present++;
        if (status === "LATE") late++;
        if (status === "ON_LEAVE") paidLeave++;
        if (status === "UNPAID_LEAVE") unpaidLeave++;
        if (status === "ABSENT") absent++;
        if (status === "EARLY") early++;
      } else if (!isWeekendFromDateStr(dateStr) && !holidaySet.has(dateStr) && !isFuture) {
        absent++;
      }
    }

    return { totalPresent: present, totalLate: late, totalPaidLeave: paidLeave, totalUnpaidLeave: unpaidLeave, totalAbsent: absent, totalEarly: early, };
  }, [attendance, allHolidays, month, year, todayStr]);


  const handleMarkToday = useCallback(
    async () => {
      if (alreadyMarked) return toast.error("Already marked today");
      try {
        const today = await markAttendance({ employee: employeeId, date: todayStr }).unwrap();
        dispatch(setAuthenticated({ user: employee, attendance: today }));
        toast.success("Attendance marked for today");
        refetch();
      } catch (err) {
        console.error(err);
        toast.error("Failed to mark attendance");
      }
    },
    [alreadyMarked, employee, employeeId, markAttendance, dispatch, refetch, todayStr]
  );

  const handleDateClick = useCallback(
    (dateStr) => {
      const att = attendance.find((a) => formatToCSTDate(a.date) === dateStr);
      const holiday = allHolidays.find((h) => formatToCSTDate(h.date) === dateStr);
      const dayMeetings = meetings.filter((m) => formatToCSTDate(m.date) === dateStr);

      let status = att?.status;
      const isHoliday = !!holiday;
      const isFuture = dateStr > todayStr;

      if (!status && !isHoliday && !isWeekendFromDateStr(dateStr) && !isFuture) {
        status = "absent";
      }

      setSelectedDateInfo({
        date: dateStr,
        attendance: { status },
        holiday,
        meetings: dayMeetings,
      });
      setDialogOpen(true);
    },
    [attendance, allHolidays, meetings, todayStr]
  );

  return (
    <Box sx={{ bgcolor: "#f4f6f8", minHeight: "100vh", py: 4 }}>
      <Paper sx={{ maxWidth: 900, mx: "auto", p: 4, borderRadius: 2 }}>
        <Typography variant="h4" align="center" fontWeight={600} gutterBottom>
          Employee Attendance
        </Typography>

        <Box>
          <Typography variant="h6">Welcome, {user?.employee?.name || "Employee"}</Typography>
          <Typography variant="body2" color="text.secondary">ID: {user?.employee?.login_id}</Typography>
        </Box>

        <Box display="grid" gridTemplateColumns={{ xs: "1fr 1fr", sm: "1fr 1fr 1fr 1fr" }} gap={2} mt={3} mb={3}>
          {[
            { key: "present", label: "✅ Present", count: totalPresent, color: "success" },
            { key: "late", label: "⏰ Late", count: totalLate, color: "warning" },
            { key: "paidLeave", label: "🌴 Paid Leave", count: totalPaidLeave, color: "info" },
            { key: "unpaidLeave", label: "💸 Unpaid Leave", count: totalUnpaidLeave, color: "secondary" },
            { key: "absent", label: "❌ Absent", count: totalAbsent, color: "error" },
            { key: "early", label: "⌚ Early", count: totalEarly, color: "blue" },
          ].map(({ key, label, count, color }) => (
            <Paper
              key={key}
              sx={{
                p: 1,
                borderRadius: 1.5,
                textAlign: "center",
                cursor: "pointer",
                bgcolor: filter === key ? `${color}.main` : `${color}.100`,
                color: filter === key ? "#fff" : `${color}.800`,
                transition: "0.2s",
                boxShadow: 1,
                "&:hover": { transform: "scale(1.03)", boxShadow: 2 },
              }}
              onClick={() => setFilter(filter === key ? null : key)}
            >
              <Typography variant="subtitle2">{label}</Typography>
              <Typography variant="h6" fontWeight={700}>{count}</Typography>
            </Paper>
          ))}

        </Box>

        <Box mt={2}>
          <AttendanceCalendar
            attendance={attendance}
            holidays={allHolidays}
            meetings={meetings}
            loading={isLoading}
            onDateClick={handleDateClick}
            filter={filter}
            month={month}
            year={year}
            onMonthChange={(m, y) => { setMonth(m); setYear(y); }}
          />
        </Box>
      </Paper>

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
