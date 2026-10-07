
import { createContext, useContext, useState } from "react";


// Create the authentication context
const AuthContext = createContext(null);


// Authentication Provider
export function AuthProvider({ children }) {

  const [user, setUser] = useState(null);


  // Login
  const login = (userData) => {
    setUser(userData);
  };


  // Logout
  const logout = () => {
    setUser(null);
  };


  const value = {
    user,
    isAuthenticated: user !== null,
    login,
    logout,
  };


  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}


// Custom hook
export function useAuth() {

  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}

