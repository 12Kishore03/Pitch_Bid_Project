
const STORAGE_KEY = "pitchbid_owner_registrations";

// Read all team owner registrations from Local Storage
function readOwnerRegistrations() {
  try {
    const registrations = localStorage.getItem(STORAGE_KEY);

    return registrations ? JSON.parse(registrations) : [];
  } catch (error) {
    throw new Error("Unable to read owner registrations from Local Storage.");
  }
}

// Get all owner registrations
export function getOwnerRegistrations() {
  return readOwnerRegistrations();
}

// Get owner registrations belonging to a particular auction
export function getOwnerRegistrationsByAuction(auctionId) {
  return readOwnerRegistrations().filter(
    (registration) => registration.auctionId === auctionId
  );
}

// Save a new team owner registration
export function saveOwnerRegistration(registration) {
  if (!registration.auctionId) {
    throw new Error("Auction ID is required.");
  }

  const registrations = readOwnerRegistrations();

  const ownerEmail = registration.owner.email.trim().toLowerCase();
  const teamShortName = registration.team.teamShortName.trim().toUpperCase();

  // Prevent duplicate owner emails within the same auction
  const duplicateEmail = registrations.some(
    (existing) =>
      existing.auctionId === registration.auctionId &&
      existing.owner.email.trim().toLowerCase() === ownerEmail
  );

  if (duplicateEmail) {
    throw new Error(
      "This email address has already been registered as a team owner for this auction."
    );
  }

  // Prevent duplicate team short names within the same auction
  const duplicateTeamShortName = registrations.some(
    (existing) =>
      existing.auctionId === registration.auctionId &&
      existing.team.teamShortName.trim().toUpperCase() === teamShortName
  );

  if (duplicateTeamShortName) {
    throw new Error(
      "This team short name is already registered for this auction."
    );
  }

  registrations.push(registration);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registrations));
  } catch (error) {
    throw new Error(
      "Unable to save registration. Check your browser's Local Storage."
    );
  }

  return registration;
}

// Update registration status from the Creator's management page
export function updateOwnerRegistrationStatus(registrationId, status) {
  const allowedStatuses = [
    "Pending Approval",
    "Approved",
    "Rejected",
  ];

  if (!allowedStatuses.includes(status)) {
    throw new Error("Invalid owner registration status.");
  }

  const registrations = readOwnerRegistrations();

  const registrationIndex = registrations.findIndex(
    (registration) => registration.id === registrationId
  );

  if (registrationIndex === -1) {
    throw new Error("Team owner registration not found.");
  }

  registrations[registrationIndex].status = status;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registrations));
  } catch (error) {
    throw new Error("Unable to update registration status.");
  }

  return registrations[registrationIndex];
}
