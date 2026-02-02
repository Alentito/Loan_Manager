import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

export default function RequireAuth() {
  // RequireAuth.jsx
const { isAuthenticated, user, initialized } = useSelector((state) => state.auth);
console.log("RequireAuth:", { isAuthenticated, user, initialized });
return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
}