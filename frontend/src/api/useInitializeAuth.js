import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useRefreshTokenMutation, useLazyGetMeQuery } from "../api/authApi";
import { useLazyGetTodayAttendanceQuery } from "../api/attendanceApi";
import { useLazyGetHolidaysQuery } from "../api/holidayApi";
import { useLazyGetMeetingsQuery } from "../api/meetingApi";
import { useLazyGetEmployeeLeaveRequestsQuery } from "../api/leaveApi";
import { logoutAction, setAuthenticated, setInitialized } from "../api/authSlice";

export default function useInitializeAuthEnhanced() {
  const [refresh] = useRefreshTokenMutation();
  const [triggerGetMe] = useLazyGetMeQuery();
  const [triggerGetTodayAttendance] = useLazyGetTodayAttendanceQuery();
  const [triggerGetHolidays] = useLazyGetHolidaysQuery();
  const [triggerGetMeetings] = useLazyGetMeetingsQuery();
  const [triggerGetLeaves] = useLazyGetEmployeeLeaveRequestsQuery();
  const dispatch = useDispatch();

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // 1) Refresh token (sets access cookie if valid)
        await refresh().unwrap();

        // 2) Fetch current user
        const meRes = await triggerGetMe().unwrap();
        const user = meRes;
        if (!mounted) return;

        const employeeId =
          user?.employee_id ?? user?.employee?.id ?? user?.employeeId ?? null;

        // 3) Fetch related data concurrently (tolerate failures)
        const [todayRes, holidaysRes, meetingsRes, leavesRes] = await Promise.allSettled([
          triggerGetTodayAttendance().unwrap().catch(() => null),
          triggerGetHolidays({ page: 1, pageSize: 9999 }).unwrap().catch(() => null),
          triggerGetMeetings().unwrap().catch(() => null),
          triggerGetLeaves({
            employeeId: user?.employee_id,  // ✅ use correct field
            page: 1,
            page_size: 10,
          }).unwrap().catch((e) => null),
        ]);

        const today =
          todayRes.status === "fulfilled" ? todayRes.value : null;
        const holidays =
          holidaysRes.status === "fulfilled"
            ? holidaysRes.value?.holidays ?? holidaysRes.value ?? []
            : [];
        const meetings =
          meetingsRes.status === "fulfilled" ? meetingsRes.value ?? [] : [];
        const leaves =
          leavesRes.status === "fulfilled" ? leavesRes.value ?? [] : [];

        // 4) Dispatch to auth store
        dispatch(
          setAuthenticated({
            user,
            attendance: today ? (Array.isArray(today) ? today : [today]) : [],
            holidays,
            meetings,
            leaves,
          })
        );
      } catch {
        if (mounted) dispatch(logoutAction());
      } finally {
        if (mounted) dispatch(setInitialized(true));
      }
    })();

    return () => {
      mounted = false;
    };
  }, [
    refresh,
    triggerGetMe,
    triggerGetTodayAttendance,
    triggerGetHolidays,
    triggerGetMeetings,
    triggerGetLeaves,
    dispatch,
  ]);
}
