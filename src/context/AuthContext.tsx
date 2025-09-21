// src/context/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
} from "react";
import axios from "axios";
import debounce from "lodash.debounce";
import { User, AuthState } from "@/types";

interface BhogaSchedule {
  monday?: string | null;
  tuesday?: string | null;
  wednesday?: string | null;
  thursday?: string | null;
  friday?: string | null;
  saturday?: string | null;
  sunday?: string | null;
}

interface AuthContextType {
  auth: AuthState;
  loading: boolean;
  token?: string;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  registerUser: (
    name: string,
    email: string,
    password?: string
  ) => Promise<boolean>;
  users: User[];
  fetchUsers: () => void;
  bhogaSchedule: BhogaSchedule | null;
  fetchBhogaSchedule: () => Promise<void>;
  updateBhogaSchedule: (schedule: BhogaSchedule) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
  });
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | undefined>(undefined);
  const [bhogaSchedule, setBhogaSchedule] = useState<BhogaSchedule | null>(
    null
  );

  // User list state
  const [users, setUsers] = useState<User[]>([]);

  // Debounced fetchUsers function
  const debouncedFetchUsers = useMemo(
    () =>
      debounce(async () => {
        try {
          const res = await axios.get("http://localhost:4000/auth/api/users", {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
          setUsers(res.data.users || []);
        } catch (error) {
          console.error("Failed to fetch users:", error);
          setUsers([]);
        }
      }, 300),
    [token]
  );

  // Expose a fetchUsers handler
  const fetchUsers = () => {
    debouncedFetchUsers();
  };

  const loadUserProfile = async (jwtToken: string) => {
    try {
      const res = await axios.get("http://localhost:4000/auth/profile", {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      setAuth({ isAuthenticated: true, user: res.data.user });
      setToken(jwtToken);
    } catch {
      setAuth({ isAuthenticated: false, user: null });
      setToken(undefined);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadUserProfile(token);
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await axios.post("http://localhost:4000/auth/login", {
        email,
        password,
      });
      setAuth({ isAuthenticated: true, user: res.data.user });
      setToken(res.data.token);
      return true;
    } catch {
      setAuth({ isAuthenticated: false, user: null });
      setToken(undefined);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Call backend logout endpoint
      if (token) {
        await axios.post(
          "http://localhost:4000/auth/logout",
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      // Always clear frontend state regardless of API success/failure
      setAuth({ isAuthenticated: false, user: null });
      setToken(undefined);
      setUsers([]);
      setBhogaSchedule(null);
      localStorage.removeItem("sadhana_token");
    }
  };

  const registerUser = async (
    name: string,
    email: string,
    password = "password"
  ): Promise<boolean> => {
    try {
      const res = await axios.post(
        "http://localhost:4000/auth/register",
        {
          name,
          email,
          password,
          role: "user",
          adminId: auth.user?._id,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return res.data.success || true;
    } catch {
      return false;
    }
  };

  const fetchBhogaSchedule = async () => {
    if (!token) return;
    try {
      const res = await axios.get("http://localhost:4000/auth/bhoga-schedule", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBhogaSchedule(res.data.schedule || null);
      return res;
    } catch (error) {
      setBhogaSchedule(null);
    }
  };

  const updateBhogaSchedule = async (schedule: BhogaSchedule) => {
    if (!token) throw new Error("No auth token");
    await axios.put("http://localhost:4000/auth/bhoga-schedule", schedule, {
      headers: { Authorization: `Bearer ${token}` },
    });
    await fetchBhogaSchedule();
    // setBhogaSchedule(schedule);
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        auth,
        loading,
        token,
        login,
        logout,
        registerUser,
        users,
        fetchUsers,
        bhogaSchedule,
        fetchBhogaSchedule,
        updateBhogaSchedule,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
};
