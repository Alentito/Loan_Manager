// src/components/redux/teamApi.js
import { createApi } from '@reduxjs/toolkit/query/react';
import { customBaseQuery } from './authBaseQuery';

export const teamApi = createApi({
  reducerPath: 'teamApi',
  baseQuery: customBaseQuery,
  tagTypes: ['Team'],
  endpoints: (builder) => ({
    getTeams: builder.query({
      query: ({ page = 1, page_size = 10, search = '' }) =>
        `teams/?page=${page}&page_size=${page_size}&search=${search}`,
      providesTags: (result, error, arg) =>
        result?.results
          ? [
              ...result.results.map(({ id }) => ({ type: 'Team', id })),
              { type: 'Team', id: 'LIST' },
            ]
          : [{ type: 'Team', id: 'LIST' }],
    }),


    getTeamById: builder.query({
      query: (id) => `teams/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Team', id }],
    }),

    addTeam: builder.mutation({
      query: (team) => ({
        url: 'teams/',
        method: 'POST',
        body: team,
      }),
      invalidatesTags: [{ type: 'Team', id: 'LIST' }],
    }),

    updateTeam: builder.mutation({
      query: ({ id, ...team }) => ({
        url: `teams/${id}/`,
        method: 'PUT',
        body: team,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Team', id },
        { type: 'Team', id: 'LIST' },
      ],
    }),

    deleteTeam: builder.mutation({
      query: (id) => ({
        url: `teams/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Team', id },
        { type: 'Team', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetTeamsQuery,
  useGetTeamByIdQuery,
  useAddTeamMutation,
  useUpdateTeamMutation,
  useDeleteTeamMutation,
} = teamApi;
