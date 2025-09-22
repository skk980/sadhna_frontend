import React, { useEffect, useState } from "react";
import { format, addDays } from "date-fns";
import { useActivities } from "@/context/ActivitiesContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Spin } from "antd";

const rangeDays = 14;

export const PreachingManagementTable = () => {
  const { activities, loadActivities, updatePreachingContacts } =
    useActivities();
  const [dates, setDates] = useState([]);
  const [localActivities, setLocalActivities] = useState([]);
  const [editedContactsMap, setEditedContactsMap] = useState({});
  const [saveStatusLoading, setsaveStatusLoading] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    const baseDate = new Date();
    const range = [];
    for (let i = -7; i <= 7; i++) {
      range.push(addDays(baseDate, i));
    }
    // Sort descending (latest date first)
    range.sort((a, b) => b.getTime() - a.getTime());
    setDates(range);
  }, []);

  useEffect(() => {
    loadActivities();
  }, []);

  useEffect(() => {
    setLocalActivities(activities);
  }, [activities]);

  const handleEditChange = (activityId, contactId, field, value) => {
    setEditedContactsMap((prev) => {
      const prevActivityChanges = prev[activityId] || {};
      const prevContact = prevActivityChanges[contactId] || {};
      return {
        ...prev,
        [activityId]: {
          ...prevActivityChanges,
          [contactId]: {
            ...prevContact,
            [field]: value,
          },
        },
      };
    });
  };

  const handleSave = async (activityId) => {
    const activity = localActivities.find((a) => a._id === activityId);
    if (!activity) return;

    const updates = { preachingContacts: [...activity.preachingContacts] };

    if (editedContactsMap[activityId]) {
      Object.entries(editedContactsMap[activityId]).forEach(
        ([contactId, fields]) => {
          const contactIndex = updates.preachingContacts.findIndex(
            (c) => c.id === contactId
          );
          if (contactIndex !== -1) {
            updates.preachingContacts[contactIndex] = {
              ...updates.preachingContacts[contactIndex],
              ...fields,
            };
          }
        }
      );
    }
    setsaveStatusLoading(true);
    try {
      await updatePreachingContacts(activityId, updates.preachingContacts);
      setEditedContactsMap((prev) => {
        const copy = { ...prev };
        delete copy[activityId];
        return copy;
      });
      toast({
        title: "✨ Status Updated",
        description: "Your sacred status has been updated successfully",
      });
    } catch (error) {
      console.error("Save failed", error.message);
      toast({
        title: "🚫 Cannot Update",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setsaveStatusLoading(false);
    }
  };

  const handleCancel = (activityId) => {
    setEditedContactsMap((prev) => {
      const copy = { ...prev };
      delete copy[activityId];
      return copy;
    });
  };

  const itemsPerPage = 8;
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate total pages
  const totalPages = Math.ceil(dates.length / itemsPerPage);

  // Get dates for current page
  const paginatedDates = dates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="overflow-auto">
      <Spin spinning={saveStatusLoading}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="border-r border-gray-300">Date</TableHead>
              <TableHead className="border-r border-gray-300">
                Contact Name - Number
              </TableHead>
              <TableHead className="border-r border-gray-300">Status</TableHead>
              <TableHead>Attended</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedDates?.flatMap((date) => {
              const dateStr = format(date, "yyyy-MM-dd");
              const activity = localActivities.find((a) => a.date === dateStr);
              if (!activity || !activity.preachingContacts.length) {
                return (
                  <TableRow key={dateStr + "-empty"}>
                    <TableCell>{format(date, "eeee, MMM dd")}</TableCell>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground"
                    >
                      No preaching contacts for this day
                    </TableCell>
                  </TableRow>
                );
              }

              return (
                <>
                  {activity.preachingContacts.map((contact, idx) => {
                    const editedContact =
                      editedContactsMap[activity._id]?.[contact.id] || {};
                    const statusVal =
                      editedContact.status ?? contact.status ?? "";
                    const attendedVal =
                      editedContact.attended ?? contact.attended ?? false;
                    return (
                      <TableRow
                        key={`${dateStr}-${contact.id}`}
                        className="!align-top"
                      >
                        {idx === 0 && (
                          <TableCell
                            rowSpan={activity.preachingContacts.length}
                            className="align-top border-r border-gray-300"
                          >
                            {format(date, "eeee, MMM dd")}
                            {/* Save-cancel buttons under date */}
                            <div className="flex gap-2 mt-4">
                              <Button
                                size="sm"
                                onClick={() => handleSave(activity._id)}
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancel(activity._id)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </TableCell>
                        )}
                        <TableCell className="border-r border-gray-300">
                          {contact.name} - {contact.phone}
                        </TableCell>
                        <TableCell className="border-r border-gray-300 ">
                          <Input
                            value={statusVal}
                            onChange={(e) =>
                              handleEditChange(
                                activity._id,
                                contact.id,
                                "status",
                                e.target.value
                              )
                            }
                            placeholder="Enter status"
                            className="md:w-full w-[300px]"
                          />
                        </TableCell>
                        <TableCell>
                          <Switch
                            id={`attended-${activity._id}-${contact.id}`}
                            checked={attendedVal}
                            onCheckedChange={(checked) =>
                              handleEditChange(
                                activity._id,
                                contact.id,
                                "attended",
                                checked
                              )
                            }
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </>
              );
            })}
          </TableBody>
        </Table>
      </Spin>

      <div className="mt-4 flex justify-center items-center gap-4">
        <Button
          size="sm"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
        >
          Previous
        </Button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <Button
          size="sm"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
