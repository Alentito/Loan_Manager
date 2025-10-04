import { Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useGetMilestonesQuery } from '../api/milestoneApi';

/** Returns a lowercase string you can safely switch on */
const normalize = (status) => (status ?? '').toString().trim().toLowerCase();

const getDefaultMilestoneStyle = (status, isDark) => {
  // Only use as absolute fallback when API is unavailable
  return {
    label: status || 'Unknown',
    bg: isDark ? '#374151' : '#E5E7EB',
    color: isDark ? '#D1D5DB' : '#374151',
  };
};

export default function MilestoneChip({ status, milestone }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const { data: milestonesData, isLoading, isError } = useGetMilestonesQuery({
    pageSize: 100,
    status: 'active'
  });

  const milestones = milestonesData?.results || [];

  const matchedMilestone =
    milestone ||
    milestones.find(
      (m) =>
        normalize(m.name) === normalize(status) ||
        m.id === status ||
        m.name === status
    );

  let label, bg, color;

  if (matchedMilestone) {
    label = matchedMilestone.name;
    bg = matchedMilestone.background_color;
    color = matchedMilestone.color;
  } else if (isLoading) {
    label = status || 'Loading...';
    bg = isDark ? '#374151' : '#F3F4F6';
    color = isDark ? '#9CA3AF' : '#6B7280';
  } else if (isError) {
    label = status || 'Error';
    bg = isDark ? '#7F1D1D' : '#FEE2E2';
    color = isDark ? '#FCA5A5' : '#DC2626';
  } else {
    const fallback = getDefaultMilestoneStyle(status, isDark);
    label = fallback.label;
    bg = fallback.bg;
    color = fallback.color;
  }

  return (
    <Chip
      label={label}
      size="small"
      sx={{
        backgroundColor: bg,
        color,
        fontWeight: 500,
        borderRadius: '8px',
        px: 1.5,
        py: 0.5,
        fontSize: '13px',
        height: 'auto',
        transition: 'background-color 0.2s ease, color 0.2s ease',
      }}
    />
  );
}