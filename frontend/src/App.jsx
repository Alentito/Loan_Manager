// frontend/src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Dashboard from "./pages/Dashboard";
import LoanManagement from "./pages/LoanManagement";
import LoanDetails from "./pages/LoanDetails";
import Tasks from "./pages/Tasks";
import Audit from "./pages/Audit";
import Payroll from "./pages/Payroll";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import RoleManagement from "./pages/RoleManagement";
import Login from "./login/Login";
import RequireAuth from "./auth/RequireAuth";
import BrokerList from "./brokers/BrokerList";
import LoanOfficerList from "./loanOfficers/LoanOfficerList";
import EmployeeList from "./employees/EmployeeList";
import useInitializeAuth from "./api/useInitializeAuth";
import ProtectedLayout from "./auth/ProtectedLayout";

import AttendancePage from "./attendance/AttendancePage";
import MonthlySummaryTable from "./attendance/MonthlySummaryTable";
import LeaveRequestForm from "./leaves/LeaveRequestForm";
import MyLeaveRequests from "./leaves/MyLeaveRequests";
import MeetingAdminPage from "./admin/MeetingAdminPage";
import LeaveApprovalPage from "./admin/LeaveApprovalPage";
import HolidayAdminPage from "./holidays/HolidayAdminPage";
import ShiftList from "./shifts/ShiftList";
import TeamList from "./teams/TeamList";
import LenderFormDialog from "./Lender/LenderFormDialog";
import  LenderList  from "./Lender/LenderList";
import MyTokens from "./tokens/MyTokens"; // Employee token list & modal view
import TokenApprovalPage from "./tokens/TokenApprovalPage"; // Admin approval page (if you build it)
import TokenForm from "./tokens/TokenForm"; // New token request form
import BreakPage from "./breaks/BreakPage"; 




function App() {
  useInitializeAuth();
  const navigate = useNavigate();
  const { isAuthenticated, initialized } = useSelector((state) => state.auth);

  useEffect(() => {
    if (initialized && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [initialized, isAuthenticated, navigate]);

  const [mode, setMode] = useState("light");
  const theme = useMemo(() => createTheme({ palette: { mode } }), [mode]);

  if (!initialized) return null; // prevent flicker

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route element={<RequireAuth />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route element={<ProtectedLayout mode={mode} setMode={setMode} />}>
            {/* Core Pages */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/loan-management" element={<LoanManagement />} />
            <Route
              path="/loan-management/loan-details/:id"
              element={<LoanDetails />}
            />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/brokers" element={<BrokerList />} />
            <Route path="/loan-officers" element={<LoanOfficerList />} />
            <Route path="/employees" element={<EmployeeList />} />
            <Route path="/payroll" element={<Payroll />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/audit" element={<Audit />} />
            <Route path="/role-management" element={<RoleManagement />} />
            <Route path="/settings" element={<Settings />} />

            {/* New Features */}
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/attendance/summary" element={<MonthlySummaryTable />} />
            <Route path="/leaves/request" element={<LeaveRequestForm />} />
            <Route path="/leaves/my-requests" element={<MyLeaveRequests />} />
            <Route path="/admin/meetings" element={<MeetingAdminPage />} />
            <Route path="/admin/leave-approvals" element={<LeaveApprovalPage />} />
            <Route path="/admin/holidays" element={<HolidayAdminPage />} />
            <Route path="/shifts" element={<ShiftList />} />
            <Route path="/teams" element={<TeamList />} />
            <Route path="/lenders" element={<LenderList />} />
            <Route path="/tokens/my-tokens" element={<MyTokens />} />
            <Route path="/admin/token-approvals" element={<TokenApprovalPage />} />
            <Route path="/token/new" element={<TokenForm />} />
            <Route path="/breaks" element={<BreakPage />} />
          </Route>
        </Route>
      </Routes>

      {/* 🔹 Global Toasts */}
      <ToastContainer position="top-right" autoClose={3000} />
    </ThemeProvider>
  );
}

export default App;
