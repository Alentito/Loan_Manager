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
      invalidatesTags: [{ type: "Attendance", id: "LIST" }],
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
    getTodayAttendance: builder.query({
      query: () => "attendance/today/",
    }),
    getMonthlySummary: builder.query({
      query: ({ employeeId, year, month }) =>
        `attendance/summary/?employee=${employeeId}&year=${year}&month=${month}`,
    }),

  }),
});

export const {
  useGetEmployeeAttendanceQuery,
  useMarkAttendanceMutation,
  useGetAllAttendanceQuery,
  useGetTodayAttendanceQuery,
  useLazyGetTodayAttendanceQuery,
} = attendanceApi;
