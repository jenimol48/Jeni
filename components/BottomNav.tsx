
import React from 'react';
import type { ActiveView } from '../types';

interface BottomNavProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
}

const NavItem: React.FC<{
  label: string;
  iconClass: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, iconClass, isActive, onClick }) => {
  const activeClasses = isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400';
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-full transition-colors duration-200 ${activeClasses}`}>
      <i className={`fa-solid ${iconClass} text-xl`}></i>
      <span className="text-xs mt-1">{label}</span>
    </button>
  );
};

const BottomNav: React.FC<BottomNavProps> = ({ activeView, setActiveView }) => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-[0_-2px_5px_-1px_rgba(0,0,0,0.1)] p-2 flex justify-around">
      <NavItem
        label="Home"
        iconClass="fa-house"
        isActive={activeView === 'home'}
        onClick={() => setActiveView('home')}
      />
      <NavItem
        label="History"
        iconClass="fa-clock-rotate-left"
        isActive={activeView === 'history'}
        onClick={() => setActiveView('history')}
      />
      <NavItem
        label="Routes"
        iconClass="fa-route"
        isActive={activeView === 'routes'}
        onClick={() => setActiveView('routes')}
      />
      <NavItem
        label="Profile"
        iconClass="fa-user"
        isActive={activeView === 'profile'}
        onClick={() => setActiveView('profile')}
      />
    </footer>
  );
};

export default BottomNav;
