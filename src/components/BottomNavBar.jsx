import React, { useState, useEffect } from 'react';
import { User, ArrowLeft, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useWorkout } from '../context/WorkoutContext';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import BurgerIcon from '../assets/burger.svg';
import ArrowBackIcon from '../assets/arrow-back.svg';

const BottomNavBar = ({ 
  onOpenPerfil, 
  isPerfilOpen = false,
  // Props para SwipeWidget
  onOpenSwipeWidget = null,
  isSwipeWidgetOpen = false
}) => {
  const { user } = useAuth();
  const { isWorkoutActive, workoutTime, formatWorkoutTime, onBackClick } = useWorkout();
  const location = useLocation();
  const [isStandalone, setIsStandalone] = useState(false);
  const [safeAreaInsets, setSafeAreaInsets] = useState({ bottom: 0 });
  const [avatarUrl, setAvatarUrl] = useState(null);

  // Detectar modo PWA y safe area
  useEffect(() => {
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone ||
      document.referrer.includes('android-app://');
    setIsStandalone(isStandaloneMode);

    const computedStyle = getComputedStyle(document.documentElement);
    const safeBottom = parseInt(
      computedStyle.getPropertyValue('--sab') ||
      computedStyle.getPropertyValue('env(safe-area-inset-bottom)') ||
      '0'
    );

    setSafeAreaInsets({
      bottom: Math.max(safeBottom, isStandaloneMode ? 24 : 0),
    });
  }, []);

  // Obtener avatar_url de la tabla perfiles
  useEffect(() => {
    const fetchAvatarUrl = async () => {
      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from('perfiles')
            .select('avatar_url')
            .eq('id', user.id)
            .maybeSingle();
          
          if (!error && data?.avatar_url) {
            console.log('Avatar encontrado en perfiles:', data.avatar_url);
            setAvatarUrl(data.avatar_url);
          } else {
            // Fallback al avatar de user_metadata si existe
            const fallbackAvatar = user.user_metadata?.avatar_url || null;
            console.log('Avatar no encontrado en perfiles, usando fallback:', fallbackAvatar);
            console.log('Datos del usuario:', { user, user_metadata: user.user_metadata });
            setAvatarUrl(fallbackAvatar);
          }
        } catch (error) {
          console.error('Error obteniendo avatar:', error);
          // Fallback al avatar de user_metadata
          setAvatarUrl(user.user_metadata?.avatar_url || null);
        }
      }
    };

    fetchAvatarUrl();
  }, [user]);

  // Estados para proteger contra clics múltiples
  const [isMenuDisabled, setIsMenuDisabled] = useState(false);
  const [isProfileDisabled, setIsProfileDisabled] = useState(false);
  const [isBackDisabled, setIsBackDisabled] = useState(false);

  const handleMenuClick = () => {
    if (isMenuDisabled) return;
    setIsMenuDisabled(true);
    console.log('BottomNavBar: Menu click detectado', { onOpenSwipeWidget });
    onOpenSwipeWidget?.();
    setTimeout(() => setIsMenuDisabled(false), 300); // Reactivar después de 300ms
  };

  const handleProfileClick = () => {
    if (isProfileDisabled) return;
    setIsProfileDisabled(true);
    console.log('BottomNavBar: Profile click detectado', { onOpenPerfil });
    onOpenPerfil?.();
    setTimeout(() => setIsProfileDisabled(false), 300);
  };

  const handleBackClick = () => {
    if (isBackDisabled) return;
    setIsBackDisabled(true);
    console.log('BottomNavBar: Back click detectado', { onBackClick });
    onBackClick?.();
    setTimeout(() => setIsBackDisabled(false), 300);
  };

  // Usar el estado del contexto de workout
  const isInWorkout = isWorkoutActive;
  
  // Debug logs
  console.log('BottomNavBar render:', { isInWorkout, isWorkoutActive, workoutTime });

  return (
    <motion.nav
      className="fixed bottom-0 left-0 right-0 h-[75px] z-navbar bg-[#D9D9D9/80] backdrop-blur-md "
      style={{ paddingBottom: `${safeAreaInsets.bottom}px` }}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Línea de 100px centrada */}

      <div className="flex items-center justify-between px-6 py-3">
        {isInWorkout ? (
          <>
            {/* Modo Rutina Activa */}
            {/* Botón de Perfil (izquierda) */}
            <motion.button
              onClick={handleProfileClick}
              disabled={isProfileDisabled}
              className="flex items-center justify-center w-[40px] h-[40px] rounded-full overflow-hidden border-2 border-gray-300 transition-all duration-200 hover:border-gray-400 cursor-pointer disabled:opacity-70 fast-tap"
              whileTap={{ scale: 0.95 }}
              style={{ 
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                WebkitTouchCallout: 'none',
                WebkitUserSelect: 'none',
                userSelect: 'none'
              }}
            >
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Perfil" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Si falla la carga de la imagen, mostrar el icono por defecto
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<svg class="w-[40px] h-[40px] text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>';
                  }}
                />
              ) : (
                  <User className="w-[40px] h-[40px]" />
              )}
            </motion.button>

            {/* Cronómetro en el centro */}
            <motion.div 
              className="flex items-center gap-2 "
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <motion.span 
                key={workoutTime}
  
                className="text-[36px] text-[#545454] tracking-wide min-w-[60px] text-center"
              >
                {formatWorkoutTime ? formatWorkoutTime(workoutTime) : '00:00'}
              </motion.span>
            </motion.div>

            {/* Botón de Volver (derecha) */}
            <motion.button
              onClick={handleBackClick}
              disabled={isBackDisabled}
              className="flex items-center justify-center w-[40px] h-[40px] cursor-pointer disabled:opacity-70 critical-button"
              whileTap={{ scale: 0.95 }}
              style={{ 
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                WebkitTouchCallout: 'none',
                WebkitUserSelect: 'none',
                userSelect: 'none'
              }}
            >
              <img src={ArrowBackIcon} alt="Volver" className="w-6 h-6 pointer-events-none" />
            </motion.button>
          </>
        ) : (
          <>
            {/* Modo Normal */}
            {/* Botón de Perfil */}
            <motion.button
              onClick={handleProfileClick}
              disabled={isProfileDisabled}
              className="flex items-center justify-center w-[40px] h-[40px] rounded-full overflow-hidden border-2 border-gray-300 transition-all duration-200 hover:border-gray-400 cursor-pointer disabled:opacity-70 fast-tap"
              whileTap={{ scale: 0.95 }}
              style={{ 
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                WebkitTouchCallout: 'none',
                WebkitUserSelect: 'none',
                userSelect: 'none'
              }}
            >
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Perfil" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Si falla la carga de la imagen, mostrar el icono por defecto
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<svg class="w-[40px] h-[40px] text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>';
                  }}
                />
              ) : (
                  <User className="w-[40px] h-[40px]" />
              )}
            </motion.button>

            {/* Botón de Menú */}
            <motion.button
              onClick={handleMenuClick}
              disabled={isMenuDisabled}
              className="flex items-center justify-center w-12 h-12 cursor-pointer disabled:opacity-70 critical-button"
              whileTap={{ scale: 0.95 }}
              style={{ 
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                WebkitTouchCallout: 'none',
                WebkitUserSelect: 'none',
                userSelect: 'none'
              }}
            >
              <img src={BurgerIcon} alt="Menu" className="w-[34.24px] h-[22.83px] pointer-events-none" />
            </motion.button>
          </>
        )}
      </div>
    </motion.nav>
  );
};

export default BottomNavBar;
