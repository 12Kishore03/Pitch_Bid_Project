
import axiosInstance from "./axiosInstance";

// Create a new auction
export const createAuction = async (auctionData) => {
  const response = await axiosInstance.post(
    "/api/auctions",
    auctionData
  );
  return response.data;
};

// Get all auctions created by the logged-in Creator
export const getMyAuctions = async () => {
  const response = await axiosInstance.get("/api/auctions/mine");
  return response.data;
};

// Get auction details by ID
export const getAuctionById = async (auctionId) => {
  const response = await axiosInstance.get(
    `/api/auctions/${auctionId}`
  );
  return response.data;
};

// Start auction
export const startAuction = async (auctionId) => {
  const response = await axiosInstance.patch(
    `/api/auctions/${auctionId}/start`
  );
  return response.data;
};

// Pause auction
export const pauseAuction = async (auctionId) => {
  const response = await axiosInstance.patch(
    `/api/auctions/${auctionId}/pause`
  );
  return response.data;
};

// Resume auction
export const resumeAuction = async (auctionId) => {
  const response = await axiosInstance.patch(
    `/api/auctions/${auctionId}/resume`
  );
  return response.data;
};

// Stop auction
export const stopAuction = async (auctionId) => {
  const response = await axiosInstance.patch(
    `/api/auctions/${auctionId}/stop`
  );
  return response.data;
};
