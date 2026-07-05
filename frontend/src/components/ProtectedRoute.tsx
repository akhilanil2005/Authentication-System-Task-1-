import { useEffect,useState } from "react";
import { Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import type { ReactNode } from "react";
import type { RootState, AppDispatch } from "../app/store";
import { fetchProfile } from "../features/auth/authSlice";

type Props = {
  children: ReactNode;
  requiredPermission?: string;
  requiredRole?: string;
};

function ProtectedRoute({ children, requiredPermission, requiredRole }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const { token, user, profileLoading } = useSelector((s: RootState) => s.auth);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (token && !user && !profileLoading) {
      dispatch(fetchProfile());
    }
  }, [token, user, profileLoading, dispatch]);
  useEffect(() => {
  if (!user) {
    const timer = setTimeout(() => setTimedOut(true), 5000);
    return () => clearTimeout(timer);
  }
}, [user]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

 if (!user) {
  if (timedOut) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <p>Something went wrong loading your profile.</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }
  return <p style={{ padding: "40px", textAlign: "center" }}>Loading...</p>;
}
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requiredPermission && !user?.permissions?.includes(requiredPermission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;