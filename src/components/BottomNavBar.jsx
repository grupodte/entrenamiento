import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Dumbbell, User } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Inicio' },
];

const BottomNavBar = ({ onOpenPerfil }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 pb-safe z-50">
      <div className="flex justify-around max-w-md mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard'}
            className={({ isActive }) =>
              twMerge(
                'flex flex-col items-center justify-center w-full pt-2 pb-1 text-sm font-medium transition-colors duration-200',
                isActive
                  ? 'text-cyan-400'
                  : 'text-gray-400 hover:text-white'
              )
            }
          >
            <item.icon className="w-6 h-6 mb-1" />
            <span>{item.label}</span>
          </NavLink>
        ))}
        <button
          onClick={onOpenPerfil}
          className="flex flex-col items-center justify-center w-full pt-2 pb-1 text-sm font-medium transition-colors duration-200 text-gray-400 hover:text-white"
        >
          <User className="w-6 h-6 mb-1" />
          <span>Perfil</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNavBar;
