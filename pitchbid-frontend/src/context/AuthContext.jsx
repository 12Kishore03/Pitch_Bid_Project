
import {
  createContext,
  useContext,
  useState,
} from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {

  // Restore the existing login session after refresh.
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("pitchbid_user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      localStorage.removeItem("pitchbid_user");
      localStorage.removeItem("pitchbid_token");
      return null;
    }
  });

  // Save authenticated user and JWT token.
  const login = (userData) => {

    localStorage.setItem(
      "pitchbid_token",
      userData.token
    );

    const userDetails = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
    };

    localStorage.setItem(
      "pitchbid_user",
      JSON.stringify(userDetails)
    );

    setUser(userDetails);
  };

  // Clear authentication details.
  const logout = () => {

    localStorage.removeItem("pitchbid_token");
    localStorage.removeItem("pitchbid_user");

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

export function useAuth() {

  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}
