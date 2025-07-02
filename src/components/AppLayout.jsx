import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';

const AppLayout = () => {
    useEffect(() => {
        const setViewportHeight = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        setViewportHeight();
        window.addEventListener('resize', setViewportHeight);
        return () => window.removeEventListener('resize', setViewportHeight);
    }, []);

    // Se eliminó el useEffect que modificaba document.body.style.overflow
    // Se eliminó la lógica de usePullToRefresh
    // Se eliminó VideoProvider y VideoPanel
    // Se eliminó el fondo con imagen y el backdrop-blur

    return (
        // Se simplificó el div principal, eliminando clases de fixed, inset, etc.
        // y el fondo específico que ahora irá en AdminLayout.
        <div className="relative flex flex-col h-screen bg-black text-white">
            {/* Se mantuvo la barra superior simple si es necesaria para todas las rutas públicas */}
            <div className="h-[25px] bg-black border-b border-white/10 flex items-center justify-center">
                <img
                    src="/icons/iconodte.svg"
                    alt="Icono"
                    className="h-3 opacity-80"
                />
            </div>
            <div className="flex-1">
                <Outlet />
            </div>
        </div>
    );
};

export default AppLayout;