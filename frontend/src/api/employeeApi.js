// src/components/redux/employeeApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const employeeApi = createApi({
  reducerPath: 'employeeApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:8000/api/' }),
  tagTypes: ['Employee', 'Attendance'],
  endpoints: (builder) => ({
    getEmployees: builder.query({
      query: ({ page = 1, page_size = 10, search, ordering, position, status }) => {
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('page_size', page_size);
        if (search) params.append('search', search);
        if (ordering) params.append('ordering', ordering);
        if (position) params.append('position', position);
        if (status) params.append('status', status);
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

    loginEmployee: builder.mutation({
      query: (credentials) => ({
        url: 'employees/login/',
        method: 'POST',
        body: credentials,
      }),
    }),

    getEmployeeAttendance: builder.query({
      query: (employeeId) => `employees/${employeeId}/attendance/`,
      providesTags: (result, error, employeeId) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Attendance', id })),
              { type: 'Attendance', id: 'LIST' },
            ]
          : [{ type: 'Attendance', id: 'LIST' }],
    }),

    // New mutation for marking attendance
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
  useMarkAttendanceMutation,  // <--- newly added export
} = employeeApi;
