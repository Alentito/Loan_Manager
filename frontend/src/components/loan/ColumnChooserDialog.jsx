import React, { useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  Button,
  FormGroup,
  Box,
  Typography,
} from "@mui/material";

/**
 * ColumnChooserDialog
 *
 * Props:
 * - open
 * - onClose
 * - visibleIds (array)             - current selection (keeps dialog in sync)
 * - onApply (function:newIds)      - call when user Apply(s)
 * - onReset (function)             - optional handler for explicit Reset action
 * - allColumns (array of {id,label})
 * - defaultVisible (array of ids)  - used for Reset
 * - minCount, maxCount
 */
export default function ColumnChooserDialog({
  open,
  onClose,
  visibleIds,
  onApply,
  onReset,
  allColumns,
  defaultVisible = [],
  minCount = 4,
  maxCount = 7,
}) {
  const [selected, setSelected] = React.useState(() => visibleIds || []);

  useEffect(() => {
    // whenever dialog opens or visibleIds change, re-sync internal state
    setSelected(visibleIds || []);
  }, [visibleIds, open]);

  const handleToggle = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((colId) => colId !== id) : [...prev, id]
    );
  };

  const handleApply = () => {
    // ensure ordering follows allColumns to keep table stable
    const allIds = allColumns.map((c) => c.id);
    const ordered = allIds.filter((id) => selected.includes(id));
    onApply(ordered);
  };

  const handleReset = () => {
    const validDefaults = (defaultVisible || []).filter((id) =>
      allColumns.some((c) => c.id === id)
    );
    // ordered by allColumns as well
    const allIds = allColumns.map((c) => c.id);
    const ordered = allIds.filter((id) => validDefaults.includes(id));
    setSelected(ordered);
    // If a parent provided onReset, call it. Otherwise call onApply with defaults so parent can persist.
    if (typeof onReset === "function") {
      onReset();
    } else {
      onApply(ordered);
    }
  };

  const count = selected.length;
  const tooFew = count < minCount;
  const tooMany = count > maxCount;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Choose Columns</DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Choose which columns to show (min {minCount}, max {maxCount}) — {count} selected.
          </Typography>
        </Box>

        <FormGroup>
          {allColumns.map((col) => {
            const isChecked = selected.includes(col.id);
            const disableToggle = isChecked && selected.length <= minCount;
            return (
              <FormControlLabel
                key={col.id}
                control={
                  <Checkbox
                    checked={isChecked}
                    onChange={() => handleToggle(col.id)}
                    disabled={disableToggle}
                  />
                }
                label={col.label}
              />
            );
          })}
        </FormGroup>

        {(tooFew || tooMany) && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="error">
              {tooFew && `Select at least ${minCount} columns.`}
              {tooMany && `You can select at most ${maxCount} columns.`}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2, pb: 2 }}>
        <Button onClick={handleReset} variant="outlined" size="small">
          Reset to defaults
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleApply} variant="contained" disabled={tooFew || tooMany}>
          Apply
        </Button>
      </DialogActions>
    </Dialog>
  );
}
