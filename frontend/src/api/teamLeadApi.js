import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseApi";

export const teamLeadApi = createApi({
  reducerPath: "teamLeadApi",
  baseQuery: baseQueryWithReauth, // ✅ handles token + refresh automatically
  tagTypes: ["TeamLead"],

  endpoints: (builder) => ({
    // 📌 Fetch Team Leads with pagination, search, ordering
    getTeamLeads: builder.query({
      query: ({ page = 1, pageSize = 10, search, ordering } = {}) => {
        const params = new URLSearchParams({
          page,
          page_size: pageSize,
        });
        if (search) params.set("search", search);
        if (ordering) params.set("ordering", ordering);

        return `team-leads/?${params.toString()}`;
      },
      providesTags: (result) =>
        result?.results
          ? [
              ...result.results.map(({ id }) => ({ type: "TeamLead", id })),
              { type: "TeamLead", id: "LIST" },
            ]
          : [{ type: "TeamLead", id: "LIST" }],
    }),

    // 📌 Fetch Team Lead by ID
    getTeamLeadById: builder.query({
      query: (id) => `team-leads/${id}/`,
      providesTags: (_, __, id) => [{ type: "TeamLead", id }],
    }),

    // 📌 Add Team Lead
    addTeamLead: builder.mutation({
      query: (data) => ({
        url: "team-leads/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "TeamLead", id: "LIST" }],
    }),

    // 📌 Update Team Lead
    updateTeamLead: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `team-leads/${id}/`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: "TeamLead", id },
        { type: "TeamLead", id: "LIST" },
      ],
    }),

    // 📌 Delete Team Lead
    deleteTeamLead: builder.mutation({
      query: (id) => ({
        url: `team-leads/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: (_, __, id) => [
        { type: "TeamLead", id },
        { type: "TeamLead", id: "LIST" },
      ],
    }),

    // 📌 Archive Team Lead
    archiveTeamLead: builder.mutation({
      query: (id) => ({
        url: `team-leads/${id}/archive/`,
        method: "POST",
      }),
      invalidatesTags: (_, __, id) => [
        { type: "TeamLead", id },
        { type: "TeamLead", id: "LIST" },
      ],
    }),

    // 📌 Unarchive Team Lead
    unarchiveTeamLead: builder.mutation({
      query: (id) => ({
        url: `team-leads/${id}/unarchive/`,
        method: "POST",
      }),
      invalidatesTags: (_, __, id) => [
        { type: "TeamLead", id },
        { type: "TeamLead", id: "LIST" },
      ],
    }),
  }),
});

// ✅ Auto-generated hooks
export const {
  useGetTeamLeadsQuery,
  useGetTeamLeadByIdQuery,
  useAddTeamLeadMutation,
  useUpdateTeamLeadMutation,
  useDeleteTeamLeadMutation,
  useArchiveTeamLeadMutation,
  useUnarchiveTeamLeadMutation,
} = teamLeadApi;
