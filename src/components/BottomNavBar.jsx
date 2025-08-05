import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Dumbbell, User } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Inicio' },
];

const BottomNavBar = ({ onOpenPerfil }) => {
  const location = useLocation();

  const navLinkClass = ({ isActive }) =>
    twMerge(
      'flex items-center justify-center w-14 h-14 rounded-full ios-glass shadow-lg transition-all duration-300',
      isActive
        ? 'bg-cyan-400/30 text-cyan-300 scale-110'
        : 'bg-gray-800/60 text-gray-300 hover:bg-gray-700/80'
    );

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-24 z-50 pointer-events-none">
      <div className="max-w-md mx-auto h-full flex justify-between items-center px-8 pointer-events-auto">
        {/* Botón de Inicio a la izquierda */}
        <NavLink to="/dashboard" className={navLinkClass}>
          <Home className="w-7 h-7" />
        </NavLink>

        {/* Botón de Perfil a la derecha */}
        <button onClick={onOpenPerfil} className={navLinkClass({ isActive: false })}>
          <User className="w-7 h-7" />
        </button>
      </div>
    </nav>
  );
};

export default BottomNavBar;
