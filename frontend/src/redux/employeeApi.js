import { createApi } from '@reduxjs/toolkit/query/react';
import { customBaseQuery } from './authBaseQuery';

export const employeeApi = createApi({
  reducerPath: 'employeeApi',
  baseQuery: customBaseQuery,
  tagTypes: ['Employee', 'Attendance'],
  endpoints: (builder) => ({
    getEmployees: builder.query({
      query: ({ page = 1, page_size = 10, search, ordering, position,  team, primary_shift, archived = false  }) => {
        const params = new URLSearchParams({ page, page_size, archived  });

        if (search) params.append('search', search);
        if (ordering) params.append('ordering', ordering);
        if (position) params.append('position', position);
       
        if (team) params.append('team', team);
        if (primary_shift) params.append('primary_shift', primary_shift);

        return `employees/?${params.toString()}`;
      },
      providesTags: (result) =>
        result?.results
          ? [...result.results.map(({ id }) => ({ type: 'Employee', id })), { type: 'Employee', id: 'LIST' }]
          : [{ type: 'Employee', id: 'LIST' }],
    }),

    getEmployeeById: builder.query({
      query: (id) => `employees/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Employee', id }],
    }),

    addEmployee: builder.mutation({
      query: (data) => ({
        url: 'employees/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Employee', id: 'LIST' }],
    }),

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

    archiveEmployee: builder.mutation({
      query: (id) => ({
        url: `employees/${id}/archive/`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'Employee', id: 'LIST' }],
    }),

    unarchiveEmployee: builder.mutation({
      query: (id) => ({
        url: `employees/${id}/unarchive/`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'Employee', id: 'LIST' }],
    }),
     bulkArchiveEmployees: builder.mutation({
      query: (ids) => ({
        url: 'employees/bulk-archive/',
        method: 'PATCH',
        body: { ids },
      }),
      invalidatesTags: [{ type: 'Employee', id: 'LIST' }],
    }),

    bulkUnarchiveEmployees: builder.mutation({
      query: (ids) => ({
        url: 'employees/bulk-unarchive/',
        method: 'PATCH',
        body: { ids },
      }),
      invalidatesTags: [{ type: 'Employee', id: 'LIST' }],
    }),

    loginEmployee: builder.mutation({
      query: (credentials) => ({
        url: 'employees/login/',
        method: 'POST',
        body: credentials,
      }),
    }),

    getEmployeeAttendance: builder.query({
      // Accept { employeeId, month, year }
      query: ({ employeeId, month, year }) => {
        const params = new URLSearchParams();
        if (month) params.append('month', month);
        if (year) params.append('year', year);
        const suffix = params.toString() ? `?${params.toString()}` : '';
        return `employees/${employeeId}/attendance/${suffix}`;
      },
      // The backend returns an array of attendance objects (not paginated)
      providesTags: (result) =>
        result?.length
          ? [...result.map(({ id }) => ({ type: 'Attendance', id })), { type: 'Attendance', id: 'LIST' }]
          : [{ type: 'Attendance', id: 'LIST' }],
    }),

    markAttendance: builder.mutation({
      query: (payload) => ({
        url: 'attendance/',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: [{ type: 'Attendance', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetEmployeesQuery,
  useGetEmployeeByIdQuery,
  useAddEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
  useLoginEmployeeMutation,
  useGetEmployeeAttendanceQuery,
  useMarkAttendanceMutation,
  useArchiveEmployeeMutation,
  useUnarchiveEmployeeMutation,
  useBulkArchiveEmployeesMutation,
  useBulkUnarchiveEmployeesMutation,
 
} = employeeApi;
