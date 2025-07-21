import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebarDesktop from '../components/AdminSidebarDesktop';
import AdminSidebarMobile from '../components/AdminSidebarMobile';

const AdminLayout = () => {
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
        <div className="relative w-full h-[calc(var(--vh,1vh)*100)] text-white overflow-hidden pb-[60px] md:pb-0">
            {/* Fondo difuminado */}
            <div className="absolute inset-0 -z-20">
                <img
                    src="/backgrounds/admin-blur.png"
                    alt="Fondo panel"
                    className="w-full h-full object-cover opacity-40"
                />
            </div>
            <div className="absolute inset-0 -z-10 backdrop-blur-xl bg-black/40" />

            {/* Contenido scrollable */}
            <div
                className="relative z-10 flex h-full overflow-y-auto overscroll-contain pt-safe pb-safe scrollbar-hide"
            >
                {/* Sidebar Desktop */}
                <AdminSidebarDesktop />

                {/* Contenido principal */}
                <main className="flex-1 px-4 sm:px-6 lg:px-8 pl-safe pr-safe py-8">
                    <Outlet />
                </main>

                {/* Sidebar Mobile */}
                <AdminSidebarMobile />
            </div>
        </div>
    );
};

export default AdminLayout;
