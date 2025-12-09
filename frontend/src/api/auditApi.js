import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import baseQueryWithReauth from "./baseApi";

export const auditApi = createApi({
  reducerPath: 'auditApi',
  baseQuery: baseQueryWithReauth, // Use the base query with re-authentication
  tagTypes: ['Audit'], // For caching and invalidation
  endpoints: (builder) => ({
    /** GET /loans/:loanId/audit/  →  array of AuditEvent objects */
    getLoanAudit: builder.query({
    query: (loanId) => `loan/${loanId}/audit/`,
  }),

  // new global audit query
  getAllAuditLogs: builder.query({
     query: (params = {}) => {
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== "")
    );
    const searchParams = new URLSearchParams(filteredParams).toString();
    return `audit/?${searchParams}`;
  },
  }),
  }),
});

export const { useGetLoanAuditQuery,useGetAllAuditLogsQuery } = auditApi;
