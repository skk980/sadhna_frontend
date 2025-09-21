import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useActivities } from "@/context/ActivitiesContext";
import { format, isToday, isTomorrow, addDays } from "date-fns";
import { UtensilsCrossed, Calendar, User, Edit2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Spin } from "antd";

const daysOfWeek = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export const BhogaReport = () => {
  const { activities } = useActivities();
  const { users, bhogaSchedule, fetchBhogaSchedule, updateBhogaSchedule } =
    useAuth();

  const today = new Date();
  const upcomingDays = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  const [loading, setloading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [localSchedule, setLocalSchedule] = useState({
    monday: null,
    tuesday: null,
    wednesday: null,
    thursday: null,
    friday: null,
    saturday: null,
  });

  const [localScheduleTemp, setLocalScheduleTemp] = useState({
    monday: null,
    tuesday: null,
    wednesday: null,
    thursday: null,
    friday: null,
    saturday: null,
  });

  const { toast } = useToast();

  useEffect(() => {
    console.log(bhogaSchedule);
    if (modalOpen && bhogaSchedule) {
      const sched: Record<string, string | null> = {};
      daysOfWeek.forEach((day) => {
        sched[day] = bhogaSchedule[day] || null;
      });
    }
    setLocalSchedule(bhogaSchedule);
    setLocalScheduleTemp(bhogaSchedule);
  }, [modalOpen, bhogaSchedule]);

  useEffect(() => {
    fetchBhoga();
  }, [users]);

  const fetchBhoga = async () => {
    try {
      await fetchBhogaSchedule();
    } catch (err) {
      toast({
        title: err,
        description: err,
        variant: "destructive",
      });
    }
  };

  const getBhogaOfferingsForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return activities.filter(
      (activity) => activity.date === dateStr && activity.bhogaOffering
    );
  };

  const handleUserChange = (day: string, userId: string) => {
    const filteruser = users.find((u) => u._id === userId);
    console.log(filteruser, userId);
    setLocalScheduleTemp((prev) => ({ ...prev, [day]: filteruser }));
  };

  const handleSaveSchedule = async () => {
    try {
      setloading(true);
      await updateBhogaSchedule({
        ...localScheduleTemp,
        sunday: "No Offering Duty",
      });
      setModalOpen(false);
    } catch (error) {
      console.error("Failed to save schedule:", error);
      toast({
        title: error,
        description: error,
        variant: "destructive",
      });
    } finally {
      setloading(false);
    }
  };

  return (
    <>
      <Card className="divine-glow">
        <CardHeader className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-accent">
            <UtensilsCrossed className="w-6 h-6" />
            Bhoga Offering Schedule
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="link"
                  className="flex items-center gap-1"
                >
                  <Edit2 className="w-4 h-4" /> Edit Schedule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-center">
                    Edit Bhoga Offering Schedule
                  </DialogTitle>
                </DialogHeader>
                <Spin spinning={loading}>
                  <div className="flex flex-col space-y-4 mt-4">
                    {daysOfWeek.map((day) => {
                      const label = day.charAt(0).toUpperCase() + day.slice(1);
                      {
                        console.log(localScheduleTemp?.[day]);
                      }
                      return (
                        <div key={day} className="flex items-center gap-4">
                          <span className="min-w-[100px] font-semibold">
                            {label}
                          </span>
                          <Select
                            value={localScheduleTemp?.[day]?._id || ""}
                            onValueChange={(val) => handleUserChange(day, val)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select devotee" />
                            </SelectTrigger>
                            <SelectContent position="popper">
                              {users
                                ?.filter((u) => u.role === "user")
                                .map((user) => {
                                  return (
                                    <SelectItem key={user._id} value={user._id}>
                                      {user.name}
                                    </SelectItem>
                                  );
                                })}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    })}
                    <div className="flex items-center gap-4">
                      <span className="min-w-[100px] font-semibold">
                        Sunday
                      </span>
                      <span className="w-full py-2 px-3 text-sm">
                        No Offering Duty
                      </span>
                      {/* <input
                      type="text"
                      readOnly
                      value="No Offering Duty"
                      className="w-full py-2 px-3 rounded border border-gray-300 bg-gray-100 cursor-not-allowed"
                    /> */}
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                      <Button
                        onClick={() => setModalOpen(false)}
                        variant="outline"
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleSaveSchedule}>Save</Button>
                    </div>
                  </div>
                </Spin>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {upcomingDays.map((date) => {
            const offerings = getBhogaOfferingsForDate(date);
            const dayName = format(date, "eeee").toLowerCase(); // e.g. 'monday'
            const dateLabel = isToday(date)
              ? "Today"
              : isTomorrow(date)
              ? "Tomorrow"
              : format(date, "MMM dd, yyyy");

            // Assigned user id and name for this day
            const assignedUserId = localSchedule?.[dayName]?._id || null;
            const assignedUserName = assignedUserId
              ? users.find((u) => u._id === assignedUserId)?.name || "Unknown"
              : null;

            // User IDs who actually offered bhoga on this day
            const offeringUserIds = offerings.map((a) => a.userId._id);

            // Determine if assigned user did not offer but others did
            const assignedUserDidNotOffer =
              assignedUserId &&
              !offeringUserIds.includes(assignedUserId) &&
              offerings.length > 0;

            // Names of users who actually offered bhoga excluding assigned user
            const otherOfferingUsers = offerings
              .filter((a) => a.userId._id !== assignedUserId)
              .map((a) => a.userId.name);

            return (
              <div
                key={date.toISOString()}
                className="border border-primary/20 rounded-lg p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold">{dateLabel}</h3>
                  <span className="text-sm text-muted-foreground">
                    ({format(date, "EEEE")})
                  </span>
                </div>

                {offerings.length > 0 ? (
                  <div className="space-y-2">
                    {assignedUserDidNotOffer && (
                      <p className="text-sm text-warning-foreground border border-warning-300 p-2 rounded">
                        <span className="text-red-500">
                          {assignedUserName} was assigned but did not offer
                          bhoga.
                        </span>
                        &nbsp; Bhoga offered by {otherOfferingUsers.join(", ")}.
                      </p>
                    )}
                    {offerings.map((activity) => (
                      <div
                        key={activity._id}
                        className="flex items-center gap-2 p-2 bg-accent/10 rounded"
                      >
                        <User className="w-4 h-4 text-accent" />
                        <span className="font-medium">
                          User Name: {activity.userId.name}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          offered bhoga
                        </span>
                      </div>
                    ))}
                  </div>
                ) : assignedUserName ? (
                  <p className="text-sm text-muted-foreground italic">
                    Assigned user {assignedUserName} has not offered bhoga yet.
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No bhoga offered scheduled yet
                  </p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </>
  );
};
