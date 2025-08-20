// ProtectedLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../layout/Sidebar";
import Topbar from "../layout/Topbar";

export default function ProtectedLayout({ mode, setMode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-auto">
        <Topbar mode={mode} setMode={setMode} />
        <main className="flex-1 p-0 bg-white-100 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
