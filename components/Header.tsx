
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="text-center">
      <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
        AI Virtual Try-On
      </h1>
      <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
        Upload an image of a person and an item of clothing to see the magic happen. Our AI will dress the person for you.
      </p>
    </header>
  );
};
