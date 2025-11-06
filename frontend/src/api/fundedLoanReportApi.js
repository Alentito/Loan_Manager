import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseApi";

export const fundedLoanReportApi = createApi({
  reducerPath: "fundedLoanReportApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["FundedLoanReport"],

  endpoints: (builder) => ({
    getFundedLoanReport: builder.query({
      query: ({
        page = 1,
        pageSize = 10,
        milestone = "Funded",
        broker,
        loan_officer,
        team_leader,
        manager,
        processor,
        start_date,
        end_date,
      }) => {
        const params = new URLSearchParams();
        params.append("page", page);
        params.append("page_size", pageSize);
        params.append("milestone", milestone);

        if (broker) params.append("broker", broker);
        if (loan_officer) params.append("loan_officer", loan_officer);
        if (team_leader) params.append("team_leader", team_leader);
        if (manager) params.append("manager", manager);
        if (processor) params.append("processor", processor);

        // ✅ Convert date to ISO format compatible with backend CST filter
        const toISODate = (d) => (d ? new Date(d).toISOString() : null);
        if (start_date) params.append("start_date", toISODate(start_date));
        if (end_date) params.append("end_date", toISODate(end_date));

        return `report/funded-loans/?${params.toString()}`;
      },

      // ✅ Transform the backend response to a simpler structure for the UI
      transformResponse: (response) => {
        // Handle nested results structure
        const nested = response?.results;
        if (nested && nested.results) {
          return {
            count: response.count,
            next: response.next,
            previous: response.previous,
            results: nested.results,
            total_funded_loans: nested.total_funded_loans,
            milestone: nested.milestone,
          };
        }
        // If already flat
        return response;
      },

      providesTags: (result) =>
        result
          ? [
              { type: "FundedLoanReport", id: "LIST" },
              ...(result.results || []).map((_, index) => ({
                type: "FundedLoanReport",
                id: index,
              })),
            ]
          : [{ type: "FundedLoanReport", id: "LIST" }],
    }),
    getBrokerLinkedEmployees: builder.query({
  query: (brokerId) => `report/broker-linked-employees/?broker=${brokerId}`,
}),

  }),
});

export const { 
  useGetFundedLoanReportQuery,
  useGetBrokerLinkedEmployeesQuery,

  
 } = fundedLoanReportApi;
