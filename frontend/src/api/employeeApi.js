// src/api/employeeApi.js
import { createApi } from '@reduxjs/toolkit/query/react';
import baseQueryWithReauth from './baseApi';

export const employeeApi = createApi({
  reducerPath: 'employeeApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Employee', 'Team'],
  endpoints: (builder) => ({
    // Paginated / Filterable employees
    getEmployees: builder.query({
      query: ({
        page = 1,
        pageSize = 10,
        search,
        ordering,
        position,
        team,
        shift,
        manager,
        is_archived,
        employeeId,
      }) => {
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('page_size', pageSize);
        if (employeeId) params.append('employee', employeeId);
        if (search) params.append('search', search);
        if (ordering) params.append('ordering', ordering);
        if (position) params.append('position', position);
        if (team) params.append('team', team);
        if (shift) params.append('shift', shift);
        if (manager) params.append('manager', manager);
        if (is_archived !== undefined) params.append('is_archived', is_archived);

        return `employees/?${params.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.results.map(({ id }) => ({ type: 'Employee', id })),
              { type: 'Employee', id: 'LIST' },
            ]
          : [{ type: 'Employee', id: 'LIST' }],
    }),

    // Fetch all employees (no pagination) - useful for dropdowns
    getAllEmployees: builder.query({
      query: () => `employees/?page_size=1000`,
      providesTags: (result) =>
        result
          ? [
              ...result.results.map(({ id }) => ({ type: 'Employee', id })),
              { type: 'Employee', id: 'LIST' },
            ]
          : [{ type: 'Employee', id: 'LIST' }],
    }),

    // Single employee by ID
    getEmployeeById: builder.query({
      query: (id) => `employees/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Employee', id }],
    }),

    // Add employee
    addEmployee: builder.mutation({
      query: (data) => ({
        url: 'employees/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Employee', id: 'LIST' }],
    }),

    // Update employee
    updateEmployee: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `employees/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Employee', id },
        { type: 'Employee', id: 'LIST' },
      ],
    }),

    // Delete employee
    deleteEmployee: builder.mutation({
      query: (id) => ({
        url: `employees/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Employee', id },
        { type: 'Employee', id: 'LIST' },
      ],
    }),

    // Unarchive employee
    unarchiveEmployee: builder.mutation({
      query: (id) => ({
        url: `employees/${id}/unarchive/`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Employee', id },
        { type: 'Employee', id: 'LIST' },
      ],
    }),

    // Bulk archive employees
    bulkArchiveEmployees: builder.mutation({
      query: (ids) => ({
        url: 'employees/bulk-archive/',
        method: 'PATCH',
        body: { ids },
      }),
      invalidatesTags: [{ type: 'Employee', id: 'LIST' }],
    }),

    // Bulk unarchive employees
    bulkUnarchiveEmployees: builder.mutation({
      query: (ids) => ({
        url: 'employees/bulk-unarchive/',
        method: 'PATCH',
        body: { ids },
      }),
      invalidatesTags: [{ type: 'Employee', id: 'LIST' }],
    }),

    // Employee login
    loginEmployee: builder.mutation({
      query: (credentials) => ({
        url: 'employees/login/',
        method: 'POST',
        body: credentials,
      }),
    }),
    // Add inside endpoints: (builder) => ({
validateEmployeeField: builder.mutation({
  query: ({ field, value }) => ({
    url: `employees/validate-field/`,
    method: "POST",
    body: { field, value },
  }),
}),

  }),
});

export const {
  useGetEmployeesQuery,
  useGetAllEmployeesQuery,
  useGetEmployeeByIdQuery,
  useAddEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
  useLoginEmployeeMutation,
  useUnarchiveEmployeeMutation,
  useBulkArchiveEmployeesMutation,
  useBulkUnarchiveEmployeesMutation,
  useValidateEmployeeFieldMutation,
} = employeeApi;

