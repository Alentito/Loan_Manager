// src/api/attendanceSummaryApi.js
import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseApi";

export const attendanceSummaryApi = createApi({
  reducerPath: "attendanceSummaryApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["MonthlySummary"],
  endpoints: (builder) => ({
    // Fetch current user’s summaries
    getSummaries: builder.query({
      query: ({ month, year } = {}) => {
        let url = "/attendance/monthly-summaries/";
        const params = new URLSearchParams();
        if (month) params.append("month", month);
        if (year) params.append("year", year);
        if (params.toString()) url += `?${params.toString()}`;
        return url;
      },
      providesTags: ["MonthlySummary"],
    }),

    // (Optional) Admin: get summaries for all employees
    getAllSummaries: builder.query({
      query: ({ month, year } = {}) => {
        let url = "/attendance/monthly-summaries/";
        const params = new URLSearchParams();
        if (month) params.append("month", month);
        if (year) params.append("year", year);
        if (params.toString()) url += `?${params.toString()}`;
        return url;
      },
      providesTags: ["MonthlySummary"],
    }),
  }),
});

export const {
  useGetSummariesQuery,
  useGetAllSummariesQuery,
} = attendanceSummaryApi;
