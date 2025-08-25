// src/slices/authSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isAuthenticated: false,
  initialized: false,
  user: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthenticated(state, action) {
        console.log("Reducer called with:", action.payload);

      if (action.payload && typeof action.payload === "object") {
        state.isAuthenticated = true;
        state.user = action.payload;
      } else {
        state.isAuthenticated = !!action.payload;
        if (!action.payload) state.user = null;
      }
      state.initialized = true; // important: mark init done when we have auth result
    },
    logoutAction(state) {
      state.isAuthenticated = false;
      state.user = null;
      state.initialized = true;
    },
    setInitialized(state, action) {
      state.initialized = !!action.payload;
    },
  },
});

export const { setAuthenticated, logoutAction, setInitialized } = authSlice.actions;
export default authSlice.reducer;
