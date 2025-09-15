import React, { useState } from 'react';

const SwipeBackTest = () => {
  const [attempts, setAttempts] = useState(0);

  React.useEffect(() => {
    let attemptCount = 0;

    const handlePopState = () => {
      attemptCount += 1;
      setAttempts(attemptCount);
      console.log(`Navigation attempt #${attemptCount} detected`);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const testBackButton = () => {
    try {
      window.history.back();
    } catch (error) {
      console.log('Back navigation prevented:', error);
    }
  };

  return (
    <div className="p-6 bg-gray-800 rounded-lg max-w-md mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4 text-white">
        🔒 Test de Prevención de Navegación
      </h2>
      
      <div className="space-y-4">
        <div className="bg-gray-700 p-4 rounded">
          <p className="text-sm text-gray-300 mb-2">
            Intentos de navegación detectados:
          </p>
          <p className="text-2xl font-bold text-cyan-400">{attempts}</p>
        </div>

        <div className="space-y-2 text-sm text-gray-300">
          <p><strong>✅ Pruebas a realizar:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Arrastra desde el borde izquierdo hacia la derecha</li>
            <li>Usa el botón "Atrás" del navegador (si está visible)</li>
            <li>Presiona Alt + Flecha Izquierda (desktop)</li>
            <li>Presiona Backspace fuera de campos de texto</li>
          </ul>
        </div>

        <button
          onClick={testBackButton}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded transition-colors"
        >
          🧪 Probar window.history.back()
        </button>

        <div className="bg-blue-900/50 p-3 rounded text-xs text-blue-200">
          <strong>Nota:</strong> Si la prevención funciona correctamente, estos intentos de navegación deberían ser bloqueados y el contador debería aumentar.
        </div>
      </div>
    </div>
  );
};

export default SwipeBackTest;
