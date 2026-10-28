
const STORAGE_KEY = "pitchbid_owner_registrations";

function createRegistrationId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `TOR-${crypto.randomUUID()}`;
  }

  return `TOR-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readOwnerRegistrations() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];

    if (!Array.isArray(parsed)) {
      throw new Error("Owner registrations must be a list.");
    }

    let changed = false;
    const usedIds = new Set();

    const repaired = parsed.map((registration) => {
      const oldId =
        typeof registration.id === "string" && registration.id.trim()
          ? registration.id.trim()
          : null;

      const id = oldId && !usedIds.has(oldId)
        ? oldId
        : createRegistrationId();

      usedIds.add(id);

      if (registration.id !== id) {
        changed = true;
        return { ...registration, id };
      }

      return registration;
    });

    if (changed) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(repaired));
    }

    return repaired;
  } catch (error) {
    console.error("Failed to read owner registrations:", error);
    throw new Error(
      "Unable to read owner registrations from Local Storage."
    );
  }
}

export function getOwnerRegistrations() {
  return readOwnerRegistrations();
}

export function getOwnerRegistrationsByAuction(auctionId) {
  return readOwnerRegistrations().filter(
    (registration) => registration.auctionId === auctionId
  );
}

export function saveOwnerRegistration(registration) {
  if (!registration?.auctionId) {
    throw new Error("Auction ID is required.");
  }

  if (!registration.owner?.email || !registration.team?.teamShortName) {
    throw new Error("Owner email and team short name are required.");
  }

  const registrations = readOwnerRegistrations();

  const auctions = JSON.parse(
    localStorage.getItem("pitchbid_auctions") || "[]"
  );

  const auction = auctions.find(
    (item) => item.id === registration.auctionId
  );

  if (!auction) {
    throw new Error("Auction not found.");
  }

  const maxTeams = Number(auction.numberOfTeams);

  if (!Number.isFinite(maxTeams) || maxTeams < 1) {
    throw new Error("The auction's maximum team count is not configured.");
  }

  // Pending and approved teams occupy a slot. Rejected teams do not.
  const activeTeams = registrations.filter(
    (item) =>
      item.auctionId === registration.auctionId &&
      item.status !== "Rejected"
  );

  if (activeTeams.length >= maxTeams) {
    throw new Error(
      `This auction has reached its maximum of ${maxTeams} teams.`
    );
  }

  // Every team owner is automatically registered as Player #1.
  const maxPlayers = Number(auction.maxAuctionPlayers);

  if (!Number.isFinite(maxPlayers) || maxPlayers < 1) {
    throw new Error("The auction's maximum player count is not configured.");
  }

  const individualPlayers = JSON.parse(
    localStorage.getItem("pitchbid_registrations") || "[]"
  ).filter(
    (item) =>
      item.auctionId === registration.auctionId &&
      item.status !== "Rejected"
  );

  const activeOwnerPlayers = registrations.filter(
    (item) =>
      item.auctionId === registration.auctionId &&
      item.status !== "Rejected"
  );

  if (individualPlayers.length + activeOwnerPlayers.length >= maxPlayers) {
    throw new Error(
      `This auction has reached its maximum of ${maxPlayers} players.`
    );
  }

  const ownerEmail = registration.owner.email.trim().toLowerCase();
  const teamShortName = registration.team.teamShortName.trim().toUpperCase();

  if (
    registrations.some(
      (item) =>
        item.auctionId === registration.auctionId &&
        item.owner?.email?.trim().toLowerCase() === ownerEmail
    )
  ) {
    throw new Error(
      "This email address has already been registered as a team owner for this auction."
    );
  }

  if (
    registrations.some(
      (item) =>
        item.auctionId === registration.auctionId &&
        item.team?.teamShortName?.trim().toUpperCase() === teamShortName
    )
  ) {
    throw new Error(
      "This team short name is already registered for this auction."
    );
  }

  const registrationToSave = {
    ...registration,
    id: registration.id || createRegistrationId(),
  };

  const updated = [...registrations, registrationToSave];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  return registrationToSave;
}

export function updateOwnerRegistrationStatus(registrationId, status) {
  const allowedStatuses = [
    "Pending Approval",
    "Approved",
    "Rejected",
  ];

  if (!registrationId) {
    throw new Error("Registration ID is required.");
  }

  if (!allowedStatuses.includes(status)) {
    throw new Error("Invalid owner registration status.");
  }

  const registrations = readOwnerRegistrations();

  const index = registrations.findIndex(
    (item) => item.id === registrationId
  );

  if (index === -1) {
    throw new Error("Team owner registration not found.");
  }

  const updatedRegistration = {
    ...registrations[index],
    status,
  };

  registrations[index] = updatedRegistration;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(registrations));

  return updatedRegistration;
}
