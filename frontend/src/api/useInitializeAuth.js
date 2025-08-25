import { useEffect } from "react";
import { useRefreshTokenMutation, useLazyGetMeQuery } from "../api/authApi";
import { useDispatch } from "react-redux";
import { logoutAction, setAuthenticated, setInitialized } from "../api/authSlice";

export default function useInitializeAuth() {
  const [refresh] = useRefreshTokenMutation();
  const dispatch = useDispatch();

  const [triggerGetMe] = useLazyGetMeQuery();

useEffect(() => {
  let mounted = true;
  (async () => {
    try {
      await refresh().unwrap();
      const result = await triggerGetMe();
      const user = result.data;
      if (!mounted) return;
      dispatch(setAuthenticated(user));
    } catch (err) {
      if (!mounted) return;
      dispatch(logoutAction());
    } finally {
      if (mounted) dispatch(setInitialized(true));
    }
  })();
  return () => { mounted = false; };
}, [refresh, triggerGetMe, dispatch]);
}