import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import AdminSidebarDesktop from '../components/AdminSidebarDesktop';
import AdminSidebarMobile from '../components/AdminSidebarMobile';
import PullToRefreshIndicator from '../components/PullToRefreshIndicator';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { DragStateProvider, useDragState } from '../context/DragStateContext';

// This component will contain the actual layout structure and logic
const AdminLayoutContent = ({ children }) => {
    // const navigate = useNavigate(); // If needed by content specifically
    // const { logout } = useAuth(); // If needed by content specifically

    const { isDragging } = useDragState(); // Consumes isDragging from context

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

    // Pass the isDragging state from context to the hook
    const { isRefreshing, pullDistance, scrollRef } = usePullToRefresh(handleRefresh, isDragging);

    return (
        <div className="relative w-full h-[calc(var(--vh,1vh)*100)] text-white overflow-hidden">
            <div className="absolute inset-0 -z-20">
                <img
                    src="/backgrounds/admin-blur.png"
                    alt="Fondo admin"
                    className="w-full h-full object-cover opacity-40"
                />
            </div>
            <div className="absolute inset-0 -z-10 backdrop-blur-xl bg-black/30" />

            <PullToRefreshIndicator
                isRefreshing={isRefreshing}
                pullDistance={pullDistance}
            />

            <div
                ref={scrollRef}
                className="relative z-10 flex h-full overflow-y-scroll overscroll-contain pt-safe pb-safe"
            >
                <AdminSidebarDesktop />
                <motion.main
                    className="flex-1 min-h-full px-4 sm:px-6 lg:px-8 pl-safe pr-safe"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                    {children}
                </motion.main>
                <AdminSidebarMobile />
            </div>
        </div>
    );
};

// AdminLayout now wraps its content with DragStateProvider
const AdminLayout = ({ children }) => {
    // Top-level hooks like useNavigate and useAuth can remain here if AdminLayout
    // itself has UI elements that use them (e.g., a logout button directly in AdminLayout).
    // For this problem, we primarily focus on DragStateProvider wrapping the content.
    // const navigate = useNavigate(); 
    // const { logout } = useAuth(); 

    return (
        <DragStateProvider>
            <AdminLayoutContent>{children}</AdminLayoutContent>
        </DragStateProvider>
    );
};

export default AdminLayout;
