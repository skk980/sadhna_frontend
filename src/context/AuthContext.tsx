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
import { BACKEND_URL } from "@/api";

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
  usersloading: boolean;
  logoutLoading: boolean;
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
  const [logoutLoading, setlogoutLoading] = useState(false);
  const [usersloading, setusersloading] = useState(false);
  const [token, setToken] = useState<string | undefined>(undefined);
  const [bhogaSchedule, setBhogaSchedule] = useState<BhogaSchedule | null>(
    null
  );

  // User list state
  const [users, setUsers] = useState<User[]>([]);

  // Expose a fetchUsers handler
  const fetchUsers = async () => {
    setusersloading(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/auth/api/users`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setUsers(res.data.users || []);
      return Promise.resolve();
    } catch (error) {
      console.error("Failed to fetch users:", error.message);
      setUsers([]);
      Promise.reject(error);
    } finally {
      setusersloading(false);
    }
  };

  const loadUserProfile = async (jwtToken: string) => {
    try {
      const res = await axios.get(`${BACKEND_URL}/auth/profile`, {
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
      const res = await axios.post(`${BACKEND_URL}/auth/login`, {
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
    setlogoutLoading(true);
    try {
      // Call backend logout endpoint
      if (token) {
        await axios.post(
          `${BACKEND_URL}/auth/logout`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setAuth({ isAuthenticated: false, user: null });
        setToken(undefined);
        setUsers([]);
        setBhogaSchedule(null);
        // localStorage.removeItem("sadhana_token");
      }
    } catch (error) {
      console.error("Logout API call failed:", error.message);
    } finally {
      // Always clear frontend state regardless of API success/failure

      setlogoutLoading(false);
    }
  };

  const registerUser = async (
    name: string,
    email: string,
    isBaseMember: boolean,
    password = "password"
  ): Promise<boolean> => {
    try {
      const res = await axios.post(
        `${BACKEND_URL}/auth/register`,
        {
          name,
          email,
          password,
          role: "user",
          adminId: auth.user?._id,
          isBaseMember,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return Promise.resolve(res.data.success);
    } catch (err) {
      console.log(err);
      return Promise.reject(err?.response?.data?.message || err?.message);
    }
  };

  const fetchBhogaSchedule = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${BACKEND_URL}/auth/bhoga-schedule`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBhogaSchedule(res.data.schedule || null);
      return Promise.resolve(res.data.schedule);
    } catch (error) {
      setBhogaSchedule(null);
      Promise.reject(error);
      console.log(error.message);
    }
  };

  const updateBhogaSchedule = async (schedule: BhogaSchedule) => {
    if (!token) throw new Error("No auth token");
    await axios.put(`${BACKEND_URL}/auth/bhoga-schedule`, schedule, {
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
        logoutLoading,
        registerUser,
        users,
        fetchUsers,
        usersloading,
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
