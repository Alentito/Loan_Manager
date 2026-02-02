// src/api/useInitializeAuth.js
import { useEffect } from "react";
import { useRefreshTokenMutation, useLazyGetMeQuery } from "../api/authApi";
import { useLazyGetTodayAttendanceQuery } from "../api/attendanceApi";
import { useLazyGetHolidaysQuery } from "../api/holidayApi";
import { useLazyGetMeetingsQuery } from "../api/meetingApi";
import { useLazyGetEmployeeLeaveRequestsQuery } from "../api/leaveApi";
import { useDispatch } from "react-redux";
import { logoutAction, setAuthenticated, setInitialized } from "../api/authSlice";

export default function useInitializeAuth() {
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
        // 1) Try refresh token (will return 200 and set access cookie if OK)
        await refresh().unwrap();

        // 2) get /me
        const meRes = await triggerGetMe().unwrap();
        const user = meRes;

        if (!mounted) return;

        // 3) fetch other data concurrently where possible
        // be tolerant: some endpoints may fail (e.g. user has no employee)
        const [
          todayRes,
          holidaysRes,
          meetingsRes,
          leavesRes,
        ] = await Promise.allSettled([
          // only try attendance if user likely has employee relation
          triggerGetTodayAttendance().unwrap().catch((e) => null),
          triggerGetHolidays({ page: 1, pageSize: 9999 }).unwrap().catch((e) => null),
          triggerGetMeetings().unwrap().catch((e) => null),
          triggerGetLeaves({
            employeeId: user?.employee_id,  // ✅ use correct field
            page: 1,
            page_size: 10,
          }).unwrap().catch((e) => null),
        ]);

        // Resolve results (use null if failed)
        const today = todayRes.status === "fulfilled" ? todayRes.value : null;
        const holidays = holidaysRes.status === "fulfilled" ? (holidaysRes.value?.holidays ?? holidaysRes.value ?? []) : [];
        const meetings = meetingsRes.status === "fulfilled" ? (meetingsRes.value ?? []) : [];
        const leaves = leavesRes.status === "fulfilled" ? (leavesRes.value ?? []) : [];

        // 4) Dispatch structured payload expected by authSlice
        dispatch(
          setAuthenticated({
            user,
            attendance: today ? (Array.isArray(today) ? today : [today]) : [],
            holidays,
            meetings,
            leaves,
          })
        );
      } catch (err) {
        // refresh or /me failed -> not authenticated
        if (mounted) dispatch(logoutAction());
      } finally {
        if (mounted) dispatch(setInitialized(true));
      }
    })();

    return () => {
      mounted = false;
    };
  }, [refresh, triggerGetMe, triggerGetTodayAttendance, triggerGetHolidays, triggerGetMeetings, triggerGetLeaves, dispatch]);
}
