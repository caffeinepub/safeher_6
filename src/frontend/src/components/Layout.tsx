import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toaster } from "@/components/ui/sonner";
import { Link, useLocation } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  BarChart2,
  Bell,
  Clock,
  ExternalLink,
  FileText,
  Home,
  MapIcon,
  Moon,
  Navigation,
  Shield,
  Sun,
  User,
  Users,
  Wrench,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useSafeHer } from "../context/SafeHerContext";
import type { AlertRecord, EmergencyContact, UserProfile } from "../types";
import SOSButton from "./SOSButton";

const bottomNavItems = [
  { path: "/", icon: Home, labelKey: "home" as const },
  { path: "/map", icon: MapIcon, labelKey: "map" as const },
  { path: "/tools", icon: Shield, labelKey: "tools" as const },
  { path: "/alerts", icon: AlertTriangle, labelKey: "alerts" as const },
  { path: "/profile", icon: User, labelKey: "profile" as const },
];

const sidebarItems = [
  { path: "/", icon: Home, labelKey: "dashboard" as const },
  { path: "/map", icon: MapIcon, labelKey: "map" as const },
  { path: "/contacts", icon: Users, labelKey: "contacts" as const },
  { path: "/alerts", icon: AlertTriangle, labelKey: "alerts" as const },
  { path: "/tools", icon: Wrench, labelKey: "tools" as const },
  { path: "/journey", icon: Navigation, labelKey: "journey" as const },
  { path: "/checkin", icon: Clock, label: "Check-In" },
  { path: "/safezones", icon: Shield, label: "Safe Zones" },
  { path: "/reports", icon: FileText, labelKey: "reports" as const },
  { path: "/analytics", icon: BarChart2, labelKey: "analytics" as const },
  { path: "/profile", icon: User, labelKey: "profile" as const },
];

function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("safeher_theme");
    return saved !== "light";
  });

  const toggle = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem("safeher_theme", next ? "dark" : "light");
      if (next) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return next;
    });
  }, []);

  return { isDark, toggle };
}

interface LayoutProps {
  children: React.ReactNode;
  contacts: EmergencyContact[];
  onAlertAdded: (alert: AlertRecord) => void;
  profile: UserProfile | null;
}

export default function Layout({
  children,
  contacts,
  onAlertAdded,
  profile,
}: LayoutProps) {
  const location = useLocation();
  const { notifications, markAllRead, markRead, unreadCount } = useSafeHer();
  const { t, lang, setLang } = useLanguage();
  const { isDark, toggle: toggleDark } = useDarkMode();
  const [notifOpen, setNotifOpen] = useState(false);

  const isAdmin = localStorage.getItem("safeher_admin") === "true";

  const recentNotifs = notifications.slice(0, 5);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 flex-col bg-sidebar border-r border-border z-30">
        {/* Sidebar Header */}
        <div className="h-16 flex items-center gap-3 px-4 border-b border-border">
          <img
            src="/assets/generated/safeher-logo-transparent.dim_256x256.png"
            alt="SafeHer India"
            className="w-8 h-8 object-contain"
          />
          <div>
            <span className="font-display font-bold text-base text-foreground">
              SafeHer <span className="gradient-text">India</span>
            </span>
            <p className="text-[10px] text-muted-foreground">
              Women Safety Platform
            </p>
          </div>
        </div>

        {/* Nav Items */}
        <ScrollArea className="flex-1 py-4">
          <nav className="px-3 space-y-1">
            {sidebarItems.map((item) => {
              const active = location.pathname === item.path;
              const label =
                "labelKey" in item && item.labelKey
                  ? t(item.labelKey)
                  : item.label;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                  data-ocid={`nav.${
                    "labelKey" in item && item.labelKey
                      ? item.labelKey
                      : item.path.slice(1)
                  }.link`}
                >
                  <item.icon
                    className={`w-4 h-4 flex-shrink-0 ${active ? "" : ""}`}
                  />
                  {label}
                  {active && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                to="/admin"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  location.pathname === "/admin"
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
                data-ocid="nav.admin.link"
              >
                <Activity className="w-4 h-4" />
                {t("admin")}
              </Link>
            )}
            {/* Guardian Portal external link */}
            <a
              href="/guardian"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-secondary"
              data-ocid="nav.guardian.link"
            >
              <ExternalLink className="w-4 h-4 flex-shrink-0" />
              Guardian Portal
            </a>
          </nav>
        </ScrollArea>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border">
          <p className="text-[10px] text-muted-foreground text-center">
            National Emergency: <strong>112</strong> | Women:{" "}
            <strong>1091</strong>
          </p>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-card/90 backdrop-blur-md border-b border-border px-4 h-16 flex items-center justify-between sticky top-0 z-20">
          {/* Mobile Logo */}
          <div className="flex items-center gap-2 md:hidden">
            <img
              src="/assets/generated/safeher-logo-transparent.dim_256x256.png"
              alt="SafeHer India"
              className="w-7 h-7 object-contain"
            />
            <span className="font-display font-bold text-base text-foreground">
              SafeHer <span className="gradient-text">India</span>
            </span>
          </div>

          {/* Desktop page title area */}
          <div className="hidden md:block">
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <button
              type="button"
              onClick={() => setLang(lang === "en" ? "hi" : "en")}
              className="text-xs font-medium px-2 py-1 rounded-lg bg-secondary text-secondary-foreground hover:bg-muted transition-colors"
              data-ocid="nav.language.toggle"
            >
              {lang === "en" ? "हिंदी" : "EN"}
            </button>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleDark}
              className="w-8 h-8 rounded-lg bg-secondary hover:bg-muted flex items-center justify-center transition-colors"
              data-ocid="nav.darkmode.toggle"
              aria-label="Toggle dark mode"
            >
              {isDark ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            {/* Notification Bell */}
            <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="w-8 h-8 rounded-lg bg-secondary hover:bg-muted flex items-center justify-center transition-colors relative"
                  data-ocid="nav.notifications.button"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-80 p-0"
                data-ocid="nav.notifications.dropdown_menu"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <p className="font-semibold text-sm">{t("notifications")}</p>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllRead}
                      className="text-xs text-primary hover:underline"
                      data-ocid="nav.notifications.mark_all_read.button"
                    >
                      {t("markAllRead")}
                    </button>
                  )}
                </div>
                {recentNotifs.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                    {t("noNotifications")}
                  </div>
                ) : (
                  <div>
                    {recentNotifs.map((n) => (
                      <DropdownMenuItem
                        key={n.id}
                        className={`px-4 py-3 cursor-pointer flex-col items-start gap-1 ${
                          !n.read ? "bg-primary/5" : ""
                        }`}
                        onClick={() => markRead(n.id)}
                        data-ocid="notifications.item"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <span className="font-medium text-xs flex-1">
                            {n.title}
                          </span>
                          {!n.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {n.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(n.timestamp).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </DropdownMenuItem>
                    ))}
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 pb-24 md:pb-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-6">{children}</div>
        </main>

        {/* Mobile Bottom Nav */}
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border shadow-nav-up z-20 bottom-nav-safe"
          data-ocid="nav.panel"
        >
          <div className="flex items-center justify-around h-16 max-w-md mx-auto">
            {bottomNavItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-lg transition-colors min-w-[52px] ${
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-ocid={`nav.${item.labelKey}.link`}
                >
                  <item.icon
                    className={`w-5 h-5 ${active ? "stroke-[2.5px]" : ""}`}
                  />
                  <span className="text-[10px] font-medium">
                    {t(item.labelKey)}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* SOS Button */}
      <SOSButton
        contacts={contacts}
        onAlertAdded={onAlertAdded}
        profile={profile}
      />

      <Toaster position="top-center" richColors />
    </div>
  );
}
