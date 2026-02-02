// src/redux/breakSlice.js
import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "../api/baseApi";

export const breakApi = createApi({
  reducerPath: "breakApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Break", "BreakSummary"],
  endpoints: (builder) => ({
    
  getActiveBreak: builder.query({
  query: () => "/employee-break/active/",
  providesTags: (result) =>
    result?.has_active_break && result.break?.id
      ? [{ type: "Break", id: result.break.id }]
      : [{ type: "Break", id: "LIST" }],
}),

    getBreaks: builder.query({
      query: ({ employeeId, page = 1, page_size = 10 } = {}) => {
        const params = new URLSearchParams({ page, page_size });
        if (employeeId) params.append("employee", employeeId); // allow selecting any employee
        return `/employee-break/?${params.toString()}`;
      },
      providesTags: (result) =>
        result?.results?.length
          ? [
            ...result.results.map(({ id }) => ({ type: "Break", id })),
            { type: "Break", id: "LIST" },
          ]
          : [{ type: "Break", id: "LIST" }],
    }),

    startBreak: builder.mutation({
      query: (body) => ({
        url: "/employee-break/",  // <- ensure correct path
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Break", id: "LIST" }, "BreakSummary"],
    }),




    endBreak: builder.mutation({
      query: (id) => ({
        url: `/employee-break/${id}/break_out/`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Break", id },
        { type: "Break", id: "LIST" },
        "BreakSummary",
      ],
    }),

    getEmployeeBreaks: builder.query({
      query: ({ employeeId, month, year }) =>
        `/employee-break/?employee=${employeeId}&month=${month}&year=${year}`,
      providesTags: (result, error, arg) =>
        result?.results?.map((b) => ({ type: "Break", id: b.id })) ?? [{ type: "Break", id: "LIST" }],
    }),

    getTotalBreakTime: builder.query({
      query: ({ employeeId, month, year }) =>
        `/employee-break/total_break_time/?employee=${employeeId}&month=${month}&year=${year}`,
      providesTags: ["Break"],
    }),

  }),
});

export const {
  useGetBreaksQuery,
  useLazyGetBreaksQuery,
  useStartBreakMutation,
  useEndBreakMutation,
  useGetEmployeeBreaksQuery,
  useGetTotalBreakTimeQuery,
  useGetActiveBreakQuery,
  useLazyGetActiveBreakQuery,
} = breakApi;