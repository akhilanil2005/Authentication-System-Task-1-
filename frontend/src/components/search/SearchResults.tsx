// src/components/search/SearchResults.tsx
import type { SearchResponse } from '../../features/search/searchApiSlice';

interface SearchResultsProps {
  data: SearchResponse | undefined;
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  onLoadMore: (entity: 'files' | 'users' | 'roles') => void;
  onDeleteFile: (fileId: number) => void;
}

export default function SearchResults({ data, isLoading, isFetching, error, onLoadMore, onDeleteFile }: SearchResultsProps) {
  if (isLoading) {
    return <div className="search-results__status">Searching...</div>;
  }

  if (error) {
    return <div className="search-results__status search-results__status--error">Something went wrong. Please try again.</div>;
  }

  if (!data) return null;

  const hasAnyResults =
    (data.files?.rows.length ?? 0) > 0 ||
    (data.users?.rows.length ?? 0) > 0 ||
    (data.roles?.rows.length ?? 0) > 0;

  if (!hasAnyResults) {
    return <div className="search-results__status">No results found.</div>;
  }

  return (
    <div className="search-results">
      {data.files && data.files.rows.length > 0 && (
        <section className="search-results__group">
          <h3 className="search-results__group-title">Files ({data.files.rows.length}{data.files.hasMore ? '+' : ''})</h3>
          <ul className="search-results__list">
            {data.files.rows.map((file) => (
              <li key={file.id} className="search-results__item search-results__item--file">
                <div>
                  <span className="search-results__item-name">{file.original_name}</span>
                  <span className="search-results__item-meta">{file.mime_type}</span>
                </div>
                <button
                  onClick={() => onDeleteFile(file.id)}
                  className="search-results__delete-btn"
                  aria-label={`Delete ${file.original_name}`}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
          {data.files.hasMore && (
            <button onClick={() => onLoadMore('files')} className="search-results__load-more">
              Load more files
            </button>
          )}
        </section>
      )}

      {data.users && data.users.rows.length > 0 && (
        <section className="search-results__group">
          <h3 className="search-results__group-title">Users ({data.users.rows.length}{data.users.hasMore ? '+' : ''})</h3>
          <ul className="search-results__list">
            {data.users.rows.map((user) => (
              <li key={user.id} className="search-results__item">
                <span className="search-results__item-name">{user.name}</span>
                <span className="search-results__item-meta">{user.email}</span>
              </li>
            ))}
          </ul>
          {data.users.hasMore && (
            <button onClick={() => onLoadMore('users')} className="search-results__load-more">
              Load more users
            </button>
          )}
        </section>
      )}

      {data.roles && data.roles.rows.length > 0 && (
        <section className="search-results__group">
          <h3 className="search-results__group-title">Roles ({data.roles.rows.length}{data.roles.hasMore ? '+' : ''})</h3>
          <ul className="search-results__list">
            {data.roles.rows.map((role) => (
              <li key={role.id} className="search-results__item">
                <span className="search-results__item-name">{role.name}</span>
                <span className="search-results__item-meta">{role.description || 'No description'}</span>
              </li>
            ))}
          </ul>
          {data.roles.hasMore && (
            <button onClick={() => onLoadMore('roles')} className="search-results__load-more">
              Load more roles
            </button>
          )}
        </section>
      )}

      {isFetching && <div className="search-results__status">Loading more...</div>}
    </div>
  );
}