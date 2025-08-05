import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, User } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { motion } from 'framer-motion';

const BottomNavBar = ({ onOpenPerfil }) => {
  const navLinkClass = ({ isActive }) =>
    twMerge(
      'flex flex-col items-center justify-center flex-1 h-14 transition-all duration-300',
      isActive
        ? 'text-cyan-300'
        : 'text-gray-300 hover:text-white'
    );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="max-w-md mx-auto flex items-center justify-around bg-black/50 backdrop-blur-md border-t border-white/10 shadow-lg h-16 rounded-t-xl">
        {/* Botón Inicio */}
        <motion.div whileTap={{ scale: 0.95 }}>
          <NavLink to="/dashboard" className={navLinkClass}>
            <Home className="w-6 h-6" />
            <span className="text-xs mt-1">Inicio</span>
          </NavLink>
        </motion.div>

        {/* Botón Perfil */}
        <motion.div whileTap={{ scale: 0.95 }}>
          <button onClick={onOpenPerfil} className={navLinkClass({ isActive: false })}>
            <User className="w-6 h-6" />
            <span className="text-xs mt-1">Perfil</span>
          </button>
        </motion.div>
      </div>
    </nav>
  );
};

export default BottomNavBar;
