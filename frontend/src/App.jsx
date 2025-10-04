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
import LeaveRequestForm from "./leaves/LeaveRequestForm";
import MyLeaveRequests from "./leaves/MyLeaveRequests";
import MeetingAdminPage from "./admin/MeetingAdminPage";
import LeaveApprovalPage from "./admin/LeaveApprovalPage";
import HolidayAdminPage from "./holidays/HolidayAdminPage";
import ShiftList from "./shifts/ShiftList";
import TeamList from "./teams/TeamList";
import MilestoneManagement from "./components/milestone/MilestoneManagement";
import useMediaQuery from "@mui/material/useMediaQuery";

function App() {
  useInitializeAuth();
  const navigate = useNavigate();
  const initial = (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
  const [mode, setMode] = useState(() => localStorage.getItem("themeMode") || initial);

  const { isAuthenticated, initialized } = useSelector((state) => state.auth);
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

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
    if (initialized && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [initialized, isAuthenticated, navigate]);

  //const [mode, setMode] = useState("light");
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

            {/* New Features */}
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/leaves/request" element={<LeaveRequestForm />} />
            <Route path="/leaves/my-requests" element={<MyLeaveRequests />} />
            <Route path="/admin/meetings" element={<MeetingAdminPage />} />
            <Route path="/admin/leave-approvals" element={<LeaveApprovalPage />} />
            <Route path="/admin/holidays" element={<HolidayAdminPage />} />
            <Route path="/shifts" element={<ShiftList />} />
            <Route path="/teams" element={<TeamList />} />
          </Route>
        </Route>
      </Routes>
    </ThemeProvider>
  );
}

export default App;
