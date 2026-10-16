import React, { useState } from 'react';
import { FiSearch } from 'react-icons/fi';

const SearchBar = ({ onSearch, value, onChange, placeholder = 'Search for notes, PPTs, videos, past papers...' }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const displayedValue = value ?? searchTerm;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(displayedValue.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto relative group">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <FiSearch className="text-gray-400 group-focus-within:text-blue-400 transition-colors text-xl" />
      </div>
      <input
        type="search"
        aria-label="Search study resources"
        className="block w-full pl-12 pr-28 py-4 bg-white/5 border border-white/10 rounded-2xl text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all shadow-lg backdrop-blur-sm placeholder:text-gray-500"
        placeholder={placeholder}
        value={displayedValue}
        onChange={(e) => { setSearchTerm(e.target.value); onChange?.(e.target.value); }}
      />
      <button 
        type="submit" 
        className="absolute right-2 top-2 bottom-2 px-6 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors"
      >
        Search
      </button>
    </form>
  );
};

export default SearchBar;
