import { getUserById } from "../repositories/user.repository";

export const getProfile = async (userId: number) => {
  return await getUserById(userId);
};