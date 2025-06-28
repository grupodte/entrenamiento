import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext'; // ⬅️ Asegurate de tener esto configurado
import AdminSidebarDesktop from '../components/AdminSidebarDesktop';
import AdminSidebarMobile from '../components/AdminSidebarMobile';
import PullToRefreshIndicator from '../components/PullToRefreshIndicator';
import { usePullToRefresh } from '../hooks/usePullToRefresh';

const AdminLayout = ({ children }) => {
    const navigate = useNavigate();
    const { logout } = useAuth();



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
                className="relative z-10 flex h-full overflow-y-scroll overscroll-contain pt-safe pb-safe" // py-safe ya estaba, overscroll-contain ya estaba. No hay cambios aquí en esta pasada.
            >
                <AdminSidebarDesktop />
                {/* AdminSidebarDesktop podría necesitar su propio pl-safe si es fijo y está al borde */}
                <motion.main
                    className="flex-1 min-h-full px-4 sm:px-6 lg:px-8 pl-safe pr-safe" /* Paddings laterales y safe-area para el contenido principal */
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                    {/* Botón de logout */}
                    {children}
                </motion.main>
                {/* AdminSidebarMobile, si es un overlay, podría necesitar su propio manejo de safe-area */}
                <AdminSidebarMobile />
            </div>
        </div>
    );
};

export default AdminLayout;
