
import axiosInstance from "./axiosInstance";

// Get all teams in an auction
export const getAuctionTeams = async (auctionId) => {
  const response = await axiosInstance.get(
    `/api/auctions/${auctionId}/teams`
  );
  return response.data;
};

// Get one team's details
export const getTeamById = async (auctionId, teamId) => {
  const response = await axiosInstance.get(
    `/api/auctions/${auctionId}/teams/${teamId}`
  );
  return response.data;
};

// Update permitted team details
export const updateTeam = async (auctionId, teamId, teamData) => {
  const response = await axiosInstance.put(
    `/api/auctions/${auctionId}/teams/${teamId}`,
    teamData
  );
  return response.data;
};

// Get players belonging to a team
export const getTeamPlayers = async (auctionId, teamId) => {
  const response = await axiosInstance.get(
    `/api/auctions/${auctionId}/teams/${teamId}/players`
  );
  return response.data;
};
