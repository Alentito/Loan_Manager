// src/components/redux/designationApi.js
import { createApi } from '@reduxjs/toolkit/query/react';
import { customBaseQuery } from './authBaseQuery';

export const designationApi = createApi({
  reducerPath: 'designationApi',
  baseQuery: customBaseQuery,
  tagTypes: ['Designation', 'Group'],
  endpoints: (builder) => ({
    getDesignations: builder.query({
      query: ({ page = 1, page_size = 10, search, ordering, group }) => {
        const params = new URLSearchParams({ page, page_size });
        if (search) params.append('search', search);
        if (ordering) params.append('ordering', ordering);
        if (group) params.append('group', group);
        return `designations/?${params.toString()}`;
      },
      providesTags: (result) =>
        result?.results
          ? [
              ...result.results.map(({ id }) => ({ type: 'Designation', id })),
              { type: 'Designation', id: 'LIST' },
            ]
          : [{ type: 'Designation', id: 'LIST' }],
    }),

    getDesignationById: builder.query({
      query: (id) => `designations/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Designation', id }],
    }),

    addDesignation: builder.mutation({
      query: (data) => ({
        url: 'designations/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Designation', id: 'LIST' }],
    }),

    updateDesignation: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `designations/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Designation', id },
        { type: 'Designation', id: 'LIST' },
      ],
    }),

    deleteDesignation: builder.mutation({
      query: (id) => ({
        url: `designations/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Designation', id },
        { type: 'Designation', id: 'LIST' },
      ],
    }),

    // Groups API
    getGroups: builder.query({
      query: () => 'groups/',
      providesTags: (result) =>
        result ? [...result.map(({ id }) => ({ type: 'Group', id })), { type: 'Group', id: 'LIST' }] : [{ type: 'Group', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetDesignationsQuery,
  useGetDesignationByIdQuery,
  useAddDesignationMutation,
  useUpdateDesignationMutation,
  useDeleteDesignationMutation,
  useGetGroupsQuery,
} = designationApi;
