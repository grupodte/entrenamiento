import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, User } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { motion } from 'framer-motion';

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Inicio' },
];

const BottomNavBar = ({ onOpenPerfil }) => {
  const navLinkClass = ({ isActive }) =>
    twMerge(
      'flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-300',
      'backdrop-blur-md bg-black/40 border border-white/10',
      isActive
        ? 'text-cyan-300 scale-110'
        : 'text-gray-300 hover:bg-white/10 hover:scale-105'
    );

  return (
    <nav className="fixed bottom-4 left-0 right-0 z-30 pointer-events-none">
      <div className="max-w-md mx-auto flex justify-between items-center px-8 pointer-events-auto">
        {/* Botón Inicio */}
        <motion.div whileTap={{ scale: 0.9 }}>
          <NavLink to="/dashboard" className={navLinkClass}>
            <Home className="w-7 h-7" />
          </NavLink>
        </motion.div>

        {/* Botón Perfil */}
        <motion.div whileTap={{ scale: 0.9 }}>
          <button onClick={onOpenPerfil} className={navLinkClass({ isActive: false })}>
            <User className="w-7 h-7" />
          </button>
        </motion.div>
      </div>
    </nav>
  );
};

export default BottomNavBar;
