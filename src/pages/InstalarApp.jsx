import React from 'react';
import { motion } from 'framer-motion';
import { Download, Smartphone, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useInstallPWA from '../hooks/useInstallPWA';

const InstalarApp = () => {
  const navigate = useNavigate();
  const { 
    handleInstallApp, 
    isInstalling, 
    isInstalled,
    isIOS 
  } = useInstallPWA();

  const handleInstallClick = async () => {
    const success = await handleInstallApp();
    if (success && !isIOS) {
      // Redirigir después de instalación exitosa
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  if (isInstalled) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        {/* Video de fondo */}
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
          <source src="/backgrounds/loginbg.mp4" type="video/mp4" />
        </video>

        {/* Capa oscura con blur total */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-xl"></div>

        {/* Botón de volver */}
        <button
          onClick={handleGoBack}
          className="absolute top-6 left-6 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-200 backdrop-blur-md border border-white/20"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        {/* Modal con animación - App ya instalada */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="relative z-10 p-12 rounded-2xl bg-gray-900/30 max-w-md text-white border border-gray-700/20 shadow-2xl backdrop-blur-xl text-center"
        >
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 mb-6 mx-auto">
            <Smartphone className="w-10 h-10 text-green-400" />
          </div>
          
          <h1 className="text-3xl font-bold mb-4">
            ¡App Instalada! 🎉
          </h1>
          
          <p className="text-gray-300 mb-8 leading-relaxed">
            FitApp ya está instalada en tu dispositivo. 
            Puedes acceder a ella desde tu pantalla de inicio.
          </p>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full px-6 py-4 rounded-2xl bg-cyan-600/60 hover:bg-cyan-500 text-white font-bold text-lg transition-all duration-200 hover:shadow-lg"
          >
            Ir al Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      {/* Video de fondo */}
      <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
        <source src="/backgrounds/loginbg.mp4" type="video/mp4" />
      </video>

      {/* Capa oscura con blur total */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-xl"></div>

      {/* Botón de volver */}
      <button
        onClick={handleGoBack}
        className="absolute top-6 left-6 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-200 backdrop-blur-md border border-white/20"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      {/* Modal con animación */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative z-10 p-12 rounded-2xl bg-gray-900/30 max-w-md text-white border border-gray-700/20 shadow-2xl backdrop-blur-xl text-center"
      >
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-cyan-500/20 mb-6 mx-auto">
          {isInstalling ? (
            <div className="w-10 h-10 border-4 border-cyan-300 border-t-transparent rounded-full animate-spin" />
          ) : isIOS ? (
            <Smartphone className="w-10 h-10 text-cyan-400" />
          ) : (
            <Download className="w-10 h-10 text-cyan-400" />
          )}
        </div>
        
        <h1 className="text-3xl font-bold mb-4">
          {isInstalling ? 'Instalando...' : 'Instalar FitApp'}
        </h1>
        
        <p className="text-gray-300 mb-8 leading-relaxed">
          {isInstalling 
            ? 'Configurando tu aplicación...'
            : isIOS 
              ? 'Agrega FitApp a tu pantalla de inicio para un acceso rápido y una experiencia completa como app nativa.'
              : 'Instala FitApp en tu dispositivo para un acceso rápido y una experiencia completa como app nativa.'
          }
        </p>

        <button
          onClick={handleInstallClick}
          disabled={isInstalling}
          className={`w-full px-6 py-4 rounded-2xl font-bold text-lg transition-all duration-200 ${
            isInstalling
              ? "bg-cyan-600/30 text-white cursor-not-allowed"
              : "bg-cyan-600/60 hover:bg-cyan-500 text-white hover:shadow-lg"
          }`}
        >
          {isInstalling ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Instalando...
            </div>
          ) : isIOS ? (
            <>
              <Smartphone className="w-5 h-5 inline mr-2" />
              Agregar al Inicio
            </>
          ) : (
            <>
              <Download className="w-5 h-5 inline mr-2" />
              Instalar App
            </>
          )}
        </button>

        {/* Información adicional */}
        <div className="mt-8 p-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-sm text-gray-400 leading-relaxed">
            {isIOS 
              ? '💡 En iOS: Toca el botón compartir (⬆️) en Safari y selecciona "Agregar a pantalla de inicio"'
              : '💡 Después de instalar podrás acceder a FitApp desde tu escritorio o menú de inicio'
            }
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default InstalarApp;
