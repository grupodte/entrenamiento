import { useEffect } from 'react';
import AdminSidebarDesktop from '../components/AdminSidebarDesktop';
import AdminSidebarMobile from '../components/AdminSidebarMobile';
import PullToRefreshIndicator from '../components/PullToRefreshIndicator';
import { usePullToRefresh } from '../hooks/usePullToRefresh';

const AdminLayout = ({ children }) => {
    useEffect(() => {
        const setViewportHeight = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        setViewportHeight();
        window.addEventListener('resize', setViewportHeight);
        return () => window.removeEventListener('resize', setViewportHeight);
    }, []);

    const handleRefresh = async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        window.location.reload();
    };

    const { isRefreshing, pullDistance, scrollRef } = usePullToRefresh(handleRefresh);

    return (
        <div className="fixed inset-0 w-full h-full overflow-hidden text-white">
            {/* Fondo blur iOS */}
            <div className="absolute inset-0 -z-10">
                <img
                    src="/backgrounds/admin-blur.webp"
                    alt="Background"
                    className="w-full h-full object-cover opacity-40"
                />
            </div>
            <div className="absolute inset-0 -z-10 backdrop-blur-xl bg-white/30" />

            {/* Barra fija top fuera del flujo */}
            <div className="fixed top-0 left-0 w-full h-[25px] backdrop-blur-xl bg-black/30 border-b border-white/10 z-20 flex items-center justify-center">
                <img
                    src="/icons/iconodte.svg"
                    alt="Icono"
                    className="h-4 opacity-80"
                />
            </div>

            {/* Contenido con padding compensado */}
            <div
                ref={scrollRef}
                data-scroll
                className="relative z-10 h-full overflow-y-auto overscroll-contain pt-[25px]"
            >
                <Outlet />
            </div>

            {/* Video global */}
            <VideoPanel open={isOpen} onClose={hideVideo} videoUrl={videoUrl} />
        </div>
    );
      
};

export default AdminLayout;
