import { Chip } from '@mui/material';

/** Returns a lowercase string you can safely switch on */
const normalize = (status) => (status ?? '').toString().trim().toLowerCase();

const getMilestoneStyle = (status) => {
  switch (normalize(status)) {
    case 'application':
      return { label: 'Application', bg: '#FFE5E5', color: '#D32F2F' };

    case 'underwriting':
      return { label: 'Underwriting', bg: '#D1FAE5', color: '#065F46' };

    case 'funding':
      return { label: 'Funding', bg: '#FEF3C7', color: '#92400E' };

    default:
      // when status is null/undefined/unknown we fall back gracefully
      return { label: status ?? 'Unknown', bg: '#E5E7EB', color: '#374151' };
  }
};

export default function MilestoneChip({ status }) {
  const { label, bg, color } = getMilestoneStyle(status);

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
