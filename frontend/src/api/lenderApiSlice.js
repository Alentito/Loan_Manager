import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseApi";

export const lenderApi = createApi({
  reducerPath: "lenderApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Lender"],

  endpoints: (builder) => ({

    // ---------------------------------------------------------------------
    // 📌 Get lenders (pagination + search + ordering + archived filter)
    // ---------------------------------------------------------------------
    getLenders: builder.query({
      query: ({ page = 1, pageSize = 10, search, ordering, archived } = {}) => {
        const params = new URLSearchParams({
          page,
          page_size: pageSize,
        });

        if (search) params.set("search", search);
        if (ordering) params.set("ordering", ordering);
        if (archived !== undefined) params.set("archived", archived);

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

    // ---------------------------------------------------------------------
    // 📌 Get ALL lenders (no pagination, useful for dropdowns)
    // ---------------------------------------------------------------------
    getAllLenders: builder.query({
      query: () => `lenders/?all=true&archived=false`,
      providesTags: (result) =>
        result?.results
          ? [
              ...result.results.map(({ id }) => ({ type: "Lender", id })),
              { type: "Lender", id: "ALL" },
            ]
          : [{ type: "Lender", id: "ALL" }],
    }),

    // ---------------------------------------------------------------------
    // 📌 Get lender by ID
    // ---------------------------------------------------------------------
    getLenderById: builder.query({
      query: (id) => `lenders/${id}/`,
      providesTags: (_, __, id) => [{ type: "Lender", id }],
    }),

    // ---------------------------------------------------------------------
    // 📌 Add new lender
    // ---------------------------------------------------------------------
    addLender: builder.mutation({
      query: (data) => ({
        url: "lenders/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [
        { type: "Lender", id: "LIST" },
        { type: "Lender", id: "ALL" },
      ],
    }),

    // ---------------------------------------------------------------------
    // 📌 Update lender
    // ---------------------------------------------------------------------
    updateLender: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `lenders/${id}/`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: "Lender", id },
        { type: "Lender", id: "LIST" },
        { type: "Lender", id: "ALL" },
      ],
    }),

    // ---------------------------------------------------------------------
    // 📌 Delete lender
    // ---------------------------------------------------------------------
    deleteLender: builder.mutation({
      query: (id) => ({
        url: `lenders/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (_, __, id) => [
        { type: "Lender", id },
        { type: "Lender", id: "LIST" },
        { type: "Lender", id: "ALL" },
      ],
    }),

    // ---------------------------------------------------------------------
    // 📌 Validate unique fields (name, NMLS, email)
    // ---------------------------------------------------------------------
    validateLenderField: builder.mutation({
      query: (payload) => ({
        url: "lenders/validate/",
        method: "POST",
        body: payload,
      }),
    }),

    // ---------------------------------------------------------------------
    // 📌 Archive lender
    // ---------------------------------------------------------------------
    archiveLender: builder.mutation({
      query: (id) => ({
        url: `lenders/${id}/archive/`,
        method: "POST",
      }),
      invalidatesTags: [
        { type: "Lender", id: "LIST" },
        { type: "Lender", id: "ALL" },
      ],
    }),

    // ---------------------------------------------------------------------
    // 📌 Unarchive lender
    // ---------------------------------------------------------------------
    unarchiveLender: builder.mutation({
      query: (id) => ({
        url: `lenders/${id}/unarchive/`,
        method: "POST",
      }),
      invalidatesTags: [
        { type: "Lender", id: "LIST" },
        { type: "Lender", id: "ALL" },
      ],
    }),

  }),
});

export const {
  useGetLendersQuery,
  useGetAllLendersQuery,
  useGetLenderByIdQuery,
  useAddLenderMutation,
  useUpdateLenderMutation,
  useDeleteLenderMutation,
  useValidateLenderFieldMutation,
  useArchiveLenderMutation,
  useUnarchiveLenderMutation,
} = lenderApi;
