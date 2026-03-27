import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "@tanstack/react-router";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Phone,
  Shield,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import AISafetyAssistant from "../components/AISafetyAssistant";
import EscalationPanel from "../components/EscalationPanel";
import LocationSharingCard from "../components/LocationSharingCard";
import OperationsTimeline from "../components/OperationsTimeline";
import { INDIA_DANGER_ZONES } from "../data/dangerZones";
import type {
  AlertRecord,
  EmergencyContact,
  EscalationLevel,
  IndiaOfficialContact,
  JourneySession,
  SafetyTimelineEvent,
  SharingStatus,
  UserProfile,
} from "../types";

interface DashboardProps {
  profile: UserProfile | null;
  contacts: EmergencyContact[];
  alerts: AlertRecord[];
  sharingStatus: SharingStatus;
  onSharingChange: (s: SharingStatus) => void;
  onAlertAdded: (a: AlertRecord) => void;
  officialContacts?: IndiaOfficialContact[];
  journeys?: JourneySession[];
  timelineEvents?: SafetyTimelineEvent[];
  escalationLevel?: EscalationLevel;
  setEscalationLevel?: (l: EscalationLevel) => void;
}

const ALERT_TYPE_COLORS: Record<string, string> = {
  SOS: "bg-primary/20 text-primary border-primary/30",
  RedZone: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  AutoShare: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  VoiceSOS: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  ShakeSOS: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Journey: "bg-green-500/20 text-green-400 border-green-500/30",
};

function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getRiskLabel(score: number) {
  if (score <= 30)
    return {
      label: "Safe",
      color: "text-green-400",
      bg: "bg-green-500/15 border-green-500/30",
      barColor: "bg-green-500",
    };
  if (score <= 60)
    return {
      label: "Moderate",
      color: "text-yellow-400",
      bg: "bg-yellow-500/15 border-yellow-500/30",
      barColor: "bg-yellow-500",
    };
  if (score <= 80)
    return {
      label: "High Risk",
      color: "text-orange-400",
      bg: "bg-orange-500/15 border-orange-500/30",
      barColor: "bg-orange-500",
    };
  return {
    label: "Critical",
    color: "text-rose-400",
    bg: "bg-rose-500/15 border-rose-500/30",
    barColor: "bg-rose-500",
  };
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function RiskScoreCard() {
  const [expanded, setExpanded] = useState(false);

  const { score, factors, userLat, userLng } = useMemo(() => {
    const stored = localStorage.getItem("safeher_last_position");
    let lat = 28.6139;
    let lng = 77.209;
    if (stored) {
      try {
        const p = JSON.parse(stored);
        lat = p.lat;
        lng = p.lng;
      } catch {
        /* ignore */
      }
    }

    const hour = new Date().getHours();
    const isNight = hour >= 20 || hour <= 5;
    let s = 20;
    const f: string[] = ["Base score: 20"];

    if (isNight) {
      s += 20;
      f.push("Night time (20:00–05:00): +20");
    }

    const nearbyZones = INDIA_DANGER_ZONES.filter(
      (z) => haversineDistance(lat, lng, z.lat, z.lng) <= 5000,
    );
    const zoneBonus = Math.min(nearbyZones.length * 5, 40);
    if (zoneBonus > 0) {
      s += zoneBonus;
      f.push(`${nearbyZones.length} danger zone(s) within 5km: +${zoneBonus}`);
    }
    if (nearbyZones.length > 0) {
      s += 10;
      f.push("Isolation factor (near zones): +10");
    }

    return { score: Math.min(s, 100), factors: f, userLat: lat, userLng: lng };
  }, []);

  const risk = getRiskLabel(score);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border ${risk.bg} rounded-2xl p-4`}
      data-ocid="dashboard.risk_score.card"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
            Risk Score
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`font-display font-bold text-3xl ${risk.color}`}>
              {score}
            </span>
            <span className="text-muted-foreground text-sm">/100</span>
            <Badge className={`text-xs ${risk.bg} ${risk.color} border`}>
              {risk.label}
            </Badge>
          </div>
        </div>
        <Shield className={`w-8 h-8 ${risk.color} opacity-60`} />
      </div>

      <Progress value={score} className="h-2 mb-3" />

      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        data-ocid="dashboard.risk_score.toggle"
      >
        {expanded ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
        Why this score?
      </button>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-2 space-y-1"
        >
          {factors.map((f) => (
            <p
              key={f}
              className="text-xs text-muted-foreground flex items-center gap-2"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${risk.barColor} flex-shrink-0`}
              />
              {f}
            </p>
          ))}
          <p className="text-[10px] text-muted-foreground mt-2">
            Based on approx. location ({userLat.toFixed(2)},{" "}
            {userLng.toFixed(2)})
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

export default function Dashboard({
  profile,
  contacts,
  alerts,
  sharingStatus,
  onSharingChange,
  onAlertAdded,
  journeys = [],
  timelineEvents = [],
  escalationLevel = 1,
  setEscalationLevel,
}: DashboardProps) {
  const navigate = useNavigate();
  const recentAlerts = alerts.slice(0, 3);
  const activeJourney = journeys.find((j) => j.status === "active");

  const riskScore = useMemo(() => {
    const stored = localStorage.getItem("safeher_last_position");
    let lat = 28.6139;
    let lng = 77.209;
    if (stored) {
      try {
        const p = JSON.parse(stored);
        lat = p.lat;
        lng = p.lng;
      } catch {
        /* ignore */
      }
    }
    const hour = new Date().getHours();
    let s = 20;
    if (hour >= 20 || hour <= 5) s += 20;
    const nearby = INDIA_DANGER_ZONES.filter(
      (z) => haversineDistance(lat, lng, z.lat, z.lng) <= 5000,
    );
    s += Math.min(nearby.length * 5, 40);
    if (nearby.length > 0) s += 10;
    return Math.min(s, 100);
  }, []);

  return (
    <div className="space-y-4">
      {/* Escalation Banner */}
      {escalationLevel > 1 && (
        <EscalationPanel
          currentLevel={escalationLevel}
          onEscalate={() =>
            setEscalationLevel?.(
              Math.min(4, escalationLevel + 1) as EscalationLevel,
            )
          }
          onDeescalate={() =>
            setEscalationLevel?.(
              Math.max(1, escalationLevel - 1) as EscalationLevel,
            )
          }
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 rounded-2xl p-4"
        data-ocid="dashboard.panel"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-muted-foreground text-xs">{getGreeting()}</p>
            <h2 className="font-display font-bold text-xl text-foreground">
              {profile?.name || "Stay Safe"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Risk Score */}
      <RiskScoreCard />

      {/* AI Safety Assistant */}
      <AISafetyAssistant
        riskScore={riskScore}
        isJourneyActive={!!activeJourney}
        sharingStatus={sharingStatus}
        contactsCount={contacts.length}
      />

      {/* Showcase Stats */}
      <div
        className="grid grid-cols-2 gap-3"
        data-ocid="dashboard.showcase.card"
      >
        {[
          { label: "Women Protected", value: "50,000+", icon: "🛡️" },
          { label: "Cities Covered", value: "1,200+", icon: "🏙️" },
          { label: "Danger Zones", value: "600+", icon: "⚠️" },
          { label: "Emergency Points", value: "500+", icon: "🚨" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-card border border-border rounded-xl p-3 flex flex-col gap-1"
          >
            <span className="text-xl">{s.icon}</span>
            <p className="font-bold text-base">{s.value}</p>
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Location Sharing */}
      <LocationSharingCard
        sharingStatus={sharingStatus}
        onSharingChange={onSharingChange}
        onAlertAdded={onAlertAdded}
        contacts={contacts}
        profile={profile}
      />

      {/* Recent Alerts */}
      {recentAlerts.length > 0 && (
        <div
          className="bg-card border border-border rounded-2xl p-4"
          data-ocid="dashboard.alerts.card"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-sm">Recent Alerts</p>
            <button
              type="button"
              className="text-xs text-primary flex items-center gap-0.5"
              onClick={() => navigate({ to: "/alerts" })}
              data-ocid="dashboard.alerts.view_all.button"
            >
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {recentAlerts.map((a, i) => (
              <div
                key={a.id}
                className="flex items-center gap-3"
                data-ocid={`dashboard.alerts.item.${i + 1}`}
              >
                <Badge
                  className={`text-[10px] flex-shrink-0 border ${
                    ALERT_TYPE_COLORS[a.type] ??
                    "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {a.type}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate text-muted-foreground">
                    {a.location}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(a.timestamp).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Operations Timeline */}
      <OperationsTimeline events={timelineEvents} />

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Journey Mode", icon: "🗯️", path: "/journey" },
          { label: "Check-In", icon: "⏰", path: "/checkin" },
          { label: "Safe Zones", icon: "🏠", path: "/safezones" },
        ].map((q) => (
          <button
            key={q.path}
            type="button"
            onClick={() => navigate({ to: q.path })}
            className="bg-card border border-border rounded-xl p-3 flex flex-col items-center gap-1.5 hover:bg-secondary transition-colors"
            data-ocid="dashboard.quick_action.button"
          >
            <span className="text-xl">{q.icon}</span>
            <span className="text-[11px] text-muted-foreground font-medium">
              {q.label}
            </span>
          </button>
        ))}
      </div>

      {/* Official Help */}
      <div
        className="bg-card border border-border rounded-2xl p-4"
        data-ocid="dashboard.official_help.card"
      >
        <p className="font-semibold text-sm mb-3">National Emergency Numbers</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "National", number: "112", color: "text-rose-400" },
            { label: "Women", number: "1091", color: "text-pink-400" },
            { label: "Ambulance", number: "108", color: "text-blue-400" },
          ].map((c) => (
            <a
              key={c.number}
              href={`tel:${c.number}`}
              className="flex flex-col items-center gap-1 p-2 rounded-xl bg-secondary hover:bg-muted transition-colors"
              data-ocid="dashboard.emergency_call.button"
            >
              <Phone className={`w-4 h-4 ${c.color}`} />
              <span className={`font-bold text-sm ${c.color}`}>{c.number}</span>
              <span className="text-[10px] text-muted-foreground">
                {c.label}
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
