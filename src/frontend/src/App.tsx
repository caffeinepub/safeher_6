import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import Layout from "./components/Layout";
import { LanguageProvider } from "./context/LanguageContext";
import { SafeHerProvider, useSafeHer } from "./context/SafeHerContext";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import AdminPage from "./pages/AdminPage";
import AlertsPage from "./pages/AlertsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import AuthPage from "./pages/AuthPage";
import CheckInPage from "./pages/CheckInPage";
import ContactsPage from "./pages/ContactsPage";
import Dashboard from "./pages/Dashboard";
import GuardianPortal from "./pages/GuardianPortal";
import JourneyPage from "./pages/JourneyPage";
import LandingPage from "./pages/LandingPage";
import MapPage from "./pages/MapPage";
import ProfilePage from "./pages/ProfilePage";
import ReportsPage from "./pages/ReportsPage";
import SafeZonesPage from "./pages/SafeZonesPage";
import SafetyToolsPage from "./pages/SafetyToolsPage";

function AppLayout() {
  const { contacts, addAlert, profile } = useSafeHer();
  return (
    <Layout contacts={contacts} onAlertAdded={addAlert} profile={profile}>
      <Outlet />
    </Layout>
  );
}

function DashboardPage() {
  const {
    profile,
    contacts,
    alerts,
    sharingStatus,
    setSharingStatus,
    addAlert,
    officialContacts,
    journeys,
    timelineEvents,
    escalationLevel,
    setEscalationLevel,
  } = useSafeHer();
  return (
    <Dashboard
      profile={profile}
      contacts={contacts}
      alerts={alerts}
      sharingStatus={sharingStatus}
      onSharingChange={setSharingStatus}
      onAlertAdded={addAlert}
      officialContacts={officialContacts}
      journeys={journeys}
      timelineEvents={timelineEvents}
      escalationLevel={escalationLevel}
      setEscalationLevel={setEscalationLevel}
    />
  );
}

function MapPageWrapper() {
  const { zones, addAlert, officialContacts } = useSafeHer();
  return (
    <MapPage
      zones={zones}
      onAlertAdded={addAlert}
      officialContacts={officialContacts}
    />
  );
}

function ContactsPageWrapper() {
  const { contacts, addContact, updateContact, deleteContact } = useSafeHer();
  return (
    <ContactsPage
      contacts={contacts}
      onAdd={addContact}
      onUpdate={updateContact}
      onDelete={deleteContact}
    />
  );
}

function AlertsPageWrapper() {
  const { alerts, clearAlerts } = useSafeHer();
  return <AlertsPage alerts={alerts} onClear={clearAlerts} />;
}

function ProfilePageWrapper() {
  const { profile, saveProfile } = useSafeHer();
  return <ProfilePage profile={profile} onSave={saveProfile} />;
}

const rootRoute = createRootRoute({ component: AppLayout });
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: DashboardPage,
});
const mapRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/map",
  component: MapPageWrapper,
});
const contactsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/contacts",
  component: ContactsPageWrapper,
});
const alertsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/alerts",
  component: AlertsPageWrapper,
});
const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: ProfilePageWrapper,
});
const analyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/analytics",
  component: AnalyticsPage,
});
const toolsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tools",
  component: SafetyToolsPage,
});
const journeyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/journey",
  component: JourneyPage,
});
const reportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reports",
  component: ReportsPage,
});
const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPage,
});
const checkInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/checkin",
  component: CheckInPage,
});
const safeZonesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/safezones",
  component: SafeZonesPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  mapRoute,
  contactsRoute,
  alertsRoute,
  profileRoute,
  analyticsRoute,
  toolsRoute,
  journeyRoute,
  reportsRoute,
  adminRoute,
  checkInRoute,
  safeZonesRoute,
]);
const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;

  // Guardian portal is accessible without auth
  if (
    window.location.pathname === "/guardian" ||
    window.location.hash === "#/guardian"
  ) {
    return (
      <LanguageProvider>
        <GuardianPortal />
      </LanguageProvider>
    );
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center animate-pulse">
            <img
              src="/assets/generated/safeher-logo-transparent.dim_256x256.png"
              alt="SafeHer India"
              className="w-10 h-10 object-contain"
            />
          </div>
          <p className="text-muted-foreground text-sm">
            Loading SafeHer India...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LanguageProvider>
        <LandingPage />
      </LanguageProvider>
    );
  }

  return (
    <SafeHerProvider>
      <LanguageProvider>
        <RouterProvider router={router} />
      </LanguageProvider>
    </SafeHerProvider>
  );
}
