import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './layout/Sidebar';
import TopBar from './layout/Topbar'; // ✅ Import the TopBar
import Dashboard from './pages/Dashboard';
import LoanManagement from './pages/LoanManagement';
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

// Dummy user and notifications data
const user = {
  firstName: 'Alen',
  lastName: 'Tito',
  avatarUrl: '', // you can pass an actual image URL here
};

const notifications = [
  { id: 1, title: "New loan submitted", timestamp: "1 min ago", read: false },
  { id: 2, title: "Payroll updated", timestamp: "2 hrs ago", read: true },
];

function App() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-auto">
        {/* ✅ TopBar */}
        <TopBar user={user} notifications={notifications} />

        {/* Page Content */}
        <main className="flex-1 p-4 bg-gray-50 overflow-y-auto">
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
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
