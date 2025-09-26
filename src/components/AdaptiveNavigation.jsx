import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Dumbbell, 
  BookOpen, 
  User,
  Menu,
  ArrowLeft,
  ChevronLeft,
  Plus
} from 'lucide-react';
import usePlatformAdaptation from '../hooks/usePlatformAdaptation';

/**
 * Navegación adaptativa que cambia según la plataforma (iOS vs Android)
 * Implementa las convenciones de cada OS según el documento de arquitectura
 */

const AdaptiveNavigation = ({ title, showBackButton = false, onBackClick }) => {
  const { 
    isIOS, 
    isAndroid, 
    getNavigationConfig, 
    getPlatformClasses,
    getAnimationConfig 
  } = usePlatformAdaptation();
  
  const location = useLocation();
  const navigate = useNavigate();
  const navigationConfig = getNavigationConfig();
  const animationConfig = getAnimationConfig();

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Inicio' },
    { path: '/rutinas', icon: Dumbbell, label: 'Rutinas' },
    { path: '/mis-cursos', icon: BookOpen, label: 'Cursos' },
    { path: '/perfil', icon: User, label: 'Perfil' }
  ];

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      navigate(-1);
    }
  };

  // === NAVEGACIÓN PARA iOS (Tab Bar) ===
  if (isIOS && navigationConfig.type === 'tabbar') {
    return (
      <>
        {/* Header iOS */}
        <header className="bg-gray-900/95 backdrop-blur-xl border-b border-gray-800/50 px-4 py-3">
          <div className="flex items-center justify-between">
            {showBackButton && (
              <button
                onClick={handleBackClick}
                className="flex items-center text-blue-500 hover:text-blue-400 transition-colors"
                style={{
                  transitionDuration: `${animationConfig.duration}ms`,
                  transitionTimingFunction: animationConfig.easing
                }}
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                <span className="text-sm">Atrás</span>
              </button>
            )}
            
            <h1 className="text-lg font-semibold text-white text-center flex-1">
              {title}
            </h1>
            
            <div className="w-16"> {/* Spacer para centrar título */}</div>
          </div>
        </header>

        {/* Tab Bar iOS (Inferior) */}
        <nav className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-xl border-t border-gray-800/50 px-2 py-1 z-50">
          <div className="flex items-center justify-around">
            {navItems.map(({ path, icon: Icon, label }) => {
              const isActive = location.pathname === path;
              return (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all ${
                    isActive 
                      ? 'text-blue-500 bg-blue-500/10' 
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                  style={{
                    transitionDuration: `${animationConfig.duration}ms`,
                    transitionTimingFunction: animationConfig.easing,
                    transform: isActive ? 'scale(0.95)' : 'scale(1)'
                  }}
                >
                  <Icon className="w-5 h-5 mb-1" />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </>
    );
  }

  // === NAVEGACIÓN PARA ANDROID (Drawer + FAB) ===
  if (isAndroid && navigationConfig.type === 'drawer') {
    return (
      <>
        {/* Header Android */}
        <header className="bg-gray-900 shadow-md border-b border-gray-800 px-4 py-4">
          <div className="flex items-center">
            {showBackButton ? (
              <button
                onClick={handleBackClick}
                className="mr-4 p-2 hover:bg-gray-800 rounded-full transition-colors"
                style={{
                  transitionDuration: `${animationConfig.duration}ms`
                }}
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            ) : (
              <button
                className="mr-4 p-2 hover:bg-gray-800 rounded-full transition-colors"
                onClick={() => {/* Toggle drawer */}}
              >
                <Menu className="w-5 h-5 text-white" />
              </button>
            )}
            
            <h1 className="text-xl font-medium text-white">
              {title}
            </h1>
          </div>
        </header>

        {/* Navigation Drawer (se mostraría como overlay) */}
        <nav className="hidden md:flex flex-col w-64 bg-gray-900 border-r border-gray-800 fixed left-0 top-0 h-full z-40 pt-16">
          <div className="p-4">
            <div className="text-2xl font-bold text-white mb-8">DD</div>
            <div className="space-y-2">
              {navItems.map(({ path, icon: Icon, label }) => {
                const isActive = location.pathname === path;
                return (
                  <button
                    key={path}
                    onClick={() => navigate(path)}
                    className={`w-full flex items-center px-4 py-3 rounded-lg transition-all ${
                      isActive 
                        ? 'text-white bg-indigo-600 shadow-lg' 
                        : 'text-gray-300 hover:text-white hover:bg-gray-800'
                    }`}
                    style={{
                      transitionDuration: `${animationConfig.duration}ms`,
                      transitionTimingFunction: animationConfig.easing
                    }}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    <span className="font-medium">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Floating Action Button (Android) */}
        <button
          className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all z-50 flex items-center justify-center"
          style={{
            transitionDuration: `${animationConfig.duration}ms`,
            transitionTimingFunction: animationConfig.easing
          }}
          onClick={() => navigate('/rutinas/crear')}
        >
          <Plus className="w-6 h-6" />
        </button>
      </>
    );
  }

  // === NAVEGACIÓN DESKTOP ===
  return (
    <header className="bg-gray-900 shadow-sm border-b border-gray-800 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {showBackButton && (
            <button
              onClick={handleBackClick}
              className="mr-4 p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
          )}
          <h1 className="text-xl font-semibold text-white">{title}</h1>
        </div>
        
        <nav className="flex items-center space-x-6">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'text-indigo-400 bg-indigo-900/20' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                <span className="font-medium">{label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

// Componente de ejemplo de uso
export const NavigationExample = () => {
  const { isIOS, isAndroid, isMobile } = usePlatformAdaptation();
  
  return (
    <div className="min-h-screen bg-gray-950">
      <AdaptiveNavigation 
        title="Mi Entrenamiento" 
        showBackButton={false}
      />
      
      <main className={`p-6 ${isMobile ? 'pb-20' : ''}`}>
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800/50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">
              Navegación Adaptativa Detectada
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${
                  isIOS ? 'bg-blue-500' : 'bg-gray-600'
                }`}></div>
                <span className="text-gray-300">iOS</span>
                {isIOS && <p className="text-blue-400 mt-1">Tab Bar + Chevron Back</p>}
              </div>
              
              <div className="text-center">
                <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${
                  isAndroid ? 'bg-green-500' : 'bg-gray-600'
                }`}></div>
                <span className="text-gray-300">Android</span>
                {isAndroid && <p className="text-green-400 mt-1">Drawer + FAB + Arrow Back</p>}
              </div>
              
              <div className="text-center">
                <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${
                  !isMobile ? 'bg-purple-500' : 'bg-gray-600'
                }`}></div>
                <span className="text-gray-300">Desktop</span>
                {!isMobile && <p className="text-purple-400 mt-1">Horizontal Nav</p>}
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-3">
              Contenido Principal
            </h3>
            <p className="text-gray-300">
              La navegación se adapta automáticamente según la plataforma detectada,
              siguiendo las convenciones de UX específicas de cada sistema operativo.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdaptiveNavigation;
