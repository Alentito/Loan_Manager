import { Link, useLocation, useNavigate } from "react-router-dom";
import React from "react";
import { useSelector } from "react-redux";
import {
  LayoutDashboard,
  Wallet,
  Flag,
  ListChecks,
  UserRound,
  Building2,
  Users,
  BadgeDollarSign,
  FileText,
  Settings,
  LogOut,
  ClipboardList,
  UsersRound,
  Clock,
  CalendarCheck2,
} from "lucide-react";
import { useLogoutMutation } from "../api/authApi";
import { useTheme } from "@mui/material/styles";
import { useChicagoTime } from "../hooks/useChicagoTime";

export function SidebarContent() {
  const { isAuthenticated, user } = useSelector((s) => s.auth);
  const [logout] = useLogoutMutation();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { time, period } = useChicagoTime();

  if (!isAuthenticated) return null;

  const userPermissions = user?.permissions || [];
  const isActive = (path) => location.pathname === path;

  const navItems = [
    //{ path: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "loan.view_loan" },
    { path: "/loan-management", label: "Loan Management", icon: Wallet, permission: "loan.view_loan" },
    { path: "/milestones", label: "Milestones", icon: Flag, permission: "loan.view_milestone" },
    { path: "/tasks", label: "Tasks", icon: ListChecks, permission: "loan.view_task" },
    { path: "/brokers", label: "Brokers", icon: UserRound, permission: "employee.sidebar_broker" },
    { path: "/loan-officers", label: "Loan Officers", icon: Building2, permission: "employee.sidebar_loanofficer" },
    { path: "/employees", label: "Employees", icon: Users, permission: "employee.sidebar_employee" },
    { path: "/payroll", label: "Payroll", icon: BadgeDollarSign, permission: "employee.view_payroll" },
    { path: "/reports", label: "Reports", icon: FileText, permission: "loan.view_report" },
    { path: "/audit", label: "Audit", icon: ClipboardList, permission: "audit.view_auditevent" },
    { path: "/role-management", label: "Role Management", icon: UsersRound, permission: "auth.view_group" },
    { path: "/teams", label: "Teams", icon: Users, permission: "employee.view_team" },
    { path: "/shifts", label: "Shifts", icon: Clock, permission: "employee.view_shift" },
    { path: "/attendance", label: "Attendance", icon: ClipboardList, permission: "employee.view_attendance" },
    //{ path: "/leaves/my-requests", label: "My Leaves", icon: ClipboardList, permission: "employee.view_leaverequests" },
    { path: "/leaves/request", label: "Leave Request", icon: ClipboardList, permission: "employee.add_leaverequests" },
    { path: "/admin/leave-approvals", label: "Leave Approvals", icon: ClipboardList, permission: "employee.approve_leave" },
    { path: "/admin/holidays", label: "Holidays", icon: CalendarCheck2, permission: "employee.view_publicholiday" },
    { path: "/lenders", label: "Lenders", icon: Building2, permission: "employee.sidebar_lender" },
    { path: "/attendance/summary", label: "Monthly Summary", icon: ClipboardList, permission: "employee.view_attendancesummary" },
    { path: "/attendance/late-logins", label: "Late Logins", icon: Clock, permission: "employee.view_latelogins" },
    //{ path: "/tokens/my-tokens", label: "My Tokens", icon: ClipboardList, permission: "employee.view_tokens" },
    { path: "/token/new", label: "Complaint", icon: ClipboardList, permission: "employee.add_employeetoken" },
    { path: "/admin/token-approvals", label: "Respond", icon: ClipboardList, permission: "employee.approve_tokens" },
    { path: "/reports/funded-loans", label: "Report", icon: FileText, permission: "loan.View_reports" },
    { path: "/breaks", label: "Breaks", icon: Clock, permission: null },
    { path: "/payroll", label: "Payroll", icon: BadgeDollarSign, permission: "payroll.view_employeepayroll" },

  ];

  const filteredNavItems = navItems.filter((i) => !i.permission || userPermissions.includes(i.permission));

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } catch (e) {
      console.error("Logout error", e);
    }
    navigate("/login");
  };

  const isDarkTone = isDark;
  const sectionBorder = isDarkTone ? "border-slate-800" : "border-white/10";
  const itemBase = "group relative flex items-center gap-3 rounded-lg px-3 py-2 transition-colors";
  const itemTone = (active) =>
    isDarkTone ? (active ? "bg-slate-800/70" : "hover:bg-slate-800/40") : active ? "bg-white/15" : "hover:bg-white/10";
  const indicatorTone = isDarkTone ? "bg-blue-400" : "bg-white";
  const iconTone = (active) =>
    isDarkTone
      ? active
        ? "text-blue-400"
        : "text-slate-300 group-hover:text-slate-100"
      : active
        ? "text-white"
        : "text-white/80 group-hover:text-white";
  const textTone = (active) =>
    isDarkTone
      ? active
        ? "text-slate-100"
        : "text-slate-300 group-hover:text-slate-100"
      : active
        ? "text-white"
        : "text-white/90 group-hover:text-white";

  return (
    <div className="flex flex-col h-full">
      <div className="p-4">
        <h1 className="text-2xl font-bold">Entregar Solutions</h1>
        <div className="mt-2 flex items-center text-sm opacity-80">
          <Clock className="mr-2" size={16} />
          <span>
            {time || "Loading..."} {period && `${period} CST`}
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {filteredNavItems.map((item) => {
          const ActiveIcon = item.icon;
          const active = isActive(item.path);
          return (
            <Link key={item.path} to={item.path} className={`${itemBase} ${itemTone(active)}`}>
              <span
                className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r ${indicatorTone} transition-opacity duration-300
                ${active ? "opacity-100" : "opacity-0 group-hover:opacity-60"}`}
              />
              <ActiveIcon size={18} className={`shrink-0 transition-colors ${iconTone(active)}`} strokeWidth={2} />
              <span className={`text-sm transition-colors ${textTone(active)}`}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={`px-4 py-3 border-t ${sectionBorder}`}>
        
        <button
          onClick={handleLogout}
          className={`mt-2 flex items-center gap-2 text-sm transition-colors ${isDark ? "text-slate-300 hover:text-rose-300" : "text-white/90 hover:text-white"}`}
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

   const asideBase = "hidden lg:flex flex-col w-64 h-screen border-r fixed left-0 top-0 z-40";
  const asideTone = isDark
    ? "bg-slate-900 text-slate-100 border-slate-800"
    : "bg-gradient-to-b from-blue-600 via-blue-700 to-blue-800 text-white shadow-lg border-transparent";

  return (
    <aside className={`${asideBase} ${asideTone}`}>
      <SidebarContent />
    </aside>
  );
}
