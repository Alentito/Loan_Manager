import { createApi } from '@reduxjs/toolkit/query/react';
import { customBaseQuery } from './authBaseQuery';

export const shiftApi = createApi({
  reducerPath: 'shiftApi',
  baseQuery: customBaseQuery,
  tagTypes: ['Shift'],
  endpoints: (builder) => ({
    getShifts: builder.query({
      query: ({ page = 1, page_size = 10, search = '' }) =>
        `shifts/?page=${page}&page_size=${page_size}&search=${search}`,
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
