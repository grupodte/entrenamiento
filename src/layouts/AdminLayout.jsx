// Limpio AdminLayout.jsx
import AdminSidebarDesktop from '../components/AdminSidebarDesktop';
import AdminSidebarMobile from '../components/AdminSidebarMobile';

const AdminLayout = ({ children }) => {
    return (
        <div className="relative w-full h-full text-white overflow-hidden">
            {/* Fondo blur con imagen estilo iOS */}
            <div className="absolute inset-0 -z-20">
                <img
                    src="/backgrounds/admin-blur.png"
                    alt="Fondo admin"
                    className="w-full h-full object-cover opacity-40"
                />
            </div>
            <div className="absolute inset-0 -z-10 backdrop-blur-xl bg-black/30" />

            {/* Layout principal */}
            <div className="relative z-10 flex w-full h-full">
                <AdminSidebarDesktop />

                <main className="flex-1 min-h-full p-6 md:p-6">
                    {children}
                </main>

                <AdminSidebarMobile />
            </div>
        </div>
    );
};

export default AdminLayout;
