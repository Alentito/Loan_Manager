// frontend/src/layout/Sidebar.jsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaUserTie, FaFileInvoiceDollar, FaTachometerAlt, FaMoneyCheckAlt, FaTasks,
  FaUsers, FaBuilding, FaFileAlt, FaCog, FaSignOutAlt, FaClipboardList, FaClock
} from "react-icons/fa";
import { useLogoutMutation } from "../api/authApi";
import React from "react";
import { useSelector } from "react-redux";
import { useChicagoTime } from "../hooks/useChicagoTime";
import { logoutAction } from "../api/authSlice";
import { useDispatch } from "react-redux";

export default function Sidebar() {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [logout] = useLogoutMutation();
  const location = useLocation();
  const navigate = useNavigate();
  const { time, period } = useChicagoTime();
  const dispatch = useDispatch();

  if (!isAuthenticated) return null;

  // Permissions array from user object
  const userPermissions = user?.permissions || [];

  // Define nav items with required permissions
  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: <FaTachometerAlt />, permission: "loan.view_loan" },
    { path: "/loan-management", label: "Loan Management", icon: <FaMoneyCheckAlt />, permission: "loan.view_loan" },
    { path: "/tasks", label: "Tasks", icon: <FaTasks />, permission: "loan.view_task" },
    { path: "/brokers", label: "Brokers", icon: <FaUserTie />, permission: "employee.view_broker" },
    { path: "/loan-officers", label: "Loan Officers", icon: <FaBuilding />, permission: "employee.view_loanofficer" },
    { path: "/employees", label: "Employees", icon: <FaUsers />, permission: "employee.view_employee" },
    { path: "/payroll", label: "Payroll", icon: <FaFileInvoiceDollar />, permission: "employee.view_payroll" },
    { path: "/reports", label: "Reports", icon: <FaFileAlt />, permission: "loan.view_report" },
    { path: "/audit", label: "Audit", icon: <FaClipboardList />, permission: "audit.view_auditevent" },
    { path: "/role-management", label: "Role Management", icon: <FaClipboardList />, permission: "auth.view_group" },
    { path: "/teams", label: "Teams", icon: <FaUsers />, permission: "employee.view_team" },
    { path: "/shifts", label: "Shifts", icon: <FaClipboardList />, permission: "employee.view_shift" },
    { path: "/attendance", label: "Attendance", icon: <FaClipboardList />, permission: "employee.view_attendance" },
    { path: "/leaves/my-requests", label: "My Leaves", icon: <FaClipboardList />, permission: "employee.view_leaverequests" },
    { path: "/leaves/request", label: "Leave Request", icon: <FaClipboardList />, permission: "employee.add_leaverequests" },
    { path: "/admin/leave-approvals", label: "Leave Approvals", icon: <FaClipboardList />, permission: "employee.approve_leave" },
    
    { path: "/admin/holidays", label: "Holidays", icon: <FaClipboardList />, permission: "employee.view_publicholiday" }, 
    { path: "/lenders", label: "Lenders", icon: <FaClipboardList />, permission: "employee.view_lender" },
    { path: "/attendance/summary", label: "Monthly Summary", icon: <FaClipboardList />, permission: "employee.view_attendancesummary" },
    { path: "/tokens/my-tokens", label: "My Tokens", icon: <FaClipboardList />, permission: "employee.view_tokens" },
    { path: "/admin/token-approvals", label: "Token Approvals", icon: <FaClipboardList />, permission: "employee.approve_tokens" },
    { path: "/token/new", label: "Request Token", icon: <FaClipboardList />, permission: "employee.add_employeetoken" },
    { path: "/breaks", label: "Breaks", icon: <FaClock />, permission: null },    
    
  ];

  // Filter nav items by user permissions
  const filteredNavItems = navItems.filter(
    item => !item.permission || userPermissions.includes(item.permission)
  );

  if (filteredNavItems.length === 0) return null;

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } catch (e) {  console.error("Logout failed:", e);}
    dispatch(logoutAction());
    navigate("/login");
  };

  return (
    <div className="hidden lg:flex flex-col w-64 h-screen bg-gradient-to-b from-blue-600 to-blue-800 text-white shadow-lg">
      {/* Logo/Header */}

      <div className="p-4">
        <h1 className="text-2xl font-bold">Entregar Solutions</h1>
        {/* ⏰ Chicago Time */}
        <div className="mt-2 flex items-center text-sm text-gray-200">
          <FaClock className="mr-2" />
          <span>{time || "Loading..."} {period && `${period} CST`}</span>
        </div>

      </div>

      {/* Scrollable nav */}
      <div className="flex-1 overflow-y-auto px-4 space-y-2">
        <nav className="pb-16">
          {filteredNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded hover:bg-blue-700 transition ${location.pathname === item.path ? "bg-blue-900" : ""
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