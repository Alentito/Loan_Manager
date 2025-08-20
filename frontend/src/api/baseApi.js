// src/services/baseApi.js
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { logoutAction } from './authSlice'; // adjust path if needed

let refreshing = null; // Promise shared between requests

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";").map(c => c.trim());
    for (let cookie of cookies) {
      if (cookie.startsWith(name + "=")) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

const baseQuery = fetchBaseQuery({
  baseUrl: 'http://localhost:8000/api/',
  credentials: 'include',
  prepareHeaders: (headers) => {
    headers.set('X-CSRFToken', getCookie('csrftoken') || '');
    return headers;
  }
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  // If the request returned 401, try refreshing once
  if (result?.error?.status === 401) {
    if (!refreshing) {
      refreshing = (async () => {
        try {
          const refreshResult = await baseQuery(
            { url: 'token/refresh/', method: 'POST' },
            api,
            extraOptions
          );

          // If refresh failed (no cookie, expired, etc.) -> logout
          if (refreshResult?.error) {
            api.dispatch(logoutAction());
            return false;
          }

          // Refresh succeeded
          return true;
        } catch (err) {
          // Unexpected error during refresh -> logout
          api.dispatch(logoutAction());
          return false;
        } finally {
          // leave resetting to caller after awaiting
        }
      })();
    }

    const success = await refreshing;
    refreshing = null; // reset for future attempts

    if (!success) {
      // Refresh failed -> return original 401 result so callers can handle it
      return result;
    }

    // Refresh succeeded -> retry original request
    result = await baseQuery(args, api, extraOptions);
  }

  return result;
};

export default baseQueryWithReauth;
