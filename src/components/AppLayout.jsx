import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useViewportHeight } from '../hooks/useViewportHeight';

const AppLayout = () => {
    useViewportHeight();

    return (
        <div
            className="flex flex-col text-white font-sans overflow-hidden bg-[#121212]"
            style={{
                height: 'var(--vh)'
            }}
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
