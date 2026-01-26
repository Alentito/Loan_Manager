import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseApi";

export const payrollApi = createApi({
  reducerPath: "payrollApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Payrolls", "IncentiveRules", "PayrollSettings"],
  endpoints: (builder) => ({
    // Payrolls
    getPayrolls: builder.query({
      query: (params = {}) => {
        const usp = new URLSearchParams(params);
        return { url: `/payroll/payrolls/?${usp.toString()}` };
      },
      providesTags: (res) =>
        res?.results
          ? [{ type: "Payrolls", id: "LIST" }, ...res.results.map((r) => ({ type: "Payrolls", id: r.id }))]
          : [{ type: "Payrolls", id: "LIST" }],
    }),
    getMyPayrolls: builder.query({
      query: (params = {}) => {
        const usp = new URLSearchParams(params);
        return { url: `/payroll/payrolls/mine/?${usp.toString()}` };
      },
      providesTags: [{ type: "Payrolls", id: "MINE" }],
    }),
    getPayroll: builder.query({
      query: (id) => ({ url: `/payroll/payrolls/${id}/` }),
      providesTags: (_res, _err, id) => [{ type: "Payrolls", id }],
    }),
    createPayroll: builder.mutation({
      query: (data) => ({
        url: `/payroll/payrolls/`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Payrolls", id: "LIST" }],
    }),
    updatePayroll: builder.mutation({
      query: ({ id, data }) => ({
        url: `/payroll/payrolls/${id}/`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_res, _err, arg) => [{ type: "Payrolls", id: arg.id }, { type: "Payrolls", id: "LIST" }],
    }),
    deletePayroll: builder.mutation({
      query: (id) => ({ url: `/payroll/payrolls/${id}/`, method: "DELETE" }),
      invalidatesTags: [{ type: "Payrolls", id: "LIST" }],
    }),

    // Incentive Rules
    getIncentiveRules: builder.query({
      query: (params = {}) => {
        const usp = new URLSearchParams(params);
        return { url: `/payroll/incentive-rules/?${usp.toString()}` };
      },
      providesTags: (res) =>
        res?.results
          ? [{ type: "IncentiveRules", id: "LIST" }, ...res.results.map((r) => ({ type: "IncentiveRules", id: r.id }))]
          : [{ type: "IncentiveRules", id: "LIST" }],
    }),
    createIncentiveRule: builder.mutation({
      query: (data) => ({ url: `/payroll/incentive-rules/`, method: "POST", body: data }),
      invalidatesTags: [{ type: "IncentiveRules", id: "LIST" }],
    }),
    updateIncentiveRule: builder.mutation({
      query: ({ id, data }) => ({ url: `/payroll/incentive-rules/${id}/`, method: "PUT", body: data }),
      invalidatesTags: (_res, _err, arg) => [{ type: "IncentiveRules", id: arg.id }, { type: "IncentiveRules", id: "LIST" }],
    }),
    deleteIncentiveRule: builder.mutation({
      query: (id) => ({ url: `/payroll/incentive-rules/${id}/`, method: "DELETE" }),
      invalidatesTags: [{ type: "IncentiveRules", id: "LIST" }],
    }),

    // Settings
    getPayrollSettings: builder.query({
      query: () => ({ url: `/payroll/settings/current/` }),
      providesTags: [{ type: "PayrollSettings", id: "CURRENT" }],
    }),
    updatePayrollSettings: builder.mutation({
      query: (data) => ({ url: `/payroll/settings/1/`, method: "PUT", body: data }),
      invalidatesTags: [{ type: "PayrollSettings", id: "CURRENT" }],
    }),
    exportPayrolls: builder.query({
      query: ({ month, format }) => {
        const usp = new URLSearchParams();
        if (month) usp.set("month", month);
        if (format) usp.set("format", format);
        return {
          url: `/payroll/payrolls/export/?${usp.toString()}`,
          method: "GET",
          // Tell fetchBaseQuery to return a Blob instead of trying to JSON-parse
          responseHandler: (response) => response.blob(),
        };
      },
    }),
    downloadPayslip: builder.query({
      query: ({ id }) => ({
        url: `/payroll/payrolls/${id}/payslip/`,
        method: "GET",
        responseHandler: (response) => response.blob(),
      }),
    }),
    generatePayroll: builder.mutation({
    query: (data) => ({
    url: `/payroll/payrolls/generate/`,
    method: "POST",
    body: data,
  }),
  invalidatesTags: [{ type: "Payrolls", id: "LIST" }],
}),
  }),
});

export const {
  useGetPayrollsQuery,
  useLazyGetPayrollsQuery,
  useGetMyPayrollsQuery,
  useGetPayrollQuery,
  useCreatePayrollMutation,
  useUpdatePayrollMutation,
  useDeletePayrollMutation,
  useGetIncentiveRulesQuery,
  useCreateIncentiveRuleMutation,
  useUpdateIncentiveRuleMutation,
  useDeleteIncentiveRuleMutation,
  useGetPayrollSettingsQuery,
  useUpdatePayrollSettingsMutation,
  useGeneratePayrollMutation,
  useExportPayrollsQuery,
  useLazyExportPayrollsQuery,
  useDownloadPayslipQuery,
  useLazyDownloadPayslipQuery,
} = payrollApi;
