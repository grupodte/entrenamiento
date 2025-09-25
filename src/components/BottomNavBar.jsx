import React, { useState, useEffect } from 'react';
import { Home, User, Target, ArrowLeft, Menu, PanelLeftOpen } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const BottomNavBar = ({ 
  onOpenPerfil, 
  isPerfilOpen = false,
  // Props para ProgressDock (solo en RutinaDetalle)
  showProgressDock = false,
  onToggleProgressDock = null,
  progressGlobal = 0,
  // Props para botón dinámico Home/Back
  onBackClick = null,
  // Props para SwipeWidget (solo en Dashboard)
  onOpenSwipeWidget = null,
  isSwipeWidgetOpen = false
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeButton, setActiveButton] = useState('home');
  const [isStandalone, setIsStandalone] = useState(false);
  const [safeAreaInsets, setSafeAreaInsets] = useState({ bottom: 0 });

  // Detectar rutas específicas
  const isInRutinaDetalle = location.pathname.includes('/rutina/');
  const shouldShowProgressButton = isInRutinaDetalle && onToggleProgressDock;
  const shouldShowSwipeButton = !isInRutinaDetalle && onOpenSwipeWidget;

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
      bottom: Math.max(safeBottom, isStandaloneMode ? 24 : 12),
    });
  }, []);

  // Sincronizar activeButton con el estado del drawer
  useEffect(() => {
    if (!isPerfilOpen && activeButton === 'profile') {
      setActiveButton('home');
    }
  }, [isPerfilOpen, activeButton]);

  const handleHomeClick = () => {
    if (isInRutinaDetalle && onBackClick) {
      onBackClick();
    } else {
      setActiveButton('home');
      navigate('/dashboard');
    }
  };

  const handleProfileClick = () => {
    if (!isPerfilOpen) {
      setActiveButton('profile');
      onOpenPerfil?.();
    }
  };

  const handleProgressClick = () => {
    onToggleProgressDock();
    setActiveButton('progress');
  };

  const handleSwipeWidgetClick = () => {
    onOpenSwipeWidget();
  };

  const navItemClass = (isActive, isSpecial = false) => {
    const baseClass = 'flex flex-col items-center justify-center py-3 px-4 rounded-xl transition-all duration-200 min-w-[60px]';
    
    if (isSpecial && isActive) {
      return `${baseClass} bg-emerald-500/30 text-emerald-200 shadow-lg shadow-emerald-500/20`;
    } else if (isSpecial) {
      return `${baseClass} text-emerald-300 hover:bg-emerald-500/20`;
    }
    
    return isActive
      ? `${baseClass} bg-white/20 text-white shadow-lg`
      : `${baseClass} text-white/60 hover:text-white hover:bg-white/15`;
  };

  const iconSize = 'w-5 h-5';

  return (
    <motion.nav 
      className="fixed bottom-0 left-0 right-0 z-[100] bg-black/90 backdrop-blur-xl border-t border-white/20"
      style={{
        paddingBottom: `${safeAreaInsets.bottom}px`,
      }}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="flex items-center justify-around px-6 py-3">
        
        {/* Botón Home/Back */}
        <motion.button
          onClick={handleHomeClick}
          className={navItemClass(activeButton === 'home')}
          whileTap={{ scale: 0.95 }}
        >
          <div className="relative">
            <AnimatePresence mode="wait">
              {isInRutinaDetalle ? (
                <motion.div
                  key="back"
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  <ArrowLeft className={iconSize} />
                </motion.div>
              ) : (
                <motion.div
                  key="home"
                  initial={{ opacity: 0, rotate: 90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: -90 }}
                  transition={{ duration: 0.2 }}
                >
                  <Home className={iconSize} />
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Dot indicator */}
            {activeButton === 'home' && (
              <motion.div 
                className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </div>
          <span className="text-xs font-medium mt-1">
            {isInRutinaDetalle ? 'Salir' : 'Inicio'}
          </span>
        </motion.button>

        {/* Botón SwipeWidget - Solo en Dashboard */}
        {shouldShowSwipeButton && (
          <motion.button
            onClick={handleSwipeWidgetClick}
            className={navItemClass(isSwipeWidgetOpen)}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="relative">
              <PanelLeftOpen className={iconSize} />
              {isSwipeWidgetOpen && (
                <motion.div 
                  className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                />
              )}
            </div>
            <span className="text-xs font-medium mt-1">Menú</span>
          </motion.button>
        )}

        {/* Botón ProgressDock - Solo en RutinaDetalle */}
        {shouldShowProgressButton && (
          <motion.button
            onClick={handleProgressClick}
            className={navItemClass(showProgressDock, true)}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="relative">
              <motion.div
                animate={{ 
                  rotate: showProgressDock ? 0 : [0, 5, -5, 0],
                }}
                transition={{
                  rotate: {
                    duration: 2,
                    repeat: showProgressDock ? 0 : Infinity,
                    ease: "easeInOut"
                  }
                }}
              >
                <Target className={iconSize} />
              </motion.div>
              
              {/* Progreso en número */}
              {progressGlobal > 0 && (
                <motion.div 
                  className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  {Math.round(progressGlobal)}
                </motion.div>
              )}
              
              {/* Dot indicator cuando está activo */}
              {showProgressDock && (
                <motion.div 
                  className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                />
              )}
              
              {/* Pulso sutil cuando no está activo */}
              {!showProgressDock && progressGlobal === 0 && (
                <motion.div
                  className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full"
                  animate={{
                    scale: [0, 1.2, 0],
                    opacity: [0.8, 0.4, 0.8]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
            </div>
            <span className="text-xs font-medium mt-1">Progreso</span>
          </motion.button>
        )}

        {/* Spacer para centrar el botón perfil cuando solo hay 2 botones */}
        {!shouldShowSwipeButton && !shouldShowProgressButton && (
          <div className="flex-1" />
        )}

        {/* Botón Perfil - Solo visible si NO estamos en RutinaDetalle */}
        {!isInRutinaDetalle && (
          <motion.button
            onClick={handleProfileClick}
            className={navItemClass(activeButton === 'profile' && isPerfilOpen)}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: shouldShowSwipeButton ? 0.2 : 0.1 }}
          >
            <div className="relative">
              <User className={iconSize} />
              {activeButton === 'profile' && isPerfilOpen && (
                <motion.div 
                  className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                />
              )}
            </div>
            <span className="text-xs font-medium mt-1">Perfil</span>
          </motion.button>
        )}
      </div>
    </motion.nav>
  );
};

export default BottomNavBar;
