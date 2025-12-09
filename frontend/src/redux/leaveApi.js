// src/components/redux/leaveApi.js
import { createApi } from '@reduxjs/toolkit/query/react';
import { customBaseQuery } from './authBaseQuery';

export const leaveApi = createApi({
  reducerPath: 'leaveApi',
  baseQuery: customBaseQuery,
  tagTypes: ['LeaveRequest'],
  endpoints: (builder) => ({
    // Employee: get own leave requests
    getEmployeeLeaveRequests: builder.query({
      query: (employeeId) => `leave-requests/employee/${employeeId}`,
      providesTags: (result) =>
        result?.length
          ? [
            ...result.map(({ id }) => ({ type: 'LeaveRequest', id })),
            { type: 'LeaveRequest', id: 'LIST' },
          ]
          : [{ type: 'LeaveRequest', id: 'LIST' }],
    }),


    // Admin: get all leave requests
    getAllLeaveRequests: builder.query({
      query: ({ page = 1, page_size = 10, status = '', search = '' } = {}) =>
        `leave-requests/?page=${page}&page_size=${page_size}&status=${status}&search=${search}`,
      providesTags: (result) =>
        result?.results?.length
          ? [
            ...result.results.map(({ id }) => ({ type: 'LeaveRequest', id })),
            { type: 'LeaveRequest', id: 'LIST' },
          ]
          : [{ type: 'LeaveRequest', id: 'LIST' }],
    }),


    // Submit leave
    submitLeaveRequest: builder.mutation({
      query: (payload) => ({
        url: 'leave-requests/',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: [{ type: 'LeaveRequest', id: 'LIST' }],
    }),

    // Admin: update approval status
    updateLeaveStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `leave-requests/${id}/`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'LeaveRequest', id },
        { type: 'LeaveRequest', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetEmployeeLeaveRequestsQuery,
  useGetAllLeaveRequestsQuery,
  useSubmitLeaveRequestMutation,
  useUpdateLeaveStatusMutation,
} = leaveApi;
