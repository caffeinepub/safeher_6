import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
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

  // Old actor state (empty)
  type OldActor = {};

  // New actor state
  type NewActor = {
    twilioConfig : TwilioConfig;
    emergencyContacts : Map.Map<Text, EmergencyContact>;
    userProfiles : Map.Map<Principal, UserProfile>;
    alertLogs : Map.Map<Text, AlertLog>;
    journeySessions : Map.Map<Text, JourneySession>;
    safeZones : Map.Map<Text, SafeZone>;
    userIdToPrincipal : Map.Map<Text, Principal>;
    totalSosAlerts : Nat;
    totalAutoAlerts : Nat;
    totalDeliveries : Nat;
    failedDeliveries : Nat;
  };

  public func run(_ : OldActor) : NewActor {
    {
      twilioConfig = {
        sid = "";
        authToken = "";
        fromNumber = "";
        isConfigured = false;
      };
      emergencyContacts = Map.empty<Text, EmergencyContact>();
      userProfiles = Map.empty<Principal, UserProfile>();
      alertLogs = Map.empty<Text, AlertLog>();
      journeySessions = Map.empty<Text, JourneySession>();
      safeZones = Map.empty<Text, SafeZone>();
      userIdToPrincipal = Map.empty<Text, Principal>();
      totalSosAlerts = 0;
      totalAutoAlerts = 0;
      totalDeliveries = 0;
      failedDeliveries = 0;
    };
  };
};
