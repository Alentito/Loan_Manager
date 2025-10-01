// src/api/leaveApi.js
import { createApi } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseApi";

export const leaveApi = createApi({
  reducerPath: "leaveApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["LeaveRequest"],
  endpoints: (builder) => ({
    // ✅ Employee: get own leave requests (with pagination)
    getEmployeeLeaveRequests: builder.query({
      query: ({ employeeId, page = 1, page_size = 10 }) => {
        if (!employeeId) {
          throw new Error("❌ employeeId (Employee profile ID) is required for fetching leave requests");
        }

        const params = new URLSearchParams();
        params.set("page", page);
        params.set("page_size", page_size);

        return `/leave-requests/employee/${employeeId}/?${params.toString()}`;
      },
      providesTags: (result) =>
        result?.results?.length
          ? [
            ...result.results.map(({ id }) => ({
              type: "LeaveRequest",
              id,
            })),
            { type: "LeaveRequest", id: "LIST" },
          ]
          : [{ type: "LeaveRequest", id: "LIST" }],
    }),

    // ✅ Admin/Manager: get all leave requests (with filters + pagination)
    getAllLeaveRequests: builder.query({
      query: ({ page = 1, page_size = 10, status, employee, search } = {}) => {
        const params = new URLSearchParams();
        params.set("page", page);
        params.set("page_size", page_size);
        if (status) params.set("status", status);
        if (employee) params.set("employee", employee);
        if (search) params.set("search", search);

        return `/leave-requests/?${params.toString()}`;
      },
      providesTags: (result) =>
        result?.results?.length
          ? [
            ...result.results.map(({ id }) => ({
              type: "LeaveRequest",
              id,
            })),
            { type: "LeaveRequest", id: "LIST" },
          ]
          : [{ type: "LeaveRequest", id: "LIST" }],
    }),

    // ✅ Employee: submit leave request
    submitLeaveRequest: builder.mutation({
      query: (payload) => ({
        url: "/leave-requests/",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: [{ type: "LeaveRequest", id: "LIST" }],
    }),

    // ✅ Manager/HR: approve leave
    approveLeave: builder.mutation({
      query: ({ id, approval_type }) => ({
        url: `/leave-requests/${id}/approve/`,
        method: "POST",
        body: { approval_type },   // 👈 backend will set paid/unpaid here
      }),
      invalidatesTags: ["LeaveRequest"],
    }),

    // ✅ Manager/HR: deny leave
    denyLeave: builder.mutation({
      query: (id) => ({
        url: `/leave-requests/${id}/deny/`,
        method: "POST",
      }),
      invalidatesTags: ["LeaveRequest"],
    }),
  }),
});

export const {
  useGetEmployeeLeaveRequestsQuery,
  useLazyGetEmployeeLeaveRequestsQuery,
  useGetAllLeaveRequestsQuery,
  useSubmitLeaveRequestMutation,
  useApproveLeaveMutation,
  useDenyLeaveMutation,
} = leaveApi;
