import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebarDesktop from '../components/AdminSidebarDesktop';
import AdminSidebarMobile from '../components/AdminSidebarMobile';
import { DragStateProvider } from '../context/DragStateContext';
import { VideoProvider, useVideo } from '../context/VideoContext';
import VideoPanel from '../components/VideoPanel';
import { useViewportHeight } from '../hooks/useViewportHeight';

const AdminLayoutInternal = () => {
    const { isOpen, videoUrl, hideVideo } = useVideo();
    useViewportHeight(); // Hook para altura dinámica en móviles

    return (
        <div
            className="relative flex text-white bg-black app-container"
            style={{ height: 'var(--full-vh, 100vh)' }}
        >
            {/* Fondo decorativo global */}
            <div className="absolute inset-0 -z-20 overflow-hidden">
                <img
                    src="/backgrounds/admin-blur.png"
                    alt="Fondo desenfocado"
                    className="w-full h-full object-cover opacity-30"
                />
                <div className="absolute inset-0 bg-black/50" />
            </div>

            {/* Layout principal */}
            <AdminSidebarDesktop />
            <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                    <main className="min-h-full px-4 sm:px-6 lg:px-8 py-8 pl-safe pr-safe">
                        <Outlet />
                    </main>
                </div>
            </div>
            <AdminSidebarMobile />

            {/* Panel de video flotante */}
            <VideoPanel open={isOpen} onClose={hideVideo} videoUrl={videoUrl} />
        </div>
    );
};

// Proveedores de contexto envuelven el layout
const AdminLayout = () => (
    <VideoProvider>
        <DragStateProvider>
            <AdminLayoutInternal />
        </DragStateProvider>
    </VideoProvider>
);

export default AdminLayout;
