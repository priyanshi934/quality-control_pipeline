import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/authService";

interface User {
  email: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in on mount
    const storedToken = authService.getStoredToken();
    const storedUser = authService.getStoredUser();

    if (storedToken) {
      // Verify token is still valid
      authService.verifyToken(storedToken).then((response) => {
        if (response.valid && storedUser.email) {
          setToken(storedToken);
          setUser(storedUser as User);
        } else {
          // Token is invalid, clear storage
          authService.clearToken();
        }
        setIsLoading(false);
      }).catch(() => {
        authService.clearToken();
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  const logout = () => {
    authService.clearToken();
    setToken(null);
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
