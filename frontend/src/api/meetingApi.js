// src/api/meetingApi.js
import { createApi } from '@reduxjs/toolkit/query/react';
import baseQueryWithReauth from './baseApi';

export const meetingApi = createApi({
  reducerPath: 'meetingApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Meeting'],
  endpoints: (builder) => ({
    getMeetings: builder.query({
      query: () => 'meetings/',
      transformResponse: (response) => response.results || response,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Meeting', id })),
              { type: 'Meeting', id: 'LIST' },
            ]
          : [{ type: 'Meeting', id: 'LIST' }],
    }),

    addMeeting: builder.mutation({
      query: ({ title, description, date, time, employees }) => ({
        url: 'meetings/',
        method: 'POST',
        body: { title, description, date, time, employees },
      }),
      // Refetch the list after adding
      invalidatesTags: [{ type: 'Meeting', id: 'LIST' }],
    }),

    updateMeeting: builder.mutation({
      query: ({ id, title, description, date, time, employees }) => ({
        url: `meetings/${id}/`,
        method: 'PUT',
        body: { title, description, date, time, employees },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Meeting', id },
        { type: 'Meeting', id: 'LIST' },
      ],
    }),

    deleteMeeting: builder.mutation({
      query: (id) => ({
        url: `meetings/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Meeting', id },
        { type: 'Meeting', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetMeetingsQuery,
  useAddMeetingMutation,
  useUpdateMeetingMutation,
  useDeleteMeetingMutation,
  useLazyGetMeetingsQuery,
} = meetingApi;
