import { ScrollArea } from "@/components/ui/scroll-area";
import type { SafetyTimelineEvent } from "../types";

const TYPE_ICONS: Record<SafetyTimelineEvent["type"], string> = {
  journey_start: "🚀",
  danger_zone_entered: "⚠️",
  risk_score_changed: "📊",
  check_in_completed: "✅",
  missed_check_in: "❌",
  route_deviation: "📍",
  sos_triggered: "🚨",
  safe_zone_entered: "🏠",
  auto_share_sent: "📡",
};

const SEVERITY_COLORS = {
  info: "border-l-blue-500/50 bg-blue-500/5",
  warning: "border-l-yellow-500/50 bg-yellow-500/5",
  critical: "border-l-red-500/50 bg-red-500/5",
};

const SEVERITY_TEXT = {
  info: "text-muted-foreground",
  warning: "text-yellow-400",
  critical: "text-red-400",
};

interface Props {
  events: SafetyTimelineEvent[];
}

export default function OperationsTimeline({ events }: Props) {
  const recent = events.slice(0, 10);

  return (
    <div
      className="bg-card border border-border rounded-2xl p-4"
      data-ocid="timeline.panel"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">⚡</span>
        <span className="font-semibold text-sm">Live Safety Timeline</span>
        {recent.length > 0 && (
          <span className="ml-auto text-[10px] text-muted-foreground">
            {recent.length} event{recent.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {recent.length === 0 ? (
        <div
          className="text-center py-6 text-xs text-muted-foreground"
          data-ocid="timeline.empty_state"
        >
          No safety events yet. Start your journey to begin tracking.
        </div>
      ) : (
        <ScrollArea className="max-h-64">
          <div className="space-y-2">
            {recent.map((event) => (
              <div
                key={event.id}
                className={`border-l-2 pl-3 py-2 rounded-r-lg ${
                  SEVERITY_COLORS[event.severity]
                }`}
                data-ocid="timeline.item"
              >
                <div className="flex items-start gap-2">
                  <span className="text-sm flex-shrink-0">
                    {TYPE_ICONS[event.type]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs font-medium ${
                        SEVERITY_TEXT[event.severity]
                      }`}
                    >
                      {event.description}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(event.timestamp).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
