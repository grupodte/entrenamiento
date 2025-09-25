import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import BurgerIcon from '../assets/burger.svg';

const BottomNavBar = ({ 
  onOpenPerfil, 
  isPerfilOpen = false,
  // Props para SwipeWidget
  onOpenSwipeWidget = null,
  isSwipeWidgetOpen = false
}) => {
  const { user } = useAuth();
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

  const handleMenuClick = () => {
    onOpenSwipeWidget?.();
  };

  const handleProfileClick = () => {
    onOpenPerfil?.();
  };

  const buttonClass = 'flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 text-white/80 hover:text-white hover:bg-white/10';

  return (
    <motion.nav 
      className="fixed bottom-0 left-0 h-[75px] right-0 z-floating-nav bg-[#D9D9D9] border-t border-black"
      style={{
        paddingBottom: `${safeAreaInsets.bottom}px`,
      }}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="flex items-center justify-between px-6 py-3">
        
  

        {/* Botón de Perfil */}
        <motion.button
          onClick={handleProfileClick}
          className="flex items-center justify-center w-8 h-8 rounded-full overflow-hidden border-2 border-gray-300 transition-all duration-200 hover:border-gray-400"
          whileTap={{ scale: 0.95 }}
        >
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt="Perfil" 
              className="w-full h-full object-cover"
              onError={(e) => {
                // Si falla la carga de la imagen, mostrar el icono por defecto
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<svg class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>';
              }}
            />
          ) : (
            <User className="w-6 h-6 text-gray-700" />
          )}
        </motion.button>


        {/* Botón de Menú */}
        <motion.button
          onClick={handleMenuClick}
          className={buttonClass}
          whileTap={{ scale: 0.95 }}
        >
          <img src={BurgerIcon} alt="Menu" className="w-6 h-6"  />
        </motion.button>
      </div>
    </motion.nav>
  );
};

export default BottomNavBar;
