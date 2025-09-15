import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NotFound = () => {
  const navigate = useNavigate();
  const { user, rol } = useAuth();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Redirigir según el estado del usuario
          if (user) {
            if (rol === 'admin') {
              navigate('/admin', { replace: true });
            } else {
              navigate('/dashboard', { replace: true });
            }
          } else {
            navigate('/login', { replace: true });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, user, rol]);

  const handleRedirectNow = () => {
    if (user) {
      if (rol === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } else {
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        {/* Icono 404 */}
        <div className="mb-6">
          <div className="text-6xl font-bold text-indigo-600 mb-2">404</div>
          <div className="w-16 h-1 bg-indigo-600 mx-auto rounded-full"></div>
        </div>

        {/* Mensaje principal */}
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Página no encontrada
        </h1>
        
        <p className="text-gray-600 mb-6">
          Lo sentimos, la página que estás buscando no existe o ha sido movida.
        </p>

        {/* Información de redirección */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700 mb-2">
            Te redirigiremos automáticamente en:
          </p>
          <div className="text-2xl font-bold text-indigo-600 mb-3">
            {countdown} segundos
          </div>
          <p className="text-xs text-gray-500">
            {user 
              ? `Ir a ${rol === 'admin' ? 'Panel de Admin' : 'Dashboard'}`
              : 'Ir al Login'
            }
          </p>
        </div>

        {/* Botones de acción */}
        <div className="space-y-3">
          <button
            onClick={handleRedirectNow}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            {user 
              ? `Ir ${rol === 'admin' ? 'al Admin' : 'al Dashboard'} ahora`
              : 'Ir al Login ahora'
            }
          </button>
          
          <button
            onClick={() => window.history.back()}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Volver atrás
          </button>
        </div>

        {/* Mensaje adicional */}
        <p className="text-xs text-gray-500 mt-6">
          Si el problema persiste, por favor contacta al administrador.
        </p>
      </div>
    </div>
  );
};

export default NotFound;
