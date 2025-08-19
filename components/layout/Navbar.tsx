

import React from 'react';
import { Send, Search } from 'lucide-react';

const Navbar: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 md:left-20 bg-surface-1 z-40">
      <div className="container mx-auto max-w-3xl px-4">
        <div className="flex items-center justify-between h-16">
          <a href="#/" aria-label="Home" className="flex items-center gap-3 text-primary hover:opacity-80 transition-opacity">
            <Send size={28} />
            <span className="text-xl font-bold text-on-surface">Takaka</span>
          </a>
          <a href="#/search" className="p-2 rounded-full hover:bg-surface-3" aria-label="Search">
            <Search size={24} className="text-on-surface-variant hover:text-on-surface" />
          </a>
        </div>
      </div>
    </header>
  );
};

export default Navbar;