// src/components/redux/holidayApi.js
import { createApi } from '@reduxjs/toolkit/query/react';
import { customBaseQuery } from './authBaseQuery';

export const holidayApi = createApi({
  reducerPath: 'holidayApi',
  baseQuery: customBaseQuery,
  tagTypes: ['Holiday'],
  endpoints: (builder) => ({
    getHolidays: builder.query({
      query: ({ page = 1, pageSize = 10, search = '', date = '' }) => {
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('page_size', pageSize);
        if (search) params.append('search', search);
        if (date) params.append('date', date);
        return `public-holidays/?${params.toString()}`;
      },
      transformResponse: (response) => {
        if (Array.isArray(response)) {
          return { holidays: response };
        }
        return {
          holidays: response.results,
          count: response.count,
          next: response.next,
          previous: response.previous,
        };
      },
      providesTags: (result) =>
        result?.holidays
          ? [
              ...result.holidays.map(({ id }) => ({ type: 'Holiday', id })),
              { type: 'Holiday', id: 'LIST' },
            ]
          : [{ type: 'Holiday', id: 'LIST' }],
    }),

    addHoliday: builder.mutation({
      query: (holiday) => ({
        url: 'public-holidays/',
        method: 'POST',
        body: holiday,
      }),
      invalidatesTags: [{ type: 'Holiday', id: 'LIST' }],
    }),

    updateHoliday: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `public-holidays/${id}/`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Holiday', id }],
    }),

    deleteHoliday: builder.mutation({
      query: (id) => ({
        url: `public-holidays/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Holiday', id },
        { type: 'Holiday', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetHolidaysQuery,
  useAddHolidayMutation,
  useUpdateHolidayMutation,
  useDeleteHolidayMutation,
} = holidayApi;
