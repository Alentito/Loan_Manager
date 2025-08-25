// services/authApi.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import baseQueryWithReauth from "./baseApi"; // Import the base query with re-authentication

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: baseQueryWithReauth, // Use the base query with re-authentication
  tagTypes: ["Auth"], // For caching and invalidation
  endpoints: (builder) => ({
    refreshToken: builder.mutation({
      query: () => ({
        url: "token/refresh/",
        method: "POST",
      }),
    }),
    login: builder.mutation({
      query: (body) => ({
        url: "token/", // or your JWT endpoint, e.g. 'token/' or 'login/'
        method: "POST",
        body,
      }),
    }),
    getPermissions: builder.query({
      query: () => "permissions/",
    }),
    getGroups: builder.query({
      query: () => "groups/",
    }),
    createGroup: builder.mutation({
      query: (body) => ({
        url: "groups/",
        method: "POST",
        body,
      }),
    }),
    logout: builder.mutation({
      query: () => ({
        url: "logout/",
        method: "POST",
        credentials: "include",
      }),
    }),
    getMe: builder.query({
      query: () => "me/",
    }),
  }),
});

export const {
  useLoginMutation,
  useRefreshTokenMutation,
  useGetPermissionsQuery,
  useGetGroupsQuery,
  useCreateGroupMutation,
  useLogoutMutation,
  useLazyGetPermissionsQuery,
  useGetMeQuery,
  useLazyGetMeQuery,
} = authApi;
