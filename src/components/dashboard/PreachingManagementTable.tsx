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
import { X } from "lucide-react";
import { usePreachingStatus } from "@/context/PreachingStatusContext";
import { useAuth } from "@/context/AuthContext";

const rangeDays = 14;

export const PreachingManagementTable = ({ setShowPreachingManagement }) => {
  const { activities, loadActivities } = useActivities();
  const { auth } = useAuth();
  const {
    preachingStatuses,
    loadPreachingStatuses,
    updatePreachingStatusesBulk,
    updatePreachingStatus,
    loading,
  } = usePreachingStatus();
  const [dates, setDates] = useState([]);
  const [allContacts, setAllContacts] = useState([]);
  const [editedStatusMap, setEditedStatusMap] = useState({});
  const [savingDates, setSavingDates] = useState({});
  const { toast } = useToast();

  useEffect(() => {
    const allContacts = [];

    activities.forEach((activity) => {
      if (activity.preachingContacts) {
        allContacts.push(...activity.preachingContacts);
      }
    });

    setAllContacts(allContacts);
  }, [activities]);

  useEffect(() => {
    const baseDate = new Date();
    const range = [];
    // Generate dates from today (i=0) going backwards to past 7 days (i=-7)
    for (let i = 0; i >= -7; i--) {
      range.push(addDays(baseDate, i));
    }
    // Sort descending to have latest (today) on top
    range.sort((a, b) => b.getTime() - a.getTime());
    setDates(range);
  }, []);

  useEffect(() => {
    loadActivities();
  }, []);

  useEffect(() => {
    if (dates.length) {
      loadPreachingStatuses(dates.map((d) => format(d, "yyyy-MM-dd")));
    }
  }, [dates, loadPreachingStatuses]);

  const handleStatusChange = (date, contactNumber, field, value) => {
    setEditedStatusMap((prev) => {
      const prevContact = prev?.[date]?.[auth.user._id]?.[contactNumber] || {};

      const updatedContact = {
        ...prevContact,
        [field]: value,
      };

      return {
        ...prev,
        [date]: {
          ...prev[date],
          [auth.user._id]: {
            ...prev[date]?.[auth.user._id],
            [contactNumber]: updatedContact,
          },
        },
      };
    });
  };

  const hasChanges = (date) =>
    !!editedStatusMap?.[date] &&
    Object.keys(editedStatusMap?.[date] || {}).length > 0;

  const handleSave = async (date) => {
    if (!editedStatusMap[date] || !editedStatusMap[date][auth.user._id]) return;

    // setSavingDates((prev) => ({ ...prev, [date]: true }));

    const contactStatuses = Object.entries(
      editedStatusMap[date][auth.user._id]
    ).map(([contactNumber, changes]) => ({
      userId: auth.user._id,
      status: changes.status ?? "",
      attended: changes.attended ?? false,
      contactNumber,
      contactName: changes.contactName ?? "",
    }));

    if (contactStatuses.length === 0) return;

    try {
      await updatePreachingStatusesBulk(date, contactStatuses);
      loadPreachingStatuses(dates.map((d) => format(d, "yyyy-MM-dd")));

      toast({
        title: "✨ Status updated",
        description: `Preaching statuses updated for ${date}`,
      });
    } catch (error) {
      toast({
        title: "🚫 Failed to save preaching statuses.",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSavingDates((prev) => ({ ...prev, [date]: false }));
    }
  };

  const itemsPerPage = 8;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(dates.length / itemsPerPage);
  const paginatedDates = dates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="overflow-auto">
      <Spin spinning={loading}>
        <Table style={{ height: "80vh", overflowY: "auto" }}>
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
            {paginatedDates?.length == 0 || allContacts?.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-8 text-muted-foreground"
                >
                  No preaching contacts found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedDates?.flatMap((date) => {
                const dateStr = format(date, "yyyy-MM-dd");
                return allContacts?.map((contact, idx) => {
                  // console.log(preachingStatuses[dateStr], auth.user._id, contact);

                  const editedEntry =
                    editedStatusMap?.[dateStr]?.[auth.user._id]?.[
                      contact.phone
                    ];

                  const storedContactsStatus =
                    preachingStatuses?.[dateStr]?.[auth.user._id] ?? {};
                  const storedStatus =
                    storedContactsStatus?.[contact.phone] ?? {};

                  const statusVal =
                    editedEntry?.status ?? storedStatus?.status ?? "";
                  const attendedVal =
                    editedEntry?.attended ?? storedStatus?.attended ?? false;

                  return (
                    <TableRow
                      key={`${dateStr}-${auth.user._id}-${contact.phone}`}
                      className="!align-top"
                    >
                      {idx === 0 && (
                        <TableCell
                          rowSpan={allContacts.length}
                          className="align-top border-r border-gray-300"
                        >
                          {format(date, "eeee, MMM dd")}
                          <div className="flex gap-2 mt-4">
                            <Button
                              size="sm"
                              disabled={
                                !hasChanges(dateStr) || savingDates[dateStr]
                              }
                              loading={savingDates[dateStr]}
                              onClick={() =>
                                handleSave(
                                  dateStr,
                                  statusVal,
                                  attendedVal,
                                  contact?.phone,
                                  contact?.name
                                )
                              }
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={
                                !hasChanges(dateStr) || savingDates[dateStr]
                              }
                              onClick={() => {
                                setEditedStatusMap((prev) => {
                                  const copy = { ...prev };
                                  delete copy[dateStr];
                                  return copy;
                                });
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </TableCell>
                      )}
                      <TableCell className="border-r border-gray-300">
                        {contact.name} - {contact.phone}
                      </TableCell>
                      <TableCell className="border-r border-gray-300">
                        <Input
                          value={statusVal}
                          onChange={(e) =>
                            handleStatusChange(
                              dateStr,
                              contact.phone,
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
                          id={`attended-${dateStr}-${contact.id}`}
                          checked={attendedVal}
                          onCheckedChange={(checked) =>
                            handleStatusChange(
                              dateStr,
                              contact.phone,
                              "attended",
                              checked
                            )
                          }
                        />
                      </TableCell>
                    </TableRow>
                  );
                });
              })
            )}
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
        <Button
          size="sm"
          onClick={() => setShowPreachingManagement(false)}
          variant="destructive"
        >
          <X className="h-4" />
        </Button>
      </div>
    </div>
  );
};
