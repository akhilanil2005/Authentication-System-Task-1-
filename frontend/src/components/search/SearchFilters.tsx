interface SearchFiltersProps {
  mimeType: string;
  onMimeTypeChange: (value: string) => void;
  roleId: string;
  onRoleIdChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  sortOrder: 'ASC' | 'DESC';
  onSortOrderChange: (value: 'ASC' | 'DESC') => void;
}

export default function SearchFilters({
  mimeType, onMimeTypeChange,
  roleId, onRoleIdChange,
  sortBy, onSortByChange,
  sortOrder, onSortOrderChange,
}: SearchFiltersProps) {
  return (
    <div className="search-filters">
      <select value={mimeType} onChange={(e) => onMimeTypeChange(e.target.value)}>
        <option value="">All file types</option>
        <option value="application/pdf">PDF</option>
        <option value="image/png">PNG</option>
        <option value="image/jpeg">JPEG</option>
        <option value="text/plain">Text</option>
      </select>

      <select value={roleId} onChange={(e) => onRoleIdChange(e.target.value)}>
        <option value="">All roles</option>
        <option value="1">Admin</option>
        <option value="3">User</option>
      </select>

      <select value={sortBy} onChange={(e) => onSortByChange(e.target.value)}>
        <option value="created_at">Date created</option>
        <option value="name">Name</option>
      </select>

      <button
        onClick={() => onSortOrderChange(sortOrder === 'ASC' ? 'DESC' : 'ASC')}
        className="search-filters__sort-toggle"
      >
        {sortOrder === 'ASC' ? '↑ Ascending' : '↓ Descending'}
      </button>
    </div>
  );
}