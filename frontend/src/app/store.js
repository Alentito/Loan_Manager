// src/app/store.js
import { configureStore } from '@reduxjs/toolkit';
import selectedLoansReducer from "../api/selectedLoansSlice";
import { loanApi } from '../api/loanApi';
import { auditApi } from '../api/auditApi';
import { brokerApi } from '../api/brokerApi';
import { loanOfficerApi} from '../api/loanOfficerApi';
import { employeeApi } from '../api/employeeApi';
//import authReducer from '../features/auth/authSlice';

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
    
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(loanApi.middleware)
      .concat(auditApi.middleware)
      //kishke middleware
      .concat(brokerApi.middleware)
      .concat(loanOfficerApi.middleware)
      .concat(employeeApi.middleware),
});
