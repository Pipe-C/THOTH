import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { AuthContextType, User } from "../types/index";
import { MOCK_CURRENT_USER } from "../services/mockData";
// import { loginRequest, getMeRequest } from "../services/auth.service";
// import { setAuthToken } from "../services/api";
// import { saveToken, getToken, removeToken } from "../services/data/storage";
// import { getItem, removeItem, saveItem } from "../services/data/storage.repository";
// import { STORAGE_KEYS } from "../constants/storageKeys";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const login = async (email: string, password: string) => {
    try {
      const userData = MOCK_CURRENT_USER;

      setUser({
          uid: userData.uid,
          email: userData.email,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          activeProfile: userData.activeProfile,
      });
    } catch (error) {
      console.log("Error login:", error);
      throw error;
    }
  };

  const logout = async () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }

  return context;
}