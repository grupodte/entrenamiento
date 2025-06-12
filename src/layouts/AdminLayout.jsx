import AdminSidebarDesktop from '../components/AdminSidebarDesktop';
import AdminSidebarMobile from '../components/AdminSidebarMobile';

const AdminLayout = ({ children }) => {
    return (
        <div className="relative flex min-h-screen text-white">

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

            {/* Layout principal con contenido encima */}
            <div className="relative z-10 flex flex-1 min-h-screen">
                <AdminSidebarDesktop />

                <main className="flex-1 p-6 md:p-10 overflow-y-auto">
                    {children}
                </main>

                <AdminSidebarMobile />
            </div>
        </div>
    );
};

export default AdminLayout;
