// src/services/loanApi.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const loanApi = createApi({
  reducerPath: "loanApi",
  baseQuery: fetchBaseQuery({ baseUrl: "https://backend-l3f9.onrender.com/api/" }),
  tagTypes: ["Loan"], // For caching and invalidation
  endpoints: (builder) => ({
    getLoans: builder.query({
      query: ({ page = 1, pageSize, milestone, search,ordering }) => {
        let url = `loan/?page=${page}&page_size=${pageSize}`;
        if (milestone) url += `&milestone=${milestone}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        if (ordering) url += `&ordering=${ordering}`; // <-- new line
        return url;
      },
      providesTags: ["Loan"],
    }),
    createLoan: builder.mutation({
      query: (data) => ({
        url: "loan/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Loan"],
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
    listLoanTasks: builder.query({
      query: (loanId) => `loan/${loanId}/tasks/`,
        providesTags: (res, err, loanId) => {
    const items = Array.isArray(res) ? res : res?.results || [];
    return [
      ...items.map(({ id }) => ({ type: 'Task', id })),
      { type: 'Task', id: `LOAN-${loanId}` },
    ];
  },
    }),

    createTask: builder.mutation({
      query: ({ loan, ...body }) => ({
        url: `loan/${loan}/tasks/`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (res, err, { loan }) => [
        { type: 'Task', id: `LOAN-${loan}` },
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
    
  
  }),
});

export const {
  useGetLoansQuery,
  useGetLoanQuery,
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
} = loanApi;
