import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "./app/store";
import { fetchProfile } from "./features/auth/authSlice";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import ProtectedRoute from "./components/ProtectedRoute";
import { isTokenExpired } from "./utils/tokenCheck";
import Notifications from "./pages/Notifications";
import ActivityHistory from "./pages/ActivityHistory";
import Profile from "./pages/Profile";
import Unauthorized from "./pages/Unauthorized";
import RoleManagement from "./pages/RoleManagement";
import PermissionManagement from "./pages/PermissionManagement";
import UserManagement from "./pages/UserManagement";
import Files from "./pages/Files";
import GlobalSearch from "./pages/GlobalSearch";

function App() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && !isTokenExpired(token)) {
      dispatch(fetchProfile());
    }
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <Admin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/activity-history"
          element={
            <ProtectedRoute>
              <ActivityHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route path="/unauthorized" element={<Unauthorized />} />

        <Route
          path="/roles"
          element={
            <ProtectedRoute requiredPermission="roles:manage">
              <RoleManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/permissions"
          element={
            <ProtectedRoute requiredPermission="permissions:manage">
              <PermissionManagement />
            </ProtectedRoute>
          }
        />
       <Route
  path="/users"
  element={
    <ProtectedRoute requiredPermission="users:view">  {/* ← correct */}
      <UserManagement />
    </ProtectedRoute>
  }
/>
        <Route path="/files" element={
  <ProtectedRoute requiredPermission="files:view">
    <Files />
  </ProtectedRoute>
} />
        <Route
  path="/search"
  element={
    <ProtectedRoute requiredPermission="search:read">
      <GlobalSearch />
    </ProtectedRoute>
  }
/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;