
import axiosInstance from "./axiosInstance";

// ==========================================
// PLAYER REGISTRATION APIs
// ==========================================

// Get all player registrations
export const getPlayerRegistrations = async (auctionId, status) => {
  const response = await axiosInstance.get(
    `/api/auctions/${auctionId}/player-registrations`,
    {
      params: status ? { status } : {},
    }
  );

  return response.data;
};

// Approve player registration
export const approvePlayerRegistration = async (
  auctionId,
  playerId
) => {
  const response = await axiosInstance.patch(
    `/api/auctions/${auctionId}/player-registrations/${playerId}/approve`
  );

  return response.data;
};

// Reject player registration
export const rejectPlayerRegistration = async (
  auctionId,
  playerId
) => {
  const response = await axiosInstance.patch(
    `/api/auctions/${auctionId}/player-registrations/${playerId}/reject`
  );

  return response.data;
};

// ==========================================
// TEAM OWNER REGISTRATION APIs
// ==========================================

// Get all team-owner registrations
export const getTeamOwnerRegistrations = async (
  auctionId,
  status
) => {
  const response = await axiosInstance.get(
    `/api/auctions/${auctionId}/team-registrations`,
    {
      params: status ? { status } : {},
    }
  );

  return response.data;
};

// Approve team-owner registration
export const approveTeamOwnerRegistration = async (
  auctionId,
  registrationId
) => {
  const response = await axiosInstance.patch(
    `/api/auctions/${auctionId}/team-registrations/${registrationId}/approve`
  );

  return response.data;
};

// Reject team-owner registration
export const rejectTeamOwnerRegistration = async (
  auctionId,
  registrationId
) => {
  const response = await axiosInstance.patch(
    `/api/auctions/${auctionId}/team-registrations/${registrationId}/reject`
  );

  return response.data;
};

export const registerPlayer = async (auctionId, playerData) => {
  const response = await axiosInstance.post(
    `/api/auctions/${auctionId}/player-registrations`,
    playerData
  );

  return response.data;
};

// Public: register a team owner
export const registerTeamOwner = async (auctionId, ownerData) => {
  const response = await axiosInstance.post(
    `/api/auctions/${auctionId}/team-registrations`,
    ownerData
  );

  return response.data;
};