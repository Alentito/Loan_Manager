// src/app/store.js
import { configureStore } from '@reduxjs/toolkit';
import selectedLoansReducer from "../api/selectedLoansSlice";
import { loanApi } from '../api/loanApi';
import { auditApi } from '../api/auditApi';
import { brokerApi } from '../api/brokerApi';
import { loanOfficerApi} from '../api/loanOfficerApi';
import { employeeApi } from '../api/employeeApi';
<<<<<<< HEAD
//import authReducer from '../features/auth/authSlice';
=======
import { authApi } from '../api/authApi';
import authReducer from "../api/authSlice"; // <--- ADD THIS

import { attendanceApi } from "../api/attendanceApi";
import { holidayApi } from '../api/holidayApi';
import { meetingApi } from '../api/meetingApi';
import { leaveApi } from '../api/leaveApi';
import { shiftApi } from '../api/shiftApi';
import { teamApi } from '../api/teamApi';
import { breakApi } from '../api/breakApi';
import { attendanceSummaryApi } from "../api/attendanceSummaryApi";
import { lenderApi } from '../api/lenderApiSlice';
import { teamLeadApi } from '../api/teamLeadApi';
import { teamManagerApi} from '../api/teamManagerApi';
import { tokenApi } from '../api/tokenApi';

>>>>>>> 00f6f991e (Initial commit of backend and frontend project)

export const store = configureStore({
  reducer: {
    selectedLoans: selectedLoansReducer,
    
     //auth: authReducer,
    [loanApi.reducerPath]: loanApi.reducer,
    [auditApi.reducerPath]: auditApi.reducer,
    //kishke reducer
    [brokerApi.reducerPath]: brokerApi.reducer,
    [loanOfficerApi.reducerPath]: loanOfficerApi.reducer,
    [employeeApi.reducerPath]: employeeApi.reducer,
<<<<<<< HEAD
    
=======
    [holidayApi.reducerPath]: holidayApi.reducer,
    [meetingApi.reducerPath]: meetingApi.reducer,
    [leaveApi.reducerPath]: leaveApi.reducer,
    [shiftApi.reducerPath]: shiftApi.reducer,
    [teamApi.reducerPath]: teamApi.reducer,
    [attendanceApi.reducerPath]: attendanceApi.reducer,
    [breakApi.reducerPath]: breakApi.reducer,
    [attendanceSummaryApi.reducerPath]: attendanceSummaryApi.reducer,
    [lenderApi.reducerPath]: lenderApi.reducer,
    [teamLeadApi.reducerPath]: teamLeadApi.reducer,
    [teamManagerApi.reducerPath]: teamManagerApi.reducer,
    [tokenApi.reducerPath]: tokenApi.reducer,

>>>>>>> 00f6f991e (Initial commit of backend and frontend project)
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(loanApi.middleware)
      .concat(auditApi.middleware)
      //kishke middleware
      .concat(brokerApi.middleware)
      .concat(loanOfficerApi.middleware)
<<<<<<< HEAD
      .concat(employeeApi.middleware),
=======
      .concat(employeeApi.middleware)
      .concat(holidayApi.middleware)
      .concat(meetingApi.middleware)
      .concat(leaveApi.middleware)
      .concat(shiftApi.middleware)
      .concat(teamApi.middleware)
      .concat(attendanceApi.middleware)
      .concat(breakApi.middleware)
      .concat(attendanceSummaryApi.middleware)
      .concat(lenderApi.middleware)
      .concat(teamLeadApi.middleware)
      .concat(teamManagerApi.middleware)
      .concat(tokenApi.middleware)

>>>>>>> 00f6f991e (Initial commit of backend and frontend project)
});
