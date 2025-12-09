import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import { brokerApi } from './brokerApi';
import { loanOfficerApi } from './loanOfficerApi';
import { employeeApi } from './employeeApi';
import { holidayApi } from './holidayApi';
import { meetingApi } from './meetingApi';
import { leaveApi } from './leaveApi';
import { shiftApi } from './shiftApi';
import { teamApi } from './teamApi';

const store = configureStore({
  reducer: {
    auth: authReducer,
    [brokerApi.reducerPath]: brokerApi.reducer,
    [loanOfficerApi.reducerPath]: loanOfficerApi.reducer,
    [employeeApi.reducerPath]: employeeApi.reducer,
    [holidayApi.reducerPath]: holidayApi.reducer,
    [meetingApi.reducerPath]: meetingApi.reducer,
    [leaveApi.reducerPath]: leaveApi.reducer,
    [shiftApi.reducerPath]: shiftApi.reducer,
    [teamApi.reducerPath]: teamApi.reducer,

  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(brokerApi.middleware)
      .concat(loanOfficerApi.middleware)
      .concat(employeeApi.middleware)
      .concat(holidayApi.middleware)
      .concat(meetingApi.middleware)
      .concat(leaveApi.middleware)
      .concat(shiftApi.middleware)
      .concat(teamApi.middleware)

});

export default store;
