import pool from "../config/db";

export const getUserProfile = async (id: number) => {
  const result = await pool.query(
    `SELECT id, name, email, role
     FROM users
     WHERE id = $1`,
    [id]
  );

  return result.rows[0];
};
export const updateUserProfile = async (
  id: number,
  name: string,
  email: string
) => {
  const result = await pool.query(
    `
    UPDATE users
    SET name = $1,
        email = $2
    WHERE id = $3
    RETURNING id, name, email, role
    `,
    [name, email, id]
  );

  return result.rows[0];
};
export const getUserById = async (id: number) => {
  const result = await pool.query(
    "SELECT * FROM users WHERE id = $1",
    [id]
  );

  return result.rows[0];
};
export const updatePassword = async (
  id: number,
  hashedPassword: string
) => {
  await pool.query(
    `
    UPDATE users
    SET password = $1
    WHERE id = $2
    `,
    [hashedPassword, id]
  );
};