
const STORAGE_KEY = "pitchbid_registrations";

function readRegistrations() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to read registrations:", error);
    return [];
  }
}

export function getRegistrations() {
  return readRegistrations();
}

export function getRegistrationsByAuction(auctionId) {
  return readRegistrations().filter(
    (registration) => registration.auctionId === auctionId
  );
}

export function savePlayerRegistration(registration) {
  if (!registration?.auctionId || !registration?.id) {
    throw new Error("Registration ID and auction ID are required.");
  }

  const registrations = readRegistrations();

  const duplicate = registrations.some(
    (item) =>
      item.auctionId === registration.auctionId &&
      item.email.toLowerCase() === registration.email.toLowerCase()
  );

  if (duplicate) {
    throw new Error(
      "This email has already been registered for this auction."
    );
  }

  const updated = [...registrations, registration];

  // Allow storage errors to reach the calling component.
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  return updated;
}

export function updateRegistrationStatus(registrationId, status) {
  const allowedStatuses = ["Pending Approval", "Approved", "Rejected"];

  if (!allowedStatuses.includes(status)) {
    throw new Error("Invalid registration status.");
  }

  const registrations = readRegistrations();
  const exists = registrations.some(
    (item) => item.id === registrationId
  );

  if (!exists) {
    throw new Error("Registration not found.");
  }

  const updated = registrations.map((item) =>
    item.id === registrationId
      ? { ...item, status, reviewedAt: new Date().toISOString() }
      : item
  );

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  return updated;
}
