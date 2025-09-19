import React, { useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useNotificationSocket } from "../config/useNotificationSocket";
import { getPageMeta } from "../config/getPageMeta";
import { useTheme } from "@mui/material/styles";
import { useSelector } from "react-redux";

import {
  Box,
  Typography,
  IconButton,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  ListItemText,
  Divider,
  ListItemIcon,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";


import { Bell, Sun, Moon, User, LogOut } from "lucide-react";

/* TopNavbar */
export default function TopNavbar({ mode, setMode }) {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const { title, description } = getPageMeta(location.pathname);

  // Show back button only on loan details page
  const showBackButton = location.pathname.includes("/loan-management/loan-details");

  /* Notification menu state */
  const [anchorNotif, setAnchorNotif] = useState(null);
  const openNotif = Boolean(anchorNotif);
  const handleNotifClick = (e) => setAnchorNotif(e.currentTarget);
  const handleNotifClose = () => setAnchorNotif(null);

  /* User menu state */
  const [anchorUser, setAnchorUser] = useState(null);
  const openUser = Boolean(anchorUser);
  const handleUserClick = (e) => setAnchorUser(e.currentTarget);
  const handleUserClose = () => setAnchorUser(null);

  // Demo user + notifications list
  
const user = useSelector((state) => state.auth.user);
console.log("User from Redux:", user);
  const [notifList, setNotifList] = useState([]);

  const handleNewNotification = useCallback((msg) => {
    setNotifList((prev) => [
      {
        id: msg.id || Date.now(),
        type: msg.type,
        title: msg.title || msg.message || "Notification",
        body: msg.message || "",
        created_at: msg.created_at || new Date().toISOString(),
        data: msg.data || {},
        read: false,
      },
      ...prev,
    ]);
  }, []);

  useNotificationSocket(handleNewNotification);

  const unreadCount = notifList.filter((n) => !n.read).length;

  // Fallback initials (if you prefer initials instead of User icon, change below)
  const initials =
    user?.firstName?.[0]?.toUpperCase() + user?.lastName?.[0]?.toUpperCase();

  const handleLogout = () => {
    // Replace with your logout logic
    console.log("logout");
    handleUserClose();
    // navigate("/logout"); // uncomment if you have a route
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        px: 3,
        py: 2,
        borderBottom: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Typography variant="h6" fontWeight={600} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {showBackButton && (
              <IconButton
                onClick={() => navigate(-1)}
                size="small"
                sx={{ mr: 0.5 }}
                aria-label="Go back"
              >
                <ArrowBackIcon />
              </IconButton>
            )}
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {/* Theme toggle */}
        <Tooltip title={mode === "light" ? "Switch to dark mode" : "Switch to light mode"}>
          <IconButton
            onClick={() => setMode(mode === "light" ? "dark" : "light")}
            color="inherit"
            aria-label={mode === "light" ? "Switch to dark mode" : "Switch to light mode"}
          >
            {mode === "light" ? <Moon size={18} strokeWidth={1.8} /> : <Sun size={18} strokeWidth={1.8} />}
          </IconButton>
        </Tooltip>

        {/* Notifications */}
        <Tooltip title="Notifications">
          <IconButton
            onClick={handleNotifClick}
            size="medium"
            aria-label={`Notifications (${unreadCount} unread)`}
            aria-controls={openNotif ? "notifications-menu" : undefined}
            aria-haspopup="true"
          >
            <Badge badgeContent={unreadCount} color="error">
              <Bell size={20} strokeWidth={1.6} />
            </Badge>
          </IconButton>
        </Tooltip>

        <Menu
          id="notifications-menu"
          anchorEl={anchorNotif}
          open={openNotif}
          onClose={handleNotifClose}
          PaperProps={{
            sx: {
              width: 340,
              boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.25)",
              border: "1px solid #e0e0e0",
              borderRadius: 2,
              maxHeight: 420,
            },
          }}
        >
          <Box px={2} py={1} fontWeight="bold">
            Notifications
          </Box>
          <Divider />
          {notifList.length === 0 && <MenuItem disabled>No new notifications</MenuItem>}
          {notifList.slice(0, 8).map((n) => (
            <MenuItem key={n.id} onClick={handleNotifClose}>
              <ListItemText
                primary={n.title}
                secondary={`${n.body} • ${new Date(n.created_at).toLocaleString()}`}
                primaryTypographyProps={{ fontWeight: n.read ? "normal" : "bold" }}
              />
            </MenuItem>
          ))}
        </Menu>

        {/* Avatar (lucide User used as fallback when avatarSrc is missing) */}
        <Tooltip title={`${user.Firstname} ${user.lastName}`}>
          <IconButton
            onClick={handleUserClick}
            size="small"
            sx={{ ml: 1 }}
            aria-controls={openUser ? "user-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={openUser ? "true" : undefined}
          >
            {user.avatarSrc ? (
              <Avatar src={user.avatarSrc} alt={`${user.Firstname} ${user.lastName}`} />
            ) : (
              <Avatar sx={{ width: 40, height: 40 }}>
                <User size={18} strokeWidth={1.6} />
              </Avatar>
            )}
          </IconButton>
        </Tooltip>

        <Menu
          id="user-menu"
          anchorEl={anchorUser}
          open={openUser}
          onClose={handleUserClose}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          PaperProps={{
            sx: {
              width: 220,
              boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.25)",
            },
          }}
        >
          <Box px={2} py={1} fontWeight="bold">
            {user.firstName} {user.lastName}
          </Box>
          <Divider />
          <MenuItem onClick={() => { handleUserClose(); navigate("/profile"); }}>
            <ListItemIcon>
              <User size={16} />
            </ListItemIcon>
            <ListItemText>Profile</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogOut size={16} />
            </ListItemIcon>
            <ListItemText>Logout</ListItemText>
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
}
