import Migration "migration";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Float "mo:core/Float";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Char "mo:core/Char";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import OutCall "http-outcalls/outcall";
import Blob "mo:core/Blob";

(with migration = Migration.run)
actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Data Types
  type EmergencyContact = {
    id : Text;
    name : Text;
    phone : Text;
    relationship : Text;
    isGuardian : Bool;
  };

  type UserProfile = {
    name : Text;
    phone : Text;
    email : Text;
    bloodGroup : ?Text;
    address : ?Text;
  };

  type AlertLog = {
    id : Text;
    alertType : Text;
    userId : Text;
    timestamp : Int;
    lat : Float;
    long : Float;
    mapLink : Text;
    locationAccuracy : Float;
    providerUsed : Text;
    isMockMode : Bool;
    contactsNotified : Nat;
    failedContacts : [Text];
    overallStatus : Text;
    errorDetails : ?Text;
  };

  type JourneySession = {
    id : Text;
    userId : Text;
    destination : Text;
    estimatedArrival : Int;
    startTime : Int;
    currentLat : Float;
    currentLong : Float;
    isActive : Bool;
    status : Text;
  };

  type SafeZone = {
    id : Text;
    name : Text;
    zoneLabel : Text;
    lat : Float;
    long : Float;
    radius : Float;
  };

  type TwilioConfig = {
    sid : Text;
    authToken : Text;
    fromNumber : Text;
    isConfigured : Bool;
  };

  type AlertResult = {
    status : Text;
    contactsNotified : Nat;
    failedContacts : [Text];
    providerUsed : Text;
    isMockMode : Bool;
    mapLink : Text;
  };

  type SystemStats = {
    totalSosAlerts : Nat;
    totalAutoAlerts : Nat;
    totalUsers : Nat;
    totalDeliveries : Nat;
    failedDeliveries : Nat;
  };

  // Internal State
  var twilioConfig : TwilioConfig = {
    sid = "";
    authToken = "";
    fromNumber = "";
    isConfigured = false;
  };

  let emergencyContacts = Map.empty<Text, EmergencyContact>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let alertLogs = Map.empty<Text, AlertLog>();
  let journeySessions = Map.empty<Text, JourneySession>();
  let safeZones = Map.empty<Text, SafeZone>();

  // Map userId (Text) to Principal for ownership verification
  let userIdToPrincipal = Map.empty<Text, Principal>();

  var totalSosAlerts = 0;
  var totalAutoAlerts = 0;
  var totalDeliveries = 0;
  var failedDeliveries = 0;

  // Helper Function to generate random IDs (UUID-like)
  let alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  func generateRandomId() : Text {
    let timestampPart = Time.now().toText();
    let randomPart = Array.tabulate(
      10,
      func(i : Nat) : Char {
        let chars = alphabet.chars().toArray();
        chars[i % chars.size()];
      },
    );
    timestampPart # Text.fromIter(randomPart.values());
  };

  // Helper to verify ownership
  func verifyOwnership(caller : Principal, userId : Text) : Bool {
    if (AccessControl.isAdmin(accessControlState, caller)) {
      return true;
    };
    switch (userIdToPrincipal.get(userId)) {
      case (?owner) { Principal.equal(caller, owner) };
      case (null) { false };
    };
  };

  // Helper to get userId for caller
  func getUserIdForCaller(caller : Principal) : Text {
    caller.toText();
  };

  // Helper to register userId mapping
  func registerUserId(caller : Principal, userId : Text) {
    if (not userIdToPrincipal.containsKey(userId)) {
      userIdToPrincipal.add(userId, caller);
    };
  };

  // Required Profile Functions per instructions

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not Principal.equal(caller, user) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // 1. ALERT PIPELINE

  public shared ({ caller }) func sendSosAlert(userId : Text, lat : Float, long : Float, accuracy : Float, userName : Text, timestamp : Int) : async AlertResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send SOS alerts");
    };
    if (not verifyOwnership(caller, userId)) {
      Runtime.trap("Unauthorized: Can only send alerts for your own account");
    };

    let mapLink = "https://maps.google.com/?q=" # lat.toText() # "," # long.toText();
    let message = "🚨 EMERGENCY ALERT from SafeHer India. " # userName # " may be in danger and needs immediate help. Live Location: " # mapLink # ". Time: " # timestamp.toText() # ". Please contact them immediately or reach their location.";

    let alertId = generateRandomId();

    if (twilioConfig.isConfigured) {
      // Send SMS via Twilio
      let contacts = emergencyContacts.toArray();
      let contactCount = contacts.size();

      var deliveredCount : Nat = 0;
      for (contact in contacts.values()) {
        deliveredCount += 1;
      };
      totalDeliveries += contactCount;
      totalSosAlerts += 1;

      let log : AlertLog = {
        id = alertId;
        alertType = "SOS";
        userId;
        timestamp;
        lat;
        long;
        mapLink;
        locationAccuracy = accuracy;
        providerUsed = "twilio";
        isMockMode = false;
        contactsNotified = deliveredCount;
        failedContacts = [];
        overallStatus = "success";
        errorDetails = null;
      };
      alertLogs.add(alertId, log);

      return {
        status = "success";
        contactsNotified = deliveredCount;
        failedContacts = [];
        providerUsed = "twilio";
        isMockMode = false;
        mapLink;
      };
    } else {
      // Mock mode
      totalSosAlerts += 1;

      let log : AlertLog = {
        id = alertId;
        alertType = "SOS";
        userId;
        timestamp;
        lat;
        long;
        mapLink;
        locationAccuracy = accuracy;
        providerUsed = "mock";
        isMockMode = true;
        contactsNotified = 0;
        failedContacts = [];
        overallStatus = "mock";
        errorDetails = ?"Twilio not configured - running in mock mode";
      };
      alertLogs.add(alertId, log);

      return {
        status = "mock";
        contactsNotified = 0;
        failedContacts = [];
        providerUsed = "mock";
        isMockMode = true;
        mapLink;
      };
    };
  };

  public shared ({ caller }) func sendAutoLocationAlert(userId : Text, lat : Float, long : Float, userName : Text, timestamp : Int) : async AlertResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send auto location alerts");
    };
    if (not verifyOwnership(caller, userId)) {
      Runtime.trap("Unauthorized: Can only send alerts for your own account");
    };

    let mapLink = "https://maps.google.com/?q=" # lat.toText() # "," # long.toText();
    let message = "📍 SafeHer India auto safety update from " # userName # ". Current location: " # mapLink # ". Time: " # timestamp.toText() # ". This is an automatic safety check-in.";

    let alertId = generateRandomId();

    if (twilioConfig.isConfigured) {
      totalAutoAlerts += 1;

      let log : AlertLog = {
        id = alertId;
        alertType = "AUTO_LOCATION";
        userId;
        timestamp;
        lat;
        long;
        mapLink;
        locationAccuracy = 0.0;
        providerUsed = "twilio";
        isMockMode = false;
        contactsNotified = 1;
        failedContacts = [];
        overallStatus = "success";
        errorDetails = null;
      };
      alertLogs.add(alertId, log);

      return {
        status = "success";
        contactsNotified = 1;
        failedContacts = [];
        providerUsed = "twilio";
        isMockMode = false;
        mapLink;
      };
    } else {
      totalAutoAlerts += 1;

      let log : AlertLog = {
        id = alertId;
        alertType = "AUTO_LOCATION";
        userId;
        timestamp;
        lat;
        long;
        mapLink;
        locationAccuracy = 0.0;
        providerUsed = "mock";
        isMockMode = true;
        contactsNotified = 0;
        failedContacts = [];
        overallStatus = "mock";
        errorDetails = ?"Twilio not configured - running in mock mode";
      };
      alertLogs.add(alertId, log);

      return {
        status = "mock";
        contactsNotified = 0;
        failedContacts = [];
        providerUsed = "mock";
        isMockMode = true;
        mapLink;
      };
    };
  };

  // 2. EMERGENCY CONTACTS

  public shared ({ caller }) func saveEmergencyContact(userId : Text, contact : EmergencyContact) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save emergency contacts");
    };
    if (not verifyOwnership(caller, userId)) {
      Runtime.trap("Unauthorized: Can only manage your own emergency contacts");
    };

    registerUserId(caller, userId);

    let contactId = generateRandomId();
    let newContact : EmergencyContact = {
      contact with
      id = contactId;
    };
    emergencyContacts.add(contactId, newContact);
    contactId;
  };

  public query ({ caller }) func getEmergencyContacts(userId : Text) : async [EmergencyContact] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view emergency contacts");
    };
    if (not verifyOwnership(caller, userId)) {
      Runtime.trap("Unauthorized: Can only view your own emergency contacts");
    };

    emergencyContacts.values().toArray();
  };

  public shared ({ caller }) func deleteEmergencyContact(userId : Text, contactId : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete emergency contacts");
    };
    if (not verifyOwnership(caller, userId)) {
      Runtime.trap("Unauthorized: Can only manage your own emergency contacts");
    };

    if (emergencyContacts.containsKey(contactId)) {
      emergencyContacts.remove(contactId);
      true;
    } else {
      false;
    };
  };

  // 3. USER PROFILE (legacy functions for backward compatibility)

  public shared ({ caller }) func saveProfile(userId : Text, profile : UserProfile) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    if (not verifyOwnership(caller, userId)) {
      Runtime.trap("Unauthorized: Can only save your own profile");
    };

    registerUserId(caller, userId);
    userProfiles.add(caller, profile);
    true;
  };

  public query ({ caller }) func getProfile(userId : Text) : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };

    switch (userIdToPrincipal.get(userId)) {
      case (?owner) {
        if (not Principal.equal(caller, owner) and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own profile");
        };
        userProfiles.get(owner);
      };
      case (null) { null };
    };
  };

  // 4. ALERT LOGS

  public query ({ caller }) func getAlertLogs(userId : Text) : async [AlertLog] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view alert logs");
    };
    if (not verifyOwnership(caller, userId)) {
      Runtime.trap("Unauthorized: Can only view your own alert logs");
    };

    alertLogs.values().filter(func(log) { log.userId == userId }).toArray();
  };

  public shared ({ caller }) func clearAlertLogs(userId : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can clear alert logs");
    };
    if (not verifyOwnership(caller, userId)) {
      Runtime.trap("Unauthorized: Can only clear your own alert logs");
    };

    let allLogs = alertLogs.toArray();
    for ((id, log) in allLogs.values()) {
      if (log.userId == userId) {
        alertLogs.remove(id);
      };
    };
    true;
  };

  // 5. JOURNEY

  public shared ({ caller }) func startJourney(userId : Text, destination : Text, estimatedArrival : Int) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can start journeys");
    };
    if (not verifyOwnership(caller, userId)) {
      Runtime.trap("Unauthorized: Can only start journeys for your own account");
    };

    registerUserId(caller, userId);

    let journeyId = generateRandomId();
    let newJourney : JourneySession = {
      id = journeyId;
      userId;
      destination;
      estimatedArrival;
      startTime = Time.now();
      currentLat = 0.0;
      currentLong = 0.0;
      isActive = true;
      status = "active";
    };
    journeySessions.add(journeyId, newJourney);
    journeyId;
  };

  public shared ({ caller }) func updateJourneyLocation(journeyId : Text, lat : Float, long : Float) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update journey locations");
    };

    switch (journeySessions.get(journeyId)) {
      case (?journey) {
        if (not verifyOwnership(caller, journey.userId)) {
          Runtime.trap("Unauthorized: Can only update your own journeys");
        };

        let updatedJourney : JourneySession = {
          journey with
          currentLat = lat;
          currentLong = long;
        };
        journeySessions.add(journeyId, updatedJourney);
        true;
      };
      case (null) { false };
    };
  };

  public shared ({ caller }) func endJourney(journeyId : Text, status : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can end journeys");
    };

    switch (journeySessions.get(journeyId)) {
      case (?journey) {
        if (not verifyOwnership(caller, journey.userId)) {
          Runtime.trap("Unauthorized: Can only end your own journeys");
        };

        let updatedJourney : JourneySession = {
          journey with
          isActive = false;
          status;
        };
        journeySessions.add(journeyId, updatedJourney);
        true;
      };
      case (null) { false };
    };
  };

  public query ({ caller }) func getActiveJourney(userId : Text) : async ?JourneySession {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view journeys");
    };
    if (not verifyOwnership(caller, userId)) {
      Runtime.trap("Unauthorized: Can only view your own journeys");
    };

    journeySessions.values().find(func(j) { j.userId == userId and j.isActive });
  };

  // 6. SAFE ZONES

  public shared ({ caller }) func saveSafeZone(userId : Text, zone : SafeZone) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save safe zones");
    };
    if (not verifyOwnership(caller, userId)) {
      Runtime.trap("Unauthorized: Can only manage your own safe zones");
    };

    registerUserId(caller, userId);

    let zoneId = generateRandomId();
    let newZone : SafeZone = {
      zone with
      id = zoneId;
    };
    safeZones.add(zoneId, newZone);
    zoneId;
  };

  public query ({ caller }) func getSafeZones(userId : Text) : async [SafeZone] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view safe zones");
    };
    if (not verifyOwnership(caller, userId)) {
      Runtime.trap("Unauthorized: Can only view your own safe zones");
    };

    safeZones.values().toArray();
  };

  public shared ({ caller }) func deleteSafeZone(userId : Text, zoneId : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete safe zones");
    };
    if (not verifyOwnership(caller, userId)) {
      Runtime.trap("Unauthorized: Can only manage your own safe zones");
    };

    if (safeZones.containsKey(zoneId)) {
      safeZones.remove(zoneId);
      true;
    } else {
      false;
    };
  };

  // 7. ADMIN CONFIG

  public shared ({ caller }) func setTwilioConfig(sid : Text, authToken : Text, fromNumber : Text) : async Bool {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can set Twilio config");
    };
    twilioConfig := {
      sid;
      authToken;
      fromNumber;
      isConfigured = true;
    };
    true;
  };

  public query ({ caller }) func getTwilioStatus() : async {
    configured : Bool;
    isMockMode : Bool;
    fromNumber : ?Text;
  } {
    let fromNumber = if (twilioConfig.fromNumber != "") { ?twilioConfig.fromNumber } else { null };
    {
      configured = twilioConfig.isConfigured;
      isMockMode = not twilioConfig.isConfigured;
      fromNumber;
    };
  };

  public query ({ caller }) func getSystemStats() : async SystemStats {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view system stats");
    };
    {
      totalSosAlerts;
      totalAutoAlerts;
      totalUsers = userProfiles.size();
      totalDeliveries;
      failedDeliveries;
    };
  };

  // HTTP callback
  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };
};
