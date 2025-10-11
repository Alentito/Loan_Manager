import React, { useState, useCallback } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../layout/Sidebar";
import Topbar from "../layout/Topbar";
import MobileNavDrawer from "../layout/MobileNavDrawer";

export default function ProtectedLayout({ mode, setMode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <MobileNavDrawer open={drawerOpen} onOpen={openDrawer} onClose={closeDrawer} />
      <div className="flex flex-col flex-1 overflow-auto lg:ml-64">
        <Topbar mode={mode} setMode={setMode} onOpenSidebar={openDrawer} />
        <main className="flex-1 p-0 bg-white overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
