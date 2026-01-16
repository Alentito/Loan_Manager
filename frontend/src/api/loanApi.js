// src/services/loanApi.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseApi";

export const loanApi = createApi({
  reducerPath: "loanApi",
  baseQuery: baseQueryWithReauth, // Use the base query with re-authentication
  tagTypes: ["Loan","IncomeAssetNote",], // For caching and invalidation
  endpoints: (builder) => ({
    getLoans: builder.query({
      query: ({
  page = 1,
  pageSize,
  milestone,
  broker,
  loan_officer,
  team_leader,
  processor,
  start_date,
  end_date,
  search,
  ordering,
  assigned_to,
  include_archived,
  is_archived,
}) => {

        let url = `loan/?page=${page}&page_size=${pageSize}`;
        if (milestone !== undefined && milestone !== null && milestone !== "") {
          url += `&milestone=${milestone}`;} 
        if (search) url += `&search=${encodeURIComponent(search)}`;
        if (ordering) url += `&ordering=${ordering}`; // <-- new line
        if (assigned_to) url += `&assigned_to=${encodeURIComponent(assigned_to)}`; // pass "me" or id
        if (include_archived !== undefined)
          url += `&include_archived=${include_archived ? "true" : "false"}`;
        if (is_archived !== undefined)
          url += `&is_archived=${is_archived ? "true" : "false"}`;
        if (broker) url += `&broker=${broker}`;
        if (loan_officer) url += `&loan_officer=${loan_officer}`;
        if (team_leader) url += `&team_leader=${team_leader}`;
        if (processor) url += `&processor=${processor}`;
        if (start_date) url += `&start_date=${start_date}`;
        if (end_date) url += `&end_date=${end_date}`;
        return url;
      },
      providesTags: (result) =>
        result
          ? [
              { type: "Loan", id: "LIST" },
              ...((result.results || result).map ? result.results.map((r) => ({ type: "Loan", id: r.id })) : (result || []).map((r) => ({ type: "Loan", id: r.id }))),
            ]
          : [{ type: "Loan", id: "LIST" }],
    }),
    createLoan: builder.mutation({
      query: (data) => ({
        url: "loan/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Loan"],
    }),
    archiveLoan: builder.mutation({
      query: (id) => ({
        url: `loan/${id}/archive/`,
        method: "POST",
      }),
      invalidatesTags: (_res, _err, id) => [
        { type: "Loan", id },
        { type: "Loan", id: "LIST" },
      ],
    }),
   unarchiveLoan: builder.mutation({
      query: (id) => ({
        url: `loan/${id}/unarchive/?include_archived=true`,
        method: "POST",
      }),
      invalidatesTags: (_res,_err,id) => [
        { type: "Loan", id },
        { type: "Loan", id: "LIST" },
      ],
    }),
    updateLoan: builder.mutation({
      query: ({ id, data }) => ({
        url: `loan/${id}/`,
        method: "PATCH", // <-- PATCH instead of PUT
        body: data,
      }),
      invalidatesTags: ["Loan"],
    }),
    deleteLoan: builder.mutation({
      query: (id) => ({
        url: `loan/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["Loan"],
    }),
    getLoan: builder.query({
      query: (id) => `loan/${id}/`,
      providesTags: (result, error, id) => [{ type: "Loan", id }],
    }),
    getChecklistQuestions: builder.query({
      query: () => "checklist-questions/",
    }),
    updateLoanChecklist: builder.mutation({
      query: ({ id, answers }) => ({
        url: `loan/${id}/checklist/`,
        method: "PATCH",
        body: { answers },
      }),
      invalidatesTags: ["Loan"],
    }),
    getLoanChecklistAnswers: builder.query({
      query: (id) => `loan/${id}/checklist-answers/`,
    }),
    // ...inside endpoints: (builder) => ({
    getContacts: builder.query({
      query: (loanId) => `contacts/?loan=${loanId}`,
      providesTags: ["Contact"],
    }),
    createContact: builder.mutation({
      query: (data) => ({
        url: "contacts/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Contact"],
    }),
    updateContact: builder.mutation({
      query: ({ id, data }) => ({
        url: `contacts/${id}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Contact"],
    }),
    deleteContact: builder.mutation({
      query: (id) => ({
        url: `contacts/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["Contact"],
    }),
    // ...inside endpoints: (builder) => ({
getDocumentOrders: builder.query({
  query: (loanId) => `document-orders/?loan=${loanId}`,
  providesTags: ["DocumentOrder"],
}),
createDocumentOrder: builder.mutation({
  query: (data) => ({
    url: "document-orders/",
    method: "POST",
    body: data,
  }),
  invalidatesTags: ["DocumentOrder"],
}),
updateDocumentOrder: builder.mutation({
  query: ({ id, ...patch }) => ({
    url: `document-orders/${id}/`,
    method: "PATCH",
    body: patch,
  }),
  invalidatesTags: ["DocumentOrder"],
}),
deleteDocumentOrder: builder.mutation({
  query: (id) => ({
    url: `document-orders/${id}/`,
    method: "DELETE",
  }),
  invalidatesTags: ["DocumentOrder"],
}),

// ...other endpoints...
getLoanDocStatus: builder.query({
      query: (loanId) => `loan-doc-status/${loanId}/`,
      providesTags: (result, error, loanId) => [{ type: "LoanDocStatus", id: loanId }],
    }),
    createLoanDocStatus: builder.mutation({
      query: (data) => ({
        url: `loan-doc-status/`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["LoanDocStatus"],
    }),
    updateLoanDocStatus: builder.mutation({
      query: ({ loanId, data }) => ({
        url: `loan-doc-status/${loanId}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { loanId }) => [{ type: "LoanDocStatus", id: loanId }],
    }),
    // ...other endpoints...
     bulkDeleteLoans: builder.mutation({
      query: (ids) => ({
        url: 'loan/bulk-delete/',
        method: 'DELETE',
        body: { ids },
      }),
      // Optionally, invalidate loan list cache
       invalidatesTags: ['Loan'], // <-- This will refetch the loan list
    }),
    //task
    listAllTasks: builder.query({
  query: () => `tasks/`,  // global route
  providesTags: (res) => {
    const items = Array.isArray(res) ? res : res?.results || [];
    return [
      ...items.map(({ id }) => ({ type: 'Task', id })),
      { type: 'Task', id: 'ALL' },
    ];
  },
}),
    listLoanTasks: builder.query({
      query: (loanId) => `tasks/?loan=${loanId}`,
      providesTags: (res) =>
        res
          ? [
              ...res.map((t) => ({ type: "Task", id: t.id })),
              { type: "Task", id: "LIST" },
            ]
          : [{ type: "Task", id: "LIST" }],
    }),

    createTask: builder.mutation({
      query: ({ loan, ...body }) => ({
        url: loan ? `loan/${loan}/tasks/` : `tasks/`, // <-- use global endpoint if no loan
        method: 'POST',
        body,
      }),
      invalidatesTags: (res, err, { loan }) => [
        { type: 'Task', id:  loan ? `LOAN-${loan}` : 'ALL' },
      ],
    }),

    updateTask: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `tasks/${id}/`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (res, err, { id }) => [{ type: 'Task', id }],
    }),

    deleteTask: builder.mutation({
      query: (id) => ({ url: `tasks/${id}/`, method: 'DELETE' }),
      invalidatesTags: (res, err, id) => [{ type: 'Task', id }],
    }),
    //xml upload
    uploadXml: builder.mutation({
      query: (formData) => ({
        url: 'xml-upload/', // your backend endpoint
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Loans'],
    }),
    getIncomeAssetNote: builder.query({
  query: (loanId) => ({ url: `loan/${loanId}/income-asset-note/` }),
  providesTags: (_r, _e, loanId) => [{ type: "IncomeAssetNote", id: loanId }],
  transformResponse: (resp) => ({
    ...resp,
    serialized: resp?.editor_state ? JSON.stringify(resp.editor_state) : null,
  }),
}),

    upsertIncomeAssetNote: builder.mutation({
  query: ({ loanId, editor_state, plain_text }) => ({
    url: `loan/${loanId}/income-asset-note/`,
    method: "PUT",
    body: { editor_state, plain_text },
  }),
  // Do NOT invalidate to avoid refetch that would change data.updated_at
  invalidatesTags: [],
  async onQueryStarted({ loanId, editor_state, plain_text }, { dispatch, queryFulfilled }) {
    // Optimistically update cache so UI timestamps match without refetch
    const patch = dispatch(
      loanApi.util.updateQueryData("getIncomeAssetNote", loanId, (draft) => {
        if (!draft) return;
        draft.editor_state = editor_state;
        draft.plain_text = plain_text;
        draft.serialized = JSON.stringify(editor_state);
        draft.updated_at = new Date().toISOString();
      })
    );
    try {
      await queryFulfilled;
    } catch {
      patch.undo();
    }
  },
}),
    
  
  }),
});

export const {
  useGetLoansQuery,
  useGetLoanQuery,
  useLazyGetLoansQuery,
  useCreateLoanMutation,
  useUpdateLoanMutation,
  useDeleteLoanMutation,
  useGetChecklistQuestionsQuery,
  useUpdateLoanChecklistMutation,
  useGetLoanChecklistAnswersQuery,
  useGetContactsQuery,
  useCreateContactMutation,
  useUpdateContactMutation,
  useDeleteContactMutation,
  useGetDocumentOrdersQuery,
  useCreateDocumentOrderMutation,
  useUpdateDocumentOrderMutation,
  useDeleteDocumentOrderMutation,
  useGetLoanDocStatusQuery,
  useCreateLoanDocStatusMutation,
  useUpdateLoanDocStatusMutation,
  useBulkDeleteLoansMutation,
  useListLoanTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useUploadXmlMutation,
  useListAllTasksQuery,
  useArchiveLoanMutation,
  useUnarchiveLoanMutation,
  useGetIncomeAssetNoteQuery,        
  useUpsertIncomeAssetNoteMutation,
} = loanApi;
