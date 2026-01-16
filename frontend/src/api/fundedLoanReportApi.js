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
    broker,
    loan_officer,
    team_leader,
    processor,
    start_date,
    end_date,
  }) => {
    const params = new URLSearchParams();

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
      transformResponse: (response) => {
  console.log("📦 backend response:", response);

  return {
    milestones: Array.isArray(response?.results) ? response.results : [],
    total_loans: Number(response?.total_loans || 0),
  };
},


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

exportLoanReport: builder.mutation({
  async queryFn(
    { type, id, start_date, end_date },
    _api,
    _extra,
    baseQuery
  ) {
    const params = new URLSearchParams();

    params.append("type", type);
    if (id) params.append("id", id);
    if (start_date) params.append("start_date", start_date);
    if (end_date) params.append("end_date", end_date);

    const result = await baseQuery({
      url: `report/loan-export/?${params.toString()}`,
      method: "GET",
      responseHandler: (response) => response.blob(),
    });

    if (result.error) {
      return { error: result.error };
    }

    const blob = result.data;

    const fileNames = {
      all: "invoice_all_loan_reports.xlsx",
      broker: "invoice_broker_wise.xlsx",
      team_leader: "invoice_team_lead.xlsx",
      processor: "invoice_processor_monthly.xlsx",
    };
    const suffix =
  start_date || end_date
    ? `_${start_date || "from"}_${end_date || "to"}`
    : "";

const finalFileName = fileNames[type].replace(
  ".xlsx",
  `${suffix}.xlsx`
);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = finalFileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

    return { data: null }; // ✅ nothing stored
  },
}),



  }),
});

export const {
  useGetFundedLoanReportQuery,
  useGetBrokerLinkedEmployeesQuery,
  useGetTeamLeadProcessorsQuery,
  useExportLoanReportMutation,
} = fundedLoanReportApi;
