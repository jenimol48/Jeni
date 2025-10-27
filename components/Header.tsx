
import React from 'react';
import type { RFIDCard } from '../types';

interface HeaderProps {
    isLoggedIn: boolean;
    card: RFIDCard | null;
}

const Header: React.FC<HeaderProps> = ({ isLoggedIn, card }) => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center fixed top-0 left-0 right-0 z-10">
      <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">BUS2go</h1>
      <div className="w-10 h-10 bg-indigo-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-lg">
        {isLoggedIn && card ? (
            <span>{card.holderName.charAt(0).toUpperCase()}</span>
        ) : (
            <i className="fa-solid fa-user text-gray-500 dark:text-gray-400"></i>
        )}
      </div>
    </header>
  );
};

export default Header;
