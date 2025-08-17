import React from 'react';
import { Hash, Feather } from 'lucide-react';

const Navbar: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 md:left-20 bg-surface-1 z-40">
      <div className="container mx-auto max-w-3xl px-4">
        <div className="flex items-center justify-between h-16">
          <a href="#/" aria-label="Home" className="text-primary hover:opacity-80 transition-opacity">
            <Feather size={28} />
          </a>
          <a href="#/feeds" className="p-2 rounded-full hover:bg-surface-3" aria-label="Feeds">
            <Hash size={24} className="text-on-surface-variant hover:text-on-surface" />
          </a>
        </div>
      </div>
    </header>
  );
};

export default Navbar;