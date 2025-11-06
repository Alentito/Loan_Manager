// src/components/redux/brokerApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import baseQueryWithReauth from "./baseApi";

export const brokerApi = createApi({
  reducerPath: 'brokerApi',
  baseQuery: baseQueryWithReauth, // Use the base query with re-authentication
  tagTypes: ['Broker'],
  endpoints: (build) => ({
    getBrokers: build.query({
      query: ({ page = 1, page_size = 10, search = '', ordering = '', archived = false }) =>
        `brokers/?page=${page}&page_size=${page_size}&search=${search}&ordering=${ordering}&archived=${archived}`,
      providesTags: (result) =>
    result
      ? [
          ...result.results.map(({ id }) => ({ type: 'Broker', id })), 
          { type: 'Broker', id: 'LIST' }
        ]
      : [{ type: 'Broker', id: 'LIST' }],
    }),
    
    getBrokerById: build.query({
      query: (id) => `brokers/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Broker', id }],
    }),
    addBroker: build.mutation({
      query: (formData) => ({
        url: 'brokers/',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Broker'],
    }),
    updateBroker: build.mutation({
      query: ({ id, formData }) => ({
        url: `brokers/${id}/`,
        method: 'PUT',
        body: formData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Broker', id }],
    }),
    archiveBroker: build.mutation({
      query: (id) => ({
        url: `/brokers/${id}/archive/`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'Broker', id: 'LIST' }],
    }),
    unarchiveBroker: build.mutation({
      query: (id) => ({
        url: `/brokers/${id}/unarchive/`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'Broker', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetBrokersQuery,
  useGetBrokerByIdQuery,
  useAddBrokerMutation,
  useUpdateBrokerMutation,
  useArchiveBrokerMutation,
  useUnarchiveBrokerMutation
} = brokerApi;
