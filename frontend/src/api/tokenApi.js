// src/api/tokenApi.js
import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseApi";

export const tokenApi = createApi({
  reducerPath: "tokenApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Token"],
  endpoints: (builder) => ({
    // 🔹 Fetch tokens (employee = own, responder = all)
    getTokens: builder.query({
      query: ({ page = 1, page_size = 10, status, search, employee } = {}) => {
        const params = new URLSearchParams({ page, page_size });
        if (status) params.set("status", status);
        if (search) params.set("search", search);
        if (employee) params.set("employee", employee); // optional explicit filter
        return `/tokens/?${params.toString()}`;
      },
      providesTags: (result) =>
        result?.results?.length
          ? [
              ...result.results.map(({ id }) => ({ type: "Token", id })),
              { type: "Token", id: "LIST" },
            ]
          : [{ type: "Token", id: "LIST" }],
    }),

    // 🔹 Employee: create new token
    submitToken: builder.mutation({
      query: (payload) => ({
        url: "/tokens/",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: [{ type: "Token", id: "LIST" }],
    }),

    // 🔹 Employee: update their own pending token
    updateToken: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/tokens/${id}/`,
        method: "PATCH",
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Token", id },
        { type: "Token", id: "LIST" },
      ],
    }),

    // 🔹 Responder: respond to token
    respondToken: builder.mutation({
      query: ({ id, response }) => ({
        url: `/tokens/${id}/respond/`,
        method: "POST",
        body: { response },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Token", id },
        { type: "Token", id: "LIST" },
      ],
    }),

    // 🔹 Optional: delete token (employees can delete pending ones if allowed)
    deleteToken: builder.mutation({
      query: (id) => ({
        url: `/tokens/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Token", id: "LIST" }],
    }),
  }),
});

export const {
  useGetTokensQuery,
  useLazyGetTokensQuery,
  useSubmitTokenMutation,
  useUpdateTokenMutation,
  useRespondTokenMutation,
  useDeleteTokenMutation,
} = tokenApi;
