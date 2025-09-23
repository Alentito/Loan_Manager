// src/redux/breakSlice.js
import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "../api/baseApi";

export const breakApi = createApi({
  reducerPath: "breakApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Break", "BreakSummary"],
  endpoints: (builder) => ({

    getBreaks: builder.query({
      query: ({ page = 1, page_size = 10 } = {}) => {
        const params = new URLSearchParams({ page, page_size });
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

    getTotalBreakTime: builder.query({
      query: () => `/employee-break/total_break_time/`,
      providesTags: ["BreakSummary"],
    }),
  }),
});

export const {
  useGetBreaksQuery,
  useLazyGetBreaksQuery,
  useStartBreakMutation,
  useEndBreakMutation,
  useGetTotalBreakTimeQuery,
} = breakApi;
