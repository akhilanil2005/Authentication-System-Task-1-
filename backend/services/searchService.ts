// src/services/searchService.ts
import { Pool } from 'pg';

interface SearchOptions {
  query?: string;
  entities: ('files' | 'users' | 'roles')[];
  filters: Record<string, string | string[]>;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  cursor?: string;
  limit: number;
}

interface CursorPayload {
  createdAt: string;
  id: string;
}

function decodeCursor(cursor?: string): CursorPayload | null {
  if (!cursor) return null;
  try {
    return JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
  } catch {
    return null;
  }
}

function encodeCursor(row: { created_at: Date; id: string }): string {
  return Buffer.from(
    JSON.stringify({ createdAt: row.created_at.toISOString(), id: row.id })
  ).toString('base64');
}

const ALLOWED_SORT_COLUMNS = new Set(['created_at', 'name', 'updated_at']);

export async function searchFiles(pool: Pool, opts: SearchOptions) {
  const { query, filters, sortBy, sortOrder, cursor, limit } = opts;
  const sortCol = ALLOWED_SORT_COLUMNS.has(sortBy) ? sortBy : 'created_at';
  const dir = sortOrder === 'ASC' ? 'ASC' : 'DESC';

  const conditions: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (query) {
    conditions.push(`search_vector @@ plainto_tsquery('english', $${idx})`);
    params.push(query);
    idx++;
  }

  if (filters.mimeType) {
    const types = Array.isArray(filters.mimeType) ? filters.mimeType : [filters.mimeType];
    conditions.push(`mime_type = ANY($${idx})`);
    params.push(types);
    idx++;
  }

  if (filters.ownerId) {
    conditions.push(`owner_id = $${idx}`);
    params.push(filters.ownerId);
    idx++;
  }

  const decoded = decodeCursor(cursor);
  if (decoded) {
    const op = dir === 'DESC' ? '<' : '>';
    conditions.push(`(created_at, id) ${op} ($${idx}, $${idx + 1})`);
    params.push(decoded.createdAt, decoded.id);
    idx += 2;
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT id, original_name, mime_type, owner_id, created_at,
           'file' as entity_type
      ${query ? ", ts_rank(search_vector, plainto_tsquery('english', $1)) as rank" : ''}
    FROM files
    ${whereClause}
    ORDER BY ${query ? 'rank DESC,' : ''} ${sortCol} ${dir}, id ${dir}
    LIMIT $${idx}
  `;
  params.push(limit + 1);

  const result = await pool.query(sql, params);
  const hasMore = result.rows.length > limit;
  const rows = hasMore ? result.rows.slice(0, limit) : result.rows;
  const nextCursor = hasMore ? encodeCursor(rows[rows.length - 1]) : null;

  return { rows, nextCursor, hasMore };
}

export async function searchUsers(pool: Pool, opts: SearchOptions) {
  const { query, filters, sortOrder, cursor, limit } = opts;
  const dir = sortOrder === 'ASC' ? 'ASC' : 'DESC';

  const conditions: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (query) {
    conditions.push(`(name ILIKE $${idx} OR email ILIKE $${idx})`);
    params.push(`%${query}%`);
    idx++;
  }

  if (filters.roleId) {
    conditions.push(`role_id = $${idx}`);
    params.push(filters.roleId);
    idx++;
  }

  // No created_at column on users, so cursor is purely id-based
  if (cursor) {
    const decodedId = Buffer.from(cursor, 'base64').toString('utf-8');
    const op = dir === 'DESC' ? '<' : '>';
    conditions.push(`id ${op} $${idx}`);
    params.push(decodedId);
    idx++;
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT id, name, email, role_id,
           'user' as entity_type
    FROM users
    ${whereClause}
    ORDER BY id ${dir}
    LIMIT $${idx}
  `;
  params.push(limit + 1);

  const result = await pool.query(sql, params);
  const hasMore = result.rows.length > limit;
  const rows = hasMore ? result.rows.slice(0, limit) : result.rows;
  const nextCursor = hasMore
    ? Buffer.from(String(rows[rows.length - 1].id)).toString('base64')
    : null;

  return { rows, nextCursor, hasMore };
}

export async function searchRoles(pool: Pool, opts: SearchOptions) {
  const { query, sortBy, sortOrder, cursor, limit } = opts;
  const sortCol = ALLOWED_SORT_COLUMNS.has(sortBy) ? sortBy : 'created_at';
  const dir = sortOrder === 'ASC' ? 'ASC' : 'DESC';

  const conditions: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (query) {
    conditions.push(`(name ILIKE $${idx} OR description ILIKE $${idx})`);
    params.push(`%${query}%`);
    idx++;
  }

  const decoded = decodeCursor(cursor);
  if (decoded) {
    const op = dir === 'DESC' ? '<' : '>';
    conditions.push(`(created_at, id) ${op} ($${idx}, $${idx + 1})`);
    params.push(decoded.createdAt, decoded.id);
    idx += 2;
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT id, name, description, created_at,
           'role' as entity_type
    FROM roles
    ${whereClause}
    ORDER BY ${sortCol} ${dir}, id ${dir}
    LIMIT $${idx}
  `;
  params.push(limit + 1);

  const result = await pool.query(sql, params);
  const hasMore = result.rows.length > limit;
  const rows = hasMore ? result.rows.slice(0, limit) : result.rows;
  const nextCursor = hasMore ? encodeCursor(rows[rows.length - 1]) : null;

  return { rows, nextCursor, hasMore };
}