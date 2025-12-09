import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseApi";

export const teamManagerApi = createApi({
  reducerPath: "teamManagerApi",
  baseQuery: baseQueryWithReauth, // ✅ handles token + refresh automatically
  tagTypes: ["TeamManager"],

  endpoints: (builder) => ({
    // 📌 Fetch Team Managers with pagination, search, ordering
    getTeamManagers: builder.query({
      query: ({ page = 1, pageSize = 10, search, ordering } = {}) => {
        const params = new URLSearchParams({
          page,
          page_size: pageSize,
        });
        if (search) params.set("search", search);
        if (ordering) params.set("ordering", ordering);

        return `team-managers/?${params.toString()}`;
      },
      providesTags: (result) =>
        result?.results
          ? [
              ...result.results.map(({ id }) => ({ type: "TeamManager", id })),
              { type: "TeamManager", id: "LIST" },
            ]
          : [{ type: "TeamManager", id: "LIST" }],
    }),

    // 📌 Fetch Team Manager by ID
    getTeamManagerById: builder.query({
      query: (id) => `team-managers/${id}/`,
      providesTags: (_, __, id) => [{ type: "TeamManager", id }],
    }),

    // 📌 Add Team Manager
    addTeamManager: builder.mutation({
      query: (data) => ({
        url: "team-managers/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "TeamManager", id: "LIST" }],
    }),

    // 📌 Update Team Manager
    updateTeamManager: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `team-managers/${id}/`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: "TeamManager", id },
        { type: "TeamManager", id: "LIST" },
      ],
    }),

    // 📌 Delete Team Manager
    deleteTeamManager: builder.mutation({
      query: (id) => ({
        url: `team-managers/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (_, __, id) => [
        { type: "TeamManager", id },
        { type: "TeamManager", id: "LIST" },
      ],
    }),

    // 📌 Archive Team Manager
    archiveTeamManager: builder.mutation({
      query: (id) => ({
        url: `team-managers/${id}/archive/`,
        method: "POST",
      }),
      invalidatesTags: (_, __, id) => [
        { type: "TeamManager", id },
        { type: "TeamManager", id: "LIST" },
      ],
    }),

    // 📌 Unarchive Team Manager
    unarchiveTeamManager: builder.mutation({
      query: (id) => ({
        url: `team-managers/${id}/unarchive/`,
        method: "POST",
      }),
      invalidatesTags: (_, __, id) => [
        { type: "TeamManager", id },
        { type: "TeamManager", id: "LIST" },
      ],
    }),
  }),
});

// ✅ Auto-generated hooks
export const {
  useGetTeamManagersQuery,
  useGetTeamManagerByIdQuery,
  useAddTeamManagerMutation,
  useUpdateTeamManagerMutation,
  useDeleteTeamManagerMutation,
  useArchiveTeamManagerMutation,
  useUnarchiveTeamManagerMutation,
} = teamManagerApi;
