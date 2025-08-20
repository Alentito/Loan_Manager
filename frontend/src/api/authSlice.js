// src/slices/authSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isAuthenticated: false,
  initialized: false, // becomes true after initial auth check
  user: null,         // optional: store minimal user info if you want
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Call with payload = user object OR payload = true/false
    setAuthenticated(state, action) {
      // If payload is a user object, mark authenticated and save user
      if (action.payload && typeof action.payload === "object") {
        state.isAuthenticated = true;
        state.user = action.payload;
      } else {
        state.isAuthenticated = !!action.payload; // true/false or default
        if (!action.payload) state.user = null;
      }
    },

    // Logout: fully clear client-side auth state & localStorage keys
    logoutAction(state) {
      state.isAuthenticated = false;
      state.user = null;
      state.initialized = true; // ensure app doesn't keep waiting for init
      try {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
      } catch (e) { /* ignore */ }
    },

    // Mark that initial auth check completed
    setInitialized(state, action) {
      state.initialized = !!action.payload;
    },
  },
});

export const { setAuthenticated, logoutAction, setInitialized } = authSlice.actions;
export default authSlice.reducer;
