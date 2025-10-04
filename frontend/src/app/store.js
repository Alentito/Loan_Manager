// src/app/store.js
import { configureStore } from '@reduxjs/toolkit';
import selectedLoansReducer from "../api/selectedLoansSlice";
import { milestoneApi } from '../api/milestoneApi';

import { loanApi } from '../api/loanApi';
import { auditApi } from '../api/auditApi';
import { brokerApi } from '../api/brokerApi';
import { loanOfficerApi } from '../api/loanOfficerApi';
import { employeeApi } from '../api/employeeApi';
import { authApi } from '../api/authApi';

import authReducer from "../api/authSlice"; // <--- ADD THIS


import { holidayApi } from '../api/holidayApi';
import { meetingApi } from '../api/meetingApi';
import { leaveApi } from '../api/leaveApi';
import { shiftApi } from '../api/shiftApi';
import { teamApi } from '../api/teamApi';

export const store = configureStore({
  reducer: {
    selectedLoans: selectedLoansReducer,

    // add auth reducer under the `auth` key so useSelector(state => state.auth) works
    auth: authReducer,                 // <-- IMPORTANT

    // RTK Query reducers
    [authApi.reducerPath]: authApi.reducer,
    [loanApi.reducerPath]: loanApi.reducer,
    [auditApi.reducerPath]: auditApi.reducer,
    [brokerApi.reducerPath]: brokerApi.reducer,
    [loanOfficerApi.reducerPath]: loanOfficerApi.reducer,
    [employeeApi.reducerPath]: employeeApi.reducer,
    [holidayApi.reducerPath]: holidayApi.reducer,
    [meetingApi.reducerPath]: meetingApi.reducer,
    [leaveApi.reducerPath]: leaveApi.reducer,
    [shiftApi.reducerPath]: shiftApi.reducer,
    [teamApi.reducerPath]: teamApi.reducer,
    [milestoneApi.reducerPath]: milestoneApi.reducer,

    
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(loanApi.middleware)
      .concat(auditApi.middleware)
      .concat(brokerApi.middleware)
      .concat(loanOfficerApi.middleware)
      .concat(employeeApi.middleware)
      .concat(holidayApi.middleware)
      .concat(meetingApi.middleware)
      .concat(leaveApi.middleware)
      .concat(shiftApi.middleware)
      .concat(teamApi.middleware)
      .concat(milestoneApi.middleware)
      
});

// also export default for easier imports
export default store;
