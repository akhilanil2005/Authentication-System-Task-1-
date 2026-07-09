import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import SearchBar from '../components/search/SearchBar';
import SearchFilters from '../components/search/SearchFilters';
import SearchResults from '../components/search/SearchResults';
import { useGlobalSearchQuery, useLazyGlobalSearchQuery, useDeleteFileMutation, type SearchResponse } from '../features/search/searchApiSlice';

type EntityKey = 'files' | 'users' | 'roles';

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [mimeType, setMimeType] = useState('');
  const [roleId, setRoleId] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  const [accumulated, setAccumulated] = useState<Record<EntityKey, any[]>>({
    files: [], users: [], roles: [],
  });
  const [cursors, setCursors] = useState<Record<EntityKey, string | null>>({
    files: null, users: null, roles: null,
  });
  const [hasMoreMap, setHasMoreMap] = useState<Record<EntityKey, boolean>>({
    files: false, users: false, roles: false,
  });

  const { data, isLoading, isFetching, error } = useGlobalSearchQuery({
    q: query || undefined,
    entities: 'files,users,roles',
    sortBy,
    sortOrder,
    mimeType: mimeType || undefined,
    roleId: roleId || undefined,
    limit: 10,
  });

  const [triggerLoadMore, { isFetching: isLoadingMore }] = useLazyGlobalSearchQuery();
  const [deleteFile] = useDeleteFileMutation();

  const syncFromFreshSearch = useCallback((response: SearchResponse) => {
    const next: Record<EntityKey, any[]> = { files: [], users: [], roles: [] };
    const nextCursors: Record<EntityKey, string | null> = { files: null, users: null, roles: null };
    const nextHasMore: Record<EntityKey, boolean> = { files: false, users: false, roles: false };

    (['files', 'users', 'roles'] as EntityKey[]).forEach((key) => {
      const entity = response[key];
      if (entity) {
        next[key] = entity.rows;
        nextCursors[key] = entity.nextCursor;
        nextHasMore[key] = entity.hasMore;
      }
    });

    setAccumulated(next);
    setCursors(nextCursors);
    setHasMoreMap(nextHasMore);
  }, []);

  useEffect(() => {
    if (data) syncFromFreshSearch(data);
  }, [data, syncFromFreshSearch]);

  const handleSearch = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  const handleLoadMore = useCallback(async (entity: EntityKey) => {
    const cursor = cursors[entity];
    if (!cursor) return;

    const result = await triggerLoadMore({
      q: query || undefined,
      entities: entity,
      sortBy,
      sortOrder,
      mimeType: mimeType || undefined,
      roleId: roleId || undefined,
      cursor,
      limit: 10,
    }).unwrap();

    const incoming = result[entity];
    if (!incoming) return;

    setAccumulated((prev) => ({
      ...prev,
      [entity]: [...prev[entity], ...incoming.rows],
    }));
    setCursors((prev) => ({ ...prev, [entity]: incoming.nextCursor }));
    setHasMoreMap((prev) => ({ ...prev, [entity]: incoming.hasMore }));
  }, [cursors, query, sortBy, sortOrder, mimeType, roleId, triggerLoadMore]);

  const handleDeleteFile = useCallback(async (fileId: number) => {
    const previousFiles = accumulated.files;
    setAccumulated((prev) => ({
      ...prev,
      files: prev.files.filter((f) => f.id !== fileId),
    }));

    try {
      await deleteFile(fileId).unwrap();
    } catch (err) {
      setAccumulated((prev) => ({ ...prev, files: previousFiles }));
      alert('Failed to delete file. Please try again.');
    }
  }, [accumulated.files, deleteFile]);

  const mergedResponse: SearchResponse = {
    files: data?.files ? { ...data.files, rows: accumulated.files, hasMore: hasMoreMap.files } : undefined,
    users: data?.users ? { ...data.users, rows: accumulated.users, hasMore: hasMoreMap.users } : undefined,
    roles: data?.roles ? { ...data.roles, rows: accumulated.roles, hasMore: hasMoreMap.roles } : undefined,
  };

  return (
    <div className="dashboard-container">
      <Navbar />
      <div className="global-search-page">
        <h1>Search</h1>
        <SearchBar onSearch={handleSearch} />
        <SearchFilters
          mimeType={mimeType}
          onMimeTypeChange={setMimeType}
          roleId={roleId}
          onRoleIdChange={setRoleId}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
        />
        <SearchResults
          data={mergedResponse}
          isLoading={isLoading}
          isFetching={isFetching || isLoadingMore}
          error={error}
          onLoadMore={handleLoadMore}
          onDeleteFile={handleDeleteFile}
        />
      </div>
    </div>
  );
}