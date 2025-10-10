import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Box, Typography, Paper } from "@mui/material";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import AttendanceDialog from "./AttendanceDialog";
import AttendanceCalendar from "./AttendanceCalendar";
import { setAuthenticated } from "../api/authSlice";

import {
  useGetEmployeeAttendanceQuery,
  useMarkAttendanceMutation,
  useGetAttendanceSummaryQuery,

} from "../api/attendanceApi";
import { useGetHolidaysQuery } from "../api/holidayApi";
import { useGetMeetingsQuery } from "../api/meetingApi";
import { useGetEmployeeByIdQuery } from "../api/employeeApi";
import { useGetEmployeeBreaksQuery, useGetTotalBreakTimeQuery } from "../api/breakApi";

// ---------------------- helpers ----------------------
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
  return `${parts.find(p => p.type === "year").value}-${parts.find(p => p.type === "month").value}-${parts.find(p => p.type === "day").value}`;
};

const isWeekendFromDateStr = (dateStr) => {
  if (!dateStr) return false;
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return false;
  const dUTCNoon = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 12));
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", weekday: "short" }).format(dUTCNoon);
  return weekday === "Sat" || weekday === "Sun";
};

const formatSecondsToHHMMSS = (totalSeconds) => {
  if (!totalSeconds) return "00:00:00";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

// ---------------------- component ----------------------
const AttendancePage = () => {
  const { employeeId: routeEmployeeId } = useParams();
  const { user: authUser, attendance: todayAttendance } = useSelector(s => s.auth);
  const dispatch = useDispatch();

  const loggedInEmployee = authUser?.employee;
  const routeEmpId = routeEmployeeId ? parseInt(routeEmployeeId, 10) : null;

  // Selected employee (logged-in or from route)
  const employeeIdToFetch = routeEmpId || loggedInEmployee?.id;

  // Employee profile
  const { data: employeeData } = useGetEmployeeByIdQuery(employeeIdToFetch, {
    skip: !employeeIdToFetch,
  });
  
  // ---------------------- Attendance summary ----------------------



  const displayedEmployee = useMemo(() => {
    if (employeeData) return employeeData;
    if (loggedInEmployee && !routeEmpId) return loggedInEmployee;
    return { id: employeeIdToFetch, name: `Employee ${employeeIdToFetch}` };
  }, [employeeData, loggedInEmployee, routeEmpId, employeeIdToFetch]);

  const now = new Date();
  const todayStr = formatToCSTDate(now);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  // ---------------------- API calls ----------------------
  const { data: attendance = [], isLoading, refetch } = useGetEmployeeAttendanceQuery(
    { employeeId: employeeIdToFetch, month, year },
    { skip: !employeeIdToFetch }
  );

  const { data: attendanceSummary } = useGetAttendanceSummaryQuery(
    { employeeId: employeeIdToFetch, year },
    { skip: !employeeIdToFetch }
  );

  const { data: allHolidayData } = useGetHolidaysQuery({ page: 1, pageSize: 9999 });
  const { data: meetings = [] } = useGetMeetingsQuery();
  const [markAttendance] = useMarkAttendanceMutation();

  const allHolidays = allHolidayData?.holidays ?? [];

  // ---------------------- Breaks ----------------------
  const breakQueryArgs = useMemo(() => ({
    employeeId: employeeIdToFetch,
    month,
    year
  }), [employeeIdToFetch, month, year]);

  const { data: breakDataRaw = [], refetch: refetchBreaks } = useGetEmployeeBreaksQuery(
    breakQueryArgs,
    { refetchOnMountOrArgChange: true }
  );

  const { data: totalBreakData = {}, refetch: refetchTotalBreakTime } = useGetTotalBreakTimeQuery(
    breakQueryArgs,
    { skip: !employeeIdToFetch, refetchOnMountOrArgChange: true }
  );

  const breakData = useMemo(() => {
    if (!breakDataRaw) return [];
    return Array.isArray(breakDataRaw) ? breakDataRaw : breakDataRaw?.results ?? [];
  }, [breakDataRaw]);

  const getBreaksForDate = useCallback(
    dateStr => breakData.filter(b => formatToCSTDate(b.start_time) === dateStr),
    [breakData]
  );

  useEffect(() => {
    if (employeeIdToFetch) {
      refetchBreaks();
      refetchTotalBreakTime();
    }
  }, [employeeIdToFetch, month, year, refetchBreaks, refetchTotalBreakTime]);


  const leaveBalance = useMemo(() => attendanceSummary?.leave_balance ?? 0, [attendanceSummary]);
  const yearlyLateHHMMSS = useMemo(() => {
  if (!attendanceSummary?.yearly_late_seconds) return "00:00:00";
  return formatSecondsToHHMMSS(attendanceSummary.yearly_late_seconds);
}, [attendanceSummary]);

  // ---------------------- Attendance summary ----------------------
  const {
    totalPresent, totalLate, totalPaidLeave, totalUnpaidLeave, totalAbsent, totalEarly
  } = useMemo(() => {
    const holidaySet = new Set(allHolidays.map(h => formatToCSTDate(h.date)).filter(Boolean));
    const attendanceMap = new Map(attendance.map(a => [formatToCSTDate(a.date), a.status?.toUpperCase()]).filter(([k]) => !!k));

    let present = 0, late = 0, paidLeave = 0, unpaidLeave = 0, absent = 0, early = 0;
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const employeeCreationStr = formatToCSTDate(displayedEmployee?.created_at);
    
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = formatToCSTDate(new Date(Date.UTC(year, month - 1, d, 12)));
      if (!dateStr) continue;
      const isFuture = dateStr > todayStr;
      const status = attendanceMap.get(dateStr);
      if (status) {
        if (status === "PRESENT") present++;
        else if (status === "LATE") late++;
        else if (status === "ON_LEAVE" || status === "PAID_LEAVE") paidLeave++;
        else if (status === "UNPAID_LEAVE") unpaidLeave++;
        else if (status === "ABSENT") absent++;
        else if (status === "EARLY") early++;
      } else if (
  !isWeekendFromDateStr(dateStr) &&
  !holidaySet.has(dateStr) &&
  !isFuture &&
  (!employeeCreationStr || dateStr >= employeeCreationStr)
) {
  absent++;
}
    }
    return {
      totalPresent: present,
      totalLate: late,
      totalPaidLeave: paidLeave,
      totalUnpaidLeave: unpaidLeave,
      totalAbsent: absent,
      totalEarly: early
    };
  }, [attendance, allHolidays, month, year, todayStr]);

  const totalBreakHHMMSS = useMemo(() => {
    if (!totalBreakData?.total_break_seconds) return "00:00:00";
    return formatSecondsToHHMMSS(totalBreakData.total_break_seconds);
  }, [totalBreakData]);

  const holidayCount = useMemo(() => {
    return allHolidays.filter(h => {
      const d = formatToCSTDate(h.date);
      if (!d) return false;
      const [y, m] = d.split("-");
      return parseInt(y, 10) === year && parseInt(m, 10) === month;
    }).length;
  }, [allHolidays, month, year]);

  const alreadyMarked = (todayAttendance && formatToCSTDate(todayAttendance.date) === todayStr) ||
    attendance.some(a => formatToCSTDate(a.date) === todayStr);

  // ---------------------- Handlers ----------------------
  const handleMarkToday = useCallback(async () => {
    if (alreadyMarked) return toast.error("Already marked today");
    try {
      const today = await markAttendance({ employee: employeeIdToFetch, date: todayStr }).unwrap();
      dispatch(setAuthenticated({ user: authUser, attendance: today }));
      toast.success("Attendance marked for today");
      refetch();
    } catch (err) {
      console.error(err);
      toast.error("Failed to mark attendance");
    }
  }, [alreadyMarked, authUser, employeeIdToFetch, markAttendance, dispatch, refetch, todayStr]);
  console.log("Fetching breaks for employee:", employeeIdToFetch);

  const handleDateClick = useCallback(dateStr => {
    const att = attendance.find(a => formatToCSTDate(a.date) === dateStr);
    const holiday = allHolidays.find(h => formatToCSTDate(h.date) === dateStr);
    const dayMeetings = meetings.filter(m => formatToCSTDate(m.date) === dateStr);
    const dayBreaks = getBreaksForDate(dateStr);
    const dayTotalBreak = formatSecondsToHHMMSS(dayBreaks.reduce((sum, b) => b.end_time ? sum + (new Date(b.end_time) - new Date(b.start_time)) / 1000 : sum, 0));

    let status = att?.status;
const isHoliday = !!holiday;
const isFuture = dateStr > todayStr;
const employeeCreationStr = formatToCSTDate(displayedEmployee?.created_at);

// Only mark absent if date is after employee creation
if (
  !status &&
  !isHoliday &&
  !isWeekendFromDateStr(dateStr) &&
  !isFuture &&
  (!employeeCreationStr || dateStr >= employeeCreationStr)
) {
  status = "ABSENT";
}

    setSelectedDateInfo({ date: dateStr, attendance: { status }, holiday, meetings: dayMeetings, breaks: dayBreaks, totalBreak: dayTotalBreak });
    setDialogOpen(true);
  }, [attendance, allHolidays, meetings, todayStr, getBreaksForDate]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDateInfo, setSelectedDateInfo] = useState({});
  const [filter, setFilter] = useState(null);

  // ---------------------- Render ----------------------
  return (
    <Box sx={{ bgcolor: "#f4f6f8", minHeight: "100vh", py: 4 }}>
      <Paper sx={{ maxWidth: 900, mx: "auto", p: 4, borderRadius: 2 }}>
        <Typography variant="h4" align="center" fontWeight={600} gutterBottom>
          Employee Attendance
        </Typography>

        <Box>
          <Typography variant="h6">Welcome, {displayedEmployee?.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            Login ID: {displayedEmployee?.login_id || displayedEmployee?.id}
          </Typography>
        </Box>

        {/* Summary Cards */}
        <Box display="grid" gridTemplateColumns={{ xs: "1fr 1fr", sm: "1fr 1fr 1fr 1fr" }} gap={2} mt={3} mb={3}>
          {[
            { key: "present", label: "✅ Present", count: totalPresent, color: "success" },
            { key: "late", label: "⏰ Late", count: totalLate, color: "warning" },
            { key: "on_leave", label: "🌴 Paid Leave", count: totalPaidLeave, color: "info" },
            { key: "unpaid_leave", label: "💸 Unpaid Leave", count: totalUnpaidLeave, color: "secondary" },
            { key: "absent", label: "❌ Absent", count: totalAbsent, color: "error" },
            { key: "early", label: "⌚ Early", count: totalEarly, color: "primary" },
            { key: "holiday", label: "🎉 Holidays", count: holidayCount, color: "secondary" },
            { key: "break", label: "☕ Break Hours", count: totalBreakHHMMSS, color: "info" },
            { key: "leave_balance", label: "📝 Leave Balance", count: leaveBalance, color: "info" },
            { key: "yearly_late", label: "⏱️ Yearly Late", count: yearlyLateHHMMSS, color: "warning" },
          ].map(({ key, label, count, color }) => (
            <Paper key={key} sx={{
              p: 1, borderRadius: 1.5, textAlign: "center", cursor: "pointer",
              bgcolor: filter === key ? `${color}.main` : `${color}.100`,
              color: filter === key ? "#fff" : `${color}.800`,
              transition: "0.2s", boxShadow: 1, "&:hover": { transform: "scale(1.03)", boxShadow: 2 }
            }} onClick={() => setFilter(filter === key ? null : key)}>
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
            breaks={breakData}
            loading={isLoading}
            onDateClick={handleDateClick}
            filter={filter}
            month={month}
            year={year}
            onMonthChange={(m, y) => { setMonth(m); setYear(y); }}
            employee={displayedEmployee}
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
        breaks={selectedDateInfo.breaks}
        totalBreak={selectedDateInfo.totalBreak}
      />
    </Box>
  );
};

export default AttendancePage;
