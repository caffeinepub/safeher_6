import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { Brain, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { SharingStatus } from "../types";

interface Tip {
  icon: string;
  message: string;
  severity: "info" | "warning" | "critical";
  actionLabel?: string;
  actionPath?: string;
}

function getTips(
  riskScore: number,
  isJourneyActive: boolean,
  sharingStatus: SharingStatus,
  contactsCount: number,
): Tip[] {
  const tips: Tip[] = [];
  const hour = new Date().getHours();
  const isNight = hour >= 22 || hour < 5;

  if (contactsCount === 0) {
    tips.push({
      icon: "👥",
      message: "Add at least 2 emergency contacts to use SOS features.",
      severity: "critical",
      actionLabel: "Add Contacts",
      actionPath: "/contacts",
    });
  }

  if (riskScore > 70) {
    tips.push({
      icon: "🚨",
      message:
        "You're in a high-risk area. Share your location with contacts now.",
      severity: "critical",
      actionLabel: "Share Location",
    });
  } else if (riskScore > 50) {
    tips.push({
      icon: "⚠️",
      message: "Moderate risk detected. Stay aware of your surroundings.",
      severity: "warning",
    });
  }

  if (isNight && !isJourneyActive) {
    tips.push({
      icon: "🌙",
      message:
        "It's late at night. Consider enabling Journey Mode for added safety.",
      severity: "warning",
      actionLabel: "Start Journey",
      actionPath: "/journey",
    });
  }

  if (isJourneyActive && sharingStatus !== "active") {
    tips.push({
      icon: "📍",
      message:
        "Journey mode is active. Enable location sharing for best protection.",
      severity: "warning",
      actionLabel: "Enable Now",
    });
  }

  if (tips.length === 0) {
    tips.push({
      icon: "✅",
      message: "All systems normal. Stay aware of your surroundings.",
      severity: "info",
    });
  }

  return tips.slice(0, 3);
}

const SEVERITY_COLORS = {
  info: "text-muted-foreground",
  warning: "text-yellow-400",
  critical: "text-red-400",
};

interface Props {
  riskScore: number;
  isJourneyActive: boolean;
  sharingStatus: SharingStatus;
  contactsCount: number;
}

export default function AISafetyAssistant({
  riskScore,
  isJourneyActive,
  sharingStatus,
  contactsCount,
}: Props) {
  const [expanded, setExpanded] = useState(true);
  const navigate = useNavigate();
  const tips = getTips(
    riskScore,
    isJourneyActive,
    sharingStatus,
    contactsCount,
  );
  const hasCritical = tips.some((t) => t.severity === "critical");

  return (
    <div
      className="bg-card border border-border rounded-2xl overflow-hidden"
      data-ocid="ai_assistant.panel"
    >
      <button
        type="button"
        className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
        onClick={() => setExpanded((e) => !e)}
        data-ocid="ai_assistant.toggle"
      >
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">AI Safety Assistant</span>
          {hasCritical && (
            <Badge className="bg-red-500/20 text-red-400 border-red-500/40 text-[9px] px-1.5 py-0">
              ACTION NEEDED
            </Badge>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          {tips.map((tip) => (
            <div
              key={tip.message}
              className={`flex items-start gap-3 p-3 rounded-xl border ${
                tip.severity === "critical"
                  ? "bg-red-500/10 border-red-500/30"
                  : tip.severity === "warning"
                    ? "bg-yellow-500/10 border-yellow-500/30"
                    : "bg-secondary/50 border-border"
              }`}
            >
              <span className="text-lg flex-shrink-0 mt-0.5">{tip.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-xs ${SEVERITY_COLORS[tip.severity]}`}>
                  {tip.message}
                </p>
                {tip.actionLabel && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-[10px] mt-1 text-primary hover:text-primary"
                    onClick={() =>
                      tip.actionPath
                        ? navigate({ to: tip.actionPath })
                        : undefined
                    }
                    data-ocid="ai_assistant.action.button"
                  >
                    {tip.actionLabel} →
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
