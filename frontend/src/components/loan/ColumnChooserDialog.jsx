import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  Button,
} from "@mui/material";

export default function ColumnChooserDialog({
  open,
  onClose,
  visibleIds,
  onApply,
  allColumns,
  minCount = 4,
  maxCount = 7,
}) {
  const [draft, setDraft] = useState(visibleIds);

  useEffect(() => {
    if (open) setDraft(visibleIds); // Reset when opened
  }, [open, visibleIds]);

  const handleToggle = (id) => () => {
    const next = draft.includes(id)
      ? draft.filter((col) => col !== id)
      : [...draft, id];

    const totalVisible = allColumns.filter(c => c.min).length + next.length;
    if (totalVisible >= minCount && totalVisible <= maxCount) {
      setDraft(next);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Select columns ({minCount}–{maxCount} visible)</DialogTitle>
      <DialogContent dividers>
        {allColumns
          .filter(col => !col.min)
          .map((col) => {
            const isChecked = draft.includes(col.id);
            const total = allColumns.filter(c => c.min).length + draft.length;
            const disableUncheck = isChecked && total === minCount;
            const disableCheck = !isChecked && total === maxCount;

            return (
              <FormControlLabel
                key={col.id}
                control={
                  <Checkbox
                    size="small"
                    checked={isChecked}
                    onChange={handleToggle(col.id)}
                    disabled={disableUncheck || disableCheck}
                  />
                }
                label={col.label}
              />
            );
          })}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => onApply(draft)}>Apply</Button>
      </DialogActions>
    </Dialog>
  );
}
