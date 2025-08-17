import React from 'react';

const Navbar: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 md:left-20 bg-surface-1/80 backdrop-blur-md border-b border-surface-3 z-40">
      <div className="container mx-auto max-w-3xl px-4">
        <div className="flex items-center justify-center md:justify-start h-16">
          <a href="#/" className="text-xl font-bold text-on-surface">Takaka</a>
        </div>
      </div>
    </header>
  );
};

export default Navbar;