import React from 'react';
import { WifiOff, RefreshCw, Dumbbell, Clock, Users, Target } from 'lucide-react';

const OfflinePage = () => {
  const handleRefresh = () => {
    window.location.reload();
  };

  // Datos cacheados simulados que podrían estar disponibles offline
  const offlineFeatures = [
    {
      icon: Dumbbell,
      title: "Rutinas Descargadas",
      description: "Accede a tus rutinas guardadas sin conexión",
      available: true
    },
    {
      icon: Clock,
      title: "Cronómetros",
      description: "Usa los temporizadores para tus entrenamientos",
      available: true
    },
    {
      icon: Target,
      title: "Historial Local",
      description: "Revisa tu progreso guardado localmente",
      available: true
    },
    {
      icon: Users,
      title: "Sincronización",
      description: "Se sincronizará cuando vuelvas a tener conexión",
      available: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        {/* Logo/Icono principal */}
        <div className="mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">DD - Entrenamiento</h1>
        </div>

        {/* Estado offline */}
        <div className="mb-8">
          <div className="flex items-center justify-center mb-4">
            <WifiOff className="w-12 h-12 text-red-400 mr-3" />
            <div className="text-left">
              <h2 className="text-xl font-semibold text-red-400">Sin Conexión</h2>
              <p className="text-gray-400 text-sm">No hay conexión a Internet</p>
            </div>
          </div>
          <p className="text-gray-300 mb-6">
            No te preocupes, aún puedes usar algunas funciones sin conexión.
          </p>
        </div>

        {/* Funciones disponibles offline */}
        <div className="bg-gray-800/50 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Disponible Sin Conexión</h3>
          <div className="space-y-3">
            {offlineFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index}
                  className={`flex items-center p-3 rounded-lg ${
                    feature.available 
                      ? 'bg-green-900/20 border border-green-800/30' 
                      : 'bg-gray-800/50 border border-gray-700/30'
                  }`}
                >
                  <Icon className={`w-5 h-5 mr-3 ${
                    feature.available ? 'text-green-400' : 'text-gray-500'
                  }`} />
                  <div className="text-left">
                    <h4 className={`font-medium ${
                      feature.available ? 'text-white' : 'text-gray-400'
                    }`}>{feature.title}</h4>
                    <p className="text-sm text-gray-400">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Botón de reintento */}
        <button
          onClick={handleRefresh}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center mx-auto"
        >
          <RefreshCw className="w-5 h-5 mr-2" />
          Intentar de Nuevo
        </button>

        {/* Mensaje de sincronización */}
        <div className="mt-8 p-4 bg-blue-900/20 border border-blue-800/30 rounded-lg">
          <p className="text-blue-200 text-sm">
            💡 <strong>Tip:</strong> Los entrenamientos que hagas sin conexión se sincronizarán automáticamente cuando vuelvas a estar online.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OfflinePage;
