import axiosInstance from "./axiosInstance";

// Get all eligible individual players for an auction
export const getAuctionPlayers = async (auctionId) => {
  const response = await axiosInstance.get(
    `/api/auctions/${auctionId}/players/auction-pool`
  );

  return response.data;
};

// Update an individual player's profile
export const updatePlayer = async (
  auctionId,
  playerId,
  playerData
) => {
  const response = await axiosInstance.put(
    `/api/auctions/${auctionId}/players/${playerId}`,
    playerData
  );

  return response.data;
};