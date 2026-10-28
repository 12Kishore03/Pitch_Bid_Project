
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

  const auction = JSON.parse(
    localStorage.getItem("pitchbid_auctions") || "[]"
  ).find((item) => item.id === registration.auctionId);

  if (!auction) {
    throw new Error("Auction not found.");
  }

  const maxPlayers = Number(auction.maxAuctionPlayers);

  if (!Number.isFinite(maxPlayers) || maxPlayers < 1) {
    throw new Error("The auction's maximum player count is not configured.");
  }

  const ownerRegistrations = JSON.parse(
    localStorage.getItem("pitchbid_owner_registrations") || "[]"
  ).filter((item) => item.auctionId === registration.auctionId);

  // Count non-rejected individual players.
  const individualPlayers = registrations.filter(
    (item) =>
      item.auctionId === registration.auctionId &&
      item.status !== "Rejected"
  );

  // Count each non-rejected team owner's automatic Player #1.
  const ownerPlayers = ownerRegistrations.filter(
    (item) => item.status !== "Rejected"
  );

  const registeredPlayerCount =
    individualPlayers.length + ownerPlayers.length;

  if (registeredPlayerCount >= maxPlayers) {
    throw new Error(
      `This auction has reached its maximum of ${maxPlayers} players.`
    );
  }

  const email = String(registration.email || "").trim().toLowerCase();

  const duplicate = registrations.some(
    (item) =>
      item.auctionId === registration.auctionId &&
      String(item.email || "").trim().toLowerCase() === email
  );

  if (duplicate) {
    throw new Error(
      "This email has already been registered for this auction."
    );
  }

  const ownerDuplicate = ownerRegistrations.some(
    (item) =>
      String(item.owner?.email || "").trim().toLowerCase() === email
  );

  if (ownerDuplicate) {
    throw new Error(
      "This email is already registered as a team owner and Player #1."
    );
  }

  const updated = [...registrations, registration];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  return updated;
}

export function updateRegistrationStatus(registrationId, status) {
  const allowedStatuses = [
    "Pending Approval",
    "Approved",
    "Rejected",
  ];

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
