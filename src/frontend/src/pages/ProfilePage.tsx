import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Save, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import type { UserProfile } from "../types";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

interface Props {
  profile: UserProfile | null;
  onSave: (p: UserProfile) => void;
}

export default function ProfilePage({ profile, onSave }: Props) {
  const { clear, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<UserProfile>({
    name: "",
    phone: "",
    email: "",
    bloodGroup: "",
    address: "",
  });
  const [isAdmin, setIsAdmin] = useState(
    () => localStorage.getItem("safeher_admin") === "true",
  );

  useEffect(() => {
    if (profile) setForm(profile);
  }, [profile]);

  const handleSave = () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error("Name and phone number are required");
      return;
    }
    onSave(form);
    toast.success("Profile saved successfully!");
  };

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const handleAdminToggle = (checked: boolean) => {
    localStorage.setItem("safeher_admin", checked ? "true" : "false");
    setIsAdmin(checked);
    toast.success(
      checked
        ? "Admin mode enabled. Refresh to see admin panel."
        : "Admin mode disabled.",
    );
  };

  const principal = identity?.getPrincipal().toString();
  const shortPrincipal = principal
    ? `${principal.slice(0, 8)}...${principal.slice(-4)}`
    : null;

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <div className="flex items-center gap-4 bg-card border border-border rounded-2xl p-4">
        <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center flex-shrink-0">
          {form.name ? (
            <span className="text-2xl font-bold text-primary">
              {form.name[0].toUpperCase()}
            </span>
          ) : (
            <User className="w-8 h-8 text-primary/60" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-lg truncate">
            {form.name || "Your Name"}
          </p>
          {shortPrincipal && (
            <p className="text-xs text-muted-foreground font-mono">
              {shortPrincipal}
            </p>
          )}
        </div>
        <Button
          data-ocid="profile.logout.button"
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="flex-shrink-0 gap-1 text-primary border-primary/30 hover:bg-primary/10"
        >
          <LogOut className="w-4 h-4" /> Logout
        </Button>
      </div>

      {/* Form */}
      <div className="space-y-4" data-ocid="profile.form.panel">
        <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Personal Details
        </h3>

        <div>
          <Label htmlFor="p-name">Full Name *</Label>
          <Input
            id="p-name"
            data-ocid="profile.name.input"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="e.g. Priya Sharma"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="p-phone">Phone Number *</Label>
          <Input
            id="p-phone"
            data-ocid="profile.phone.input"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            placeholder="e.g. +91 98765 43210"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="p-email">Email Address</Label>
          <Input
            id="p-email"
            data-ocid="profile.email.input"
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            placeholder="e.g. priya@example.com"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="p-blood">Blood Group (optional)</Label>
          <Select
            value={form.bloodGroup || ""}
            onValueChange={(v) => setForm((p) => ({ ...p, bloodGroup: v }))}
          >
            <SelectTrigger
              id="p-blood"
              data-ocid="profile.bloodgroup.select"
              className="mt-1"
            >
              <SelectValue placeholder="Select blood group" />
            </SelectTrigger>
            <SelectContent>
              {BLOOD_GROUPS.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="p-addr">Address (optional)</Label>
          <Textarea
            id="p-addr"
            data-ocid="profile.address.textarea"
            value={form.address || ""}
            onChange={(e) =>
              setForm((p) => ({ ...p, address: e.target.value }))
            }
            placeholder="Your home address"
            className="mt-1 resize-none"
            rows={3}
          />
        </div>

        <Button
          data-ocid="profile.save.submit_button"
          onClick={handleSave}
          className="w-full bg-primary text-primary-foreground h-12 font-semibold rounded-2xl gap-2"
        >
          <Save className="w-4 h-4" /> Save Profile
        </Button>
      </div>

      {/* Emergency card */}
      {profile?.bloodGroup && (
        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-center gap-3">
          <div className="text-2xl">🩸</div>
          <div>
            <p className="text-xs text-muted-foreground">Blood Group</p>
            <p className="font-display font-bold text-2xl text-primary">
              {profile.bloodGroup}
            </p>
          </div>
        </div>
      )}

      {/* Demo Admin Toggle */}
      <div
        className="bg-card border border-border rounded-2xl p-4"
        data-ocid="profile.admin.card"
      >
        <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
          Developer Options
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Enable Admin Mode</p>
            <p className="text-xs text-muted-foreground">
              Demo — access admin dashboard & tools
            </p>
          </div>
          <Switch
            checked={isAdmin}
            onCheckedChange={handleAdminToggle}
            data-ocid="profile.admin.switch"
          />
        </div>
      </div>
    </div>
  );
}
