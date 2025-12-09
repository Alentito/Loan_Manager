export const stickyLeftStyle = (offset = 0) => ({
  position: 'sticky',
  left: offset,
  zIndex: 2,
  background: 'inherit',
  boxShadow: offset === 0 ? '2px 0 4px -2px rgba(0,0,0,0.12)' : undefined,
});

export const styles = {
  headerCell: {
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  bodyCell: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
};
