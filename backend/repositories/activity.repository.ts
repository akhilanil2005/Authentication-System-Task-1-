import pool from "../config/db";

export const createActivity = async (
  userId: number,
  action: string,
  ipAddress: string
) => {
  return await pool.query(
    `INSERT INTO activity_logs
     (user_id, action, ip_address)
     VALUES ($1, $2, $3)`,
    [userId, action, ipAddress]
  );
};

export const getActivitiesByUser = async (
  userId: number
) => {
  const result = await pool.query(
    `SELECT *
     FROM activity_logs
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );

  return result.rows;
};