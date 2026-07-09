// src/routes/search.ts
import { Router } from 'express';
import { verifyToken } from '../middleware/verifyToken';
import { requirePermission } from '../middleware/requirePermission';
import { searchFiles, searchUsers, searchRoles } from '../services/searchService';

const router = Router();

router.get('/search', verifyToken, requirePermission('search:read'), async (req, res) => {
  try {
    const {
      q,
      entities = 'files,users,roles',
      sortBy = 'created_at',
      sortOrder = 'DESC',
      cursor,
      limit = '20',
      ...rawFilters
    } = req.query as Record<string, string>;

    const entityList = entities.split(',') as ('files' | 'users' | 'roles')[];
    const parsedLimit = Math.min(parseInt(limit, 10) || 20, 100); // cap to prevent abuse

    const results: Record<string, any> = {};

    await Promise.all(
      entityList.map(async (entity) => {
        if (entity === 'files') {
          results.files = await searchFiles(req.app.locals.pool, {
            query: q,
            entities: entityList,
            filters: rawFilters,
            sortBy,
            sortOrder: sortOrder as 'ASC' | 'DESC',
            cursor,
            limit: parsedLimit,
          });
        }
        if (entity === 'users') {
          results.users = await searchUsers(req.app.locals.pool, {
            query: q,
            entities: entityList,
            filters: rawFilters,
            sortBy,
            sortOrder: sortOrder as any,
            cursor,
            limit: parsedLimit,
          });
        }
        if (entity === 'roles') {
          results.roles = await searchRoles(req.app.locals.pool, {
            query: q,
            entities: entityList,
            filters: rawFilters,
            sortBy,
            sortOrder: sortOrder as any,
            cursor,
            limit: parsedLimit,
          });
        }
      })
    );

    res.json(results);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;