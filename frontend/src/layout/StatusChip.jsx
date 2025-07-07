import { useState } from "react";
import { ChevronDown,Ban,               // for N/A
  Truck,              } from "lucide-react";
import {
  Button,
  Menu,
  MenuItem,
  Box,
  Typography,
  styled,
  ListItemIcon,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WatchLaterIcon from "@mui/icons-material/WatchLater";

// 1️⃣  Status → meta
const STATUSES = {
  "n/a": { label: "N/A", color: "#F5F5F5", text: "#757575", icon: Ban },
  pending: {
    label: "Pending",
    color: "#FEF3C7",
    text: "#92400E",
    icon: WatchLaterIcon,
  },
  ordered: {
    label: "Ordered",
    color: "#DBEAFE",
    text: "#1D4ED8",
    icon: Truck,
  },
  received: {
    label: "Received",
    color: "#D1FAE5",
    text: "#065F46",
    icon: CheckCircleIcon,
  },
};

// 2️⃣  Menu pill
const Pill = styled(Box)(({ bgcolor, color }) => ({
  backgroundColor: bgcolor,
  color,
  width: "100%",
  display: "flex",
  alignItems: "center",
  gap: 0,
  padding: "3px 6px",
  borderRadius: 999,
  fontWeight: 600,
}));

export default function StatusChip({ value = "n/a", onChange }) {
  //const [current, setCurrent]   = useState(defaultValue);
  const [anchorEl, setAnchorEl] = useState(null);

  // helpers
  const open = Boolean(anchorEl);
  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);
  //const choose      = key    => { setCurrent(key); handleClose(); };

  const meta = STATUSES[value] || STATUSES["n/a"];
  const { color: bg, text, label, icon: Icon } = meta;

  const choose = (key) => {
    if (onChange) onChange({ target: { value: key } });
    handleClose();
  };

  return (
    <>
      {/* MAIN BUTTON with status icon */}
      <Button
        variant="contained"
        onClick={handleOpen}
        startIcon={<Icon size={16}  htmlColor={text} />} //  🆕  icon displayed
        endIcon={
          <span style={{ fontSize: 14 }}>
            {" "}
            <ChevronDown />
          </span>
        }
        sx={{
          height: 30,
          width: 140,
          backgroundColor: bg,
          color: text,
          borderRadius: 1.5,
          fontSize: 14,
          px: 2,
          boxShadow: "none",
          textTransform: "none",
          transition: "box-shadow 0.2s ease", // smooth in/out
          "&:hover": {
            backgroundColor: bg,
            boxShadow: (theme) => theme.shadows[1], // subtle preset shadow
          },
        }}
      >
        {label}
      </Button>

      {/* POPOVER MENU */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{ elevation: 0, sx: { borderRadius: 3, px: 0 ,boxShadow: (theme) => theme.shadows[3]} }}
      >
        {Object.entries(STATUSES).map(([key, m]) => (
          <MenuItem
            key={key}
            onClick={() => choose(key)}
            disableRipple
            sx={{ "&:hover": { backgroundColor: "transparent" } }}
          >
            <Pill bgcolor={m.color} color={m.text}>
              <ListItemIcon sx={{ minWidth: 0 }}>
                <m.icon fontSize="small"  size={16} htmlColor={m.text} />
              </ListItemIcon>
              <Typography variant="body2" fontWeight={600}>
                {m.label}
              </Typography>
            </Pill>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
