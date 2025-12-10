"use client";

import { motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";

interface SearchInputProps {
  onSearch: (query: string) => void;
  initialQuery?: string;
}

export default function SearchInput({ onSearch }: SearchInputProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    // setMounted(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      // inputRef.current?.blur();
    }
  };

  const handleClear = () => {
    setQuery("");
    // inputRef.current?.focus();
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="relative w-full max-w-2xl mx-auto"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground" size={24} />
      <input
        // ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full pl-16 pr-14 py-5 border bg-input border-border text-foreground rounded-full text-lg focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-300 placeholder:text-muted-foreground"
      />
      {query && (
        <motion.button
          type="button"
          onClick={handleClear}
          className="absolute right-6 top-1/2 -translate-y-1/2 p-1.5 bg-secondary hover:bg-accent rounded-full text-muted-foreground"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
        >
          <X size={18} />
        </motion.button>
      )}
    </motion.form>
  );
}
