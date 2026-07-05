import pool from "../config/db";

export const getUserProfile = async (id: number) => {
  const result = await pool.query(
    `SELECT u.id, u.name, u.email, r.name AS role
     FROM users u
     LEFT JOIN roles r ON u.role_id = r.id
     WHERE u.id = $1`,
    [id]
  );

  return result.rows[0];
};

export const updateUserProfile = async (
  id: number,
  name: string,
  email: string
) => {
  await pool.query(
    `
    UPDATE users
    SET name = $1,
        email = $2
    WHERE id = $3
    `,
    [name, email, id]
  );

  const result = await pool.query(
    `SELECT u.id, u.name, u.email, r.name AS role
     FROM users u
     LEFT JOIN roles r ON u.role_id = r.id
     WHERE u.id = $1`,
    [id]
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