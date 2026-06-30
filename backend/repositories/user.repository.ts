import pool from "../config/db";

export const getUserById = async (id: number) => {
  const result = await pool.query(
    "SELECT id, name, email, role FROM users WHERE id = $1",
    [id]
  );

  return result.rows[0];
};