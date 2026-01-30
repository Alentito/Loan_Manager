import React from "react";
import { useSelector } from "react-redux";
import {
  Box,
  Grid,
  Paper,
  Card,
  CardHeader,
  CardContent,
  Avatar,
  Typography,
  Chip,
  Divider,
  Skeleton,
  Alert,
  Stack,
  Button,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import {
  User,
  Mail,
  Phone,
  Users,
  Briefcase,
  Calendar,
  MapPin,
  Hash,
  BadgeCheck,
} from "lucide-react";

// Data hooks (adjust paths if your API slices differ)
import { useGetEmployeeByIdQuery } from "../api/employeeApi";
import { useGetEmployeeAttendanceQuery } from "../api/attendanceApi";
import { useGetHolidaysQuery } from "../api/holidayApi";
import { useGetMeetingsQuery } from "../api/meetingApi";
import { useGetEmployeeBreaksQuery } from "../api/breakApi";

// Attendance UI
import AttendanceCalendar from "../attendance/AttendanceCalendar";
import AttendanceDialog from "../attendance/AttendanceDialog";

// Labeled row
function InfoRow({ icon: Icon, label, value, loading, width = 220 }) {
  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
        <Icon size={18} />
        <Typography variant="subtitle2" color="text.secondary">
          {label}
        </Typography>
      </Stack>
      {loading ? <Skeleton width={width} /> : <Typography variant="body1">{value || "-"}</Typography>}
    </Box>
  );
}

// Format to YYYY-MM-DD in America/Chicago
function fmtCST(input) {
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
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const da = parts.find((p) => p.type === "day")?.value;
  return y && m && da ? `${y}-${m}-${da}` : null;
}

export default function ProfilePage() {
  const theme = useTheme();
  const authUser = useSelector((s) => s.auth.user);

  // Employee id
  const employeeId = authUser?.employee_id || authUser?.employee?.id || authUser?.id;

  const { data: employee, isLoading, isError, refetch } = useGetEmployeeByIdQuery(employeeId, {
    skip: !employeeId,
  });

  // Name and initials
  const firstName = employee?.first_name || employee?.firstname || employee?.name || authUser?.firstName;
  const lastName = employee?.last_name || employee?.lastname || authUser?.lastName;
  const fullName =
    employee?.full_name ||
    [firstName, lastName].filter(Boolean).join(" ") ||
    employee?.username ||
    employee?.email ||
    "Employee";
  const initials =
    (firstName?.[0]?.toUpperCase() || "") + (lastName?.[0]?.toUpperCase() || "");

  // Roles/chips (optional)
  const roles =
    employee?.roles ||
    (employee?.position?.name ? [employee.position.name] : null);

  // Fields to show (only existing values)
  const items = [
    { label: "Email", icon: Mail, value: employee?.company_email || employee?.email },
    { label: "Phone", icon: Phone, value: employee?.phone || employee?.contact_number },
    { label: "Team", icon: Users, value: employee?.team?.name || employee?.team_name },
    { label: "Designation", icon: Briefcase, value: employee?.designation?.name || employee?.designation },
    { label: "Department", icon: Users, value: employee?.department?.name || employee?.department },
    { label: "Primary Shift", icon: Briefcase, value: employee?.primary_shift?.name || employee?.shift || employee?.primary_shift_name },
    {
      label: "Manager",
      icon: User,
      value:
        employee?.manager?.full_name ||
        (employee?.manager &&
          [employee.manager.first_name, employee.manager.last_name].filter(Boolean).join(" ")),
    },
    { label: "Employee Code", icon: Hash, value: employee?.employee_code },
    { label: "Location", icon: MapPin, value: employee?.location || employee?.office_location },
    { label: "Status", icon: BadgeCheck, value: employee?.status },
    {
      label: "Joined",
      icon: Calendar,
      value: employee?.created_at ? new Date(employee.created_at).toLocaleDateString() : undefined,
    },
  ].filter((i) => i.value !== undefined && i.value !== null && i.value !== "");

  // Attendance state and queries
  const now = new Date();
  const todayStr = fmtCST(now);
  const empIdToFetch = employee?.id || employeeId;

  const [month, setMonth] = React.useState(now.getMonth() + 1);
  const [year, setYear] = React.useState(now.getFullYear());
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedDateInfo, setSelectedDateInfo] = React.useState({});

  const { data: attendance = [], isLoading: isAttLoading } = useGetEmployeeAttendanceQuery(
    { employeeId: empIdToFetch, month, year },
    { skip: !empIdToFetch }
  );

  const { data: holidaysResp } = useGetHolidaysQuery({ page: 1, pageSize: 9999 });
  const allHolidays = holidaysResp?.holidays ?? holidaysResp?.results ?? [];

  const { data: meetings = [] } = useGetMeetingsQuery();

  const { data: breakDataRaw = [] } = useGetEmployeeBreaksQuery(
    { employeeId: empIdToFetch, month, year },
    { skip: !empIdToFetch, refetchOnMountOrArgChange: true }
  );
  const breakData = Array.isArray(breakDataRaw) ? breakDataRaw : breakDataRaw?.results ?? [];

  const isWeekendFromDateStr = (dateStr) => {
    if (!dateStr) return false;
    const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return false;
    const dUTCNoon = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 12));
    const weekday = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      weekday: "short",
    }).format(dUTCNoon);
    return weekday === "Sat" || weekday === "Sun";
  };

  const formatSecondsToHHMMSS = (totalSeconds) => {
    if (!totalSeconds) return "00:00:00";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const handleDateClick = (dateStr) => {
    const att = attendance.find((a) => fmtCST(a.date) === dateStr);
    const holiday = allHolidays.find((h) => fmtCST(h.date) === dateStr);
    const dayMeetings = (meetings || []).filter((m) => fmtCST(m.date) === dateStr);
    const dayBreaks = (breakData || []).filter((b) => fmtCST(b.start_time) === dateStr);

    let status = att?.status;
    const isHoliday = !!holiday;
    const isFuture = dateStr > todayStr;
    const employeeCreationStr = fmtCST(employee?.created_at);
    if (!status && !isHoliday && !isWeekendFromDateStr(dateStr) && !isFuture && (!employeeCreationStr || dateStr >= employeeCreationStr)) {
      status = "ABSENT";
    }

    const totalBreakSeconds = dayBreaks.reduce(
      (sum, b) => (b.end_time ? sum + (new Date(b.end_time) - new Date(b.start_time)) / 1000 : sum),
      0
    );

    setSelectedDateInfo({
      date: dateStr,
      attendance: { status, ...att },
      holiday,
      meetings: dayMeetings,
      breaks: dayBreaks,
      totalBreak: formatSecondsToHHMMSS(totalBreakSeconds),
    });
    setDialogOpen(true);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
      }}
    >
      {/* Hero / cover with theme-aware gradient */}
      <Box
        sx={{
          width: "100%",
          height: { xs: 160, sm: 200, md: 240 },
          background:
            theme.palette.mode === "dark"
              ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.25)} 0%, ${alpha(
                  theme.palette.primary.main,
                  0.35
                )} 100%)`
              : `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.18)} 0%, ${alpha(
                  theme.palette.primary.main,
                  0.35
                )} 100%)`,
        }}
      />

      {/* Main content */}
      <Box
        sx={{
          flex: 1,
          width: "100%",
          px: { xs: 2, sm: 3, md: 6 },
          pb: 6,
          mt: { xs: -8, sm: -10, md: -12 },
        }}
      >
        {/* Use Grid container (not Box) to control columns */}
        <Grid
          container
          spacing={3}
          sx={{ maxWidth: "1400px", mx: "auto", width: "100%" }}
          alignItems="stretch"
          columns={{ xs: 12, sm: 12, md: 12, lg: 12 }}
        >
          {/* Left: Profile details */}
          <Grid item xs={12} sm={6} md={5} lg={4}>
            <Paper elevation={6} sx={{ borderRadius: 3, overflow: "hidden", height: "100%" }}>
              <Card elevation={0} sx={{ height: "100%" }}>
                <CardHeader
                  avatar={
                    employee?.avatar_url ? (
                      <Avatar
                        src={employee.avatar_url}
                        sx={{
                          width: 104,
                          height: 104,
                          boxShadow: 3,
                          border: (t) => `3px solid ${t.palette.background.paper}`,
                        }}
                      />
                    ) : (
                      <Avatar
                        sx={{
                          width: 104,
                          height: 104,
                          bgcolor: "primary.main",
                          fontSize: 40,
                          boxShadow: 3,
                          border: (t) => `3px solid ${t.palette.background.paper}`,
                        }}
                      >
                        {initials || <User size={40} />}
                      </Avatar>
                    )
                  }
                  title={
                    isLoading ? (
                      <Skeleton width={240} height={34} />
                    ) : (
                      <Typography variant="h4" fontWeight={800}>
                        {fullName}
                      </Typography>
                    )
                  }
                  subheader={
                    isLoading ? (
                      <Skeleton width={160} height={24} />
                    ) : roles ? (
                      <Stack direction="row" spacing={1} sx={{ mt: 1 }} useFlexGap flexWrap="wrap">
                        {roles.map((r, i) => (
                          <Chip key={i} label={r} color="primary" size="small" sx={{ fontWeight: 700 }} />
                        ))}
                      </Stack>
                    ) : null
                  }
                  sx={{ pt: 3, pb: 0, px: 3 }}
                />
                <CardContent sx={{ px: 3, pb: 3 }}>
                  {isError && (
                    <Alert
                      severity="error"
                      action={
                        <Button size="small" onClick={() => refetch()}>
                          Retry
                        </Button>
                      }
                      sx={{ mb: 2 }}
                    >
                      Failed to load profile.
                    </Alert>
                  )}

                  {!employeeId && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      No employee id available for this user.
                    </Alert>
                  )}

                  <Stack spacing={2.2}>
                    {items.slice(0, 4).map((it) => (
                      <InfoRow
                        key={it.label}
                        icon={it.icon}
                        label={it.label}
                        value={it.value}
                        loading={isLoading}
                      />
                    ))}
                  </Stack>

                  <Divider sx={{ my: 3 }} />

                  <Stack spacing={2.2}>
                    {items.slice(4).map((it) => (
                      <InfoRow
                        key={it.label}
                        icon={it.icon}
                        label={it.label}
                        value={it.value}
                        loading={isLoading}
                      />
                    ))}
                  </Stack>

                  
                </CardContent>
              </Card>
            </Paper>
          </Grid>

          {/* Right: Attendance calendar */}
          <Grid item xs={12} sm={6} md={7} lg={8}>
            <Paper elevation={6} sx={{ borderRadius: 3, height: "100%" }}>
              <Card elevation={0} sx={{ height: "100%" }}>
                <CardHeader
                  title={
                    <Typography variant="h6" fontWeight={800}>
                      Attendance
                    </Typography>
                  }
                  sx={{ pb: 0, px: 3, pt: 3 }}
                />
                <CardContent sx={{ px: 3, pb: 3 }}>
                  <AttendanceCalendar
                    attendance={attendance}
                    holidays={allHolidays}
                    meetings={meetings}
                    breaks={breakData}
                    loading={isAttLoading}
                    onDateClick={handleDateClick}
                    month={month}
                    year={year}
                    onMonthChange={(m, y) => {
                      setMonth(m);
                      setYear(y);
                    }}
                    employee={employee}
                  />
                </CardContent>
              </Card>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Day details dialog */}
      <AttendanceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        date={selectedDateInfo.date}
        attendance={selectedDateInfo.attendance?.status}
        holiday={selectedDateInfo.holiday?.title}
        meetings={selectedDateInfo.meetings || []}
        breaks={selectedDateInfo.breaks || []}
        totalBreak={selectedDateInfo.totalBreak}
      />
    </Box>
  );
}
