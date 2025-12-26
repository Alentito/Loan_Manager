// src/components/redux/loanOfficerApi.js
import { createApi } from '@reduxjs/toolkit/query/react';
import { customBaseQuery } from './authBaseQuery';

export const loanOfficerApi = createApi({
  reducerPath: 'loanOfficerApi',
  baseQuery: customBaseQuery,
  tagTypes: ['LoanOfficer'],
  endpoints: (builder) => ({
    getLoanOfficers: builder.query({
      query: ({ page = 1, page_size = 10, search = '', ordering = '', archived = false }) =>
        `loan-officers/?page=${page}&page_size=${page_size}&search=${search}&ordering=${ordering}&archived=${archived}`,
      providesTags: (result) =>
        result
          ? [
              ...result.results.map(({ id }) => ({ type: 'LoanOfficer', id })),
              { type: 'LoanOfficer', id: 'LIST' },
            ]
          : [{ type: 'LoanOfficer', id: 'LIST' }],
    }),

    getLoanOfficerById: builder.query({
      query: (id) => `loan-officers/${id}/`,
      providesTags: (result, error, id) => [{ type: 'LoanOfficer', id }],
    }),

    createLoanOfficer: builder.mutation({
      query: (formData) => ({
        url: 'loan-officers/',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: [{ type: 'LoanOfficer', id: 'LIST' }],
    }),

    updateLoanOfficer: builder.mutation({
      query: ({ id, formData }) => ({
        url: `loan-officers/${id}/`,
        method: 'PUT',
        body: formData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'LoanOfficer', id },
        { type: 'LoanOfficer', id: 'LIST' },
      ],
    }),

    deleteLoanOfficer: builder.mutation({
      query: (id) => ({
        url: `loan-officers/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'LoanOfficer', id: 'LIST' }],
    }),

    archiveLoanOfficer: builder.mutation({
      query: (id) => ({
        url: `/loan-officers/${id}/archive/`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'LoanOfficer', id: 'LIST' }],
    }),

    unarchiveLoanOfficer: builder.mutation({
      query: (id) => ({
        url: `/loan-officers/${id}/unarchive/`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'LoanOfficer', id: 'LIST' }],
    }),

    validateLoanOfficer: builder.mutation({
      query: (data) => ({
        url: 'loan-officers/validate/',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const {
  useGetLoanOfficersQuery,
  useGetLoanOfficerByIdQuery,
  useCreateLoanOfficerMutation,
  useUpdateLoanOfficerMutation,
  useDeleteLoanOfficerMutation,
  useArchiveLoanOfficerMutation,
  useUnarchiveLoanOfficerMutation,
  useValidateLoanOfficerMutation,
} = loanOfficerApi;
