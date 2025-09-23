import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

// utils
import {  hasAnyRole } from "../../utils/authUtils";

export default function ProtectedRoute({ 
  children, 
  requiredRoles = [], 
  requiredPermissions = [] 
}) {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Check permissions
  const userPermissions = user?.permissions || [];
  const hasPermission = 
    requiredPermissions.length === 0 ||
    requiredPermissions.some((perm) => userPermissions.includes(perm));

  // ✅ Check roles
  const hasRequiredRole =
    requiredRoles.length === 0 ||
    hasAnyRole(requiredRoles);

  // ❌ If user doesn't have role or permission
  if (!hasPermission || !hasRequiredRole) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2>🚫 Access Denied</h2>
      <p>You don’t have permission to view this page.</p>
    </div>;
  }

  // ✅ Otherwise, allow access
  return children;
}
