// src/api/teamApi.js
import { createApi } from '@reduxjs/toolkit/query/react';
import baseQueryWithReauth from "./baseApi";
import { employeeApi } from "./employeeApi"; // 👈 import employeeApi for cross-invalidation

export const teamApi = createApi({
  reducerPath: 'teamApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Team', 'Employee', 'Group'], // tag tracking for cache invalidation

  endpoints: (builder) => ({

    // 🔹 Fetch all teams
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

    // 🔹 Get single team
    getTeamById: builder.query({
      query: (id) => `teams/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Team', id }],
    }),

    // 🔹 Add team
    addTeam: builder.mutation({
      query: (team) => ({
        url: 'teams/',
        method: 'POST',
        body: team,
      }),
      invalidatesTags: [{ type: 'Team', id: 'LIST' }],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          // 🔁 refresh employees so UI reflects new team relations
          dispatch(employeeApi.util.invalidateTags([{ type: 'Employee', id: 'LIST' }]));
        } catch {
          /* ignore */
        }
      },
    }),

    // 🔹 Update team
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
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          // ✅ force refetch of employees to get updated team details
          dispatch(employeeApi.util.invalidateTags([{ type: 'Employee', id: 'LIST' }]));
        } catch {
          /* ignore */
        }
      },
    }),

    // 🔹 Delete team
    deleteTeam: builder.mutation({
      query: (id) => ({
        url: `teams/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Team', id },
        { type: 'Team', id: 'LIST' },
      ],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          // ✅ ensure employee list updates when a team is deleted
          dispatch(employeeApi.util.invalidateTags([{ type: 'Employee', id: 'LIST' }]));
        } catch {
          /* ignore */
        }
      },
    }),

    // 🔹 Get all roles (Groups)
    getRoles: builder.query({
      query: () => `groups/`,
      providesTags: ['Group'],
    }),

    // 🔹 Get employees filtered by role
    getEmployeesByRole: builder.query({
      query: (role) => `employees/?role=${encodeURIComponent(role)}`,
      providesTags: ['Employee'],
    }),
    // 🔹 Get all managers
getManagers: builder.query({
  query: () => `employees/Managers/`,
  providesTags: ['Employee'],
}),

// 🔹 Get all leads
getLeads: builder.query({
  query: () => `employees/Leads/`,
  providesTags: ['Employee'],
}),

  }),
});

export const {
  useGetTeamsQuery,
  useGetTeamByIdQuery,
  useAddTeamMutation,
  useUpdateTeamMutation,
  useDeleteTeamMutation,
  useGetRolesQuery,
  useGetEmployeesByRoleQuery,
  useGetManagersQuery,   // ✅ new
  useGetLeadsQuery,
} = teamApi;
