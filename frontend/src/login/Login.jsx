import { useState } from "react";
import { useLoginMutation, useRefreshTokenMutation } from "../api/authApi"; // adjust path if needed
import { useNavigate } from "react-router-dom";

export default function Login() {


  const [refreshToken] = useRefreshTokenMutation();

const tryRefresh = async () => {
  const refresh = localStorage.getItem("refresh");
  if (!refresh) return false;
  try {
    const res = await refreshToken(refresh).unwrap();
    localStorage.setItem("access", res.access);
    return true;
  } catch {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    return false;
  }
};
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [login, { isLoading, error }] = useLoginMutation();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await login({ username, password }).unwrap();
      // Save token to localStorage (if not handled by RTK Query)
      localStorage.setItem("access", res.access);
      localStorage.setItem("refresh", res.refresh);
      navigate("/dashboard");
    } catch (err) {
      // error handled below
    }
  };
  const handleAuthError = () => { // <-- Place here
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    navigate("/login");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-blue-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        <input
          className="w-full mb-4 p-2 border rounded"
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
        <input
          className="w-full mb-4 p-2 border rounded"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        {error && <div className="text-red-500 mb-2">Invalid credentials</div>}
        <button
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}