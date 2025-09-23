//utils/authUtils.js
import store from "../src/app/store.js";

export const isLoggedIn = () => {
  const state = store.getState();
  return state.auth?.isAuthenticated || false;
};

export const getUser = () => {
  const state = store.getState();
  return state.auth?.user || null;
};

export const getUserId = () => {
  return getUser()?.id || null;
};

export const getUserRole = () => {
  // If your user has a single role field
  return getUser()?.role || null;

  // OR if user has multiple roles, adapt:
  // return getUser()?.roles || [];
};

// ✅ Dynamic role check
export const hasRole = (roleName) => {
  const role = getUserRole();
  if (!role) return false;

  // if backend sends one role as string
  if (typeof role === "string") {
    return role.toLowerCase() === roleName.toLowerCase();
  }

  // if backend sends roles as array
  if (Array.isArray(role)) {
    return role.map(r => r.toLowerCase()).includes(roleName.toLowerCase());
  }

  return false;
};

// ✅ More flexible: check multiple
export const hasAnyRole = (roles = []) => {
  if (!roles?.length) return false;
  const role = getUserRole();
  if (!role) return false;

  if (typeof role === "string") {
    return roles.map(r => r.toLowerCase()).includes(role.toLowerCase());
  }

  if (Array.isArray(role)) {
    return role.some(r => roles.map(rr => rr.toLowerCase()).includes(r.toLowerCase()));
  }

  return false;
};
