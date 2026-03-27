# SafeHer India — Production Upgrade

## Current State

Fully branded SafeHer India PWA with:
- SOSButton.tsx: Uses `mockSendSOSAlert()` — always returns success, never actually sends SMS
- LocationSharingCard.tsx: Uses `mockSendLocationAlert()` — always returns success, never actually sends
- dangerZones.ts: ~199 zones, needs expansion to 600+
- Backend: Minimal Motoko canister with only `_initializeAccessControlWithSecret`
- No Guardian Portal, no Smart Check-In, no AI Safety Assistant, no Safe Zones, no Emergency Escalation
- Existing pages: Dashboard, Map, Contacts, Alerts, Journey, Reports, Analytics, SafetyTools, Admin, Profile

## Requested Changes (Diff)

### Add
- Motoko backend: `sendSosAlert`, `sendAutoLocationAlert`, `saveAlertLog`, `getAlertLogs`, `saveEmergencyContact`, `getEmergencyContacts`, `deleteEmergencyContact`, `updateProfile`, `getProfile`, `startJourney`, `endJourney`, `saveCheckIn`, `saveSafeZone`, `getSafeZones` — all using HTTP outcalls to Twilio for real SMS
- New page: GuardianPortal.tsx — invite-token based access for family to see live journey status
- New page: CheckInPage.tsx — smart check-in with 10/20/30 min intervals, countdown, "I'm safe" button, missed check-in escalation
- New page: SafeZonesPage.tsx — save Home/College/Hostel/Workplace safe zones, shown on map
- New component: EscalationPanel.tsx — Level 1-4 escalation system with visual progress
- New component: AISafetyAssistant.tsx — rule-based safety tips panel on dashboard based on risk score, time of day
- New component: OperationsTimeline.tsx — live safety events feed on dashboard
- Danger zones expanded to 600+ entries in dangerZones.ts covering all states
- `.env.example` with Twilio/MSG91 credentials and DEMO_MODE flag
- types/index.ts: add SafeZone, CheckIn, GuardianSession, EscalationLevel types
- AlertRecord: add `providerUsed`, `isMockMode`, `mapLink` fields
- Admin panel: zone CSV import UI, alert delivery monitoring panel, failed alert retry

### Modify
- SOSButton.tsx: Replace `mockSendSOSAlert()` with real call to Motoko `sendSosAlert()`. Show actual delivery status per contact, show mock mode badge if provider not configured
- LocationSharingCard.tsx: Replace `mockSendLocationAlert()` with real call to Motoko `sendAutoLocationAlert()`. Show real delivery result
- JourneyPage.tsx: Add route deviation detection (200m/500m/1km threshold), no-movement detection, missed ETA detection, deviation threshold settings
- Dashboard.tsx: Add AISafetyAssistant panel, OperationsTimeline, EscalationPanel widget
- AdminPage.tsx: Add delivery monitoring, failed alert retry panel, CSV zone import
- types/index.ts: Extend AlertRecord, add new types

### Remove
- All `mockSendSOSAlert()` and `mockSendLocationAlert()` functions
- All hardcoded fake success states from SOS and auto-location paths

## Implementation Plan

1. Generate Motoko backend with alert pipeline + HTTP outcalls to Twilio
2. Expand dangerZones.ts to 600+ entries
3. Update types/index.ts with new types
4. Patch SOSButton.tsx to call real canister `sendSosAlert` method
5. Patch LocationSharingCard.tsx to call real canister `sendAutoLocationAlert`
6. Add new pages: GuardianPortal, CheckInPage, SafeZonesPage
7. Add new components: EscalationPanel, AISafetyAssistant, OperationsTimeline
8. Upgrade JourneyPage with deviation/movement detection
9. Upgrade AdminPage with monitoring panel
10. Update App.tsx with new routes
11. Create .env.example
