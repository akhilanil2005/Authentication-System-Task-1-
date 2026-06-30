import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import AdminRoute from "./components/AdminRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import { useEffect } from "react";
import { isTokenExpired } from "./utils/tokenCheck";
import Notifications from "./pages/Notifications";
import ActivityHistory from "./pages/ActivityHistory";
import Profile from "./pages/Profile";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
      <Route path="/admin" element={
    <AdminRoute>
      <Admin />
    </AdminRoute>
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
<Route path="/profile" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;