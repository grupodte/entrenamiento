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
        <div className="relative w-full h-[calc(var(--vh,1vh)*100)] text-white overflow-hidden">
            {/* Fondo blur con imagen estilo iOS */}
            <div className="absolute inset-0 -z-20">
                <img
                    src="/backgrounds/admin-blur.png"
                    alt="Fondo admin"
                    className="w-full h-full object-cover opacity-40"
                />
            </div>
            <div className="absolute inset-0 -z-10 backdrop-blur-xl bg-black/30" />

            {/* Indicador de pull to refresh */}
            <PullToRefreshIndicator
                isRefreshing={isRefreshing}
                pullDistance={pullDistance}
            />

            {/* Layout principal con scroll interno */}
            <div
                ref={scrollRef}
                className="relative z-10 flex h-full overflow-y-auto overscroll-contain"
            >
                <AdminSidebarDesktop />

                <main className="flex-1 min-h-full p-6 md:p-10">
                    {children}
                </main>

                <AdminSidebarMobile />
            </div>
        </div>
    );
};

export default AdminLayout;
