import { useState, useEffect } from 'react';
import { useDebounce } from '../../hooks/useDebounce';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export default function SearchBar({ onSearch, placeholder = 'Search files, users, roles...' }: SearchBarProps) {
  const [input, setInput] = useState('');
  const debouncedInput = useDebounce(input, 400);

  useEffect(() => {
    onSearch(debouncedInput);
  }, [debouncedInput, onSearch]);

  return (
    <div className="search-bar">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={placeholder}
        className="search-bar__input"
        aria-label="Global search"
      />
      {input && (
        <button
          onClick={() => setInput('')}
          className="search-bar__clear"
          aria-label="Clear search"
        >
          ×
        </button>
      )}
    </div>
  );
}