import { Box } from "@mui/material";
import AttendanceCalendar from "./AttendanceCalendar";

export default function Layout({ attendance, holidays, meetings, ...props }) {
  return (
    <Box display="flex" height="100vh">
      {/* Sidebar */}
      <Box
        width="250px"         // fixed sidebar width
        bgcolor="grey.200"    // just for demo
        p={2}
      >
        Sidebar
      </Box>

      {/* Calendar Fullscreen Area */}
      <Box flex={1} p={0} overflow="hidden">
        <AttendanceCalendar
          attendance={attendance}
          holidays={holidays}
          meetings={meetings}
          {...props}
        />
      </Box>
    </Box>
  );
}