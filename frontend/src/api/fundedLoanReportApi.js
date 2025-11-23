import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseApi";

export const fundedLoanReportApi = createApi({
  reducerPath: "fundedLoanReportApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["FundedLoanReport"],

  endpoints: (builder) => ({
    // 🔹 Fetch Funded Loan Report
    getFundedLoanReport: builder.query({
  query: ({
    page = 1,
    pageSize = 10,
    broker,
    loan_officer,
    team_leader,
    processor,
    start_date,
    end_date,
  }) => {
    const params = new URLSearchParams();
    params.append("page", page);
    params.append("page_size", pageSize);

    if (broker) params.append("broker", broker);
    if (loan_officer) params.append("loan_officer", loan_officer);
    if (team_leader) params.append("team_leader", team_leader);
    if (processor) params.append("processor", processor);

    // ✅ no ISO conversion, dates are already yyyy-MM-dd
    if (start_date) params.append("start_date", start_date);
    if (end_date) params.append("end_date", end_date);

    return `report/funded-loans/?${params.toString()}`;
  },


      // ✅ Transform backend response
      transformResponse: (response) => ({
        milestones: response?.results || [],
        default_milestone: response?.default_milestone || "Funded",
        total_loans: response?.total_loans || 0,
        message: response?.message || "",
      }),

      providesTags: (result) =>
  result?.milestones?.length
    ? [
        { type: "FundedLoanReport", id: "LIST" },
        ...result.milestones.map((_, i) => ({
          type: "FundedLoanReport",
          id: i,
        })),
      ]
    : [{ type: "FundedLoanReport", id: "LIST" }],

    }),

    // 🔹 Get linked employees by Broker
    getBrokerLinkedEmployees: builder.query({
      query: (brokerId) => `report/broker-linked-employees/?broker=${brokerId}`,
      providesTags: ["FundedLoanReport"],
    }),

    // 🔹 Get processors by Team Leader
    getTeamLeadProcessors: builder.query({
      query: (teamLeadId) => `report/team-lead-processors/?team_leader=${teamLeadId}`,
      providesTags: ["FundedLoanReport"],
    }),
  }),
});

export const {
  useGetFundedLoanReportQuery,
  useGetBrokerLinkedEmployeesQuery,
  useGetTeamLeadProcessorsQuery,
} = fundedLoanReportApi;
