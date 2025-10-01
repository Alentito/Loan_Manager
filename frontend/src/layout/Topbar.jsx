import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  ListItemText,
  Divider,
  Box,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";

export default function Topbar({ user, notifications = [] }) {
  /* --- Notification menu state --- */
  const [anchorNotif, setAnchorNotif] = useState(null);
  const openNotif = Boolean(anchorNotif);

  const handleNotifClick = (e) => setAnchorNotif(e.currentTarget);
  const handleNotifClose = () => setAnchorNotif(null);

  /* --- User menu state --- */
  const [anchorUser, setAnchorUser] = useState(null);
  const openUser = Boolean(anchorUser);

  const handleUserClick = (e) => setAnchorUser(e.currentTarget);
  const handleUserClose = () => setAnchorUser(null);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const initials =
    user?.firstName?.[0]?.toUpperCase() + user?.lastName?.[0]?.toUpperCase();

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{ bgcolor: "background.paper", color: "text.primary", borderBottom: 1, borderColor: "divider" }}
    >
      <Toolbar sx={{ justifyContent: "flex-end" }}>
        {/* --- Notification bell --- */}
        <Tooltip title="Notifications">
          <IconButton onClick={handleNotifClick} size="large">
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={anchorNotif}
          open={openNotif}
          onClose={handleNotifClose}
          PaperProps={{ sx: { width: 300 } }}
        >
          <Box px={2} py={1} fontWeight="bold">
            Notifications
          </Box>
          <Divider />
          {notifications.length === 0 && (
            <MenuItem disabled>No new notifications</MenuItem>
          )}
          {notifications.slice(0, 6).map((n) => (
            <MenuItem key={n.id} onClick={() => { handleNotifClose(); /* navigate or mark read */ }}>
              <ListItemText
                primary={n.title}
                secondary={n.timestamp}
                primaryTypographyProps={{ fontWeight: n.read ? "normal" : "bold" }}
              />
            </MenuItem>
          ))}
        </Menu>

        {/* --- User avatar --- */}
        <Tooltip title="Account">
          <IconButton onClick={handleUserClick} size="large" sx={{ ml: 1 }}>
            {user?.avatarUrl ? (
              <Avatar alt={user.fullName} src={user.avatarUrl} />
            ) : (
              <Avatar>{initials}</Avatar>
            )}
          </IconButton>
        </Tooltip>

        <Menu anchorEl={anchorUser} open={openUser} onClose={handleUserClose}>
          <MenuItem
            onClick={() => {
              handleUserClose();
              // navigate("/profile");  // react-router
            }}
          >
            <PersonIcon fontSize="small" sx={{ mr: 1 }} /> Profile
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={() => {
              handleUserClose();
              // dispatch(logout());
            }}
          >
            <LogoutIcon fontSize="small" sx={{ mr: 1 }} /> Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
