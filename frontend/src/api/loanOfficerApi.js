// src/components/redux/loanOfficerApi.js
import { createApi } from '@reduxjs/toolkit/query/react';
import baseQueryWithReauth from "./baseApi";

export const loanOfficerApi = createApi({
  reducerPath: 'loanOfficerApi',
  baseQuery: baseQueryWithReauth, // Use the base query with re-authentication
  tagTypes: ['LoanOfficer'],
  endpoints: (builder) => ({
    getLoanOfficers: builder.query({
      query: (params) => ({
        url: 'loan-officers/',
        method: 'GET',
        params,
      }),
      providesTags: ['LoanOfficer'],
    }),
    getLoanOfficerById: builder.query({
      query: (id) => `loan-officers/${id}/`,
    }),
    createLoanOfficer: builder.mutation({
      query: (data) => ({
        url: 'loan-officers/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['LoanOfficer'],
    }),
    updateLoanOfficer: builder.mutation({
      query: ({ id, data }) => ({
        url: `loan-officers/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['LoanOfficer'],
    }),
    deleteLoanOfficer: builder.mutation({
      query: (id) => ({
        url: `loan-officers/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['LoanOfficer'],
    }),
    validateLoanOfficer: builder.mutation({
      query: (data) => ({
        url: 'loan-officers/validate/',
        method: 'POST',
        body: data,
      }),
    }),
    archiveLoanOfficer: builder.mutation({
      query: (id) => ({
        url: `loan-officers/${id}/archive/`,
        method: 'POST',
      }),
      invalidatesTags: ['LoanOfficer'],
    }),
    unarchiveLoanOfficer: builder.mutation({
      query: (id) => ({
        url: `loan-officers/${id}/unarchive/`,
        method: 'POST',
      }),
      invalidatesTags: ['LoanOfficer'],
    }),
  }),
});

// ✅ Export the auto-generated hooks from RTK Query
export const {
  useGetLoanOfficersQuery,
  useGetLoanOfficerByIdQuery,
  useCreateLoanOfficerMutation,
  useUpdateLoanOfficerMutation,
  useDeleteLoanOfficerMutation,
  useArchiveLoanOfficerMutation,   // new
  useUnarchiveLoanOfficerMutation, // new
  useValidateLoanOfficerMutation,
} = loanOfficerApi;
