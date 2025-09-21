import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Spin } from "antd";

interface UserRegistrationFormProps {
  onClose: () => void;
}

export const UserRegistrationForm = ({
  onClose,
}: UserRegistrationFormProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const { registerUser } = useAuth();
  const { toast } = useToast();
  const { auth, fetchUsers } = useAuth();
  const [registerloading, setregisterloading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setregisterloading(true);
    try {
      await registerUser(name, email);
      toast({
        title: "User Registered",
        description: `${name} has been successfully registered`,
      });
      await fetchUsers();
      setregisterloading(false);
      onClose();
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setregisterloading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Register New User</DialogTitle>
          <DialogDescription>
            Add a new devotee to the Sadhna tracking system
          </DialogDescription>
        </DialogHeader>

        <Spin spinning={registerloading}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter devotee's name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                required
              />
            </div>

            <div className="bg-muted/50 p-3 rounded-md">
              <p className="text-sm text-muted-foreground">
                Default password for new devotee:{" "}
                <code className="font-mono">password</code>
              </p>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                Register User
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </Spin>
      </DialogContent>
    </Dialog>
  );
};
