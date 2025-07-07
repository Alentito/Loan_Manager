import { Link, useLocation } from 'react-router-dom';
import {FaUserTie,FaFileInvoiceDollar, FaTachometerAlt, FaMoneyCheckAlt, FaTasks, FaUsers, FaChartBar, FaBuilding, FaFileAlt, FaCog } from 'react-icons/fa'; // Sample icons from FontAwesome
import { Handshake } from 'lucide-react';

import { FaClipboardList } from 'react-icons/fa';


 // preferred
// or
//<Banknote />

export default function Sidebar() {
  const location = useLocation();

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
    { path: "/loan-management", label: "Loan Management", icon: <FaMoneyCheckAlt /> },
    { path: "/tasks", label: "Tasks", icon: <FaTasks /> },
    { path: "/brokers", label: "Brokers", icon: <FaUserTie />},
    { path: "/loan-officers", label: "Loan Officers", icon: <FaBuilding /> },
   
    { path: "/employees", label: "Employee", icon: <FaUsers />  },
    
    { path: "/payroll", label: "Payroll", icon: <FaFileInvoiceDollar /> },
    { path: "/reports", label: "Reports", icon: <FaFileAlt /> },
    { path: "/audit", label: "audit", icon: <FaClipboardList /> },
  ];

  return (
    <div className="hidden lg:block shadow-[0_4px_10px_rgba(0,0,0,0.2),0_0_10px_rgba(0,60,247,0.5)] relative w-64 h-screen bg-gradient-to-b from-blue-600 to-blue-800 text-white p-4 flex flex-col">
      <h1 className="text-2xl font-bold mb-8">Entregar Solutions</h1>
      <nav className="flex-1 space-y-2">
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-3 py-2 rounded hover:bg-blue-700 transition ${
              location.pathname === item.path ? 'bg-blue-900' : ''
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="absolute bottom-4 w-full px-4">
        <Link to="/settings" className="flex items-center gap-2 text-sm text-gray-200">
          <FaCog /> Settings
        </Link>
      </div>
    </div>
  );
}
