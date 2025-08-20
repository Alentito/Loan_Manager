// src/components/redux/meetingApi.js
import { createApi } from '@reduxjs/toolkit/query/react';
import { customBaseQuery } from './authBaseQuery';

export const meetingApi = createApi({
  reducerPath: 'meetingApi',
  baseQuery: customBaseQuery,
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
      query: (meeting) => ({
        url: 'meetings/',
        method: 'POST',
        body: meeting,
      }),
      invalidatesTags: [{ type: 'Meeting', id: 'LIST' }],
    }),

    updateMeeting: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `meetings/${id}/`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Meeting', id }],
    }),

    deleteMeeting: builder.mutation({
      query: (id) => ({
        url: `meetings/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Meeting', id }],
    }),
  }),
});

export const {
  useGetMeetingsQuery,
  useAddMeetingMutation,
  useUpdateMeetingMutation,
  useDeleteMeetingMutation,
} = meetingApi;
