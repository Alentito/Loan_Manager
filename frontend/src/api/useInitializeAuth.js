// src/hooks/useInitializeAuth.js
import { useEffect } from "react";
import { useRefreshTokenMutation } from "./authApi";
import { useDispatch } from "react-redux";
import { logoutAction, setAuthenticated, setInitialized } from "./authSlice";

export default function useInitializeAuth() {
  const [refresh] = useRefreshTokenMutation();
  const dispatch = useDispatch();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await refresh().unwrap(); // cookie-based refresh
        if (!mounted) return;
        dispatch(setAuthenticated(true));
      } catch (err) {
        if (!mounted) return;
        dispatch(logoutAction()); // clear app state if refresh fails
      } finally {
        if (mounted) dispatch(setInitialized(true));
      }
    })();
    return () => { mounted = false; };
  }, [refresh, dispatch]);
}
