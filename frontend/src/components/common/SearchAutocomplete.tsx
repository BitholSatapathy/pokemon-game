import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2, Sparkles, User, Package, Layers } from 'lucide-react';
import { fetchSearchSuggestions, SearchSuggestion } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface SearchAutocompleteProps {
  placeholder?: string;
  category?: 'all' | 'cards' | 'users' | 'packs' | 'decks';
  onSelect?: (item: SearchSuggestion) => void;
  className?: string;
  autoNavigate?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}

export const SearchAutocomplete: React.FC<SearchAutocompleteProps> = ({
  placeholder = 'Search cards, sets, packs, or trainers...',
  category = 'all',
  onSelect,
  className = '',
  autoNavigate = true,
  value,
  onChange,
}) => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [internalQuery, setInternalQuery] = useState('');
  const query = value !== undefined ? value : internalQuery;

  const setQueryValue = (newVal: string) => {
    if (value === undefined) {
      setInternalQuery(newVal);
    }
    if (onChange) {
      onChange(newVal);
    }
  };

  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (!query || query.trim().length === 0) {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const results = await fetchSearchSuggestions(query, category, token || undefined);
        setSuggestions(results);
        setIsOpen(results.length > 0);
        setActiveIndex(-1);
      } catch {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 180);

    return () => clearTimeout(timeout);
  }, [query, category, token]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectItem = (item: SearchSuggestion) => {
    setIsOpen(false);
    setQueryValue(item.title);
    if (onSelect) {
      onSelect(item);
    } else if (autoNavigate && item.link_to) {
      navigate(item.link_to);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        handleSelectItem(suggestions[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'user':
        return <User className="w-3.5 h-3.5 text-blue-400" />;
      case 'pack':
        return <Package className="w-3.5 h-3.5 text-amber-400" />;
      case 'deck':
        return <Layers className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-pink-400" />;
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input Field */}
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQueryValue(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-9 py-2 bg-[#141424] border border-[#2A2A44] rounded-xl text-xs sm:text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-all"
        />
        {isLoading ? (
          <Loader2 className="w-4 h-4 text-purple-400 animate-spin absolute right-3" />
        ) : query ? (
          <button
            type="button"
            onClick={() => {
              setQueryValue('');
              setSuggestions([]);
              setIsOpen(false);
            }}
            className="text-gray-400 hover:text-white absolute right-3 p-0.5 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>

      {/* Dropdown Suggestions Menu */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-[#0F0F1C]/95 backdrop-blur-xl border border-purple-500/40 rounded-2xl shadow-2xl overflow-hidden py-1.5 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-gray-400 flex items-center justify-between border-b border-white/5 pb-1.5 mb-1">
            <span>Instant Suggestions</span>
            <span>{suggestions.length} results</span>
          </div>

          <div className="max-h-72 overflow-y-auto sidebar-scrollbar space-y-0.5 px-1">
            {suggestions.map((item, index) => {
              const isSelected = index === activeIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectItem(item)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-brand-violet/30 border border-purple-400/50 text-white shadow-glow-purple'
                      : 'hover:bg-white/5 border border-transparent text-gray-200'
                  }`}
                >
                  {/* Left Side Icon / Thumbnail */}
                  <div className="w-9 h-11 shrink-0 rounded-lg overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center relative">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className={`w-full h-full ${item.category === 'user' ? 'object-cover' : 'object-contain'}`}
                        loading="lazy"
                      />
                    ) : (
                      getCategoryIcon(item.category)
                    )}
                  </div>

                  {/* Title & Metadata */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs sm:text-sm text-white truncate">
                        {item.title}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-mono uppercase font-bold shrink-0 ${
                          item.category === 'card'
                            ? 'bg-purple-900/60 text-purple-300 border border-purple-500/30'
                            : item.category === 'pack'
                            ? 'bg-amber-900/60 text-amber-300 border border-amber-500/30'
                            : item.category === 'user'
                            ? 'bg-blue-900/60 text-blue-300 border border-blue-500/30'
                            : 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {item.category}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-400 truncate mt-0.5">
                      {item.subtitle}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
