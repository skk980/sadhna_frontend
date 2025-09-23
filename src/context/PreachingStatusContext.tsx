import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";
import { useToast } from "@/hooks/use-toast";

import { BACKEND_URL } from "@/api";

interface PreachingStatus {
  userId: string;
  date: string;
  status: string;
  attended: boolean;
}

interface PreachingStatusMap {
  [date: string]: {
    [userId: string]: PreachingStatus;
  };
}

interface PreachingStatusContextType {
  preachingStatuses: PreachingStatusMap;
  loading: boolean;
  loadPreachingStatuses: (dates: string[]) => Promise<void>;
  updatePreachingStatusesBulk: (
    date: string,
    updates: Partial<PreachingStatus>[]
  ) => Promise<void>;
  updatePreachingStatus: () => void;
}

const PreachingStatusContext = createContext<
  PreachingStatusContextType | undefined
>(undefined);

export const PreachingStatusProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { token, auth } = useAuth();
  const { toast } = useToast();
  const [preachingStatuses, setPreachingStatuses] =
    useState<PreachingStatusMap>({});
  const [loading, setLoading] = useState(false);

  const loadPreachingStatuses = useCallback(
    async (dates: string[]) => {
      if (!token) return;
      setLoading(true);
      try {
        const newStatuses: PreachingStatusMap = {};

        for (const date of dates) {
          const res = await axios.get(`${BACKEND_URL}/preachingStatus`, {
            params: { date },
            headers: { Authorization: `Bearer ${token}` },
          });

          const nestedStatuses: Record<
            string,
            Record<string, PreachingStatus>
          > = {};

          newStatuses[date] = {};

          res.data.statuses.forEach(
            (status: PreachingStatus & { contactNumber: string }) => {
              const { userId, contactNumber } = status;
              if (!nestedStatuses[userId]) nestedStatuses[userId] = {};
              nestedStatuses[userId][contactNumber] = status;
            }
          );

          newStatuses[date] = nestedStatuses;
        }
        if (dates?.length === 1) {
          return newStatuses;
        } else {
          setPreachingStatuses(newStatuses);
        }
      } catch (error) {
        toast({
          title: "Error loading preaching status",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [token, toast]
  );

  const updatePreachingStatus = useCallback(
    async (date, { userId, status, attended, contactNumber, contactName }) => {
      if (!token) return;
      setLoading(true);
      try {
        await axios.put(
          `${BACKEND_URL}/preachingStatus/${userId}/${date}`,
          { status, attended, contactNumber, contactName },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        await loadPreachingStatuses([date]);
        toast({ title: "✨ Preaching statuses updated" });
      } catch (error) {
        toast({
          title: "Error updating preaching statuses",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [token, loadPreachingStatuses, toast]
  );

  const updatePreachingStatusesBulk = useCallback(
    async (date: string, updates: Partial<PreachingStatus>[]) => {
      if (!token) return;
      setLoading(true);
      try {
        await axios.post(
          `${BACKEND_URL}/preachingStatus/bulk-update`,
          { date, updates },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // await loadPreachingStatuses([date]);
        toast({ title: "✨ Preaching statuses updated" });
      } catch (error) {
        toast({
          title: "Error updating preaching statuses",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [token, loadPreachingStatuses, toast]
  );

  return (
    <PreachingStatusContext.Provider
      value={{
        preachingStatuses,
        loading,
        loadPreachingStatuses,
        updatePreachingStatus,
        updatePreachingStatusesBulk,
      }}
    >
      {children}
    </PreachingStatusContext.Provider>
  );
};

export const usePreachingStatus = (): PreachingStatusContextType => {
  const context = useContext(PreachingStatusContext);
  if (!context) {
    throw new Error(
      "usePreachingStatus must be used within a PreachingStatusProvider"
    );
  }
  return context;
};
