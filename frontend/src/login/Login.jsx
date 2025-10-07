// frontend/src/login/Login.jsx
import { useState } from "react";
import { useLoginMutation, useLazyGetMeQuery } from "../api/authApi";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setAuthenticated } from "../api/authSlice";
import { useMarkAttendanceMutation, useLazyGetTodayAttendanceQuery } from "../api/attendanceApi";
import { useLazyGetActiveBreakQuery } from "../api/breakApi";


export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [login, { isLoading }] = useLoginMutation();
  const [triggerGetMe] = useLazyGetMeQuery();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [errorMsg, setErrorMsg] = useState("");
  const [markAttendance] = useMarkAttendanceMutation();
  const [triggerGetTodayAttendance] = useLazyGetTodayAttendanceQuery();
  const [triggerGetActiveBreak] = useLazyGetActiveBreakQuery();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      // 1️⃣ Login
      await login({ username, password }).unwrap();

      // 2️⃣ Fetch current user (unwrap ensures we get the actual object)
      const user = await triggerGetMe().unwrap();
      if (!user) throw new Error("Failed to fetch user info.");

      // 3️⃣ Mark today's attendance (if your backend requires employee, pass user.id)
      try {
        await markAttendance({ employee: user.id }).unwrap();
      } catch (err) {
        console.warn("Mark attendance skipped:", err);
      }

      // 4️⃣ Fetch today's attendance
      let today = [];
      try {
        const todayData = await triggerGetTodayAttendance().unwrap();
        today = todayData ? [todayData] : [];
      } catch (err) {
        console.warn("Today attendance not found:", err);
      }

      // 5️⃣ Save to Redux
      dispatch(
        setAuthenticated({
          user,
          attendance: today,
        })
      );

      try {
        const activeBreak = await triggerGetActiveBreak().unwrap();
        if (activeBreak.has_active_break) {
          // Store active break in Redux so BreakPage can show overlay
          dispatch(setAuthenticated({
            user,
            attendance: today,
            activeBreak: activeBreak.break
          }));

          // Navigate to dashboard as usual
          navigate("/dashboard");
          return;
        }

      } catch (err) {
        console.warn("Active break check failed:", err);
      }

      // 6️⃣ Navigate
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setErrorMsg(
        err?.data?.detail || "Login failed. Please check your credentials."
      );
    }
  };


  return (
    <div className="flex items-center justify-center min-h-screen bg-blue-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow-md w-96"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

        <input
          className="w-full mb-4 p-2 border rounded"
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <input
          className="w-full mb-4 p-2 border rounded"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {errorMsg && <div className="text-red-500 mb-2">{errorMsg}</div>}

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
