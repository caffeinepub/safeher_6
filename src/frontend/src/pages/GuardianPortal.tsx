import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, MapPin, Phone, Shield } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

const LS_TOKEN = "safeher_guardian_token";
const LS_JOURNEY = "safeher_journeys";
const LS_PROFILE = "safeher_profile";
const LS_CHECKIN = "safeher_checkin_session";
const LS_ALERTS = "safeher_alerts";

function readLS<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function GuardianPortal() {
  const [token, setToken] = useState("");
  const [authenticated, setAuthenticated] = useState(() => {
    return !!localStorage.getItem(LS_TOKEN);
  });
  const [tokenError, setTokenError] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);

  const handleLogin = () => {
    if (token.length < 6) {
      setTokenError("Token must be at least 6 characters");
      return;
    }
    localStorage.setItem(LS_TOKEN, token);
    setAuthenticated(true);
    setTokenError("");
  };

  const handleLogout = () => {
    localStorage.removeItem(LS_TOKEN);
    setAuthenticated(false);
    setToken("");
  };

  // Read data from localStorage (demo mode)
  const profile = readLS<{ name: string; phone?: string } | null>(
    LS_PROFILE,
    null,
  );
  const journeys = readLS<
    Array<{
      id: string;
      destination: string;
      estimatedArrival: number;
      status: string;
      startTime: number;
    }>
  >(LS_JOURNEY, []);
  const checkIn = readLS<{
    status: string;
    nextCheckInAt: number;
    lastCheckInAt: number | null;
    intervalMinutes: number;
  } | null>(LS_CHECKIN, null);
  const alerts = readLS<Array<{ type: string; timestamp: number }>>(
    LS_ALERTS,
    [],
  );

  const activeJourney = journeys.find((j) => j.status === "active");
  const lastSOS = alerts.find((a) => a.type === "SOS");

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm space-y-6"
        >
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display font-bold text-2xl">Guardian Portal</h1>
            <p className="text-sm text-muted-foreground mt-2">
              This portal is for trusted family members and guardians.
            </p>
          </div>

          <div
            className="bg-card border border-border rounded-2xl p-6 space-y-4"
            data-ocid="guardian.login.panel"
          >
            <div className="space-y-2">
              <label
                htmlFor="guardian-token"
                className="text-xs text-muted-foreground"
              >
                Guardian Access Token
              </label>
              <Input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter your 6+ character token"
                type="password"
                className="h-10"
                data-ocid="guardian.token.input"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
              {tokenError && (
                <p
                  className="text-xs text-red-400"
                  data-ocid="guardian.token.error_state"
                >
                  {tokenError}
                </p>
              )}
            </div>
            <Button
              onClick={handleLogin}
              className="w-full"
              data-ocid="guardian.login.button"
            >
              View Dashboard
            </Button>
          </div>

          <p className="text-center text-[11px] text-muted-foreground">
            Tokens are shared by the protected user from their Profile settings.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="font-display font-bold text-xl">Guardian Portal</h1>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="text-xs text-muted-foreground hover:text-foreground"
            data-ocid="guardian.logout.button"
          >
            Sign Out
          </button>
        </div>

        {/* SOS Alert Banner */}
        {lastSOS && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-500/20 border border-red-500/50 rounded-2xl p-4"
            data-ocid="guardian.sos.panel"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg animate-pulse">🚨</span>
              <p className="font-bold text-red-400">SOS Alert Triggered!</p>
            </div>
            <p className="text-sm text-red-300">
              Contact <strong>{profile?.name ?? "the user"}</strong>{" "}
              immediately.
            </p>
            {profile?.phone && (
              <a
                href={`tel:${profile.phone}`}
                className="inline-flex items-center gap-2 mt-3 bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-semibold"
                data-ocid="guardian.call_user.button"
              >
                <Phone className="w-4 h-4" /> Call {profile.name}
              </a>
            )}
          </motion.div>
        )}

        {/* User Status */}
        <div
          className="bg-card border border-border rounded-2xl p-4 space-y-2"
          data-ocid="guardian.user_status.card"
        >
          <p className="font-semibold text-sm">Protected User</p>
          <p className="text-lg font-bold text-foreground">
            {profile?.name ?? "Unknown User"}
          </p>
          {activeJourney ? (
            <div className="space-y-2 mt-2">
              <Badge className="bg-green-500/20 text-green-400 border-green-500/40">
                🟢 Journey Active
              </Badge>
              <p className="text-xs text-muted-foreground">
                Destination:{" "}
                <span className="text-foreground font-medium">
                  {activeJourney.destination}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                ETA:{" "}
                <span className="text-foreground font-medium">
                  {new Date(activeJourney.estimatedArrival).toLocaleTimeString(
                    "en-US",
                    { hour: "2-digit", minute: "2-digit" },
                  )}
                </span>
              </p>
            </div>
          ) : (
            <Badge className="bg-muted text-muted-foreground border-border">
              No active journey
            </Badge>
          )}
        </div>

        {/* Check-in Status */}
        {checkIn && (
          <div
            className="bg-card border border-border rounded-2xl p-4"
            data-ocid="guardian.checkin.card"
          >
            <p className="font-semibold text-sm mb-2">Check-In Status</p>
            <div className="flex items-center justify-between">
              <div>
                <Badge
                  className={
                    checkIn.status === "active"
                      ? "bg-green-500/20 text-green-400 border-green-500/40"
                      : "bg-red-500/20 text-red-400 border-red-500/40"
                  }
                >
                  {checkIn.status === "active" ? "On Schedule" : "⚠️ MISSED"}
                </Badge>
                {checkIn.lastCheckInAt && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Last check-in:{" "}
                    {new Date(checkIn.lastCheckInAt).toLocaleTimeString()}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-[11px] text-muted-foreground">
                  Next expected
                </p>
                <p className="text-xs font-mono font-bold">
                  {new Date(checkIn.nextCheckInAt).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div
          className="grid grid-cols-2 gap-3"
          data-ocid="guardian.actions.panel"
        >
          <a
            href="tel:112"
            className="flex items-center justify-center gap-2 bg-red-500/20 border border-red-500/40 text-red-400 rounded-xl py-3 text-sm font-semibold hover:bg-red-500/30 transition-colors"
            data-ocid="guardian.call_emergency.button"
          >
            <Phone className="w-4 h-4" /> Call 112
          </a>
          <button
            type="button"
            onClick={() => {
              setAcknowledged(true);
              localStorage.setItem(
                "safeher_guardian_ack",
                Date.now().toString(),
              );
            }}
            className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-colors border ${
              acknowledged
                ? "bg-green-500/20 border-green-500/40 text-green-400"
                : "bg-primary/20 border-primary/40 text-primary hover:bg-primary/30"
            }`}
            data-ocid="guardian.help_on_way.button"
          >
            <MapPin className="w-4 h-4" />
            {acknowledged ? "Help Sent ✓" : "Help On the Way"}
          </button>
        </div>

        <p className="text-center text-[10px] text-muted-foreground">
          Guardian Portal — SafeHer India · Data shown is from the protected
          user's device (demo mode)
        </p>
      </div>
    </div>
  );
}
