import { createApi } from '@reduxjs/toolkit/query/react';
import baseQuery from './baseApi';

export const incomeAssetNoteApi = createApi({
  reducerPath: 'incomeAssetNoteApi',
  baseQuery,
  tagTypes: ['IncomeAssetNote'],
  endpoints: (builder) => ({
    getIncomeAssetNote: builder.query({
      query: (loanId) => ({ url: `loans/${loanId}/income-asset-note/` }),
      providesTags: (_, __, loanId) => [{ type: 'IncomeAssetNote', id: loanId }],
      transformResponse: (resp) => ({
        ...resp,
        serialized: resp?.editor_state ? JSON.stringify(resp.editor_state) : null,
      }),
    }),
    upsertIncomeAssetNote: builder.mutation({
      query: ({ loanId, editor_state, plain_text }) => ({
        url: `loans/${loanId}/income-asset-note/`,
        method: 'PUT',
        body: { editor_state, plain_text },
      }),
      invalidatesTags: (_, __, arg) => [{ type: 'IncomeAssetNote', id: arg.loanId }],
    }),
  }),
});

export const {
  useGetIncomeAssetNoteQuery,
  useUpsertIncomeAssetNoteMutation,
} = incomeAssetNoteApi;
