import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Download,
  FileText,
  Loader2,
  MapPin,
  MessageSquare,
  Shield,
  Upload,
  Users,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSafeHer } from "../context/SafeHerContext";
import { INDIA_DANGER_ZONES } from "../data/dangerZones";
import { useActor } from "../hooks/useActor";

export default function AdminPage() {
  const navigate = useNavigate();
  const isAdmin = localStorage.getItem("safeher_admin") === "true";
  const { alerts, reports, updateReport, contacts } = useSafeHer();
  const { actor } = useActor();

  // Twilio config form state
  const [twilioSid, setTwilioSid] = useState("");
  const [twilioToken, setTwilioToken] = useState("");
  const [twilioFrom, setTwilioFrom] = useState("");
  const [savingTwilio, setSavingTwilio] = useState(false);

  // System stats
  const [stats, setStats] = useState<{
    totalSosAlerts: number;
    totalAutoAlerts: number;
    failedDeliveries: number;
    totalUsers: number;
  } | null>(null);
  const [twilioStatus, setTwilioStatus] = useState<{
    isMockMode: boolean;
    configured: boolean;
    fromNumber?: string;
  } | null>(null);
  const [alertLogs, setAlertLogs] = useState<
    Array<{
      id: string;
      alertType: string;
      timestamp: bigint;
      contactsNotified: bigint;
      overallStatus: string;
      isMockMode: boolean;
      providerUsed: string;
    }>
  >([]);

  useEffect(() => {
    if (!actor || !isAdmin) return;
    Promise.all([
      actor.getSystemStats(),
      actor.getTwilioStatus(),
      actor.getAlertLogs("system"),
    ])
      .then(([s, tw, logs]) => {
        setStats({
          totalSosAlerts: Number(s.totalSosAlerts),
          totalAutoAlerts: Number(s.totalAutoAlerts),
          failedDeliveries: Number(s.failedDeliveries),
          totalUsers: Number(s.totalUsers),
        });
        setTwilioStatus(tw);
        setAlertLogs(logs.slice(0, 20));
      })
      .catch((e) => console.warn("[Admin] stats fetch failed", e));
  }, [actor, isAdmin]);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
        <Shield className="w-16 h-16 text-muted-foreground" />
        <h2 className="font-display font-bold text-2xl">
          Admin Access Required
        </h2>
        <p className="text-muted-foreground text-sm max-w-xs">
          Enable Admin Mode in your Profile settings to access the admin panel.
        </p>
        <Button onClick={() => navigate({ to: "/profile" })}>
          Go to Profile
        </Button>
      </div>
    );
  }

  const handleExport = () => {
    toast.success("Export started (CSV generation — demo)");
  };

  const handleApproveReport = (id: string) => {
    const report = reports.find((r) => r.id === id);
    if (report) {
      updateReport({ ...report, status: "approved" });
      toast.success("Report approved.");
    }
  };

  const handleRejectReport = (id: string) => {
    const report = reports.find((r) => r.id === id);
    if (report) {
      updateReport({ ...report, status: "rejected" });
      toast.info("Report rejected.");
    }
  };

  const handleSaveTwilio = async () => {
    if (!actor) {
      toast.error("Backend unavailable");
      return;
    }
    setSavingTwilio(true);
    try {
      const ok = await actor.setTwilioConfig(
        twilioSid,
        twilioToken,
        twilioFrom,
      );
      if (ok) {
        toast.success("✅ Twilio configuration saved!");
        const tw = await actor.getTwilioStatus();
        setTwilioStatus(tw);
      } else {
        toast.error("Failed to save Twilio config");
      }
    } catch (e) {
      toast.error("Error saving Twilio config");
      console.error(e);
    } finally {
      setSavingTwilio(false);
    }
  };

  const displayedZones = INDIA_DANGER_ZONES.slice(0, 20);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl">Admin Panel</h2>
          <p className="text-xs text-muted-foreground">
            SafeHer India — Platform Administration (Demo)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-primary/20 text-primary border-primary/30">
            Admin Mode
          </Badge>
          {twilioStatus?.isMockMode && (
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/40 text-xs">
              ⚠️ MOCK MODE
            </Badge>
          )}
        </div>
      </div>

      {/* Mock Mode Warning */}
      {twilioStatus?.isMockMode && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <p className="text-sm font-semibold text-yellow-400 mb-1">
            ⚠️ Running in MOCK MODE — No real SMS is being sent
          </p>
          <p className="text-xs text-yellow-400/80">
            Configure Twilio credentials below to enable real SMS delivery. All
            alerts are currently logged to console only.
          </p>
        </div>
      )}

      <Tabs defaultValue="overview">
        <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full h-auto gap-1 p-1">
          <TabsTrigger value="overview" className="text-xs">
            Overview
          </TabsTrigger>
          <TabsTrigger value="sms" className="text-xs">
            SMS Config
          </TabsTrigger>
          <TabsTrigger value="deliveries" className="text-xs">
            Deliveries
          </TabsTrigger>
          <TabsTrigger value="zones" className="text-xs">
            Zones
          </TabsTrigger>
          <TabsTrigger value="reports" className="text-xs">
            Reports
          </TabsTrigger>
          <TabsTrigger value="incidents" className="text-xs">
            Incidents
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                label: "Total SOS Alerts",
                value:
                  stats?.totalSosAlerts ??
                  alerts.filter((a) => a.type === "SOS").length,
                icon: AlertTriangle,
                color: "text-rose-400",
              },
              {
                label: "Auto-Location Alerts",
                value:
                  stats?.totalAutoAlerts ??
                  alerts.filter((a) => a.type === "AutoShare").length,
                icon: MapPin,
                color: "text-blue-400",
              },
              {
                label: "Failed Deliveries",
                value: stats?.failedDeliveries ?? 0,
                icon: XCircle,
                color: "text-orange-400",
              },
              {
                label: "Total Users",
                value: stats?.totalUsers ?? contacts.length + 5,
                icon: Users,
                color: "text-green-400",
              },
            ].map((s) => (
              <Card key={s.label} data-ocid="admin.stat.card">
                <CardContent className="p-4">
                  <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
                  <p className="font-bold text-xl">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No recent alerts.
                </p>
              ) : (
                <div className="space-y-2">
                  {alerts.slice(0, 5).map((a, i) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-2 text-sm"
                      data-ocid={`admin.activity.item.${i + 1}`}
                    >
                      <Activity className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium">{a.type}</span>
                      {a.isMockMode && (
                        <Badge className="text-[9px] bg-yellow-500/20 text-yellow-400 border-yellow-500/30 px-1">
                          MOCK
                        </Badge>
                      )}
                      <span className="text-muted-foreground truncate flex-1">
                        {a.location}
                      </span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {new Date(a.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMS Config Tab */}
        <TabsContent value="sms" className="space-y-4">
          <Card data-ocid="admin.twilio.card">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Twilio SMS Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Account SID</Label>
                <Input
                  value={twilioSid}
                  onChange={(e) => setTwilioSid(e.target.value)}
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="h-9 text-sm font-mono"
                  data-ocid="admin.twilio_sid.input"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Auth Token</Label>
                <Input
                  value={twilioToken}
                  onChange={(e) => setTwilioToken(e.target.value)}
                  placeholder="your_auth_token_here"
                  type="password"
                  className="h-9 text-sm"
                  data-ocid="admin.twilio_token.input"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">From Phone Number</Label>
                <Input
                  value={twilioFrom}
                  onChange={(e) => setTwilioFrom(e.target.value)}
                  placeholder="+1xxxxxxxxxx"
                  className="h-9 text-sm"
                  data-ocid="admin.twilio_from.input"
                />
              </div>
              <Button
                onClick={handleSaveTwilio}
                disabled={savingTwilio}
                className="w-full"
                data-ocid="admin.twilio_save.button"
              >
                {savingTwilio ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Save Twilio Config
              </Button>
              {twilioStatus && (
                <div className="text-xs text-muted-foreground border border-border rounded-lg p-3">
                  <p>
                    Status:{" "}
                    <span
                      className={
                        twilioStatus.configured
                          ? "text-green-400"
                          : "text-yellow-400"
                      }
                    >
                      {twilioStatus.configured
                        ? "✅ Configured"
                        : "⚠️ Not configured"}
                    </span>
                  </p>
                  <p>
                    Mode:{" "}
                    <span
                      className={
                        twilioStatus.isMockMode
                          ? "text-yellow-400"
                          : "text-green-400"
                      }
                    >
                      {twilioStatus.isMockMode
                        ? "MOCK (demo)"
                        : "REAL (live SMS)"}
                    </span>
                  </p>
                  {twilioStatus.fromNumber && (
                    <p>
                      From:{" "}
                      <span className="font-mono">
                        {twilioStatus.fromNumber}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alert Delivery Monitor Tab */}
        <TabsContent value="deliveries" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Alert Delivery Monitor</p>
            {twilioStatus?.isMockMode && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/40 text-xs">
                ⚠️ MOCK MODE
              </Badge>
            )}
          </div>
          {alertLogs.length === 0 ? (
            <div
              className="text-center py-8 text-sm text-muted-foreground"
              data-ocid="admin.deliveries.empty_state"
            >
              No alert logs yet. Send a test SOS to see delivery status.
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <Table data-ocid="admin.deliveries.table">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Time</TableHead>
                    <TableHead className="text-xs">Notified</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Mode</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alertLogs.map((log, i) => (
                    <TableRow
                      key={log.id}
                      data-ocid={`admin.deliveries.row.${i + 1}`}
                    >
                      <TableCell>
                        <Badge className="text-[10px] bg-primary/20 text-primary border-primary/30">
                          {log.alertType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(Number(log.timestamp)).toLocaleTimeString()}
                      </TableCell>
                      <TableCell className="text-xs">
                        {Number(log.contactsNotified)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-[10px] ${
                            log.overallStatus === "success"
                              ? "bg-green-500/20 text-green-400"
                              : log.overallStatus === "partial"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {log.overallStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.isMockMode ? (
                          <Badge className="text-[9px] bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                            MOCK
                          </Badge>
                        ) : (
                          <Badge className="text-[9px] bg-green-500/20 text-green-400 border-green-500/30">
                            REAL
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Danger Zones Tab */}
        <TabsContent value="zones" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {displayedZones.length} of {INDIA_DANGER_ZONES.length}{" "}
              zones
            </p>
            <div className="flex gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-xs"
                    data-ocid="admin.import.open_modal_button"
                  >
                    <Upload className="w-3 h-3" /> Import CSV
                  </Button>
                </DialogTrigger>
                <DialogContent data-ocid="admin.import.dialog">
                  <DialogHeader>
                    <DialogTitle>Import Danger Zones from CSV</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Expected CSV format:
                    </p>
                    <pre className="bg-secondary rounded-lg p-3 text-xs overflow-auto">
                      "name,city,state,lat,lng,radius,riskLevel Dark Alley Near
                      Station,Delhi,Delhi,28.65,77.23,200,high"
                    </pre>
                    <p className="text-xs text-muted-foreground">
                      Upload functionality: edit data/dangerZones.ts directly
                      for now.
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
              <Button
                size="sm"
                variant="outline"
                className="gap-1 text-xs"
                onClick={handleExport}
                data-ocid="admin.export.button"
              >
                <Download className="w-3 h-3" /> Export
              </Button>
            </div>
          </div>
          <div className="rounded-xl border border-border overflow-hidden">
            <Table data-ocid="admin.zones.table">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">City</TableHead>
                  <TableHead className="text-xs">Risk</TableHead>
                  <TableHead className="text-xs">Radius</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedZones.map((z, i) => (
                  <TableRow key={z.id} data-ocid={`admin.zones.row.${i + 1}`}>
                    <TableCell className="text-xs font-medium">
                      {z.name}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {z.city}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`text-[10px] ${
                          z.riskLevel === "critical"
                            ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                            : z.riskLevel === "high"
                              ? "bg-red-500/20 text-red-400 border-red-500/30"
                              : z.riskLevel === "medium"
                                ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                                : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                        }`}
                      >
                        {z.riskLevel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {z.radius}m
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Community Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          {reports.length === 0 ? (
            <div
              className="text-center py-10"
              data-ocid="admin.reports.empty_state"
            >
              <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No community reports yet.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <Table data-ocid="admin.reports.table">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Title</TableHead>
                    <TableHead className="text-xs">Category</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((r, i) => (
                    <TableRow
                      key={r.id}
                      data-ocid={`admin.reports.row.${i + 1}`}
                    >
                      <TableCell className="text-xs font-medium">
                        {r.title}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.category}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-[10px] ${
                            r.status === "approved"
                              ? "bg-green-500/20 text-green-400"
                              : r.status === "rejected"
                                ? "bg-muted text-muted-foreground"
                                : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {r.status === "pending" && (
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => handleApproveReport(r.id)}
                              className="p-1 hover:text-green-400 transition-colors"
                              data-ocid="admin.reports.approve.button"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectReport(r.id)}
                              className="p-1 hover:text-rose-400 transition-colors"
                              data-ocid="admin.reports.reject.button"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Incident Logs Tab */}
        <TabsContent value="incidents" className="space-y-4">
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              className="gap-1 text-xs"
              onClick={handleExport}
              data-ocid="admin.incidents.export.button"
            >
              <Download className="w-3 h-3" /> Export Logs
            </Button>
          </div>
          {alerts.length === 0 ? (
            <div
              className="text-center py-10"
              data-ocid="admin.incidents.empty_state"
            >
              <p className="text-muted-foreground">No incident logs yet.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <Table data-ocid="admin.incidents.table">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Location</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.map((a, i) => (
                    <TableRow
                      key={a.id}
                      data-ocid={`admin.incidents.row.${i + 1}`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Badge className="text-[10px] bg-primary/20 text-primary border-primary/30">
                            {a.type}
                          </Badge>
                          {a.isMockMode && (
                            <Badge className="text-[9px] bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                              MOCK
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground truncate max-w-[120px]">
                        {a.location}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(a.timestamp).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {a.sendSuccess !== undefined ? (
                          a.sendSuccess ? (
                            <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                          )
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            N/A
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
