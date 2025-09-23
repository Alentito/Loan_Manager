<<<<<<< HEAD
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './layout/Sidebar';
import Dashboard from './pages/Dashboard';
import LoanManagement from './pages/LoanManagement';
=======
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
>>>>>>> 00f6f991e (Initial commit of backend and frontend project)
import LoanDetails from "./pages/LoanDetails";
import Tasks from './pages/Tasks';
import Audit from './pages/Audit';
import ThirdParty from './pages/ThirdParty';
import TeamPeople from './pages/TeamPeople';
import Payroll from './pages/Payroll';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@syncfusion/ej2-base/styles/material.css';
import '@syncfusion/ej2-react-kanban/styles/material.css';

import BrokerList from './brokers/BrokerList';
import LoanOfficerList from './loanOfficers/LoanOfficerList';
import EmployeeList from './employees/EmployeeList';

<<<<<<< HEAD
=======
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
import TeamLeadFormDialog from "./teams/TeamLeadFormDialog";
import TeamLeadList from "./teams/TeamLeadList";  
import TeamManagerList from "./teammanager/TeamManagerList";
import MyTokens from "./tokens/MyTokens"; // Employee token list & modal view
import TokenApprovalPage from "./tokens/TokenApprovalPage"; // Admin approval page (if you build it)
import TokenForm from "./tokens/TokenForm"; // New token request form
import BreakPage from "./breaks/BreakPage"; 

>>>>>>> 00f6f991e (Initial commit of backend and frontend project)

function App() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-auto">
        {/* Topbar */}
        {/* <header className="h-16 bg-white shadow px-6 flex items-center justify-between">
          <input
            type="text"
            placeholder="Search"
            className="w-1/3 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {/* You can add profile/menu here */}
       {/* </header> */ }

        {/* Page Content */}
        <main className="flex-1 p-0 bg-white-100 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/loan-management" element={<LoanManagement />} />
            <Route path="/loan-management/loan-details/:id" element={<LoanDetails />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/brokers" element={<BrokerList />} />
            <Route path="/loan-officers" element={<LoanOfficerList />} />
            <Route path="/employees" element={<EmployeeList />} />
            <Route path="/payroll" element={<Payroll />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/audit" element={<Audit />} />
            <Route path="/settings" element={<Settings />} />
<<<<<<< HEAD
          </Routes>
        </main>
      </div>
    </div>
=======

            {/* New Features */}
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/attendance/summary" element={<MonthlySummaryTable />} />
            <Route path="/attendance/:id?" element={<AttendancePage />} />
            <Route path="/leaves/request" element={<LeaveRequestForm />} />
            <Route path="/leaves/my-requests" element={<MyLeaveRequests />} />
            <Route path="/admin/meetings" element={<MeetingAdminPage />} />
            <Route path="/admin/leave-approvals" element={<LeaveApprovalPage />} />
            <Route path="/admin/holidays" element={<HolidayAdminPage />} />
            <Route path="/shifts" element={<ShiftList />} />
            <Route path="/teams" element={<TeamList />} />

            <Route path="/lenders" element={<LenderList />} />
            <Route path="/team-leads" element={<TeamLeadList />} />
            <Route path="/team-managers" element={<TeamManagerList />} />
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
>>>>>>> 00f6f991e (Initial commit of backend and frontend project)
  );
}

export default App;
