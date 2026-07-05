import {
  createActivity,
  getActivitiesByUser
} from "../repositories/activity.repository";

export const createActivityService = async (
  userId: number,
  action: string,
  ipAddress: string
) => {
  return await createActivity(userId, action, ipAddress);
};

export const getActivitiesService = async (
  userId: number
) => {
  return await getActivitiesByUser(userId);
};