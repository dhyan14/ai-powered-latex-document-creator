
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="w-full max-w-7xl mx-auto text-center py-6 px-4">
      <h1 className="text-4xl font-bold text-blue-700 sm:text-5xl">
        AI-Powered LaTeX Document Creator
      </h1>
      <p className="mt-2 text-lg text-slate-600">
        Create, edit, and convert Beamer presentations and article-style notes with AI.
      </p>
    </header>
  );
};

export default Header;