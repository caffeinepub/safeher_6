import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ChevronDown, ChevronUp, Siren } from "lucide-react";
import type { EscalationLevel } from "../types";

const LEVELS = [
  {
    level: 1 as EscalationLevel,
    color: "text-muted-foreground",
    bg: "bg-muted/50 border-border",
    activeBg: "bg-slate-500/20 border-slate-500/40",
    label: "Warning",
    desc: "Local alert only",
    icon: "⚪",
  },
  {
    level: 2 as EscalationLevel,
    color: "text-yellow-400",
    bg: "bg-muted/50 border-border",
    activeBg: "bg-yellow-500/20 border-yellow-500/40",
    label: "Notify Contacts",
    desc: "SMS to trusted contacts",
    icon: "🟡",
  },
  {
    level: 3 as EscalationLevel,
    color: "text-orange-400",
    bg: "bg-muted/50 border-border",
    activeBg: "bg-orange-500/20 border-orange-500/40",
    label: "Guardian Alert",
    desc: "Guardians + official contacts",
    icon: "🟠",
  },
  {
    level: 4 as EscalationLevel,
    color: "text-red-400",
    bg: "bg-muted/50 border-border",
    activeBg: "bg-red-500/20 border-red-500/40",
    label: "Full SOS",
    desc: "Continuous location + siren",
    icon: "🔴",
  },
];

interface Props {
  currentLevel: EscalationLevel;
  onEscalate: () => void;
  onDeescalate: () => void;
}

export default function EscalationPanel({
  currentLevel,
  onEscalate,
  onDeescalate,
}: Props) {
  return (
    <div
      className="bg-card border border-border rounded-2xl p-4 space-y-3"
      data-ocid="escalation.panel"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning" />
          <span className="font-semibold text-sm">Emergency Escalation</span>
        </div>
        {currentLevel === 4 && (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/40 animate-pulse text-xs">
            MAXIMUM ALERT
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {LEVELS.map((lvl) => {
          const isActive = currentLevel >= lvl.level;
          return (
            <div
              key={lvl.level}
              className={`rounded-xl p-2 border text-center transition-all ${
                isActive ? lvl.activeBg : lvl.bg
              }`}
            >
              <div className="text-lg mb-1">{lvl.icon}</div>
              <p
                className={`text-[10px] font-bold ${
                  isActive ? lvl.color : "text-muted-foreground"
                }`}
              >
                L{lvl.level}
              </p>
              <p
                className={`text-[9px] ${
                  isActive ? lvl.color : "text-muted-foreground/60"
                }`}
              >
                {lvl.label}
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground border border-border rounded-lg px-3 py-2">
        <Siren className="w-3.5 h-3.5 flex-shrink-0" />
        <span>{LEVELS[currentLevel - 1]?.desc ?? "No active escalation"}</span>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onDeescalate}
          disabled={currentLevel <= 1}
          className="flex-1 h-8 text-xs gap-1"
          data-ocid="escalation.deescalate.button"
        >
          <ChevronDown className="w-3 h-3" /> De-escalate
        </Button>
        <Button
          size="sm"
          onClick={onEscalate}
          disabled={currentLevel >= 4}
          className="flex-1 h-8 text-xs gap-1 bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30"
          variant="outline"
          data-ocid="escalation.escalate.button"
        >
          <ChevronUp className="w-3 h-3" /> Escalate
        </Button>
      </div>
    </div>
  );
}
