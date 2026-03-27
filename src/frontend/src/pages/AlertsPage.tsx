import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Mic,
  Navigation,
  Radio,
  RefreshCw,
  Share2,
  Smartphone,
  Trash2,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { AlertRecord, AlertType } from "../types";

const TYPE_CONFIG: Record<
  AlertType,
  {
    label: string;
    icon: React.ElementType;
    cls: string;
    iconCls: string;
    bg: string;
  }
> = {
  SOS: {
    label: "SOS",
    icon: AlertTriangle,
    cls: "bg-primary/20 text-primary border-primary/30",
    iconCls: "text-primary",
    bg: "border-primary/20",
  },
  RedZone: {
    label: "Red Zone",
    icon: Radio,
    cls: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    iconCls: "text-orange-400",
    bg: "border-orange-500/20",
  },
  AutoShare: {
    label: "Auto Share",
    icon: Share2,
    cls: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    iconCls: "text-blue-400",
    bg: "border-blue-500/20",
  },
  VoiceSOS: {
    label: "Voice SOS",
    icon: Mic,
    cls: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    iconCls: "text-purple-400",
    bg: "border-purple-500/20",
  },
  ShakeSOS: {
    label: "Shake SOS",
    icon: Smartphone,
    cls: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    iconCls: "text-yellow-400",
    bg: "border-yellow-500/20",
  },
  Journey: {
    label: "Journey",
    icon: Navigation,
    cls: "bg-green-500/20 text-green-400 border-green-500/30",
    iconCls: "text-green-400",
    bg: "border-green-500/20",
  },
};

const FILTER_TABS: Array<{ key: AlertType | "All"; label: string }> = [
  { key: "All", label: "All" },
  { key: "SOS", label: "SOS" },
  { key: "AutoShare", label: "Auto Share" },
  { key: "RedZone", label: "Red Zone" },
  { key: "VoiceSOS", label: "Voice SOS" },
  { key: "ShakeSOS", label: "Shake SOS" },
];

interface Props {
  alerts: AlertRecord[];
  onClear: () => void;
}

export default function AlertsPage({ alerts, onClear }: Props) {
  const [filter, setFilter] = useState<AlertType | "All">("All");

  const filtered =
    filter === "All" ? alerts : alerts.filter((a) => a.type === filter);

  const handleResend = (a: AlertRecord) => {
    const contacts = a.contactsNotified;
    toast.success(
      `Alert resent to ${contacts} contact${contacts !== 1 ? "s" : ""}`,
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-xl">Alert History</h2>
          <p className="text-xs text-muted-foreground">
            {alerts.length} alert{alerts.length !== 1 ? "s" : ""} recorded
          </p>
        </div>
        {alerts.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                data-ocid="alerts.clear.open_modal_button"
                className="gap-1 text-primary border-primary/30 hover:bg-primary/10"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent data-ocid="alerts.clear.dialog">
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all alerts?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all alert history.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-ocid="alerts.clear.cancel_button">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  data-ocid="alerts.clear.confirm_button"
                  onClick={onClear}
                  className="bg-primary text-primary-foreground"
                >
                  Clear All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Filter Tabs */}
      <div
        className="flex gap-2 overflow-x-auto pb-1 no-scrollbar"
        data-ocid="alerts.filter.tab"
      >
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === tab.key
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-dashed border-border rounded-2xl p-10 text-center space-y-3"
          data-ocid="alerts.empty_state"
        >
          <div className="text-5xl">🛡️</div>
          <p className="font-display font-semibold text-lg">
            {filter === "All" ? "No alerts yet" : `No ${filter} alerts`}
          </p>
          <p className="text-sm text-muted-foreground">
            Stay safe! Your alert history will appear here.
          </p>
        </motion.div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-border ml-1" />
          <AnimatePresence>
            <div className="space-y-3">
              {filtered.map((a, i) => {
                const cfg = TYPE_CONFIG[a.type] ?? TYPE_CONFIG.SOS;
                const Icon = cfg.icon;
                const date = new Date(a.timestamp);
                const hasSendStatus = a.sendSuccess !== undefined;
                return (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex gap-3"
                    data-ocid={`alerts.item.${i + 1}`}
                  >
                    {/* Timeline dot */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center bg-card border ${cfg.bg} relative z-10 flex-shrink-0`}
                    >
                      <Icon className={`w-4 h-4 ${cfg.iconCls}`} />
                    </div>

                    {/* Card */}
                    <div
                      className={`flex-1 bg-card border ${cfg.bg} rounded-2xl p-4 space-y-2 min-w-0`}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`text-[10px] ${cfg.cls}`}>
                          {cfg.label}
                        </Badge>
                        {hasSendStatus && (
                          <span
                            className={`text-[10px] flex items-center gap-1 font-medium ${
                              a.sendSuccess ? "text-safe" : "text-primary"
                            }`}
                          >
                            {a.sendSuccess ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            {a.sendSuccess ? "Sent" : "Failed"}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {date.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {date.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground truncate">
                          {a.location}
                        </span>
                      </div>

                      {a.errorMessage && (
                        <p className="text-xs text-primary">
                          Error: {a.errorMessage}
                        </p>
                      )}

                      {a.deliveryStatuses && a.deliveryStatuses.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                            Delivery Status
                          </p>
                          {a.deliveryStatuses.map((d) => (
                            <div
                              key={d.contactId}
                              className="flex items-center gap-2 text-xs"
                            >
                              {d.status === "sent" ? (
                                <CheckCircle2 className="w-3 h-3 text-safe flex-shrink-0" />
                              ) : (
                                <XCircle className="w-3 h-3 text-primary flex-shrink-0" />
                              )}
                              <span className="truncate">
                                {d.name} ({d.phone})
                              </span>
                              <span
                                className={`ml-auto font-medium ${
                                  d.status === "sent"
                                    ? "text-safe"
                                    : "text-primary"
                                }`}
                              >
                                {d.status === "sent" ? "Sent" : "Failed"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {!a.deliveryStatuses && (
                        <p className="text-xs text-muted-foreground">
                          {a.contactsNotified} contact
                          {a.contactsNotified !== 1 ? "s" : ""} notified
                        </p>
                      )}

                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => handleResend(a)}
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                          data-ocid={"alerts.resend.button"}
                        >
                          <RefreshCw className="w-3 h-3" /> Resend Alert
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
