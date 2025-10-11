import React, { useState, useCallback } from "react";
import { Outlet } from "react-router-dom";
import Box from "@mui/material/Box";
import Sidebar from "../layout/Sidebar";
import Topbar from "../layout/Topbar";
import MobileNavDrawer from "../layout/MobileNavDrawer";

export default function ProtectedLayout({ mode, setMode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default", color: "text.primary" }}>
      <Sidebar />
      <MobileNavDrawer open={drawerOpen} onOpen={openDrawer} onClose={closeDrawer} />

      <Box sx={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", ml: { lg: "16rem" } }}>
        <Topbar mode={mode} setMode={setMode} onOpenSidebar={openDrawer} />
        <Box
          component="main"
          sx={{
            flex: 1,
            overflowY: "auto",
            p: { xs: 1, sm: 2, md: 3 },
            bgcolor: "background.default",
            color: "text.primary",
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
