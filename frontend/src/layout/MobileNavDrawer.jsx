import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import { SidebarContent } from "./Sidebar.jsx";

export default function MobileNavDrawer({ open, onOpen, onClose }) {
  const theme = useTheme();
  const location = useLocation();
  const iOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);

  // Auto-close drawer on route change
  useEffect(() => {
    if (open) onClose?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <SwipeableDrawer
      anchor="left"
      open={open}
      onOpen={onOpen}
      onClose={onClose}
      disableBackdropTransition={!iOS}
      disableDiscovery={iOS}
      PaperProps={{
        sx: {
          width: 256,
          bgcolor: theme.palette.mode === "dark" ? "background.default" : "primary.dark",
          color: theme.palette.mode === "dark" ? "text.primary" : "primary.contrastText",
        },
      }}
    >
      <Box role="navigation" sx={{ height: "100%", display: { xs: "block", lg: "none" } }}>
        <SidebarContent />
      </Box>
    </SwipeableDrawer>
  );
}
