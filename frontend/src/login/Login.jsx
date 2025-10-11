import { useState } from "react";
import { useLoginMutation, useLazyGetMeQuery } from "../api/authApi";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setAuthenticated } from "../api/authSlice";
import { loanApi } from "../api/loanApi";
import { Eye, EyeOff, Mail, Lock, Loader2, LogIn } from "lucide-react";
import { useMarkAttendanceMutation, useLazyGetTodayAttendanceQuery } from "../api/attendanceApi";
import { useLazyGetActiveBreakQuery } from "../api/breakApi";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [login, { isLoading, error }] = useLoginMutation();
  const [triggerGetMe] = useLazyGetMeQuery();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [errorMsg, setErrorMsg] = useState("");

  const [markAttendance] = useMarkAttendanceMutation();
  const [triggerGetTodayAttendance] = useLazyGetTodayAttendanceQuery();
  const [triggerGetActiveBreak] = useLazyGetActiveBreakQuery();

  const apiError =
    errorMsg ||
    error?.data?.detail ||
    (typeof error?.data === "string" ? error.data : null) ||
    (error ? "Invalid credentials" : null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      // 1) Login
      await login({ username, password }).unwrap();

      // 2) Reset API cache to avoid stale data after auth
      dispatch(loanApi.util.resetApiState());

      // 3) Fetch current user
      const user = await triggerGetMe().unwrap();
      if (!user) throw new Error("Failed to fetch user info.");

      // 4) Mark today's attendance (safe to ignore failures)
      try {
        const employeeId = user.employee_id || user.employee?.id || user.id;
        const todayDate = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
        await markAttendance({
          employee: employeeId,
          date: todayDate,
          status: "PRESENT", // or your logic for status
        }).unwrap();
      } catch (err) {
        console.warn("Mark attendance skipped:", err);
      }

      // 5) Fetch today's attendance (normalize to array)
      let today = [];
      try {
        const todayData = await triggerGetTodayAttendance().unwrap();
        today = todayData ? (Array.isArray(todayData) ? todayData : [todayData]) : [];
      } catch (err) {
        console.warn("Today attendance not found:", err);
      }

      // 6) Save to Redux
      dispatch(
        setAuthenticated({
          user,
          attendance: today,
        })
      );

      // 7) If an active break exists, route to it
      try {
        const activeBreak = await triggerGetActiveBreak().unwrap();
        if (activeBreak?.has_active_break && activeBreak?.break?.id) {
          navigate(`/breaks/${activeBreak.break.id}`);
          return;
        }
      } catch (err) {
        console.warn("Active break check failed:", err);
      }

      // 8) Go to dashboard
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setErrorMsg(err?.data?.detail || "Login failed. Please check your credentials.");
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center
      bg-gradient-to-br from-indigo-50 via-white to-blue-50
      dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-900"
    >
      <div className="w-full max-w-md px-4">
        <div
          className="rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 backdrop-blur
          dark:bg-slate-900/70 dark:ring-slate-800"
        >
          <div className="px-6 pt-7 pb-3 text-center">
            <div
              className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl
              bg-gradient-to-tr from-blue-600 to-blue-500 text-white shadow-md
              dark:from-blue-500 dark:to-blue-400"
            >
              <LogIn size={18} />
            </div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Sign in to continue to your dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 pb-7 space-y-4">
            {apiError && (
              <div
                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700
                dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
              >
                {apiError}
              </div>
            )}

            <div>
              <label htmlFor="username" className="sr-only">
                Username
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400 dark:text-slate-500">
                  <Mail size={18} />
                </div>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  className="w-full rounded-lg border border-slate-200 bg-white px-10 py-2.5 text-slate-900 placeholder-slate-400 shadow-sm
                    focus:border-blue-500 focus:ring-4 focus:ring-blue-100
                    dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-100 dark:placeholder-slate-500
                    dark:focus:border-blue-500 dark:focus:ring-blue-900/40"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400 dark:text-slate-500">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-slate-200 bg-white px-10 py-2.5 pr-12 text-slate-900 placeholder-slate-400 shadow-sm
                    focus:border-blue-500 focus:ring-4 focus:ring-blue-100
                    dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-100 dark:placeholder-slate-500
                    dark:focus:border-blue-500 dark:focus:ring-blue-900/40"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute inset-y-0 right-3 inline-flex items-center text-slate-400 hover:text-slate-600
                    dark:text-slate-500 dark:hover:text-slate-300"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group inline-flex w-full items-center justify-center gap-2 rounded-lg
                bg-blue-600 px-4 py-2.5 text-white shadow-md shadow-blue-600/20 transition
                hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60
                dark:bg-blue-500 dark:hover:bg-blue-600 dark:active:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Sign in
                </>
              )}
            </button>

            <div className="text-center text-xs text-slate-500 dark:text-slate-500">
              By continuing you agree to our Terms & Privacy.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
