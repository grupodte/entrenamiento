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
        <div className="min-h-screen flex flex-col overflow-hidden">
           

            <main className="flex-1 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
};

export default AppLayout;
