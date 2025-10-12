import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";

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
// import MonthlySummaryTable from "./attendance/MonthlySummaryTable";
import LeaveRequestForm from "./leaves/LeaveRequestForm";
import MyLeaveRequests from "./leaves/MyLeaveRequests";
import MeetingAdminPage from "./admin/MeetingAdminPage";
import LeaveApprovalPage from "./admin/LeaveApprovalPage";
import HolidayAdminPage from "./holidays/HolidayAdminPage";
import ShiftList from "./shifts/ShiftList";
import TeamList from "./teams/TeamList";
import LenderList from "./Lender/LenderList";
import MyTokens from "./tokens/MyTokens";
import TokenApprovalPage from "./tokens/TokenApprovalPage";
import TokenForm from "./tokens/TokenForm";
import BreakPage from "./breaks/BreakPage";
import ProfilePage from "./employees/ProfilePage";

import MilestoneManagement from "./components/milestone/MilestoneManagement";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useGetActiveBreakQuery } from "./api/breakApi"; 


function App() {
  useInitializeAuth();
  const navigate = useNavigate();
  const initial = (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
  const [mode, setMode] = useState(() => localStorage.getItem("themeMode") || initial);

  const { isAuthenticated, initialized } = useSelector((state) => state.auth);
  
   const { data: activeBreak, isSuccess } = useGetActiveBreakQuery(undefined, {
    skip: !isAuthenticated,  // only run if logged in
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    localStorage.setItem("themeMode", mode);
  }, [mode]);

  // Toggle Tailwind dark classes
  useEffect(() => {
    const root = document.documentElement;
    if (mode === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [mode]);

  useEffect(() => {
  if (isAuthenticated && isSuccess) {
    if (activeBreak?.has_active_break && !location.pathname.startsWith("/breaks/")) {
      navigate(`/breaks/${activeBreak.break.id}`, { replace: true });
    } 
    // Optional: If break ended, and user is still on /breaks/:id, send them back to dashboard
    else if (!activeBreak?.has_active_break && location.pathname.startsWith("/breaks/")) {
      navigate("/dashboard", { replace: true });
    }
  }
}, [isAuthenticated, isSuccess, activeBreak, navigate, location.pathname]);

  useEffect(() => {
    if (initialized && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [initialized, isAuthenticated, navigate]);

  const theme = useMemo(() => createTheme({ palette: { mode } }), [mode]);

  if (!initialized) return null;

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
            <Route path="/milestones" element={<MilestoneManagement />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/brokers" element={<BrokerList />} />
            <Route path="/loan-officers" element={<LoanOfficerList />} />
            <Route path="/employees" element={<EmployeeList />} />
            <Route path="/payroll" element={<Payroll />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/audit" element={<Audit />} />
            <Route path="/role-management" element={<RoleManagement />} />
            <Route path="/settings" element={<Settings />} />

            {/* Attendance & Leave Management */}
            
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/attendance/:employeeId" element={<AttendancePage />} />

            {/* <Route path="/attendance/summary" element={<MonthlySummaryTable />} /> */}
            <Route path="/leaves/request" element={<LeaveRequestForm />} />
            <Route path="/leaves/my-requests" element={<MyLeaveRequests />} />
            <Route path="/admin/leave-approvals" element={<LeaveApprovalPage />} />
            <Route path="/admin/holidays" element={<HolidayAdminPage />} />

            {/* Teams & Shifts */}
            <Route path="/shifts" element={<ShiftList />} />
            <Route path="/teams" element={<TeamList />} />

            {/* Lenders */}
            <Route path="/lenders" element={<LenderList />} />

            {/* Tokens */}
            <Route path="/tokens/my-tokens" element={<MyTokens />} />
            <Route path="/token/new" element={<TokenForm />} />
            <Route path="/admin/token-approvals" element={<TokenApprovalPage />} />

            {/* Breaks */}
            <Route path="/breaks" element={<BreakPage />} />
            <Route path="/breaks/:id" element={<BreakPage />} />


            {/* Meetings (if applicable) */}
            <Route path="/admin/meetings" element={<MeetingAdminPage />} />
             <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>
      </Routes>
    </ThemeProvider>
  );
}

export default App;
