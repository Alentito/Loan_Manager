import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const auditApi = createApi({
  reducerPath: 'auditApi',
  baseQuery: fetchBaseQuery({ baseUrl: "https://backend-l3f9.onrender.com/api/" }),
  endpoints: (builder) => ({
    /** GET /loans/:loanId/audit/  →  array of AuditEvent objects */
    getLoanAudit: builder.query({
    query: (loanId) => `loan/${loanId}/audit/`,
  }),

  // new global audit query
  getAllAuditLogs: builder.query({
    query: () => `audit/`,
  }),
  }),
});

export const { useGetLoanAuditQuery,useGetAllAuditLogsQuery } = auditApi;
