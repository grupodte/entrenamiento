import React, { Suspense } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * App Shell - Estructura estática de la aplicación que se cachea agresivamente
 * Contiene elementos que rara vez cambian: layout base, navegación, estructura
 */
const AppShell = ({ children, showNavigation = true }) => {
  const { user, rol } = useAuth();
  
  return (
    <div className="app-shell h-screen bg-gray-950 text-white overflow-hidden">
      {/* Header estático */}
      <div className="app-shell-header bg-gray-900/50 border-b border-gray-800">
        {/* Contenido del header se carga dinámicamente */}
      </div>
      
      {/* Contenedor principal */}
      <div className="app-shell-main flex h-full">
        {/* Sidebar estático (solo estructura) */}
        {showNavigation && rol === 'admin' && (
          <aside className="app-shell-sidebar w-64 bg-gray-900/30 border-r border-gray-800">
            {/* Estructura del sidebar - se llena dinámicamente */}
            <div className="h-full flex flex-col">
              <div className="p-4">
                {/* Logo placeholder */}
                <div className="h-10 bg-gray-800 rounded animate-pulse"></div>
              </div>
              <nav className="flex-1 px-4 space-y-2">
                {/* Navigation items placeholders */}
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-10 bg-gray-800 rounded animate-pulse"></div>
                ))}
              </nav>
            </div>
          </aside>
        )}
        
        {/* Área de contenido principal */}
        <main className="app-shell-content flex-1 relative">
          {/* Aquí se renderiza el contenido dinámico */}
          <Suspense 
            fallback={
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-400">Cargando...</p>
                </div>
              </div>
            }
          >
            {children}
          </Suspense>
        </main>
      </div>
      
      {/* Bottom Navigation (móvil) - estructura estática */}
      {showNavigation && rol === 'alumno' && (
        <nav className="app-shell-bottom-nav md:hidden bg-gray-900/50 border-t border-gray-800">
          <div className="flex">
            {/* Bottom nav items placeholders */}
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex-1 p-3">
                <div className="h-8 bg-gray-800 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
};

export default AppShell;
