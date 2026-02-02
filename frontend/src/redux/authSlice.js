// src/components/redux/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isAuthenticated: !!localStorage.getItem('access_token'),
  user: JSON.parse(localStorage.getItem('employeeData') || 'null'),
  role: localStorage.getItem('employeeRole') || null,
  accessToken: localStorage.getItem('access_token') || null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      const { access, refresh, employee } = action.payload;

      // Persist to localStorage
      localStorage.setItem('access_token', access);
      if (refresh) localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('employeeData', JSON.stringify(employee));
      localStorage.setItem('employeeRole', employee.position);

      // Update state
      state.isAuthenticated = true;
      state.user = employee;
      state.role = employee.position;
      state.accessToken = access;
    },

    logout: (state) => {
      // Clear all auth-related localStorage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('employeeData');
      localStorage.removeItem('employeeRole');

      // Reset state
      state.isAuthenticated = false;
      state.user = null;
      state.role = null;
      state.accessToken = null;
    },

    rehydrate: (state) => {
      const access = localStorage.getItem('access_token');
      const employee = JSON.parse(localStorage.getItem('employeeData') || 'null');
      const role = localStorage.getItem('employeeRole');

      if (access && employee) {
        state.accessToken = access;
        state.user = employee;
        state.role = role;
        state.isAuthenticated = true;
      }
    },
  },
});

export const { loginSuccess, logout, rehydrate } = authSlice.actions;
export default authSlice.reducer;
