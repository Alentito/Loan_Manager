import { Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';

/** Returns a lowercase string you can safely switch on */
const normalize = (status) => (status ?? '').toString().trim().toLowerCase();

const getMilestoneStyle = (status, isDark) => {
  switch (normalize(status)) {
    case 'application':
      return {
        label: 'Application',
        bg: isDark ? '#4B1C1C' : '#FFE5E5',
        color: isDark ? '#FF6B6B' : '#D32F2F',
      };

    case 'underwriting':
      return {
        label: 'Underwriting',
        bg: isDark ? '#1C4532' : '#D1FAE5',
        color: isDark ? '#6EE7B7' : '#065F46',
      };

    case 'funding':
      return {
        label: 'Funding',
        bg: isDark ? '#78350F' : '#FEF3C7',
        color: isDark ? '#FBBF24' : '#92400E',
      };

    default:
      return {
        label: status ?? 'Unknown',
        bg: isDark ? '#374151' : '#E5E7EB',
        color: isDark ? '#D1D5DB' : '#374151',
      };
  }
};


export default function MilestoneChip({ status }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const { label, bg, color } = getMilestoneStyle(status, isDark);

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
      }}
    />
  );
}
