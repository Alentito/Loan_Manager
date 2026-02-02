// selectedLoansSlice.js
import { createSlice } from "@reduxjs/toolkit";

const selectedLoansSlice = createSlice({
  name: "selectedLoans",
  initialState: [],
  reducers: {
    setSelectedLoans: (state, action) => action.payload,
    addSelectedLoan: (state, action) => {
      if (!state.includes(action.payload)) state.push(action.payload);
    },
    removeSelectedLoan: (state, action) =>
      state.filter((id) => id !== action.payload),
    clearSelectedLoans: () => [],
  },
});

export const {
  setSelectedLoans,
  addSelectedLoan,
  removeSelectedLoan,
  clearSelectedLoans,
} = selectedLoansSlice.actions;
export default selectedLoansSlice.reducer;