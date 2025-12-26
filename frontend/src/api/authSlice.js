// src/api/authSlice.js (updated)
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isAuthenticated: false,
  initialized: false,
  user: null,
  attendance: [],
  holidays: [],
  meetings: [],
  leaves: [],
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthenticated(state, action) {
      const payload = action.payload || {};

      // Backwards-compatible: if caller passed a raw user object (legacy)
      const looksLikeUser = payload && (payload.id || payload.username || payload.email);

      if (looksLikeUser) {
        // old-style call: set user only
        state.isAuthenticated = true;
        state.user = payload;
        // keep other collections as-is
      } else {
        // new-style call: object containing user + collections
        const { user, attendance, holidays, meetings, leaves } = payload;
        state.isAuthenticated = !!user;
        state.user = user || null;
        state.attendance = attendance ? (Array.isArray(attendance) ? attendance : [attendance]) : [];
        state.holidays = holidays || [];
        state.meetings = meetings || [];
        state.leaves = leaves || [];
      }

      state.initialized = true;
    },

    logoutAction(state) {
      state.isAuthenticated = false;
      state.user = null;
      state.attendance = [];
      state.holidays = [];
      state.meetings = [];
      state.leaves = [];
      state.initialized = true;
    },

    setInitialized(state, action) {
      state.initialized = !!action.payload;
    },

    updateAttendance(state, action) {
      const updated = action.payload;
      if (!updated || !updated.date) return;
      const idx = state.attendance.findIndex((a) => a.date === updated.date);
      if (idx >= 0) state.attendance[idx] = updated;
      else state.attendance.push(updated);
    },
  },
});

export const { setAuthenticated, logoutAction, setInitialized, updateAttendance } = authSlice.actions;

export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectInitialized = (state) => state.auth.initialized;
export const selectAttendance = (state) => state.auth.attendance;
export const selectHolidays = (state) => state.auth.holidays;
export const selectMeetings = (state) => state.auth.meetings;
export const selectLeaves = (state) => state.auth.leaves;

export default authSlice.reducer;
