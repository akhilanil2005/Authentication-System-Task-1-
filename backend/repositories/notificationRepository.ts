import pool from "../config/db";

export const createNotification = async (
  userId: number,
  title: string,
  message: string
) => {
  const result = await pool.query(
    `INSERT INTO notifications (user_id, title, message)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, title, message]
  );

  return result.rows[0];
};

export const getNotificationsByUser = async (
  userId: number,
  page: number,
  limit: number
) => {
  const offset = (page - 1) * limit;

  const result = await pool.query(
    `SELECT * FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2
     OFFSET $3`,
    [userId, limit, offset]
  );

  return result.rows;
};

export const getNotificationsByStatus = async (
  userId: number,
  isRead: boolean
) => {
  const result = await pool.query(
    `SELECT *
     FROM notifications
     WHERE user_id = $1
     AND is_read = $2
     ORDER BY created_at DESC`,
    [userId, isRead]
  );

  return result.rows;
};

export const markAsRead = async (
  notificationId: number
) => {
  const result = await pool.query(
    `UPDATE notifications
     SET is_read = true
     WHERE id = $1
     RETURNING *`,
    [notificationId]
  );

  return result.rows[0];
};

export const deleteNotification = async (
  notificationId: number
) => {
  await pool.query(
    `DELETE FROM notifications
     WHERE id = $1`,
    [notificationId]
  );
};