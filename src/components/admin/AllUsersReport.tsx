import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useActivities } from "@/context/ActivitiesContext";
import { User, Activity, PreachingContact } from "@/types";
import { format } from "date-fns";
import { Eye, Users, Phone } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

interface AllUsersReportProps {
  searchTerm: string;
  dateRange: { start: string; end: string };
}

export const AllUsersReport = ({
  searchTerm,
  dateRange,
}: AllUsersReportProps) => {
  const { activities } = useActivities();
  const { users } = useAuth();
  const [selectedContacts, setSelectedContacts] = useState<PreachingContact[]>(
    []
  );
  const [reasonModalOpen, setReasonModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hearingReadingDescModal, setHearingReadingDescModal] = useState({
    index: null,
    status: false,
    mode: null,
  });
  const filteredData = useMemo(() => {
    let filteredActivities = activities;
    let filteredUsers = users;

    // Filter users by search term
    if (searchTerm) {
      filteredUsers = users.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter activities by date range
    if (dateRange.start && dateRange.end) {
      filteredActivities = activities.filter(
        (activity) =>
          activity.date >= dateRange.start && activity.date <= dateRange.end
      );
    }

    // Filter activities by filtered users
    if (searchTerm) {
      const userIds = filteredUsers.map((u) => u._id);
      filteredActivities = filteredActivities.filter((a) =>
        userIds.includes(a.userId?._id)
      );
    }

    return { users: filteredUsers, activities: filteredActivities };
  }, [users, activities, searchTerm, dateRange]);

  const getUserStats = (userId: string) => {
    const userActivities = filteredData.activities.filter(
      (a) => a.userId?._id === userId
    );
    const allContacts = userActivities.flatMap(
      (a) => a.preachingContacts || []
    );
    return {
      totalActivities: userActivities.length,
      mangalaAartiCount: userActivities.filter((a) => a.mangalaAarti).length,
      totalJapaRounds: userActivities.reduce((sum, a) => sum + a.japaRounds, 0),
      totalLectureDuration: userActivities.reduce(
        (sum, a) => sum + a.lectureDuration,
        0
      ),
      totalReadingDuration: userActivities.reduce(
        (sum, a) => sum + a.readingDuration,
        0
      ),
      preachingContacts: allContacts.length,
      preachingContactsList: allContacts,
    };
  };

  const handleViewContacts = (contacts: PreachingContact[]) => {
    setSelectedContacts(contacts);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>All Devotee Overview</CardTitle>
          <CardDescription>
            Summary of all devotees and their activities
            {(searchTerm || dateRange.start || dateRange.end) && " (filtered)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Total Activities</TableHead>
                <TableHead>Mangala Aarti</TableHead>
                <TableHead>Total Japa Rounds</TableHead>
                <TableHead>Lecture Hearing Duration</TableHead>
                <TableHead>Reading Duration</TableHead>
                <TableHead>Preaching Contacts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.users.map((user) => {
                const stats = getUserStats(user._id);
                return (
                  <TableRow key={user._id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{stats.totalActivities}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          stats.mangalaAartiCount > 0 ? "default" : "outline"
                        }
                      >
                        {stats.mangalaAartiCount}
                      </Badge>
                    </TableCell>
                    <TableCell>{stats.totalJapaRounds}</TableCell>
                    <TableCell>{stats.totalLectureDuration || 0} min</TableCell>
                    <TableCell>{stats.totalReadingDuration || 0} min</TableCell>
                    <TableCell>
                      {stats.preachingContacts > 0 ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleViewContacts(stats.preachingContactsList)
                          }
                          className="flex items-center gap-1 h-8 px-2 text-primary hover:text-primary"
                        >
                          <Eye className="w-4 h-4" />
                          {stats.preachingContacts}
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredData.users.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground"
                  >
                    No devotee found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Devotee Activities</CardTitle>
          <CardDescription>
            Latest activity reports from all devotee
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Wake Up</TableHead>
                <TableHead>Mangala Aarti</TableHead>
                <TableHead>Japa Rounds</TableHead>
                <TableHead>Lecture Hearing Duration</TableHead>
                <TableHead>Reading Duration</TableHead>
                <TableHead>Sleep</TableHead>
                <TableHead>Preaching</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.activities
                .sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                )
                .map((activity, index) => {
                  const user = users.find(
                    (u) => u._id === activity?.userId?._id
                  );

                  return (
                    <TableRow key={activity._id}>
                      <TableCell>
                        {format(new Date(activity.date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell className="font-medium">
                        {user?.name || "Unknown"}
                      </TableCell>
                      <TableCell>
                        {" "}
                        {activity.wakeUpTime
                          ? new Date(
                              `2000-01-01T${activity.wakeUpTime}`
                            ).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            })
                          : "Not set"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            activity.mangalaAarti ? "default" : "outline"
                          }
                        >
                          {activity.mangalaAarti ? "Yes" : "No"}
                        </Badge>
                        {activity.mangalaAartiReason && (
                          <Dialog
                            open={reasonModalOpen}
                            onOpenChange={setReasonModalOpen}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="link"
                                size="icon"
                                aria-label="Mangala aarti reason"
                                onClick={() => setReasonModalOpen(true)}
                              >
                                <Eye className="w-4 h-4 text-primary" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-sm">
                              <DialogHeader>
                                <DialogTitle className="italic">
                                  Reason for not attending Mangala Aarti
                                </DialogTitle>
                              </DialogHeader>
                              <div className="mt-4 text-base text-foreground">
                                {activity.mangalaAartiReason}
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </TableCell>
                      <TableCell>{activity.japaRounds}</TableCell>
                      <TableCell>
                        {activity.lectureDuration || 0} min &nbsp;
                        {activity?.lectureDesciption && (
                          <Dialog
                            open={
                              hearingReadingDescModal.status &&
                              hearingReadingDescModal.index === index &&
                              hearingReadingDescModal.mode === "hearing"
                            }
                            onOpenChange={(val) => {
                              setHearingReadingDescModal({
                                index,
                                status: val,
                                mode: "hearing",
                              });
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="link"
                                size="icon"
                                aria-label="Hearing description"
                                onClick={() =>
                                  setHearingReadingDescModal({
                                    index,
                                    status: true,
                                    mode: "hearing",
                                  })
                                }
                              >
                                <Eye className="w-4 h-4 text-primary" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-sm">
                              <DialogHeader>
                                <DialogTitle className="italic">
                                  Lecture description
                                </DialogTitle>
                              </DialogHeader>
                              <div className="mt-4 text-base text-foreground">
                                {activity.lectureDesciption}
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </TableCell>

                      {/* Reading Duration Cell */}
                      <TableCell>
                        {activity.readingDuration || 0} min &nbsp;
                        {activity?.readingDesciption && (
                          <Dialog
                            open={
                              hearingReadingDescModal.status &&
                              hearingReadingDescModal.index === index &&
                              hearingReadingDescModal.mode === "reading"
                            }
                            onOpenChange={(val) => {
                              setHearingReadingDescModal({
                                index,
                                status: val,
                                mode: "reading",
                              });
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="link"
                                size="icon"
                                aria-label="Reading description"
                                onClick={() =>
                                  setHearingReadingDescModal({
                                    index,
                                    status: true,
                                    mode: "reading",
                                  })
                                }
                              >
                                <Eye className="w-4 h-4 text-primary" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-sm">
                              <DialogHeader>
                                <DialogTitle className="italic">
                                  Reading description
                                </DialogTitle>
                              </DialogHeader>
                              <div className="mt-4 text-base text-foreground">
                                {activity.lectureDesciption}
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </TableCell>
                      <TableCell>
                        {" "}
                        {activity.sleepTime
                          ? new Date(
                              `2000-01-01T${activity.sleepTime}`
                            ).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            })
                          : "Not set"}
                      </TableCell>
                      <TableCell>
                        {activity.preachingContacts &&
                        activity.preachingContacts.length > 0 ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleViewContacts(activity.preachingContacts)
                            }
                            className="flex items-center gap-1 h-8 px-2 text-primary hover:text-primary"
                          >
                            <Eye className="w-4 h-4" />
                            {activity.preachingContacts.length}
                          </Button>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              {filteredData.activities.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-muted-foreground"
                  >
                    No activities found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Preaching Contacts Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Users className="w-5 h-5" />
              Preaching Contacts ({selectedContacts.length})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {selectedContacts.length > 0 ? (
              selectedContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="bg-muted/50 p-3 rounded-lg border border-primary/20"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="font-medium text-foreground">
                      {contact.name}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {contact.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3" />
                        {contact.phone}
                      </div>
                    )}
                    <div className="text-xs">
                      Added:{" "}
                      {format(new Date(contact.addedDate), "MMM dd, yyyy")}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No contacts found
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
