import { createApi } from '@reduxjs/toolkit/query/react';
import  baseQueryWithReauth  from './baseApi';

export const milestoneApi = createApi({
  reducerPath: 'milestoneApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Milestone'],
  endpoints: (builder) => ({
    getMilestones: builder.query({
      query: ({ page = 1, pageSize = 50, search = '' } = {}) => {
        let url = `milestones/?page=${page}&page_size=${pageSize}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        return url;
      },
      providesTags: (result) =>
        result
          ? [
              { type: 'Milestone', id: 'LIST' },
              ...result.results.map((milestone) => ({ type: 'Milestone', id: milestone.id })),
            ]
          : [{ type: 'Milestone', id: 'LIST' }],
    }),

    getMilestone: builder.query({
      query: (id) => `milestones/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Milestone', id }],
    }),

    createMilestone: builder.mutation({
      query: (milestone) => ({
        url: 'milestones/',
        method: 'POST',
        body: milestone,
      }),
      invalidatesTags: [{ type: 'Milestone', id: 'LIST' }],
    }),

    updateMilestone: builder.mutation({
      query: ({ id, ...milestone }) => ({
        url: `milestones/${id}/`,
        method: 'PUT',
        body: milestone,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Milestone', id },
        { type: 'Milestone', id: 'LIST' },
      ],
    }),

    deleteMilestone: builder.mutation({
      query: (id) => ({
        url: `milestones/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Milestone', id: 'LIST' }],
    }),

    bulkDeleteMilestones: builder.mutation({
      query: (ids) => ({
        url: 'milestones/bulk_delete/',
        method: 'DELETE',
        body: { ids },
      }),
      invalidatesTags: [{ type: 'Milestone', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetMilestonesQuery,
  useGetMilestoneQuery,
  useCreateMilestoneMutation,
  useUpdateMilestoneMutation,
  useDeleteMilestoneMutation,
  useBulkDeleteMilestonesMutation,
} = milestoneApi;