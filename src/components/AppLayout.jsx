import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';

const AppLayout = () => {
    useEffect(() => {
        const setViewportHeight = () => {
            const vh = window.visualViewport
                ? window.visualViewport.height * 0.01
                : window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        setViewportHeight();
        window.visualViewport?.addEventListener('resize', setViewportHeight);
        window.addEventListener('resize', setViewportHeight);
        return () => {
            window.visualViewport?.removeEventListener('resize', setViewportHeight);
            window.removeEventListener('resize', setViewportHeight);
        };
    }, []);

    return (
        <div
            className="flex flex-col text-white font-sans overflow-hidden"
            style={{ height: 'calc(var(--vh, 1vh) * 100)' }}
        >
            {/* Contenido principal */}
            <main
                className="
                    flex-1 
                    relative 
                    overflow-y-auto 
                    overscroll-behavior-y-contain 
                    scrollbar-hide 
                    pt-safe 
                    px-4 sm:px-6 lg:px-8
                "
            >
                <Outlet />
            </main>

 
        </div>
    );
};

export default AppLayout;
