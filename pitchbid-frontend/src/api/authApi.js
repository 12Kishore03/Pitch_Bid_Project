
import axiosInstance from "./axiosInstance";

export const registerCreator = async (userData) => {
  const response = await axiosInstance.post(
    "/api/auth/register",
    userData
  );

  return response.data;
};

export const loginCreator = async (credentials) => {
  const response = await axiosInstance.post(
    "/api/auth/login",
    credentials
  );

  return response.data;
};
