
import { Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";


function ProtectedRoutes({ children }) {

  const { isAuthenticated } = useAuth();


  // User is not logged in
  if (!isAuthenticated) {

    return <Navigate to="/login" replace />;

  }


  // User is authenticated
  return children;
}


export default ProtectedRoutes;

