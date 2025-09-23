import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseApi";

export const lenderApi = createApi({
  reducerPath: "lenderApi",
  baseQuery: baseQueryWithReauth, // ✅ handles token refresh
  tagTypes: ["Lender"],

  endpoints: (builder) => ({
    // 📌 Fetch lenders with pagination, search & ordering
    getLenders: builder.query({
      query: ({ page = 1, pageSize = 10, search, ordering } = {}) => {
        const params = new URLSearchParams({
          page,
          page_size: pageSize,
        });
        if (search) params.set("search", search);
        if (ordering) params.set("ordering", ordering);

        return `lenders/?${params.toString()}`;
      },
      providesTags: (result) =>
        result?.results
          ? [
              ...result.results.map(({ id }) => ({ type: "Lender", id })),
              { type: "Lender", id: "LIST" },
            ]
          : [{ type: "Lender", id: "LIST" }],
    }),

    // 📌 Fetch lender by ID
    getLenderById: builder.query({
      query: (id) => `lenders/${id}/`,
      providesTags: (_, __, id) => [{ type: "Lender", id }],
    }),

    // 📌 Add new lender
    addLender: builder.mutation({
      query: (data) => ({
        url: "lenders/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Lender", id: "LIST" }],
    }),

    // 📌 Update lender
    updateLender: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `lenders/${id}/`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: "Lender", id },
        { type: "Lender", id: "LIST" },
      ],
    }),

    // 📌 Delete lender
    deleteLender: builder.mutation({
      query: (id) => ({
        url: `lenders/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (_, __, id) => [
        { type: "Lender", id },
        { type: "Lender", id: "LIST" },
      ],
    }),

    // 📌 Validate unique fields (email, phone, etc.)
    validateLenderField: builder.mutation({
      query: (payload) => ({
        url: "lenders/validate/",
        method: "POST",
        body: payload,
      }),
    }),
    archiveLender: builder.mutation({
          query: (id) => ({
              url: `/lenders/${id}/archive/`,
              method: "POST",
          }),
      }),
    unarchiveLender: builder.mutation({
          query: (id) => ({
              url: `/lenders/${id}/unarchive/`,
              method: "POST",
          }),
      }),

  }),
});

// ✅ Auto-generated hooks
export const {
  useGetLendersQuery,
  useGetLenderByIdQuery,
  useAddLenderMutation,
  useUpdateLenderMutation,
  useDeleteLenderMutation,
  useValidateLenderFieldMutation,
  useArchiveLenderMutation,
  useUnarchiveLenderMutation,
} = lenderApi;
