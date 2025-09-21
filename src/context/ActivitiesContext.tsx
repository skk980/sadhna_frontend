// src/context/ActivitiesContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import axios from "axios";
import { Activity } from "@/types";
import { useAuth } from "@/context/AuthContext";

interface ActivitiesContextType {
  activities: Activity[];
  loading: boolean;
  addActivity: (
    activity: Omit<Activity, "id" | "createdAt" | "updatedAt">
  ) => Promise<boolean>;
  updateActivity: (id: string, updates: Partial<Activity>) => Promise<boolean>;
  getActivityByDate: (date: string) => Activity | undefined;
  canEditActivity: (date: string) => boolean;
  loadActivities: () => Promise<void>;
}

const ActivitiesContext = createContext<ActivitiesContextType | undefined>(
  undefined
);

export const ActivitiesProvider = ({ children }: { children: ReactNode }) => {
  const { auth, token } = useAuth();
  const userId = auth.user?._id;
  console.log(userId, "id");

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  // Using useCallback to avoid recreating the function on every render
  const loadActivities = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setActivities([]);
      return;
    }
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:4000/activities", {
        params: userId ? { userId } : {},
        headers: { Authorization: `Bearer ${token}` },
      });
      setActivities(res.data.activities || []);
    } catch (error) {
      console.error("Error loading activities:", error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [token, userId]);

  useEffect(() => {
    if (token && userId) {
      loadActivities();
    } else {
      setLoading(false);
      setActivities([]);
    }
  }, [token, userId, loadActivities]);

  const addActivity = async (
    activity: Omit<Activity, "id" | "createdAt" | "updatedAt">
  ) => {
    if (!token) {
      console.error("Missing auth token for adding activity");
      return false;
    }
    try {
      const res = await axios.post(
        "http://localhost:4000/activities",
        activity,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setActivities((prev) => [res.data.activity, ...prev]);
      return true;
    } catch (error) {
      console.error("Error adding activity:", error);
      return false;
    }
  };

  const updateActivity = async (id: string, updates: Partial<Activity>) => {
    if (!token) {
      console.error("Missing auth token for updating activity");
      return false;
    }
    try {
      const res = await axios.put(
        `http://localhost:4000/activities/${id}`,
        updates,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setActivities((prev) =>
        prev.map((a) => (a._id === id ? res.data.activity : a))
      );
      return true;
    } catch (error) {
      console.error("Error updating activity:", error);
      return false;
    }
  };

  const getActivityByDate = (date: string) =>
    activities.find((a) => a.date === date);

  const canEditActivity = (date: string) => {
    const today = new Date().toISOString().split("T")[0];
    return date === today;
  };

  return (
    <ActivitiesContext.Provider
      value={{
        activities,
        loading,
        addActivity,
        updateActivity,
        getActivityByDate,
        canEditActivity,
        loadActivities,
      }}
    >
      {children}
    </ActivitiesContext.Provider>
  );
};

// Custom hook for easy use
export const useActivities = (): ActivitiesContextType => {
  const context = useContext(ActivitiesContext);
  if (!context) {
    throw new Error("useActivities must be used within an ActivitiesProvider");
  }
  return context;
};
