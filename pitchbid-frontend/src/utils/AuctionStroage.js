
const STORAGE_KEY = "pitchbid_auctions";

export function getAuctions() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to read saved auctions:", error);
    return [];
  }
}

function writeAuctions(auctions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(auctions));
}

export function saveAuction(auction) {
  if (!auction?.id) {
    throw new Error("Auction ID is required.");
  }

  const auctions = getAuctions();

  if (auctions.some((item) => item.id === auction.id)) {
    throw new Error("This auction has already been saved.");
  }

  const updated = [...auctions, auction];
  writeAuctions(updated);
  return updated;
}

export function getAuctionById(auctionId) {
  return getAuctions().find((auction) => auction.id === auctionId);
}

export function updateAuction(auctionId, changes) {
  const auctions = getAuctions();
  const exists = auctions.some((item) => item.id === auctionId);

  if (!exists) {
    throw new Error("Auction not found.");
  }

  const updated = auctions.map((auction) =>
    auction.id === auctionId
      ? { ...auction, ...changes, id: auctionId }
      : auction
  );

  writeAuctions(updated);
  return updated;
}

export function deleteAuction(auctionId) {
  const auctions = getAuctions();
  const updated = auctions.filter(
    (auction) => auction.id !== auctionId
  );

  if (updated.length === auctions.length) {
    throw new Error("Auction not found.");
  }

  writeAuctions(updated);
  return updated;
}
