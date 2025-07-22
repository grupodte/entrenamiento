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

    return (
        <div className="min-h-[calc(var(--vh,1vh)*100)] flex flex-col bg-black text-white">
            <div className="h-[25px] bg-black border-b border-white/10 flex items-center justify-center shrink-0">
                <img
                    src="/icons/iconodte.svg"
                    alt="Icono"
                    className="h-3 opacity-80"
                />
            </div>

            <main className="flex-1 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
};

export default AppLayout;
