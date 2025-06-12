import { useEffect } from 'react';
import AdminSidebarDesktop from '../components/AdminSidebarDesktop';
import AdminSidebarMobile from '../components/AdminSidebarMobile';

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

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    return (
        <div className="fixed inset-0 w-full h-full overflow-hidden text-white">
            {/* Fondo blur con imagen estilo iOS */}
            <div className="absolute inset-0 -z-20">
                <img
                    src="/backgrounds/admin-blur.png"
                    alt="Fondo admin"
                    className="w-full h-full object-cover opacity-40"
                />
            </div>

            {/* Capa de blur adicional */}
            <div className="absolute inset-0 -z-10 backdrop-blur-xl bg-black/30" />

            {/* Layout principal con scroll interno */}
            <div className="relative z-10 flex h-[calc(var(--vh,1vh)*100)] w-full overflow-hidden">
                <AdminSidebarDesktop />

                <main className="flex-1 overflow-y-auto p-6 md:p-10">
                    {children}
                </main>

                <AdminSidebarMobile />
            </div>
        </div>
    );
};

export default AdminLayout;
