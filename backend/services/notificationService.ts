import {
  createNotification,
  getNotificationsByUser,
  getNotificationsByStatus,
  markAsRead,
  deleteNotification
} from "../repositories/notificationRepository";

export const createNotificationService = async (
  userId: number,
  title: string,
  message: string
) => {
  return await createNotification(userId, title, message);
};

export const getNotificationsService = async (
  userId: number,
  page: number,
  limit: number
) => {
  return await getNotificationsByUser(userId, page, limit);
};

export const getNotificationsByStatusService = async (
  userId: number,
  isRead: boolean
) => {
  return await getNotificationsByStatus(userId, isRead);
};

export const markNotificationReadService = async (
  notificationId: number
) => {
  return await markAsRead(notificationId);
};

export const deleteNotificationService = async (
  notificationId: number
) => {
  return await deleteNotification(notificationId);
};