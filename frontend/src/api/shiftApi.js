import { createApi } from '@reduxjs/toolkit/query/react';
import baseQueryWithReauth from "./baseApi";


export const shiftApi = createApi({
  reducerPath: 'shiftApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Shift'],
  endpoints: (builder) => ({
    getShifts: builder.query({
      query: ({ page = 1, page_size = 10, search = '', ordering = '-created_at' }) =>
        `shifts/?page=${page}&page_size=${page_size}&search=${encodeURIComponent(search)}&ordering=${encodeURIComponent(ordering)}`,
      providesTags: (result) =>
        result?.results
          ? [...result.results.map(({ id }) => ({ type: 'Shift', id })), { type: 'Shift', id: 'LIST' }]
          : [{ type: 'Shift', id: 'LIST' }],
    }),
    addShift: builder.mutation({
      query: (data) => ({ url: 'shifts/', method: 'POST', body: data }),
      invalidatesTags: [{ type: 'Shift', id: 'LIST' }],
    }),
    updateShift: builder.mutation({
      query: ({ id, ...updatedShift }) => ({ url: `shifts/${id}/`, method: 'PUT', body: updatedShift }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Shift', id }, { type: 'Shift', id: 'LIST' }],
    }),
    deleteShift: builder.mutation({
      query: (id) => ({ url: `shifts/${id}/`, method: 'DELETE' }),
      invalidatesTags: (result, error, id) => [{ type: 'Shift', id }, { type: 'Shift', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetShiftsQuery,
  useAddShiftMutation,
  useUpdateShiftMutation,
  useDeleteShiftMutation,
} = shiftApi;
