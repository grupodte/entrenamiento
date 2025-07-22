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
        <div className="            h-full flex flex-col">
           

            <main className="flex-1 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
};

export default AppLayout;
