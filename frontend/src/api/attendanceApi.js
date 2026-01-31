// src/api/attendanceApi.js
import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseApi";

export const attendanceApi = createApi({
  reducerPath: "attendanceApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Attendance"],
  endpoints: (builder) => ({
    // ✅ Get attendance for the logged-in employee (month + year filter)
    // ✅ Get attendance for the logged-in employee OR a specific employee (admin)
    getEmployeeAttendance: builder.query({
      query: ({ employeeId, month, year } = {}) => {
        const params = new URLSearchParams();
        if (employeeId) params.append("employeeId", employeeId);
        if (month) params.append("month", month);
        if (year) params.append("year", year);
        const queryString = params.toString();
        return `attendance/${queryString ? "?" + queryString : ""}`;
      },
      transformResponse: (response) =>
        response?.results ?? response ?? [],
      providesTags: (result) =>
        result
          ? [
            ...result.map(({ id }) => ({ type: "Attendance", id })),
            { type: "Attendance", id: "LIST" },
          ]
          : [{ type: "Attendance", id: "LIST" }],
    }),


    // ✅ Mark today's attendance for an employee
    markAttendance: builder.mutation({
  query: (body) => ({
    url: "attendance/",
    method: "POST",
    body,
  }),
  invalidatesTags: (result, error, arg) => [
    { type: "Attendance", id: "LIST" },
    { type: "Attendance", id: `EMP-${arg.employee}-${arg.date}` },
  ],
}),


    // ✅ For managers/admins — list all attendance records
    getAllAttendance: builder.query({
      query: ({ page = 1, pageSize = 20 }) =>
        `attendance/?page=${page}&page_size=${pageSize}`,
      transformResponse: (response) =>
        response?.results ?? response ?? [],
      providesTags: (result) =>
        result
          ? [
            ...result.map(({ id }) => ({ type: "Attendance", id })),
            { type: "Attendance", id: "LIST" },
          ]
          : [{ type: "Attendance", id: "LIST" }],
    }),
    
    getAttendanceSummary: builder.query({
      query: ({ employeeId, year } = {}) => {
        const params = new URLSearchParams();
        if (employeeId) params.append("employeeId", employeeId);
        if (year) params.append("year", year);
        const queryString = params.toString();
        return `attendance/summary/${queryString ? "?" + queryString : ""}`;
      },
    }),
    getMonthlyLateSummary: builder.query({
      query: ({ employeeId, year } = {}) => {
        const params = new URLSearchParams();
        if (employeeId) params.append("employeeId", employeeId);
        if (year) params.append("year", year);
        const queryString = params.toString();
        return `attendance/monthly-summary/${queryString ? "?" + queryString : ""}`;
      },
      providesTags: (result, error, arg) =>
        result
          ? [{ type: "Attendance", id: `Monthly-${arg.employeeId || "self"}` }]
          : [{ type: "Attendance", id: "LIST" }],
    }),
    getMonthlyWorkedHours: builder.query({
  query: ({ employeeId, month, year }) => {
    const params = new URLSearchParams();
    if (employeeId) params.append("employeeId", employeeId);
    if (month) params.append("month", month);
    if (year) params.append("year", year);
    const queryString = params.toString();
    return `attendance/monthly-worked-hours/?${queryString}`;
  },
  providesTags: (result, error, arg) =>
    result
      ? [{ type: "Attendance", id: `Worked-${arg.employeeId || "self"}` }]
      : [{ type: "Attendance", id: "LIST" }],
}),

// ✅ Punch In (login)
punchIn: builder.mutation({
  query: (body) => ({
    url: "attendance/punch-in/",
    method: "POST",
    body,
  }),
  invalidatesTags: [{ type: "Attendance", id: "LIST" }],
}),

// ✅ Punch Out (logout)
punchOut: builder.mutation({
  query: (body) => ({
    url: "attendance/punch-out/",
    method: "POST",
    body,
  }),
  invalidatesTags: [{ type: "Attendance", id: "LIST" }],
}),
// ✅ Get Late Logins list (day/week/month)
getLateLogins: builder.query({
  query: ({ filter = "day", date, page = 1, page_size = 10 }) => {
    const params = new URLSearchParams();
    if (filter) params.append("filter", filter);
    if (date) params.append("date", date);
    params.append("page", page);
    params.append("page_size", page_size);

    return `attendance/late-logins/?${params.toString()}`;
  },
  providesTags: [{ type: "Attendance", id: "LateLogins" }],
}),

getAbsents: builder.query({
  query: ({ filter = "day", date, page = 1, page_size = 10 }) => {
    const params = new URLSearchParams();
    params.append("filter", filter);
    if (date) params.append("date", date);
    params.append("page", page);
    params.append("page_size", page_size);

    return `attendance/absents/?${params.toString()}`;
  },
  providesTags: [{ type: "Attendance", id: "Absents" }],
}),

getLoginLogout: builder.query({
  query: ({ filter = "day", date, page = 1, page_size = 10 }) => {
    const params = new URLSearchParams();
    params.append("filter", filter);
    if (date) params.append("date", date);
    params.append("page", page);
    params.append("page_size", page_size);

    return `attendance/login-logout/?${params.toString()}`;
  },
  providesTags: [{ type: "Attendance", id: "LoginLogout" }],
}),



  }),
});

export const {
  useGetEmployeeAttendanceQuery,
  useMarkAttendanceMutation,
  useGetAllAttendanceQuery,
  useGetTodayAttendanceQuery,
  useLazyGetTodayAttendanceQuery,
  useGetAttendanceSummaryQuery,
  useGetMonthlyLateSummaryQuery,
  useGetMonthlyWorkedHoursQuery, 
  usePunchInMutation,
  usePunchOutMutation,
  useGetLateLoginsQuery,
  useGetAbsentsQuery,
  useGetLoginLogoutQuery,
} = attendanceApi;
