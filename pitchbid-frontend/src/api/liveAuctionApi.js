
import axiosInstance from "./axiosInstance";

// ==========================================
// CREATE OR GET AUCTION SESSION
// ==========================================
export const createOrGetAuctionSession = async (auctionId) => {
  const response = await axiosInstance.post(
    `/api/auctions/${auctionId}/session`
  );

  return response.data;
};

// ==========================================
// GET AUCTION SESSION
// ==========================================
export const getAuctionSession = async (auctionId) => {
  const response = await axiosInstance.get(
    `/api/auctions/${auctionId}/session`
  );

  return response.data;
};

// ==========================================
// SELECT PLAYER FOR AUCTION
// ==========================================
export const selectAuctionPlayer = async (auctionId, playerId) => {
  const response = await axiosInstance.post(
    `/api/auctions/${auctionId}/session/players/${playerId}`
  );

  return response.data;
};

// ==========================================
// RAISE BID
// Backend calculates the configured bid increment.
// Frontend sends only the team ID.
// ==========================================
export const raiseAuctionBid = async (auctionId, teamId) => {
  const response = await axiosInstance.post(
    `/api/auctions/${auctionId}/session/raise-bid/${teamId}`
  );

  return response.data;
};

// ==========================================
// FINALIZE PLAYER AS SOLD
// ==========================================
export const finalizePlayerSold = async (auctionId) => {
  const response = await axiosInstance.post(
    `/api/auctions/${auctionId}/session/finalize-sold`
  );

  return response.data;
};

// ==========================================
// FINALIZE PLAYER AS UNSOLD
// ==========================================
export const finalizePlayerUnsold = async (auctionId) => {
  const response = await axiosInstance.post(
    `/api/auctions/${auctionId}/session/finalize-unsold`
  );

  return response.data;
};

// ==========================================
// GET PERSISTED AUCTION RESULTS
// Loads SOLD and UNSOLD results from database.
// This prevents finalized players from returning
// to the eligible player queue after refresh.
// ==========================================
export const getAuctionResults = async (auctionId) => {
  const response = await axiosInstance.get(
    `/api/auctions/${auctionId}/results`
  );

  return response.data;
};
