// src/components/redux/authBaseQuery.js
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';

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

export const customBaseQuery = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result?.error?.status === 401) {
    // If a refresh is already running, wait for it
    if (!refreshing) {
      refreshing = (async () => {
        // call refresh endpoint — it will read cookie on server and set new cookie
        const refreshResult = await baseQuery({ url: 'token/refresh/', method: 'POST' }, api, extraOptions);
        if (refreshResult?.error) {
          // try server-side logout to clear cookies, then update client state
          await baseQuery({ url: 'employees/logout/', method: 'POST' }, api, extraOptions);
          api.dispatch({ type: 'auth/logout' });
          return { ok: false, data: null };
        }
        // return refreshResult so caller can inspect body (e.g. access token)
        return { ok: true, data: refreshResult.data };
      })().finally(() => {
        // we'll keep refreshing as a Promise until resolved
      });
    }

    const refreshFinished = await refreshing;
    // reset for future attempts
    refreshing = null;

    if (refreshFinished && refreshFinished.ok) {
      // If server returned access in body, attach Authorization header for the retry
      const accessFromBody = refreshFinished.data?.access;
      if (accessFromBody) {
        // normalize args into object form for retry
        const retryArgs = typeof args === 'string' ? { url: args } : { ...args };
        retryArgs.headers = {
          ...(retryArgs.headers || {}),
          Authorization: `Bearer ${accessFromBody}`,
        };
        result = await baseQuery(retryArgs, api, extraOptions);
      } else {
        // otherwise rely on cookie set by refresh; retry original
        result = await baseQuery(args, api, extraOptions);
      }
    }
  }

  return result;
};
