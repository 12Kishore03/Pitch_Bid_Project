
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoutes({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // Redirect unauthenticated users to login
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // Allow authenticated users to access the requested page
  return children;
}

export default ProtectedRoutes;
