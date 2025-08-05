import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';

const AppLayout = () => {
    useEffect(() => {
        // Ajustar --vh para altura real del viewport (fix para iOS y PWA)
        const setViewportHeight = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        setViewportHeight();
        window.addEventListener('resize', setViewportHeight);
        return () => window.removeEventListener('resize', setViewportHeight);
    }, []);

    return (
        <div
            className="
        flex flex-col 
        text-white 
        font-sans 
        bg-[#121212]
        overflow-hidden
      "
            style={{
                height: 'calc(var(--vh, 1vh) * 100)',
            }}
        >
            {/* Contenido principal scrollable */}
            <main
                className="
          flex-1 
          relative 
          overflow-y-auto 
          overscroll-behavior-y-contain 
          scrollbar-hide 
          pt-safe 
          pb-safe 
          px-4 sm:px-6 lg:px-8
        "
            >
                <Outlet />
            </main>

            {/* Footer opcional (ej: navbar) 
      <footer className="relative z-20 bg-black/80 backdrop-blur-md py-3 px-safe">
        Footer / NavBar
      </footer>
      */}
        </div>
    );
};

export default AppLayout;
