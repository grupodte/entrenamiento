import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Dumbbell, User } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Inicio' },
];

const BottomNavBar = ({ onOpenPerfil }) => {
  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md z-50">
      <div className="ios-glass flex justify-around rounded-2xl p-1 shadow-lg">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              twMerge(
                'flex flex-col items-center justify-center w-full rounded-lg py-2 text-sm font-medium transition-all duration-300',
                isActive
                  ? 'text-cyan-300 bg-white/10 scale-105'
                  : 'text-gray-300 hover:bg-white/5'
              )
            }
          >
            <item.icon className="w-6 h-6" />
            <span className="text-xs mt-1">{item.label}</span>
          </NavLink>
        ))}
        <button
          onClick={onOpenPerfil}
          className="flex flex-col items-center justify-center w-full rounded-lg py-2 text-sm font-medium transition-all duration-300 text-gray-300 hover:bg-white/5"
        >
          <User className="w-6 h-6" />
          <span className="text-xs mt-1">Perfil</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNavBar;
