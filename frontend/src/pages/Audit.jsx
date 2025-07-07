import React from 'react';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineDot,
  TimelineContent,
  TimelineOppositeContent,
}  from '@mui/lab';
import {
  Typography,
  Chip,
  Skeleton
} from '@mui/material';

import dayjs from 'dayjs';
import { useGetAllAuditLogsQuery } from '../api/auditApi';

function colorForOp(op) {
  if (op === 'CREATE') return 'success';
  if (op === 'DELETE') return 'error';
  return 'info'; // UPDATE
}

export default function Audit() {
  const { data: events, isLoading } = useGetAllAuditLogsQuery();
const auditEvents = Array.isArray(events?.results) ? events.results : [];

  if (isLoading) return <Skeleton variant="rectangular" height={200} />;

  return (
    <Timeline position="right">
      {auditEvents.map((evt) => (
        <TimelineItem key={evt.id}>
          <TimelineOppositeContent sx={{ fontSize: 12 }} color="text.secondary">
            {dayjs(evt.changed_at).format('MMM D, h:mm A')}
          </TimelineOppositeContent>

          <TimelineSeparator>
            <TimelineDot color={colorForOp(evt.operation)} />
          </TimelineSeparator>

          <TimelineContent>
            <Typography variant="subtitle2">
              {(evt.actor && evt.actor.username) || 'System'} —{' '}
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
  );
}
