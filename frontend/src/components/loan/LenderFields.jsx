import { Grid, TextField, IconButton, Box, Button } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

export default function LenderFields({ lenders, setLenders }) {
  const handleAddLender = () => setLenders([...lenders, { lender: "", comment: "" }]);
  const handleLenderChange = (index, field, value) => {
    const updated = [...lenders];
    updated[index][field] = value;
    setLenders(updated);
  };
  const handleDeleteLender = (index) => setLenders(lenders.filter((_, i) => i !== index));

  return (
    <>
      {lenders.map((item, index) => (
        <Grid container spacing={1} alignItems="center" key={index}>
          <Grid item xs={5}>
            <TextField
              label={`Lender ${index + 1}`}
              fullWidth
              value={item.lender}
              onChange={(e) => handleLenderChange(index, "lender", e.target.value)}
            />
          </Grid>
          <Grid item xs={5}>
            <TextField
              label="Comment"
              fullWidth
              value={item.comment}
              onChange={(e) => handleLenderChange(index, "comment", e.target.value)}
            />
          </Grid>
          <Grid item xs={2}>
            <IconButton onClick={() => handleDeleteLender(index)}>
              <DeleteIcon />
            </IconButton>
          </Grid>
        </Grid>
      ))}
      <Box mt={1}>
        <Button onClick={handleAddLender}>+ Add Lender</Button>
      </Box>
    </>
  );
}