import { useLocation,useNavigate } from "react-router-dom";
import { useNotificationSocket } from "../config/useNotificationSocket";
import { getPageMeta } from "../config/getPageMeta";
import React, { useState,useCallback } from "react";
import { Bell } from 'lucide-react';
import {  Switch } from "@mui/material";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import { useTheme } from "@mui/material/styles";

import {
  Typography,
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
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import NotificationsIcon from "@mui/icons-material/Notifications";


//import NotificationsIcon from "@mui/icons-material/Notifications";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";

  
export default function TopNavbar({ mode, setMode }) {
    const theme = useTheme();

  /* --- Notification menu state --- */
  
  const [anchorNotif, setAnchorNotif] = useState(null);
  const openNotif = Boolean(anchorNotif);

  const handleNotifClick = (e) => setAnchorNotif(e.currentTarget);
  const handleNotifClose = () => setAnchorNotif(null);

  /* --- User menu state --- */
  const [anchorUser, setAnchorUser] = useState(null);
  const openUser = Boolean(anchorUser);

  
const user = {
  firstName: "Alen",
  lastName: "Tito",
};
const [notifList, setNotifList] = useState([]);

const handleNewNotification = useCallback((msg) => {
  setNotifList((prev) => [{ ...msg, read: false, timestamp: new Date().toLocaleString() }, ...prev]);
}, []);

useNotificationSocket(handleNewNotification);

  
const unreadCount = notifList.filter((n) => !n.read).length;

const initials =
    user?.firstName?.[0]?.toUpperCase() + user?.lastName?.[0]?.toUpperCase();


  const location = useLocation();
  const navigate = useNavigate();

  const { title, description } = getPageMeta(location.pathname);

  // Show back button only on loan details page
  const showBackButton = location.pathname.includes("/loan-management/loan-details");


  return (
    <Box
      className="bg-white  px-6 py-4"
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
      }}
    >
      <Box sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              
            }}>
        
         <Box sx={{ display: "flex", flexDirection:"column", }}>
        <Typography variant="h6" fontWeight={600}>
          {showBackButton && (
          <button
            onClick={() => navigate(-1)} // Go back to previous page
            className=" rounded-full hover:bg-gray-100 transition"
          >
            <ArrowBackIcon />
          </button>
        )}
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
        </Box>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Tooltip title={`Switch to ${mode === "light" ? "dark" : "light"} mode`}>
  <IconButton onClick={() => setMode(mode === "light" ? "dark" : "light")} color="inherit">
    {mode === "light" ? <Brightness4Icon /> : <Brightness7Icon />}
  </IconButton>
</Tooltip>
       {/* --- Notification bell --- */}
        <Tooltip title="Notifications">
          <IconButton onClick={handleNotifClick} size="large">
            <Badge badgeContent={unreadCount} color="error">
              <Bell />
            </Badge>
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={anchorNotif}
          open={openNotif}
          onClose={handleNotifClose}
          PaperProps={{
    sx: {
      width: 300,
      boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.25)', // subtle shadow
      border: '1px solid #e0e0e0', // light gray border
      borderRadius: 2, // optional rounded corners
    },
  }}
        >
          <Box px={2} py={1} fontWeight="bold">
            Notifications
          </Box>
          <Divider />
          {notifList.length === 0 && <MenuItem disabled>No new notifications</MenuItem>}

          {notifList.slice(0, 6).map((n, i) => {
  const { title, message, timestamp } = n.message || {};
  return (
    <MenuItem key={i} onClick={() => handleNotifClose()}>
      <ListItemText
        primary={title || message || "Notification"}
        secondary={timestamp || ""}
        primaryTypographyProps={{ fontWeight: n.read ? "normal" : "bold" }}
      />
    </MenuItem>
  );
})}
        </Menu>
        <Avatar src="/profile.png" alt="User" />
      </Box>
    </Box>
  );
}
