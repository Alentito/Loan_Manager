// src/components/redux/brokerApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const brokerApi = createApi({
  reducerPath: 'brokerApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:8000/api/' }),
  tagTypes: ['Broker'],
  endpoints: (build) => ({
    getBrokers: build.query({
      query: ({ page = 1, page_size = 10, search = '', ordering = '' }) =>
        `brokers/?page=${page}&page_size=${page_size}&search=${search}&ordering=${ordering}`,
      providesTags: ['Broker'],
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
    deleteBroker: build.mutation({
      query: (id) => ({
        url: `brokers/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Broker'],
    }),
  }),
});

export const {
  useGetBrokersQuery,
  useGetBrokerByIdQuery,
  useAddBrokerMutation,
  useUpdateBrokerMutation,
  useDeleteBrokerMutation,
} = brokerApi;
