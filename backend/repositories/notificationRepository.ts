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
  limit: number,
  search: string = ""
) => {
  const offset = (page - 1) * limit;

  const result = await pool.query(
    `SELECT *, COUNT(*) OVER() AS total_count
     FROM notifications
     WHERE user_id = $1
       AND (title ILIKE $2 OR message ILIKE $2)
     ORDER BY created_at DESC
     LIMIT $3
     OFFSET $4`,
    [userId, `%${search}%`, limit, offset]
  );

  const totalCount = result.rows[0]
    ? Number(result.rows[0].total_count)
    : 0;

  const notifications = result.rows.map(
    ({ total_count, ...rest }: { total_count: number; [key: string]: any }) => rest
  );

  return { notifications, totalCount };
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