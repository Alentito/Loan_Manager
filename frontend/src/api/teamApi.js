import { createApi } from '@reduxjs/toolkit/query/react';
import baseQueryWithReauth from "./baseApi";

export const teamApi = createApi({
  reducerPath: 'teamApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Team'],
  endpoints: (builder) => ({
    getTeams: builder.query({
      query: ({ page = 1, page_size = 10, search = '', ordering = '-created_at' }) =>
        `teams/?page=${page}&page_size=${page_size}&search=${search}&ordering=${ordering}`,
      providesTags: (result) =>
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
        body: team, // include { name, head, shift, manager }
      }),
      invalidatesTags: [{ type: 'Team', id: 'LIST' }],
    }),

    updateTeam: builder.mutation({
      query: ({ id, ...team }) => ({
        url: `teams/${id}/`,
        method: 'PUT',
        body: team, // include { name, head, shift, manager }
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
