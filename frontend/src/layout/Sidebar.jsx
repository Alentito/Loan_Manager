import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaUserTie,
  FaFileInvoiceDollar,
  FaTachometerAlt,
  FaMoneyCheckAlt,
  FaTasks,
  FaUsers,
  FaBuilding,
  FaFileAlt,
  FaCog,
  FaSignOutAlt,
  FaClipboardList,
} from "react-icons/fa";
import { useLogoutMutation } from "../api/authApi"; 
import React from "react";

export default function Sidebar() {
  const [logout] = useLogoutMutation();
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem("access");
  if (!token) return null;

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } catch (e) {}
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    navigate("/login");
  };

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
    { path: "/loan-management", label: "Loan Management", icon: <FaMoneyCheckAlt /> },
    { path: "/tasks", label: "Tasks", icon: <FaTasks /> },
    { path: "/brokers", label: "Brokers", icon: <FaUserTie /> },
    { path: "/loan-officers", label: "Loan Officers", icon: <FaBuilding /> },
    { path: "/employees", label: "Employees", icon: <FaUsers /> },
    { path: "/payroll", label: "Payroll", icon: <FaFileInvoiceDollar /> },
    { path: "/reports", label: "Reports", icon: <FaFileAlt /> },
    { path: "/audit", label: "Audit", icon: <FaClipboardList /> },
    { path: "/role-management", label: "Role Management", icon: <FaClipboardList /> },
    { path: "/teams", label: "Teams", icon: <FaUsers /> },
    { path: "/shifts", label: "Shifts", icon: <FaClipboardList /> },
    { path: "/attendance", label: "Attendance", icon: <FaClipboardList /> },
    { path: "/leaves/my-requests", label: "My Leaves", icon: <FaClipboardList /> },
    { path: "/admin/meetings", label: "Meetings", icon: <FaClipboardList /> },
    { path: "/admin/holidays", label: "Holidays", icon: <FaClipboardList /> },
    { path: "/admin/leave-approvals", label: "Leave Approvals", icon: <FaClipboardList /> },
  ];

  return (
    <div className="hidden lg:flex flex-col w-64 h-screen bg-gradient-to-b from-blue-600 to-blue-800 text-white shadow-lg">
      
      {/* Logo/Header */}
      <div className="p-4">
        <h1 className="text-2xl font-bold">Entregar Solutions</h1>
      </div>

      {/* Scrollable nav */}
      <div className="flex-1 overflow-y-auto px-4 space-y-2">
        <nav className="pb-16"> {/* padding so last item not hidden */}
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded hover:bg-blue-700 transition ${
                location.pathname === item.path ? "bg-blue-900" : ""
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Bottom (fixed) */}
      <div className="px-4 py-3 border-t border-blue-500 bg-blue-700">
        <Link
          to="/settings"
          className="flex items-center gap-2 text-sm text-gray-200"
        >
          <FaCog /> Settings
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-gray-200 w-full mt-2 hover:text-red-300"
        >
          <FaSignOutAlt /> Logout
        </button>
      </div>
    </div>
  );
}
