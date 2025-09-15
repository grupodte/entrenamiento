import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Smartphone, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useInstallPWA from '../hooks/useInstallPWA';
import InstallInstructions from '../components/InstallInstructions';

const InstalarApp = () => {
  const navigate = useNavigate();
  const [showInstructions, setShowInstructions] = useState(false);
  const { 
    handleInstallApp, 
    isInstalling, 
    isInstalled,
    isIOS,
    platform
  } = useInstallPWA();

  const handleInstallClick = async () => {
    // Determinar si es un dispositivo móvil
    const isMobile = platform === 'ios' || platform.startsWith('android');
    
    const result = await handleInstallApp(isMobile);
    
    if (result.action === 'show_instructions') {
      // Mostrar las instrucciones en la página
      setShowInstructions(true);
    } else if (result.action === 'installed') {
      // Redirigir después de instalación exitosa
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    }
  };

  const handleGoBack = () => {
    if (showInstructions) {
      setShowInstructions(false);
    } else {
      navigate(-1);
    }
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

  // Vista de instrucciones
  if (showInstructions) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header con botón volver */}
        <div className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
            <button
              onClick={handleGoBack}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Volver
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Cómo instalar FitApp
            </h1>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <InstallInstructions platform={platform} />

          {/* Botón para intentar de nuevo */}
          <div className="mt-8 text-center">
            <button
              onClick={() => setShowInstructions(false)}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
            >
              Intentar instalación automática
            </button>
          </div>
        </div>
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



      {/* Modal con animación */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative z-10 p-10 rounded-2xl max-w-[300px] text-white border border-gray-700/20 shadow-2xl text-center"
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
          {isInstalling ? 'Instalando...' : 'Instalar '}
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

     
      </motion.div>
    </div>
  );
};

export default InstalarApp;
