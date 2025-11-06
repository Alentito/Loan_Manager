import React from "react";
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineDot,
  TimelineContent,
  TimelineOppositeContent,
} from "@mui/lab";
import { Typography, Box, Chip, Skeleton, Tooltip } from "@mui/material";

import dayjs from "dayjs";
import { useGetLoanAuditQuery } from "./../../api/auditApi";

function colorForOp(op) {
  if (op === "CREATE") return "success";
  if (op === "DELETE") return "error";
  return "info"; // UPDATE
}

function displayName(evt) {
  // prefer employee.name, then actor.display_name, then actor.username, else System
  return (
    evt.employee?.name ||
    evt.actor?.display_name ||
    evt.actor?.username ||
    "System"
  );
}

export default function Audit({ loanId }) {
  const { data: events, isLoading } = useGetLoanAuditQuery(loanId);
  const auditEvents = Array.isArray(events?.results) ? events.results : [];

  if (isLoading) return <Skeleton variant="rectangular" height={200} />;

  return (
    <Box display="flex" justifyContent="flex-start">
      <Timeline position="right">
        {auditEvents.map((evt) => (
          <TimelineItem key={evt.id}>
            <TimelineOppositeContent
              sx={{
                flex: "0 0 110px",
                maxWidth: 110,
                whiteSpace: "nowrap",
                textAlign: "right",
                pr: 2,
                fontSize: 12,
              }}
              color="text.secondary"
            >
              {dayjs(evt.changed_at).format("MMM D, h:mm A")}
            </TimelineOppositeContent>

            <TimelineSeparator>
              <TimelineDot color={colorForOp(evt.operation)} />
            </TimelineSeparator>

            <TimelineContent>
              <Typography variant="subtitle2">
                <Tooltip
                  title={
                    evt.actor
                      ? `${evt.actor.username}${evt.actor.first_name || evt.actor.last_name ? ` — ${evt.actor.first_name || ""} ${evt.actor.last_name || ""}` : ""}`
                      : "System"
                  }
                >
                  <span>{displayName(evt)}</span>
                </Tooltip>
                {" — "}
                {evt.operation.toLowerCase()}
              </Typography>

              <div style={{ marginTop: 4 }}>
                {Object.entries(evt.diff).map(([field, { old, new: nv }]) => (
                  <Chip
                    key={field}
                    label={`${field}: ${String(old)} → ${String(nv)}`}
                    size="small"
                    sx={{ mr: 0.5, mb: 0.5 }}
                  />
                ))}
              </div>
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    </Box>
  );
}
